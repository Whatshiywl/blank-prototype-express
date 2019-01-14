let _ = require('lodash');

function User(credentials) {
    this._id = (credentials || {}).username;
    this.username = (credentials || {}).username;
    this.password = (credentials || {}).password;
    this.score = 0;
    this.visited = [];
    this.current = '';
    this.at = this.last = Date.now();
};

User.prototype.hasVisitedRoute = route => {
    return true;
}

module.exports = User;

module.exports.from = user => {
    let newUser = new User();
    _.forIn(_.cloneDeep(user), (value, key) => newUser[key] = value);
    return newUser;
}
