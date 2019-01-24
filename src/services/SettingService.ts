import * as fs from 'fs';
import * as CryptoJS from 'crypto-js';
import * as _ from 'lodash';
import { FilterQuery, UpdateQuery } from 'mongodb';
import User from '../models/User';
import BlankPath from '../models/BlankPath';
import BlankRoute from '../models/BlankRoute';
const AES = CryptoJS.AES;
const encoding = CryptoJS.enc.Utf8;

class SettingService {
    
    config: {
        mongoSettings: {
            host: string,
            port: number,
            user: string,
            pass: string,
            daba: string
        },
        ignoreUserNames: string[],
        forbiddenUserNames: string[],
        saltTemplate: string,
        entryPoint: number,
        routes: {
            [key: string]: BlankRoute
        }
    };
    pathKeyMap: {[key: string]: any} = {};
    KEY: string;

    constructor() {
        this.getAESKey();
        this.loadConfig();
        if(!this.config) this.loadCrypted();
        if(!this.config) {
            console.error('ERROR! NO CONFIG FOUND! EXING PROCESS...');
            process.exit(9);
        }
        _.forIn(this.getConfig().routes, (value, key) => value.url ? this.pathKeyMap[value.url] = key : true);    
    }

    getConfig() {
        return _.cloneDeep(this.config);
    }

    getIgnoredNames() {
        return _.cloneDeep(this.config.ignoreUserNames || []);
    }

    getRouteByID(id: string) {
        return this.getConfig().routes[id];
    }

    getRouteIDByURL(url: string) {
        return this.pathKeyMap[url] || this.pathKeyMap[Buffer.from(url, 'base64').toString()];
    }

    getRouteByURL(url: string) {
        let id = this.getRouteIDByURL(url);
        return this.getRouteByID(id);
    }

    isIgnoredName(name: string) {
        name = name.toLowerCase().trim();
        let isIgnored = false;
        this.getIgnoredNames().forEach(ignored => {
            let regex = new RegExp(ignored.substr(6), 'gi');
            if(name.match(regex)) isIgnored = true;
        });
        return isIgnored;
    }

    getForbiddenNames() {
        let forbidden = _.cloneDeep(this.config.forbiddenUserNames || []);
        _.forIn(this.config.routes, level => {
            _.forEach(level.paths, answer => {
                if(answer.answer)
                    forbidden.push(answer.answer);
            });
        });
        forbidden.pop();
        return forbidden;
    }

    isForbiddenName(name: string) {
        name = (name || '').toLowerCase().trim();
        let isForbidden = false;
        this.getForbiddenNames().forEach(forbidden => {
            let regex = new RegExp(forbidden, 'gi');
            if(name.match(regex)) isForbidden = true;
        });
        return isForbidden;
    }

    private getAESKey() {
        this.KEY = process.env.AES_KEY;
        if(this.KEY) return;
        console.log('Loading aes.key');
        try {
            this.KEY = fs.readFileSync('./private-keys/aes.key').toString();
        } catch(err) {
            console.error('Error loading aes.key:', err.name, err.message);
            console.error('Exiting process...');
            process.exit(9);
        }
    }

    private setConfig(parsed: any) {
        _.forIn(parsed.routes, (route, key) => 
            parsed.routes[key] = BlankRoute.from(route));
        this.config = parsed;
    }

    private loadConfig() {
        console.log('Loading Config.json');
        try {
            this.setConfig(JSON.parse(fs.readFileSync('./Config.json').toString()));
            this.encrypt();
        } catch(err) {
            console.log('No Config.json!');
        }
    }

    private encrypt() {
        console.log('Saving Crypted.lock');
        try {
            let ciphertext = AES.encrypt(JSON.stringify(this.config, null, 4), this.KEY);
            fs.writeFileSync('./Crypted.lock', ciphertext.toString());
        } catch(err) {
            console.error(err);
        }
    }

    private loadCrypted() {
        console.log('Loading Crypted.lock');
        try {
            let ciphertext = fs.readFileSync('./Crypted.lock').toString();
            let bytes = AES.decrypt(ciphertext.toString(), this.KEY);
            let plaintext = bytes.toString(encoding);
            this.setConfig(JSON.parse(plaintext));
            fs.writeFileSync('./Config.json', JSON.stringify(this.config, null, 4));
        } catch(err) {
            console.log('No Crypted.lock');
        }
    }

}

const settingService = new SettingService();
export default settingService;