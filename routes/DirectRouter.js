var DirectRouter = require('express').Router();
var moment = require('moment');

var config = require('../services/SettingService').config;
var levels = config.levels || [];
var entry = config.entryPoint || 0;

var leaderboard = require('../services/LeaderboardService');
var jwtService = require('../services/JWTService');

function toRoute(url) {
    return '/' + Buffer.from(url).toString('base64');
}

var entryURL = toRoute(levels[entry].url);

function getHandler(file, obj, id) {
    return (req, res) => {
        let token = req.query.token;
        jwtService.decrypt(token)
        .then(payload => {
            let user = payload.user;
            let score = leaderboard.getScore(user);
            if(id > score && id < 99) {
                leaderboard.setScore(user, id);
            }
            res.render(file, {...obj, ...{token, leaderboard: leaderboard.leaderboard}});
        })
        .catch(err => {
            console.error(err);
            res.redirect('/')
        });
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
                leaderboard.getTokenForUser(payload.user)
                .then(newToken => {
                    let r = (req.body.r || '').toLowerCase().trim();
                    let match = r.match(answer);
                    let right = match && match[0] === r;
                    let timestamp = moment().format("DD/MM/YY HH:mm:ss");
                    console.log(timestamp, from, r, (right ? '=' : '!='), answer);
                    if(right) res.redirect(`${success}?token=${newToken}`);
                    else res.redirect(`${error}?token=${newToken}`);
                })
                .catch(err => {
                    console.error(err);
                    res.redirect(`${error}?token=${token}`)
                });
            })
            .catch(err => {
                console.error(err);
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
    res.render('index', {
        question: "Welcome to Blank\nPlease login",
        route: "/login",
        leaderboard: leaderboard.leaderboard
    });
});

DirectRouter.post('/login', (req, res) => {
    let user = (req.body.r || '').toLowerCase().trim();
    leaderboard.getTokenForUser(user)
    .then(token => res.redirect(`${entryURL}?token=${token}`))
    .catch(err => res.render('error', err));
});

module.exports = DirectRouter;
