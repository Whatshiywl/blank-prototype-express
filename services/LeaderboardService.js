var JsonDB = require('node-json-db');
var _ = require('lodash');
var moment = require('moment');
var jwtService = require('./JWTService');
var config = require('./SettingService').config;

function LeaderboardService() {
    this.users = new JsonDB('./db/users');
    this.update();
}

LeaderboardService.prototype.getTokenForUser = function(user, data) {
    let path = `/${user}`;
    let userData = {user, score: 0, at: Date.now()};
    try {
        userData = this.users.getData(path);
    } catch (error) {
        this.users.push(path, userData);
    }
    let payload = {...{user}, ...data};
    return jwtService.encrypt(payload, {
        expiresIn: '1h'
    });

}

LeaderboardService.prototype.getScore = function(user) {
    let path = `/${user}`;
    return this.users.getData(path).score;
}

LeaderboardService.prototype.setScore = function(user, score) {
    let path = `/${user}`;
    let userData = this.users.getData(path);
    let ignore = false;
    (config.ignoreUserNames || []).forEach(toIgnore => {
        if(toIgnore.startsWith('regex:')) toIgnore = new RegExp(toIgnore.substr(6), 'ig');
        if(user.match(toIgnore)) ignore = true;
    });
    userData.score = ignore ? -1 : score;
    userData.at = Date.now();
    this.users.push(`/${user}`, userData);
    this.update();
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
    this.leaderboard = ordered;
}

const leaderboardService = new LeaderboardService();
module.exports = leaderboardService;