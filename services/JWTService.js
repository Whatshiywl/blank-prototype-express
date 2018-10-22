var fs = require('fs');
var JWT = require('jsonwebtoken');

function JWTService() {
    this.loadKey();
    this.KEY = Buffer.from(this.KEY).toString('base64');
}

JWTService.prototype.loadKey = function() {
    this.KEY = process.env.JWT_KEY;
    if(this.KEY) return;
    console.log('Loading jwt.key');
    try {
        this.KEY = fs.readFileSync('./private-keys/jwt.key').toString();
    } catch(err) {
        console.warn(err);
    }
}

JWTService.prototype.encrypt = function(obj, options) {
    return new Promise((resolve, reject) => {
        JWT.sign(obj, this.KEY, options, (err, token) => {
            if(err) reject(err);
            else resolve(token);
        });
    });
}

JWTService.prototype.decrypt = function(token) {
    return new Promise((resolve, reject) => {
        JWT.verify(token, this.KEY, (err, decoded) => {
            if(err) reject(err);
            else resolve(decoded);
        });
    });
}

var jwtService = new JWTService();
module.exports = jwtService;