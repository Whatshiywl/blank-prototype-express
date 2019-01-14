import * as _ from 'lodash';

export default class User {

    _id;
    username;
    password;
    score;
    visited;
    current;
    at;
    last;

    constructor(credentials?) {
        this._id = (credentials || {}).username;
        this.username = (credentials || {}).username;
        this.password = (credentials || {}).password;
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
