"use strict";

var natural = require('natural');

var db = require("./db.json");
var U = require("./utils");

exports.search = phrase => {
    var result = [];

    phrase = natural
        .NGrams.ngrams(phrase, 1)
        .map(i => natural.PorterStemmer.stem(i[0]))
        .join(" ");

    for (var post of db) {
        if (!U.textContains(post.content, phrase)) continue;
        result.push(post.url);
    };

    return result;
};