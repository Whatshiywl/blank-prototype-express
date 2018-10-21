var DirectRouter = require('express').Router();
var moment = require('moment');

const URLS = (process.env.URLS || '').split(',');
const QUESTIONS = (process.env.QUESTIONS || '').split(',');
const ANSWERS = (process.env.ANSWERS || '').split(',').map(str => str.toLowerCase());

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

let i=0;
let fromURL;
let toURL;
URLS.forEach((url, i) => {
    let fromURL = (URLS[i-1] || 'index').replace(/(_| )+/g, '-');
    from = {
        url: fromURL,
        route: '/' + Buffer.from(fromURL).toString('base64')
    }

    let toURL = (url || 'index').replace(/(_| )+/g, '-');
    to = {
        url: toURL,
        route: '/' + Buffer.from(toURL).toString('base64')
    }

    console.log(`${i}: Setting route: ${from.route} -> ${to.route}`);

    let getFromFile = fromURL.startsWith('file:');
    if(getFromFile) fromURL = question.substr(5);

    DirectRouter.get(from.route, getF(getFromFile ? fromURL : 'index', {question: QUESTIONS[i], route: from.route}));

    DirectRouter.post(from.route, postF(ANSWERS[i], from.route, i == URLS.length-1 ? 'coming-soon' : to.route));
});

DirectRouter.get('/', (req, res) => {
    let url = '/' + Buffer.from('index').toString('base64');
    res.redirect(url);
});

DirectRouter.get('/coming-soon', (req, res) => res.render('index', {question: 'Coming soon...', route: '/coming-soon'}));

DirectRouter.post('/coming-soon', (req, res) => res.redirect('coming-soon'));

module.exports = DirectRouter;
