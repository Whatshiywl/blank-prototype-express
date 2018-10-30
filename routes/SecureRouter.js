var SecureRouter = require('express').Router();
var fs = require('fs');

var leaderboardService = require('../services/LeaderboardService');
var mongoService = require('../services/MongoService');

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
    let name = req.query.user;
    mongoService.getUser(name)
    .then(user => res.send(user))
    .catch(error => res.render('error', {error}));
});

SecureRouter.delete('/user', (req, res) => {
    let user = req.body.user;
    if(!user) res.status(404).send('User not given');
    else {
        mongoService.deleteUser(name)
        .then(() => res.send('ok'))
        .catch(error => res.render('error', {error}));
    }
});

SecureRouter.get('/users', (req, res) => {
    mongoService.getUsers()
    .then(users => res.send(users.map(user => user.name)))
    .catch(error => res.render('error', {error}));
});

module.exports = SecureRouter;