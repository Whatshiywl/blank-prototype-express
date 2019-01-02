var DefaultRouter = require('express').Router();

DefaultRouter.get('/', (req, res) => {
    res.send('hello world');
});

module.exports = DefaultRouter;