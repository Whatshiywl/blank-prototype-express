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

        mongoService.getUser(username)
        .then(user => {
            if(!user) {
                res.status(404).send({err: `No user ${username} found`});
                return;
            }

            let level;
            if(from == 'login') {
                let visited = (user.visited || []);
                if(visited.indexOf('0') == -1) visited.push('0');
                mongoService.updateUser(username, { $set: { visited } })
                .then(() => {
                    level = settingService.getConfig().levels['0'];
                    sendLevel(level);
                })
                .catch(err => res.status(500).send(err));
                return;
            }

            let plainUrl = from;
            if(from != 'login') from = Buffer.from(from, 'base64').toString();

            //TODO: still passing first loop
            let id = settingService.getRouteIDByURL(from);
            if(!user.visited || !user.visited.indexOf(id) == -1) {
                res.send({success: false});
                return;
            }
        
            level = settingService.getRouteByURL(from);
        
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

            const testQueriesOnUser = (user, queries) => {
                let passed = true; 
                _.forIn(queries, (value, key) => {
                    let eq = _.get(user, key) == value; 
                    if(!eq) passed = false; 
                    return eq;
                }); 
                return passed;
            }

            let path;
            _.forEach(ordered, p => {
                let passed = p.queries ? testQueriesOnUser(user, p.queries.find) : true;
                if(passed) path = p;
                return !passed;
            });
            if(path) {
                let visited = (user.visited || []);
                if(visited.indexOf(path.target) == -1) visited.push(path.target);
                let query = _.defaultsDeep({ $set: { visited } }, (path.queries || {}).update);
                let level = settingService.getConfig().levels[path.target];
                mongoService.updateUser(username, query)
                .then(() => sendLevel(level))
                .catch(err => res.status(500).send(err));
            } else res.send({success: false});
    
        }).catch(err => res.status(404).send(err));
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