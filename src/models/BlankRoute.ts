import * as _ from 'lodash';
import BlankPath from './BlankPath';

export default class BlankRoute {

    readonly question: string;
    readonly url: string;
    readonly base64Url: string;
    readonly paths: BlankPath[];

    constructor(){}

    static from(route) {
        let newRoute = new BlankRoute();
        _.forIn(_.cloneDeep(route), (value, key) => newRoute[key] = value);
        let key = 'base64Url';
        newRoute[key] = Buffer.from(newRoute.url).toString('base64');
        newRoute.paths.forEach((path, i) => newRoute.paths[i] = BlankPath.from(path));
        return newRoute;
    }
}