var DirectRouter = require('express').Router();

const URLS = (process.env.URLS || '').split(',');
const QUESTIONS = (process.env.QUESTIONS || '').split(',');
const ANSWERS = (process.env.ANSWERS || '').split(',').map(str => str.toLowerCase());

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

    console.log(`Setting route: ${from.route} -> ${to.route}`);

    if(i==0) {
        DirectRouter.get('/', (req, res) => res.redirect(from.route));
    }

    let getFromFile = fromURL.startsWith('file:');
    if(getFromFile) fromURL = question.substr(5);

    DirectRouter.get(from.route, (req, res) => {
        res.render(getFromFile ? fromURL : 'index', {question: QUESTIONS[i], route: from.route});
    });

    DirectRouter.post(from.route, (req, res) => {
        let r = (req.body.r || '').toLowerCase();
        if(r === ANSWERS[i]) res.redirect(i == URLS.length-1 ? 'coming-soon' : to.route);
        else res.redirect('/');
    });
});

DirectRouter.get('/coming-soon', (req, res) => res.render('index', {question: 'Coming soon...', route: '/coming-soon'}));

DirectRouter.post('/coming-soon', (req, res) => res.redirect('coming-soon'));

module.exports = DirectRouter;