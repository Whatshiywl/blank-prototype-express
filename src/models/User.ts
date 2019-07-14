import * as _ from 'lodash';
import { GridFSBucketWriteStream } from 'mongodb';

export default class User {

    static readonly GuestUser = new User();

    _id: string;
    username: string;
    password: string;
    score: number;
    visited: string[];
    current: string;
    at: number | string;
    last: number;

    constructor(credentials?: {username: string, hash: string}) {
        this._id = credentials ? credentials.username : 'guest';
        this.username = credentials ? credentials.username : 'guest';
        this.password = credentials ? credentials.hash : '';
        this.score = 0;
        this.visited = [];
        this.current = '';
        this.at = this.last = Date.now();
    }

    static from(user) {
        let newUser = new User();
        _.forIn(_.cloneDeep(user), (value, key) => newUser[key] = value);
        return newUser;
    }

    public hasVisitedRoute(route) {
        return true;
    }

    public isGuest() {
        return this.username == 'guest';
    }

}