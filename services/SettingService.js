let fs = require('fs');
let CryptoJS = require('crypto-js');
let _ = require('lodash');
let AES = CryptoJS.AES;
let encoding = CryptoJS.enc.Utf8;

function SettingService() {
    this.getAESKey();
    this.loadConfig();
    if(!this.config) this.loadCrypted();
    if(!this.config) console.error('ERROR! NO CONFIG FOUND!');
}

SettingService.prototype.getIgnoredNames = function() {
    return _.cloneDeep(this.config.ignoreUserNames || []);
}

SettingService.prototype.getForbiddenNames = function() {
    let forbidden = _.cloneDeep(this.config.forbiddenUserNames || []);
    _.forEach(this.config.levels, level => forbidden.push(level.answer));
    return forbidden;
}

SettingService.prototype.getAESKey = function() {
    this.KEY = process.env.AES_KEY;
    if(this.KEY) return;
    console.log('Loading aes.key');
    try {
        this.KEY = fs.readFileSync('./private-keys/aes.key').toString();
    } catch(err) {
        console.warn(err);
    }
}

SettingService.prototype.loadConfig = function() {
    console.log('Loading Config.json')
    this.config;
    try {
        this.config = require('../Config.json');
        this.encrypt();
    } catch(err) {
        console.log('No Config.json!');
    }
}

SettingService.prototype.encrypt = function() {
    console.log('Saving Crypted.lock');
    try {
        let ciphertext = AES.encrypt(JSON.stringify(this.config, null, 4), this.KEY);
        fs.writeFileSync('./Crypted.lock', ciphertext.toString());
    } catch(err) {
        console.error(err);
    }
}

SettingService.prototype.loadCrypted = function() {
    console.log('Loading Crypted.lock');
    try {
        let ciphertext = fs.readFileSync('./Crypted.lock').toString();
        let bytes = AES.decrypt(ciphertext.toString(), this.KEY);
        let plaintext = bytes.toString(encoding);
        this.config = JSON.parse(plaintext);
        fs.writeFileSync('./Config.json', JSON.stringify(this.config, null, 4));
    } catch(err) {
        console.log('No Crypted.lock');
    }
}

const settingService = new SettingService();
module.exports = settingService;