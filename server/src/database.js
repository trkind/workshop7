var ObjectID = require('mongodb').ObjectID;

// Data goes here.
var initialData = {
  // The "user" collection. Contains all of the users in our Facebook system.
  "users": {
    // This user has id "1".
    "1": {
      "_id": new ObjectID("000000000000000000000001"),
      "fullName": "Someone",
      "feed": new ObjectID("000000000000000000000001")
    },
    "2": {
      "_id": new ObjectID("000000000000000000000002"),
      "fullName": "Someone Else",
      "feed": new ObjectID("000000000000000000000002")
    },
    "3": {
      "_id": new ObjectID("000000000000000000000003"),
      "fullName": "Another Person",
      "feed": new ObjectID("000000000000000000000003")
    },
    // This is "you"!
    "4": {
      "_id": new ObjectID("000000000000000000000004"),
      "fullName": "John Vilk",
      // ID of your feed.
      "feed": new ObjectID("000000000000000000000004")
    }
  },
  // The 'feedItems' collection. Contains all of the feed items on our Facebook
  // system.
  "feedItems": {
    "1": {
      "_id": new ObjectID("000000000000000000000001"),
      "likeCounter": [
        new ObjectID("000000000000000000000002"), new ObjectID("000000000000000000000003")
      ],
      "type": "statusUpdate",
      "contents": {
        "author": new ObjectID("000000000000000000000001"),
        "postDate": 1453668480000,
        "location": "Austin, TX",
        "contents": "ugh."
      },
      "comments": [
        {
          "author": new ObjectID("000000000000000000000002"),
          "contents": "hope everything is ok!",
          "postDate": 1453690800000,
          "likeCounter": []
        },
        {
          "author": new ObjectID("000000000000000000000003"),
          "contents": "sending hugs your way",
          "postDate": 1453690800000,
          "likeCounter": []
        }
      ]
    },
    "2": {
      "_id": new ObjectID("000000000000000000000002"),
      "likeCounter": [],
      "type": "statusUpdate",
      "contents": {
        "author": new ObjectID("000000000000000000000004"),
        "postDate": 1458231460117,
        "location": "Philadelphia, PA",
        "contents": "You can now edit and delete status updates!\nGo ahead and click the caret in the corner of the post."
      },
      "comments": []
    }
  },
  // "feeds" collection. Feeds for each FB user.
  "feeds": {
    "4": {
      "_id": new ObjectID("000000000000000000000004"),
      // Listing of FeedItems in the feed.
      "contents": [new ObjectID("000000000000000000000002"), new ObjectID("000000000000000000000001")]
    },
    "3": {
      "_id": new ObjectID("000000000000000000000003"),
      "contents": []
    },
    "2": {
      "_id": new ObjectID("000000000000000000000002"),
      "contents": []
    },
    "1": {
      "_id": new ObjectID("000000000000000000000001"),
      "contents": []
    }
  }
};

var data;
// If 'true', the in-memory object representing the database has changed,
// and we should flush it to disk.
var updated = false;
// Pull in Node's file system and path modules.
var fs = require('fs'),
  path = require('path');

try {
  // ./database.json may be missing. The comment below prevents ESLint from
  // complaining about it.
  // Read more about configuration comments at the following URL:
  // http://eslint.org/docs/user-guide/configuring#configuring-rules
  /* eslint "node/no-missing-require": "off" */
  data = require('./database.json');
} catch (e) {
  // ./database.json is missing. Use the seed data defined above
  data = JSONClone(initialData);
}

/**
 * A dumb cloning routing. Serializes a JSON object as a string, then
 * deserializes it.
 */
function JSONClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Emulates reading a "document" from a NoSQL database.
 * Doesn't do any tricky document joins, as we will cover that in the latter
 * half of the course. :)
 */
function readDocument(collection, id) {
  // Clone the data. We do this to model a database, where you receive a
  // *copy* of an object and not the object itself.
  var collectionObj = data[collection];
  if (!collectionObj) {
    throw new Error(`Object collection ${collection} does not exist in the database!`);
  }
  var obj = collectionObj[id];
  if (obj === undefined) {
    throw new Error(`Object ${id} does not exist in object collection ${collection} in the database!`);
  }
  return JSONClone(data[collection][id]);
}
module.exports.readDocument = readDocument;

/**
 * Emulates writing a "document" to a NoSQL database.
 */
function writeDocument(collection, changedDocument) {
  var id = changedDocument._id;
  if (id === undefined) {
    throw new Error(`You cannot write a document to the database without an _id! Use AddDocument if this is a new object.`);
  }
  // Store a copy of the object into the database. Models a database's behavior.
  data[collection][id] = JSONClone(changedDocument);
  // Update our 'database'.
  updated = true;
}
module.exports.writeDocument = writeDocument;

/**
 * Adds a new document to the NoSQL database.
 */
function addDocument(collectionName, newDoc) {
  var collection = data[collectionName];
  var nextId = Object.keys(collection).length;
  if (newDoc.hasOwnProperty('_id')) {
    throw new Error(`You cannot add a document that already has an _id. addDocument is for new documents that do not have an ID yet.`);
  }
  while (collection[nextId]) {
    nextId++;
  }
  newDoc._id = nextId;
  writeDocument(collectionName, newDoc);
  return newDoc;
}
module.exports.addDocument = addDocument;

/**
 * Deletes a document from an object collection.
 */
function deleteDocument(collectionName, id) {
  var collection = data[collectionName];
  if (!collection[id]) {
    throw new Error(`Collection ${collectionName} lacks an item with id ${id}!`);
  }
  delete collection[id];
  updated = true;
}
module.exports.deleteDocument = deleteDocument;

/**
 * Returns an entire object collection.
 */
function getCollection(collectionName) {
  return JSONClone(data[collectionName]);
}
module.exports.getCollection = getCollection;

/**
 * Reset the database.
 */
function resetDatabase() {
  data = JSONClone(initialData);
  updated = true;
}
module.exports.resetDatabase = resetDatabase;

// Periodically updates the database on the hard drive
// when changed.
setInterval(function() {
  if (updated) {
    fs.writeFileSync(path.join(__dirname, 'database.json'), JSON.stringify(data), { encoding: 'utf8' });
    updated = false;
  }
}, 200);
