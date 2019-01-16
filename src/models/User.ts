import * as _ from 'lodash';

export default class User {

    _id: string;
    username: string;
    password: string;
    score: number;
    visited: string[];
    current: string;
    at: number;
    last: number;

    constructor(credentials?: {username: string, password: string}) {
        this._id = credentials ? credentials.username : '';
        this.username = credentials ? credentials.username : '';
        this.password = credentials ? credentials.password : '';
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

}
