import * as fs from 'fs';
import * as JWT from 'jsonwebtoken';
import * as _ from 'lodash';
import User from '../models/User';
import mongoService from './MongoService';
import BlankRoute from '../models/BlankRoute';

interface JWTPayload {
    iat: number,
    exp?: number
}

interface LoginPayload extends JWTPayload {

    user: {
        username: string
    }

}

interface RoutePayload extends JWTPayload {

    question: string,
    url: string,
    success: boolean

}

class JWTService {

    private readonly KEY: string;

    constructor() {
        this.KEY = this.loadKey();
    }
    
    encrypt(obj: any, options: JWT.SignOptions) {
        return new Promise<string>((resolve, reject) => {
            JWT.sign(obj, this.KEY, options, (err, token) => {
                if(err) reject(err);
                else resolve(token);
            });
        });
    }

    encryptLoginToken(user: User) {
        let payload = {
            user: {
                username: user.username
            }
        };
        return this.encrypt(payload, {
            expiresIn: '1d'
        });
    }
    
    encryptRouteToken(route: BlankRoute) {
        let payload = {
            question: route.question,
            url: Buffer.from(route.url).toString('base64'),
            success: true
        };
        return this.encrypt(payload, {
            expiresIn: '30s'
        });
    }
    
    decrypt<T>(token: string) {
        return new Promise<T>((resolve, reject) => {
            JWT.verify(token, this.KEY, (err: JWT.VerifyErrors, decoded: PromiseLike<T>) => {
                if(err) reject(err);
                else resolve(decoded);
            });
        });
    }

    decryptLoginToken(token: string) {
        return this.decrypt<LoginPayload>(token);
    }

    getUserFromToken(token: string) {
        return this.decryptLoginToken(token)
        .then(payload => mongoService.getUser(payload.user.username));
    }

    decryptRouteToken(token: string) {
        return this.decrypt<RoutePayload>(token);
    }

    private loadKey() {
        let key = process.env.JWT_KEY;
        if(!key) {
            console.log('Loading jwt.key');
            try {
                key = fs.readFileSync('./private-keys/jwt.key').toString();
            } catch(err) {
                console.warn(err);
            }
        }
        return Buffer.from(key).toString('base64');
    }
}

var jwtService = new JWTService();
export default jwtService;