let graph = require('./graph.json');
let fs = require('fs');

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
    from.answers.push({
        answer: edge.label, 
        target: edge.target,
        order: edge.attributes.Order,
        query: edge.attributes.Query
    });
});

fs.writeFileSync('levels.json', JSON.stringify(levels, null, 4));