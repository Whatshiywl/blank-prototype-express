var JsonDB = require('node-json-db');
var _ = require('lodash');
var moment = require('moment');
var jwtService = require('./JWTService');

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
    userData.score = score;
    userData.at = Date.now();
    this.users.push(`/${user}`, userData);
    this.update();
}

LeaderboardService.prototype.update = function() {
    let userData = this.users.getData('/');
    let groups = _.groupBy(userData, user => user.score);
    let mapped = _.map(groups, (value, key) => {
        let ordered = _.orderBy(value, 'at');
        return {ordered, key}
    });
    let ordered = _.orderBy(mapped, 'key', 'desc');
    this.leaderboard = ordered;
}

const leaderboardService = new LeaderboardService();
module.exports = leaderboardService;