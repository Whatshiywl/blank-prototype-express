var DefaultRouter = require('express').Router();
var leaderboardService = require('../services/LeaderboardService');
var mongoService = require('../services/MongoService');
var settingService = require('../services/SettingService');
var authService = require('../services/AuthService');
var jwtService = require('../services/JWTService');
var _ = require('lodash');

DefaultRouter.get('/hello', (req, res) => {
    res.send('hello world');
});

DefaultRouter.get('/leaderboard', (req, res) => {
    leaderboardService.getLeaderboard()
    .then(leaderboard => res.send(leaderboard))
    .catch(err => res.status(err.status).send(err));
});

DefaultRouter.get('/user-exists', (req, res) => {
    let username = req.query.username;
    if(!username) {
        res.send({exists: false});
        return;
    }
    mongoService.userExists(username)
    .then(data => res.send(data))
    .catch(err => res.send(err));
});

// function promiseSerial(funcs) {
//   return funcs.reduce((promise, func) =>
//     promise.then(result =>
//       func().then(Array.prototype.concat.bind(result))).catch(console.error),
//       Promise.resolve([]));
// }

function promiseSerial(funcs, breakFn = Boolean) {
    let searching = true;
    return funcs.reduce((promise, func) => {
        return promise.then(result => {
            if(!searching) return result;
            else return func()
            .then(r => {
                if(breakFn(r)) {
                    searching = false;
                    return r;
                } else return;
            }).catch(console.error);
        }).catch(console.error);
    }, Promise.resolve());
}

DefaultRouter.get('/get-route', (req, res) => {

    const sendLevel = level => {
        let picked = _.pick(level, ['question', 'url']);
        picked.url = Buffer.from(picked.url).toString('base64');
        res.send({...{success: true}, ...picked});
    }

    let from = req.query.from;
    let answer = req.query.answer || '';
    let token = req.query.token || '';

    if(!from) {
        res.status(400).send({err: "No from field on query"});
        return;
    }

    if(!token) {
        res.status(400).send({err: "No token field on query"});
        return;
    }

    jwtService.decrypt(token)
    .then(payload => {
        let username = payload.user.username;

        let level;
        if(from == 'login') {
            level = settingService.getConfig().levels[0];
            sendLevel(level);
        } else {
            let plainUrl = from;
            if(from != 'login') from = Buffer.from(from, 'base64').toString();
        
            level = _.find(settingService.getConfig().levels, { url: from });
        
            if(!level) {
                res.status(404).send({err: `Level with url ${plainUrl} not found`});
                return;
            }
        
            let matchingAnswers = _.filter(level.answers, a => {
                let regex = new RegExp(a.answer);
                let matches = answer.match(regex);
                if(!matches) return false;
                let matched = matches[0];
                return matched == answer;
            });
    
            let ordered = _.orderBy(matchingAnswers, 'index');
    
            let promiseFactories = ordered.map(path => {
                return () => {
                    return new Promise((resolve, reject) => {
                        const resolveAnswer = passed => resolve({...{path}, ...{passed}});
                        if(!path.queries || !path.queries.find) resolveAnswer(true);
                        mongoService.getUser(username, path.queries.find)
                        .then(user => resolveAnswer(Boolean(user)))
                        .catch(reject);
                    });
                }
            });

            promiseSerial(promiseFactories, r => r && r.passed)
            .then(result => {
                if(result && result.passed) {
                    let path = result.path;
                    let level = settingService.getConfig().levels[path.target];
                    if(path.queries && path.queries.update) {
                        mongoService.updateUser(username, path.queries.update)
                        .then(() => sendLevel(level))
                        .catch(err => res.status(500).send(err));
                    } else sendLevel(level);
                } else res.send({success: false});
            })
            .catch(err => res.status(400).send(err));
    
        }
    })
    .catch(err => res.status(400).send(err));

});

DefaultRouter.post('/login', (req, res) => {
    let credentials = req.body || {};
    let username = credentials.username;
    if(settingService.isForbiddenName(username)) res.send({err: `${username} is not an allowed name`});
    else {
        authService.login(credentials)
        .then(token => res.send({token}))
        .catch(err => res.send(err));
    }
});

module.exports = DefaultRouter;