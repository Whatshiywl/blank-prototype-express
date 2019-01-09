let graph = require('./graph-import/graph.json');
let fs = require('fs');
let _ = require('lodash');

if(!graph) {
    console.log('No graph found!');
    process.exit(0);
}

let levels = {};

graph.nodes.forEach(node => {
    let level = {
        question: node.label,
        url: node.attributes.url
    }
    level.answers = [];
    levels[node.id] = level;
});

graph.edges.forEach(edge => {
    let from = levels[edge.source];
    let a = {
        answer: edge.label, 
        target: edge.target,
        order: edge.attributes.Order,
        query: edge.attributes.Query
    };
    _.forIn(edge.attributes, (value, key) => {
        if(key.startsWith('queries')) value = JSON.parse(value);
        _.set(a, key, value);
    });
    from.answers.push(a);
});

fs.writeFileSync('levels.json', JSON.stringify(levels, null, 4));