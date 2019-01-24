import * as _ from 'lodash';
import { FilterQuery, UpdateQuery } from 'mongodb';
import User from './User';

export default class BlankPath {

    readonly answer: string;
    readonly target: string;
    readonly queries: {
        find?: FilterQuery<User>,
        update?: UpdateQuery<User>
    };
    readonly index: string;

    static from(path) {
        let newPath = new BlankPath();
        _.forIn(_.cloneDeep(path), (value, key) => newPath[key] = value);
        return newPath;
    }
}