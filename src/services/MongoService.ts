import { MongoClient, Db, Collection, InsertOneWriteOpResult, UpdateWriteOpResult, DeleteWriteOpResultObject, UpdateQuery, FilterQuery } from 'mongodb';
import * as _ from 'lodash';

import settingService from './SettingService';
var mongoSettings = settingService.getConfig().mongoSettings;
import User from '../models/User';

class MongoService {
    private readonly USER_COLLECTION: string;
    private readonly URI: string;

    private client: MongoClient;

    constructor() {
        this.USER_COLLECTION = "users";
        this.URI = `mongodb://${mongoSettings.user}:${mongoSettings.pass}@${mongoSettings.host}:${mongoSettings.port}/${mongoSettings.daba}`;
    }

    private connect() {
        return new Promise<Db>((resolve, reject) => {
            if(this.client) resolve(this.client.db(mongoSettings.daba));
            else {
                MongoClient.connect(this.URI, {useNewUrlParser: true})
                .then(c => {
                    this.client = c;
                    resolve(c.db(mongoSettings.daba));
                }).catch(reject);
            }
        });
    }

    private getCollection(collection) {
        return new Promise<Collection<User>>((resolve, reject) => {
            this.connect()
            .then(db => {
                let col: Collection<User> | PromiseLike<Collection<User>>;
                try {
                    col = db.collection(collection, {strict: true}, undefined);
                    resolve(col);
                } catch (error) {
                    try {
                        col = db.createCollection(collection);
                        resolve(col);
                    } catch (error) {
                        reject(error);
                    }
                }
            })
            .catch(reject);
        });
    }

    createUser(credentials: {username: string, password: string}) {
        return new Promise<InsertOneWriteOpResult>((resolve, reject) => {
            if(!credentials || !credentials.username) reject({err: 'Invalid credentials!'});
            else {
                let username = credentials.username.toLowerCase().trim();
                let user = new User(credentials);
                this.userExists(username)
                .then(data => {
                    if(data.exists) reject('User already exists');
                    else {
                        this.getCollection(this.USER_COLLECTION)
                        .then(users => resolve(users.insertOne(user)))
                        .catch(reject);
                    }
                })
                .catch(reject);
            }
        });
    }

    getUser(userObj: User | string, filter?: FilterQuery<User>) {
        let username = this.getUsername(userObj);
        let now = Date.now();
        return new Promise<User>((resolve, reject) => {
            this.getCollection(this.USER_COLLECTION)
            .then(users => users.findOne({...{_id: username}, ...filter})
                .then(user => {
                    if(!user) reject({err: `No user with name ${username}`});
                    else {
                        users.updateOne({_id: userObj}, {$set: {last: now}})
                        .then(() => resolve(User.from(user)))
                        .catch(reject);
                    }
                })
                .catch(reject))
            .catch(reject);
        });
    }

    getUsers(filter?: FilterQuery<User>) {
        return new Promise<User[]>((resolve, reject) => {
            this.getCollection(this.USER_COLLECTION)
            .then(users => {
                users.find(filter).toArray()
                .then(resolve)
                .catch(reject);
            })
            .catch(reject);
        });
    }

    updateUser(userObj: User | string, query: UpdateQuery<User> | User) {
        let username = this.getUsername(userObj);
        let now = Date.now();
        return new Promise<UpdateWriteOpResult>((resolve, reject) => {
            this.getCollection(this.USER_COLLECTION)
            .then(users => {
                users.updateOne({_id: username}, _.defaultsDeep({$set: {last: now}}, query))
                .then(resolve).catch(reject);
            })
            .catch(reject);
        });
    }

    userExists(userObj: User | string) {
        let username = this.getUsername(userObj);
        return new Promise<{exists: boolean, password: boolean}>((resolve, reject) => {
            this.getUser(username)
            .then(user => resolve({
                exists: Boolean(user),
                password: Boolean(user.password)
            }))
            .catch(error => error == 'User doesnt exist' ? resolve({exists: false, password: false}) : reject(error));
        });
    }

    deleteUser(userObj: User | string) {
        let username = this.getUsername(userObj);
        return new Promise<DeleteWriteOpResultObject>((resolve, reject) => {
            this.getCollection(this.USER_COLLECTION)
            .then(users => {
                users.deleteOne({_id: username})
                .then(resolve)
                .catch(reject);
            })
            .catch(reject);
        });
    }

    private getUsername(user: User | string) {
        return (user instanceof User ? user.username : user).trim().toLowerCase();
    }

    private disconnect() {
        return new Promise<void>((resolve, reject) => {
            if(!this.client) resolve();
            else this.client.close().then(() => {
                this.client = undefined;
                resolve();
            }).catch(reject);
        });
    }
}

const mongoService = new MongoService();
export default mongoService;