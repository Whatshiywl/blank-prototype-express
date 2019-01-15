import * as _ from 'lodash';
import * as moment from 'moment';
import jwtService from './JWTService';
import settingService from './SettingService';
import mongoService from './MongoService';

class LeaderboardService {

    getScore(name) {
        return new Promise((resolve, reject) => {
            mongoService.getUser(name)
            .then(user => resolve(user.score))
            .catch(reject);
        });
    }

    setScore(name, score) {
        if(settingService.isIgnoredName(name)) score = -1;
        let at = Date.now();
        return new Promise((resolve, reject) => {
            mongoService.updateUser(name, {$set: {score, at}})
            .then(() => {
                resolve();
            })
            .catch(reject);
        });
    }

    getLeaderboard() {
        return new Promise((resolve, reject) => {
            mongoService.getUsers({score: {$gte: 0}})
            .then(users => {
                let scoredUsers = users.filter(user => user.score > 0);
                let groups = _.groupBy(scoredUsers, user => user.score);
                let mapped = _.map(groups, (group, key) => {
                    let ordered = _.map(_.orderBy(group, 'at'), user => {
                        user.at = moment.utc(user.at).format('DD/MM/YY HH:mm:ss');
                        return user;
                    });
                    return {ordered, key}
                });
                let leaders = _.orderBy(mapped, 'key', 'desc');

                let zeroUsers = users.filter(user => user.score == 0);
                let newest = _.map(_.orderBy(zeroUsers, 'at', 'desc'), user => {
                    user.at = moment.utc(user.at).format('DD/MM/YY HH:mm:ss');
                    return user;
                });
                resolve({leaders, newest});
            })
            .catch(reject);
        });
    }
}

const leaderboardService = new LeaderboardService();
export default leaderboardService;