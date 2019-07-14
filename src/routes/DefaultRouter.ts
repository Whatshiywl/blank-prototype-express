import { Router, Request, Response } from 'express';
import leaderboardService from '../services/LeaderboardService';
import mongoService from '../services/MongoService';
import settingService from '../services/SettingService';
import authService from '../services/AuthService';
import jwtService from '../services/JWTService';
import User from '../models/User';
import * as _ from 'lodash';
import BlankPath from '../models/BlankPath';
import BlankRoute from '../models/BlankRoute';

class DefaultRouter {

    router: Router;

    constructor() {
        this.router = Router();

        this.router.get('/hello', this.getHelloWorld.bind(this));
        
        this.router.get('/leaderboard', this.getLeaderboard.bind(this));
        
        this.router.get('/user-exists', this.getUserExists.bind(this));
        
        this.router.post('/post-answer', this.postAnswer.bind(this));
        
        this.router.get('/validate-route', this.getValidateRoute.bind(this));
        
        this.router.post('/login', this.postLogin.bind(this));
    }

    getHelloWorld(req: Request, res: Response) {
        res.send('hello world');
    }
    
    getLeaderboard(req: Request, res: Response) {
        leaderboardService.getLeaderboard()
        .then(leaderboard => res.send(leaderboard))
        .catch(err => res.status(err.status).send(err));
    }
    
    getUserExists(req: Request, res: Response) {
        let username = req.query.username;
        if(!username) {
            res.send({exists: false});
            return;
        }
        mongoService.userExists(username)
        .then(data => res.send(data))
        .catch(err => res.send(err));
    }
    
    postAnswer(req: Request, res: Response) {
    
        const sendRoute = (route: BlankRoute) => {
            let picked = {
                question: route.question,
                url: route.base64Url
            }
            jwtService.encryptRouteToken(route).then(token => res.send({...{token}, ...picked}))
            .catch(err => res.status(500).send(err));
        }
    
        let base64Url = req.body.from;
        let answer = req.body.answer || '';
        let token = req.body.token;
    
        if(!base64Url) {
            res.status(400).send({err: "No from field on body"});
            return;
        }

        const testRouteForUser = (user: User) => {

            const success = (path?: BlankPath) => {
                let target = path ? path.target : '0';
                let routeTo = settingService.getConfig().routes[target];
                if(user.isGuest()) return sendRoute(routeTo);

                let pathUpdateQueries = path ? (path.queries || {}).update : undefined;
                let visited = (user.visited || []);
                if(visited.indexOf(target) == -1) visited.push(target);
                let updateQueries = _.defaultsDeep({ $set: { visited } }, pathUpdateQueries);
                mongoService.updateUser(user.username, updateQueries)
                .then(() => sendRoute(routeTo))
                .catch(err => res.status(500).send(err));
            }
    
            let route: BlankRoute;
            if(base64Url == 'login') return success();

            let plainUrl = Buffer.from(base64Url, 'base64').toString();

            let id = settingService.getRouteIDByURL(plainUrl);
            if(!user.isGuest() && (!user.visited || user.visited.indexOf(id) == -1)) {
                res.send({success: false});
                return;
            }
        
            route = settingService.getRouteByURL(plainUrl);
        
            if(!route) {
                res.status(404).send({err: `Route with url ${base64Url} not found`});
                return;
            }
        
            let matchingAnswers = _.filter(route.paths, p => {
                let regex = new RegExp(p.answer);
                let matches = answer.match(regex);
                if(!matches) return false;
                let matched = matches[0];
                return matched == answer;
            });
    
            let ordered = _.orderBy(matchingAnswers, 'index');

            const testFindQueries = (queries) => {
                let passed = true; 
                _.forIn(queries, (value, key) => {
                    let eq = _.get(user, key) == value; 
                    if(!eq) passed = false; 
                    return eq;
                }); 
                return passed;
            }

            let path = _.find(ordered, p => !p.queries || testFindQueries(p.queries.find));

            if(path) success(path);
            else res.send({success: false});
        }
    
        if(!token) testRouteForUser(User.GuestUser);
        else {
            jwtService.getUserFromToken(token)
            .then(testRouteForUser)
            .catch(err => res.status(400).send(err));
        }
    
    }
    
    getValidateRoute(req: Request, res: Response) {
        let from = req.query.from;
        let routeToken = req.query['route-token'];
        let token = req.query.token;
    
        if(!from) {
            res.status(401).send({err: 'No route provided'});
            return;
        }
    
        if(!routeToken && !token) {
            res.status(401).send({err: 'No token provided'});
            return;
        }
    
        const tryFromToken = (err?) => {
            if(!token) {
                res.status(403).send({err: err || 'Invalid route token'});
                return;
            }
    
            let fromId = settingService.getRouteIDByURL(from);
            jwtService.decryptLoginToken(token)
            .then(payload => {
                let username = payload.user.username;
                if(!username) {
                    res.status(401).send({err: 'Invalid login token'});
                    return;
                }
                mongoService.getUser(username)
                .then(user => {
                    res.send({success: user.visited && user.visited.indexOf(fromId) != -1});
                })
                .catch(err => res.status(401).send(err));
            })
            .catch(err => res.status(401).send(err))
        }
    
        jwtService.decryptRouteToken(routeToken)
        .then(payload => {
            if(!payload.success || !payload.url) tryFromToken();
            else res.send({success: payload.url == from});
        })
        .catch(err => tryFromToken(err));
    
    }
    
    postLogin(req: Request, res: Response) {
        let credentials = req.body || {};
        let username = credentials.username;
        if(settingService.isForbiddenName(username)) res.send({err: `${username} is not an allowed name`});
        else {
            authService.login(credentials)
            .then(token => res.send({token}))
            .catch(err => {
                console.log(err);
                res.send(err)
            });
        }
    }

}

const defaultRouter = new DefaultRouter();
export default defaultRouter.router;