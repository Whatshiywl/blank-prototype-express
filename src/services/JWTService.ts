import * as fs from 'fs';
import * as JWT from 'jsonwebtoken';

class JWTService {

    private readonly KEY: string;

    constructor() {
        this.KEY = this.loadKey();
    }
    
    encrypt(obj, options) {
        return new Promise((resolve, reject) => {
            JWT.sign(obj, this.KEY, options, (err, token) => {
                if(err) reject(err);
                else resolve(token);
            });
        });
    }
    
    decrypt(token) {
        return new Promise((resolve, reject) => {
            JWT.verify(token, this.KEY, (err, decoded) => {
                if(err) reject(err);
                else resolve(decoded);
            });
        });
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