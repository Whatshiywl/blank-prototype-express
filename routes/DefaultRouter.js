var DefaultRouter = require('express').Router();

DefaultRouter.get('/hello', (req, res) => {
    res.send('hello world');
});

module.exports = DefaultRouter;