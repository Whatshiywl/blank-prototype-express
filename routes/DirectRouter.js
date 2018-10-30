var DirectRouter = require('express').Router();
var moment = require('moment');
var _ = require('lodash');

var config = require('../services/SettingService').getConfig();
var levels = config.levels || [];
var entry = config.entryPoint || 0;

var settingService = require('../services/SettingService');
var leaderboard = require('../services/LeaderboardService');
var jwtService = require('../services/JWTService');

function toRoute(url) {
    return '/' + Buffer.from(url).toString('base64');
}

var entryURL = toRoute(levels[entry].url);

function getHandler(file, obj, id) {
    return (req, res) => {
        const respondWith = o => {
            res.render(file, {...obj, ...o});
        }

        let token = req.query.token;
        if(!token) {
            leaderboard.getLeaderboard()
            .then(lead => {
                respondWith({leaderboard: lead.leaders, newest: lead.newest});
            })
            .catch(error => res.render('error', {error}));
        } else {
            jwtService.decrypt(token)
            .then(payload => {
                let name = payload.user.name;
                leaderboard.getScore(name)
                .then(score => {
                    if(id > score && id < 99) {
                        leaderboard.setScore(name, id)
                        .then(() => respondWith({token}))
                        .catch(error => res.render('error', {error}));
                    } else respondWith({token});
                })
                .catch(error => res.render('error', {error}));
            })
            .catch(error => {
                console.error(`GET Error:`, error.message);
                res.redirect('/')
            });
        }
    };
}

function postHandler(answer, from, success, error) {
    answer = answer.toLowerCase().trim();
    if(answer.startsWith('regex:')) answer = new RegExp(answer.substr(6), 'i');
    return (req, res) => {
        let token = req.body.t;
        if(!token) res.redirect('/');
        else {
            jwtService.decrypt(token)
            .then(payload => {
                leaderboard.getTokenForUser(payload.user.name)
                .then(newToken => {
                    let r = (req.body.r || '').toLowerCase().trim();
                    let match = r.match(answer);
                    let right = match && match[0] === r;
                    let timestamp = moment().format("DD/MM/YY HH:mm:ss");
                    console.log(timestamp, from, r, (right ? '=' : '!='), answer);
                    if(right) res.redirect(`${success}?token=${newToken}`);
                    else res.redirect(`${error}?token=${newToken}`);
                })
                .catch(error => {
                    console.error(`POST TOKEN Error:`, err.message);
                    res.redirect(`${error}?token=${newToken}`);
                });
            })
            .catch(error => {
                console.error(`POST DECRYPT Error:`, error.message);
                res.redirect('/');
            });
        }
    };
}

let levelIds = Object.keys(levels);
levelIds.forEach(id => {

    let level = levels[id];
    level.route = toRoute(level.url);
    let successLevel = levels[level.success || Number(id)+1] || levels[99];
    successLevel.route = toRoute(successLevel.url);

    let errorLevel = levels[level.error || id];
    errorLevel.route = toRoute(errorLevel.url);

    console.log(`${id}: Setting route: ${level.route} ? ${successLevel.route} : ${errorLevel.route}`);

    DirectRouter.get(level.route, getHandler(level.file || 'index', level, Number(id)));

    DirectRouter.post(level.route, postHandler(level.answer, level.route, successLevel.route, errorLevel.route));
});

DirectRouter.get('/', (req, res) => {
    res.redirect('/login');
});

DirectRouter.get('/login', (req, res) => {
    leaderboard.getLeaderboard()
    .then(lead => {
        res.render('index', {
            question: "Welcome to Blank</br>Please login",
            route: "/login",
            leaderboard: lead.leaders,
            newest: lead.newest
        });
    })
    .catch(error => res.render('error', {error}));
});

DirectRouter.post('/login', (req, res) => {
    let name = (req.body.r || '').toLowerCase().trim();
    if(settingService.isForbiddenName(name)) res.redirect('/');
    else {
        leaderboard.login(name)
        .then(token => res.redirect(`${entryURL}?token=${token}`))
        .catch(error => res.render('error', {error}));
    }
});

module.exports = DirectRouter;
