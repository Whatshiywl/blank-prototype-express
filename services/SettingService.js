let fs = require('fs');
let CryptoJS = require('crypto-js');
let _ = require('lodash');
let AES = CryptoJS.AES;
let encoding = CryptoJS.enc.Utf8;

var config;
var KEY;

function SettingService() {
    getAESKey();
    loadConfig();
    if(!config) loadCrypted();
    if(!config) console.error('ERROR! NO CONFIG FOUND!');
}

SettingService.prototype.getConfig = function() {
    return _.cloneDeep(config);
}

SettingService.prototype.getIgnoredNames = function() {
    return _.cloneDeep(config.ignoreUserNames || []);
}

SettingService.prototype.isIgnoredName = function(name) {
    name = name.toLowerCase().trim();
    let isIgnored = false;
    this.getIgnoredNames().forEach(ignored => {
        if(ignored.startsWith('regex:')) ignored = new RegExp(ignored.substr(6));
        if(name.match(ignored)) isIgnored = true;
    });
    return isIgnored;
}

SettingService.prototype.getForbiddenNames = function() {
    let forbidden = _.cloneDeep(config.forbiddenUserNames || []);
    _.forIn(config.levels, level => {
        _.forEach(level.answers, answer => {
            if(answer.answer)
                forbidden.push(answer.answer);
        });
    });
    forbidden.pop();
    return forbidden;
}

SettingService.prototype.isForbiddenName = function(name) {
    name = (name || '').toLowerCase().trim();
    let isForbidden = false;
    this.getForbiddenNames().forEach(forbidden => {
        if(forbidden.startsWith('regex:')) forbidden = new RegExp(forbidden.substr(6), 'gi');
        if(name.match(forbidden)) isForbidden = true;
    });
    return isForbidden;
}

function getAESKey() {
    KEY = process.env.AES_KEY;
    if(KEY) return;
    console.log('Loading aes.key');
    try {
        KEY = fs.readFileSync('./private-keys/aes.key').toString();
    } catch(err) {
        console.warn(err);
    }
}

function loadConfig() {
    console.log('Loading Config.json');
    try {
        config = require('../Config.json');
        encrypt();
    } catch(err) {
        console.log('No Config.json!');
    }
}

function encrypt() {
    console.log('Saving Crypted.lock');
    try {
        let ciphertext = AES.encrypt(JSON.stringify(config, null, 4), KEY);
        fs.writeFileSync('./Crypted.lock', ciphertext.toString());
    } catch(err) {
        console.error(err);
    }
}

function loadCrypted() {
    console.log('Loading Crypted.lock');
    try {
        let ciphertext = fs.readFileSync('./Crypted.lock').toString();
        let bytes = AES.decrypt(ciphertext.toString(), KEY);
        let plaintext = bytes.toString(encoding);
        config = JSON.parse(plaintext);
        fs.writeFileSync('./Config.json', JSON.stringify(config, null, 4));
    } catch(err) {
        console.log('No Crypted.lock');
    }
}

const settingService = new SettingService();
module.exports = settingService;