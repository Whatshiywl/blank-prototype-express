var mongodb = require('mongodb');
var _ = require('lodash');

var settingService = require('./SettingService');
var mongoSettings = settingService.getConfig().mongoSettings;

// Create seed data

// let seedData = [
//   {
//     decade: '1970s',
//     artist: 'Debby Boone',
//     song: 'You Light Up My Life',
//     weeksAtOne: 10
//   },
//   {
//     decade: '1980s',
//     artist: 'Olivia Newton-John',
//     song: 'Physical',
//     weeksAtOne: 10
//   },
//   {
//     decade: '1990s',
//     artist: 'Mariah Carey',
//     song: 'One Sweet Day',
//     weeksAtOne: 16
//   }
// ];

// Standard URI format: mongodb://[dbuser:dbpassword@]host:port/dbname
let uri = `mongodb://${mongoSettings.user}:${mongoSettings.pass}@${mongoSettings.host}:${mongoSettings.port}/${mongoSettings.daba}`;

var client;

// mongodb.MongoClient.connect(uri, {useNewUrlParser: true}, function(err, client) {

//   if(err) throw err;

//   /*
//    * Get the database from the client. Nothing is required to create a
//    * new database, it is created automatically when we insert.
//    */

//   let db = client.db(mongoSettings.daba)

//   /*
//    * First we'll add a few songs. Nothing is required to create the
//    * songs collection; it is created automatically when we insert.
//    */

//   let songs = db.collection('songs');

//    // Note that the insert method can take either an array or a dict.

//   songs.insertMany(seedData, function(err, result) {

//     if(err) throw err;

//     /*
//      * Then we need to give Boyz II Men credit for their contribution
//      * to the hit "One Sweet Day".
//      */

//     songs.updateOne(
//       { song: 'One Sweet Day' },
//       { $set: { artist: 'Mariah Carey ft. Boyz II Men' } },
//       function (err, result) {

//         if(err) throw err;

//         /*
//          * Finally we run a query which returns all the hits that spend 10 or
//          * more weeks at number 1.
//          */

//         songs.find({ weeksAtOne : { $gte: 10 } }).sort({ decade: 1 }).toArray(function (err, docs) {

//           if(err) throw err;

//           docs.forEach(function (doc) {
//             console.log(
//               'In the ' + doc['decade'] + ', ' + doc['song'] + ' by ' + doc['artist'] +
//               ' topped the charts for ' + doc['weeksAtOne'] + ' straight weeks.'
//             );
//           });

//         //   Since this is an example, we'll clean up after ourselves.
//         songs.drop(function (err) {
//             if(err) throw err;

//             // Only close the connection when your app is terminating.
//             client.close();
//           });
//         });
//       }
//     );
//   });
// });

function MongoService() {
    this.USER_COLLECTION = "users";
}

MongoService.prototype.connect = function() {
    return new Promise((resolve, reject) => {
        if(client) resolve(client.db(mongoService.daba));
        else {
            mongodb.MongoClient.connect(uri, {useNewUrlParser: true})
            .then(c => {
                client = c;
                resolve(c.db(mongoSettings.daba));
            }).catch(reject);
        }
    });
}

MongoService.prototype.getCollection = function(collection) {
    return new Promise((resolve, reject) => {
        this.connect()
        .then(db => {
            let col;
            try {
                col = db.collection(collection, {strict: true});
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

MongoService.prototype.createUser = function(name) {
    name = name.toLowerCase().trim();
    let now = Date.now();
    let user = {
        _id: name,
        name,
        score: settingService.isIgnoredName(name) ? -1 : 0,
        at: now,
        last: now
    };
    return new Promise((resolve, reject) => {
        this.userExists(name)
        .then(data => {
            if(data.exists) reject('User already exists');
            else {
                this.getCollection(this.USER_COLLECTION)
                .then(users => resolve(users.insertOne(user)))
                .catch(reject);
            }
        })
        .catch(reject);
    });
}

MongoService.prototype.getUser = function(name) {
    name = name.toLowerCase().trim();
    let now = Date.now();
    return new Promise((resolve, reject) => {
        this.getCollection(this.USER_COLLECTION)
        .then(users => users.findOne({_id: name})
            .then(user => {
                if(!user) reject('User doesnt exist');
                else {
                    users.updateOne({_id: name}, {$set: {last: now}})
                    .then(() => resolve(user))
                    .catch(reject);
                }
            })
            .catch(reject))
        .catch(reject);
    });
}

MongoService.prototype.getUsers = function(filter) {
    return new Promise((resolve, reject) => {
        this.getCollection(this.USER_COLLECTION)
        .then(users => {
            users.find(filter).toArray()
            .then(resolve)
            .catch(reject);
        })
        .catch(reject);
    });
}

MongoService.prototype.updateUser = function(name, query) {
    name = name.toLowerCase().trim();
    let now = Date.now();
    return new Promise((resolve, reject) => {
        this.getCollection(this.USER_COLLECTION)
        .then(users => {
            users.updateOne({_id: name}, _.defaultsDeep({$set: {last: now}}, query))
            .then(resolve).catch(reject);
        })
        .catch(reject);
    });
}

MongoService.prototype.userExists = function(name) {
    name = (name || '').toLowerCase().trim();
    return new Promise((resolve, reject) => {
        this.getUser(name)
        .then(user => resolve({
            exists: Boolean(user),
            password: Boolean(user.password)
        }))
        .catch(error => error == 'User doesnt exist' ? resolve({exists: false, password: false}) : reject(error));
    });
}

MongoService.prototype.deleteUser = function(name) {
    name = name.toLowerCase().trim();
    return new Promise((resolve, reject) => {
        this.getCollection(this.USER_COLLECTION)
        .then(users => {
            users.drop({_id: name})
            .then(resolve)
            .catch(reject);
        })
        .catch(reject);
    });
}

MongoService.prototype.disconnect = function() {
    return new Promise((resolve, reject) => {
        if(!client) resolve();
        else client.close().then(() => {
            client = undefined;
            resolve();
        }).catch(reject);
    });
}

const mongoService = new MongoService();
module.exports = mongoService;