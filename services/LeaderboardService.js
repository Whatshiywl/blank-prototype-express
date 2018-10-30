var JsonDB = require('node-json-db');
var _ = require('lodash');
var moment = require('moment');
var jwtService = require('./JWTService');
var settingService = require('./SettingService');
var mongoService = require('./MongoService');

function LeaderboardService() {
    this.users = new JsonDB('./db/users');
    // this.update();
    // mongoService.createUser('Whatshiywl').then(() => {
    //     console.log('user created');
    // })
    // .catch(console.error)
    // .then(() => this.setScore('Whatshiywl', 10).catch(console.error))
    // this.login('Whatshiywl').then(console.log).catch(console.error)
    // .then(() => this.getScore('Whatshiywl').then(console.log).catch(console.error))
    // .catch(console.error);
}

LeaderboardService.prototype.login = function(name) {
    return new Promise((resolve, reject) => {
        
        const getTokenAndResolve = () => {
            this.getTokenForUser(name)
            .then(resolve).catch(reject);
        }

        mongoService.userExists(name)
        .then(exists => {
            if(!exists) mongoService.createUser(name)
                .then(getTokenAndResolve)
                .catch(reject);
            else getTokenAndResolve();
        })
        .catch(reject);
    });
}

LeaderboardService.prototype.getTokenForUser = function(name, data) {
    return new Promise((resolve, reject) => {
        mongoService.getUser(name)
        .then(user => {
            let payload = {...{user}, ...data};
            resolve(jwtService.encrypt(payload, {
                expiresIn: '1h'
            }));
        })
        .catch(reject);
    });
}

LeaderboardService.prototype.getScore = function(name) {
    return new Promise((resolve, reject) => {
        mongoService.getUser(name)
        .then(user => resolve(user.score))
        .catch(reject);
    });
}

LeaderboardService.prototype.setScore = function(name, score) {
    if(settingService.isIgnoredName(name)) score = -1;
    return new Promise((resolve, reject) => {
        mongoService.updateUser(name, {$set: {score}})
        .then(() => {
            resolve();
        })
        .catch(reject);
    });
}

LeaderboardService.prototype.getLeaderboard = function() {
    return new Promise((resolve, reject) => {
        mongoService.getUsers({score: {$gte: 0}})
        .then(users => {
            let scoredUsers = users.filter(user => user.score > 0);
            let groups = _.groupBy(scoredUsers, user => user.score);
            let mapped = _.map(groups, (group, key) => {
                let ordered = _.map(_.orderBy(group, 'at'), item => {
                    item.at = moment.utc(item.at).format('DD/MM/YY HH:mm:ss');
                    return item;
                });
                return {ordered, key}
            });
            let leaders = _.orderBy(mapped, 'key', 'desc');

            let zeroUsers = users.filter(user => user.score == 0);
            let newest = _.map(_.orderBy(zeroUsers, 'at', 'desc'), user => {
                item.at = moment.utc(item.at).format('DD/MM/YY HH:mm:ss');
                return item;
            });
            resolve({leaders, newest});
        })
        .catch(reject);
    });
}

const leaderboardService = new LeaderboardService();
module.exports = leaderboardService;