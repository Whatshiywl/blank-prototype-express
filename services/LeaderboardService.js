var JsonDB = require('node-json-db');
var jwtService = require('./JWTService');

function LeaderboardService() {
    this.users = new JsonDB('scores');
}

LeaderboardService.prototype.getTokenForUser = function(user, data) {
    let path = `/${user}`;
    let userData = {user, score: 0};
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

LeaderboardService.prototype.setScore = function(token, score) {
    jwtService.decrypt(token)
    .then(payload => {
        let path = `/${payload.user}`;
        let userData = this.users.getData(path);
        userData.score = score;
        this.users.push(`/${payload.user}`, userData);
    })
    .catch(console.error);
}

const leaderboardService = new LeaderboardService();
module.exports = leaderboardService;