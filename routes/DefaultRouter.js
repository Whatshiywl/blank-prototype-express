var DefaultRouter = require('express').Router();
var leaderboardService = require('../services/LeaderboardService');
var mongoService = require('../services/MongoService');
var settingService = require('../services/SettingService');
var authService = require('../services/AuthService');

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