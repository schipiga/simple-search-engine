"use strict";

var natural = require("natural");
var synaptic = require("synaptic");

var db = require("./db.json");

for (var post of db) {
    post.content = post.content.toLowerCase();
};

/* internal */

var makeId = db => {
    var maxId = db.length - 1;
    for (var i = 0; i <= maxId; i++) {
        db[i].id = i / maxId;
    }
};

var makeDict = db => {
    var dict = {};
    var words = [];

    for (var post of db) {
        for (var ngrams of natural.NGrams.ngrams(post.content, 1)) {
            var word = natural.PorterStemmer.stem(ngrams[0]);
            if (word.length < 3) continue;
            if (words.includes(word)) continue;
            words.push(word);
        }
    }

    var wMax = words.length;
    for (var i = 1; i <= wMax; i++) {
        dict[words[i-1]] = i / wMax;
    }

    return dict;
};

var makeSet = (db, dict) => {
    var set = [];

    for (var post of db) {
        var words = [];
        for (var ngrams of natural.NGrams.ngrams(post.content, 1)) {
            var word = natural.PorterStemmer.stem(ngrams[0]);
            if (word.length < 3) continue;
            words.push(word);
        }

        var phrase = words.join(" ");

        for (var stems of natural.NGrams.ngrams(phrase, 10)) {
            var input = [];
            for (var word of stems) {
                input.push(dict[word]);
            }
            set.push({
                input: input,
                output: [post.id],
            })
        }
    }

    return set;
};

var makeInput = (str, dict) => {
    var input = [];
    for (var ngrams of natural.NGrams.ngrams(str, 1)) {
        var word = natural.PorterStemmer.stem(ngrams[0]);
        if (word.length < 3) continue;
        if (!dict[word]) continue;
        input.push(dict[word]);
    }

    var i = 0;
    while (input.length < 10) {
        input.push(input[i++]);
    }
    return input;
}

/* internal end */

makeId(db);
var dict = makeDict(db);
var set = makeSet(db, dict);

var myNet = new synaptic.Architect.Perceptron(10, 4, 1);
var trainer = new synaptic.Trainer(myNet);

trainer.train(set, {
    rate: .5,
    iterations: 10000,
    error: .005,
    shuffle: true,
    cost: synaptic.Trainer.cost.CROSS_ENTROPY,
});

exports.search = str => {
    var res = myNet.activate(makeInput(str, dict));

    var posts = [];
    for (var post of db) {
        posts.push({ url: post.url, diff: Math.abs(post.id - res) });
    };
    posts = posts.sort((a, b) => a.diff - b.diff);
    return posts.slice(0, 5).map(i => i.url);
};
