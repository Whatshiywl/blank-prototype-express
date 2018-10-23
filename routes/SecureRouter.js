var SecureRouter = require('express').Router();
var fs = require('fs');

var leaderboardService = require('../services/LeaderboardService');

var KEY = process.env.ACCESS_KEY;
if(!KEY) {
    try {
        KEY = fs.readFileSync('./private-keys/access.key').toString();
    } catch (err) { 
        console.error(err);
    }
}

SecureRouter.use('/', (req, res, next) => {
    let key = req.headers.authorization;
    if(!KEY || !key || KEY !== key) res.status(401).send(':(');
    else next();
});

SecureRouter.get('/user', (req, res) => {
    let user = req.query.user;
    let userData = leaderboardService.getUserData(user);
    res.send(userData);
});

SecureRouter.delete('/user', (req, res) => {
    let user = req.body.user;
    if(!user) res.status(404).send('User not given');
    else {
        try {
            leaderboardService.deleteUser(user);
            res.send('ok');
        } catch (err) {
            res.status(400).send(err);
        }
    }
});

module.exports = SecureRouter;