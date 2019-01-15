import mongoService from './MongoService';
import jwtService from './JWTService';
import settingService from './SettingService';
import * as CryptoJS from 'crypto-js';
import * as _ from 'lodash';

class AuthService {

    validadeCredentials(credentials) {
        let username = credentials.username;
        let hash = this.hashPassword(credentials.hash);
    
        return new Promise((resolve, reject) => {
            mongoService.getUser(username)
            .then(user => {
                let valid = user.password ? user.password === hash : true;
                if(valid) resolve();
                else reject({err: 'Invalid Credentials!'});
            })
            .catch(reject);
        });
    }
    
    login(credentials) {
        let username = credentials.username;
        return new Promise((resolve, reject) => {
    
            if(!credentials || !credentials.username) reject({err: 'Invalid credentials!'});
            
            const getTokenAndResolve = () => {
                this.getTokenForUser(username)
                .then(resolve).catch(reject);
            }
    
            mongoService.userExists(username)
            .then(data => {
                if(!data.exists) {
                    credentials.password = this.hashPassword(credentials.hash);
                    mongoService.createUser(credentials)
                    .then(getTokenAndResolve)
                    .catch(reject);
                } else if(!data.password) getTokenAndResolve();
                else {
                    this.validadeCredentials(credentials)
                    .then(getTokenAndResolve)
                    .catch(reject);
                }
            })
            .catch(reject);
        });
    }
    
    getTokenForUser(name, data?) {
        return new Promise((resolve, reject) => {
            mongoService.getUser(name)
            .then(user => {
                user = _.pick(user, ['username']);
                let payload = {...{user}, ...data};
                resolve(jwtService.encrypt(payload, {
                    expiresIn: '1d'
                }));
            })
            .catch(reject);
        });
    }
    
    private hashPassword(password) {
        return (!password || password.length != 64) ? '' : CryptoJS.SHA512(this.addSalt(password)).toString();
    }
    
    private addSalt(password) {
        return settingService.getConfig().saltTemplate.split('|').map(p => {
            if(p.indexOf(',') == -1) return p;
            let b = p.split(',');
            return password.substring(b[0], b[1]);
        }).join('');
    }
}

const authService = new AuthService();
export default authService;