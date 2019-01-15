import * as express from 'express'
import * as path from 'path'
import * as favicon from 'serve-favicon'
import * as logger from 'morgan'
import * as cookieParser from 'cookie-parser'
import * as bodyParser from 'body-parser'
import * as handlebars from 'express-handlebars'
import * as cors from 'cors';

// var DirectRouter = require('./routes/DirectRouter');
// var DefaultRouter = require('./routes/DefaultRouter');
import DefaultRouter from './routes/DefaultRouter';
import { ExecFileOptions } from 'child_process';
// var SecureRouter = require('./routes/SecureRouter');
// import SecureRouter from './routes/SecureRouter';

class App {

  readonly express: express.Application;

  constructor() {
    this.express = express();
    this.middleware();
    this.routes();
    this.error();
  }

  private middleware() {

    this.express.use(cors());

    // view engine setup
    this.express.set('views', path.join(__dirname, 'views'));
    this.express.engine('handlebars', handlebars({defaultLayout: 'main'}));
    this.express.set('view engine', 'handlebars');
    
    // uncomment after placing your favicon in /public
    //app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
    if(process.env.NODE_ENV == 'dev') this.express.use(logger('dev'));
    this.express.use(bodyParser.json());
    this.express.use(bodyParser.urlencoded({ extended: false }));
    this.express.use(cookieParser());
    this.express.use(express.static(path.join(__dirname, 'public')));
  }

  private routes() {

    this.express.use('/api/v1', DefaultRouter);
    // this.express.use('/secure', SecureRouter);
    // this.express.use('/', DirectRouter);
  }

  private error() {
    // catch 404 and forward to error handler
    this.express.use(function(req, res, next) {
      var err = new Error('Not Found');
      err['status'] = 404;
      next(err);
    });
    
    // error handler
    this.express.use(function(err, req, res, next) {
      // set locals, only providing error in development
      res.locals.message = err.message;
      res.locals.error = err || {};
    
      // render the error page
      res.status(err.status || 500);
      res.render('error');
    });
  }

}

export default new App().express;
