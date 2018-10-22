var DirectRouter = require('express').Router();
var moment = require('moment');

var settingService = require('../services/SettingService');

const URLS = (process.env.URLS || '').split(',');
const QUESTIONS = (process.env.QUESTIONS || '').split(',');
const ANSWERS = (process.env.ANSWERS || '').split(',').map(str => str.toLowerCase());

function toRoute(url) {
    return '/' + Buffer.from(url).toString('base64');
}

function getF(file, obj) {
    return (req, res) => {
        res.render(file, obj);
    };
}

function postF(answer, from, to) {
    return (req, res) => {
        let r = (req.body.r || '').toLowerCase().trim();
        let right = r === answer;
        let timestamp = moment().format("DD/MM/YY HH:mm:ss");
        console.log(timestamp, from, r, (right ? '=' : '!='), answer);
        if(right) res.redirect(to);
        else res.redirect(from);
    };
}

URLS.forEach((url, i) => {
    let fromURL = url.replace(/(_| )+/g, '-');
    from = {
        url: fromURL,
        route: toRoute(fromURL)
    }

    let toURL = (URLS[i+1] || 'coming-soon').replace(/(_| )+/g, '-');
    to = {
        url: toURL,
        route: toRoute(toURL)
    }

    console.log(`${i}: Setting route: ${from.route} -> ${to.route}`);

    let getFromFile = fromURL.startsWith('file:');
    if(getFromFile) fromURL = question.substr(5);

    DirectRouter.get(from.route, getF(getFromFile ? fromURL : 'index', {question: QUESTIONS[i], route: from.route}));

    DirectRouter.post(from.route, postF(ANSWERS[i], from.route, to.route));
});

DirectRouter.get('/', (req, res) => {
    let url = toRoute(URLS[0]);
    res.redirect(url);
});

let comingSoonRoute = toRoute('coming-soon');

DirectRouter.get(comingSoonRoute, (req, res) => res.render('index', {question: 'Coming soon...', route: comingSoonRoute}));

DirectRouter.post(comingSoonRoute, (req, res) => res.redirect(comingSoonRoute));

module.exports = DirectRouter;
