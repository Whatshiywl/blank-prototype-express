var DirectRouter = require('express').Router();
var moment = require('moment');

var config = require('../services/SettingService').config;
var levels = config.levels || [];
var entry = config.entryPoint || 0;

const URLS = (process.env.URLS || '').split(',');
const QUESTIONS = (process.env.QUESTIONS || '').split(',');
const ANSWERS = (process.env.ANSWERS || '').split(',').map(str => str.toLowerCase());

function toRoute(url) {
    return '/' + Buffer.from(url).toString('base64');
}

function getHandler(file, obj) {
    return (req, res) => {
        res.render(file, obj);
    };
}

function postHandler(answer, from, success, error) {
    answer = answer.toLowerCase().trim();
    if(answer.startsWith('regex:')) answer = new RegExp(answer.substr(6), 'i');
    return (req, res) => {
        let r = (req.body.r || '').toLowerCase().trim();
        let match = r.match(answer);
        let right = match && match[0] === r;
        let timestamp = moment().format("DD/MM/YY HH:mm:ss");
        console.log(timestamp, from, r, (right ? '=' : '!='), answer);
        if(right) res.redirect(success);
        else res.redirect(error);
    };
}

let levelIds = Object.keys(levels);
levelIds.forEach(id => {

    let level = levels[id];
    level.route = toRoute(level.url);

    let successLevel = levels[level.success || (id+1)];
    successLevel.route = toRoute(successLevel.url);

    let errorLevel = levels[level.error || id];
    errorLevel.route = toRoute(errorLevel.url);

    console.log(`${id}: Setting route: ${level.route} ? ${successLevel.route} : ${errorLevel.route}`);

    DirectRouter.get(level.route, getHandler(level.file || 'index', level));

    DirectRouter.post(level.route, postHandler(level.answer, level.route, successLevel.route, errorLevel.route));
});

DirectRouter.get('/', (req, res) => {
    let url = toRoute(levels[entry].url);
    res.redirect(url);
});

module.exports = DirectRouter;
