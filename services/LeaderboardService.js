var JsonDB = require('node-json-db');
var _ = require('lodash');
var moment = require('moment');
var jwtService = require('./JWTService');
var config = require('./SettingService').config;
var mongoService = require('./MongoService');

function LeaderboardService() {
    this.users = new JsonDB('./db/users');
    this.update();
    mongoService.createUser('Whatshiywl').then(() => {
        console.log('user created');
    })
    .catch(console.error)
    .then(() => this.setScore('Whatshiywl', 10).catch(console.error))
    .then(() => this.getTokenForUser('Whatshiywl').then(console.log).catch(console.error))
    .then(() => this.getScore('Whatshiywl').then(console.log).catch(console.error))
    .catch(console.error);
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
    return new Promise((resolve, reject) => {
        mongoService.updateUser(name, {$set: {score}})
        .then(() => {
            // this.update();
            resolve();
        })
        .catch(reject);
    });
}

LeaderboardService.prototype.getUserData = function(user) {
    let path = `/${user}`;
    try {
        let userData = this.users.getData(path);
        return _.cloneDeep(userData);
    } catch (error) {
        return undefined;
    }
}

LeaderboardService.prototype.deleteUser = function(user) {
    let path = `/${user}`;
    this.users.delete(path);
    this.update();
}

LeaderboardService.prototype.getUserList = function() {
    let users = _.cloneDeep(this.users.getData('/'));
    return _.map(users, user => user.user);
}

LeaderboardService.prototype.update = function() {
    let userData = _.cloneDeep(this.users.getData('/'));
    let groups = _.groupBy(userData, user => user.score);
    delete groups['-1'];
    let mapped = _.map(groups, (value, key) => {
        let ordered = _.map(_.orderBy(value, 'at'), item => {
            item.at = moment.utc(item.at).format('DD/MM/YY HH:mm:ss');
            return item;
        });
        return {ordered, key}
    });
    let ordered = _.orderBy(mapped, 'key', 'desc');
    let zero = ordered.find(el => el.key == '0');
    if(zero) {
        zero.key = 'Newestest';
        zero.ordered = zero.ordered.reverse().slice(0, 10);
    }
    this.leaderboard = ordered;
}

LeaderboardService.prototype.getLeaderboard = function() {
    let ret = _.cloneDeep(this.leaderboard || []);
    ret.pop();
    return ret;
}

LeaderboardService.prototype.getNewest = function() {
    let newest = _.cloneDeep(this.leaderboard || []).pop();
    if(newest) return newest.ordered;
    else return '';
}

const leaderboardService = new LeaderboardService();
module.exports = leaderboardService;