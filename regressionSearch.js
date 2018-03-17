"use strict";

var natural = require("natural");

var db = require("./db.json");
var U = require("./utils");

U.makeId(db);

var classifier = new natural.LogisticRegressionClassifier();

for (var post of db) {
    classifier.addDocument(post.content, post.id);
};
classifier.train();

exports.search = str => {
    var result = [];
    var classified = classifier.getClassifications(str).slice(0, 5);

    for (var cls of classified) {
        var post = U.getPost(db, cls.label);
        if (post) result.push(post.url);
    };
    return result;
};
