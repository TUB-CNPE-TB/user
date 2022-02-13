const fs = require('fs');

const openapiDiff = require('openapi-diff'); // for YAML
const yaml = require('js-yaml'); // YAML to JSON library
var jsonDiff = require('json-diff') // for JSON
var diff = require('deep-diff').diff; // for js

const argv = require('minimist')(process.argv.slice(2));

const outputPath = argv['o']
const sourcePath = argv['s']
const destinationPath = argv['d']
const mode = argv['m']

const sourceSpecification = fs.readFileSync(sourcePath, 'utf8')
const sourceSpecificationJSON = yaml.load(sourceSpecification); // YAML to JSON

let destinationSpecification = fs.readFileSync(destinationPath, 'utf8')
const destinationSpecificationJSON = yaml.load(destinationSpecification); // YAML to JSON

if (mode === "openapi-diff") {
    openapiDiff.diffSpecs({
        sourceSpec: {
            content: sourceSpecification,
            location: 'source.yaml',
            format: 'openapi3'
        },
        destinationSpec: {
            content: destinationSpecification,
            location: 'destination.yaml',
            format: 'openapi3'
        }
    })
    .then(result => {
        fs.writeFileSync(outputPath, JSON.stringify(result, null, 4))
    })
}
else if (mode === "json-diff") {
    const options = {color: false, full: true}
    const result = jsonDiff.diffString(sourceSpecificationJSON, destinationSpecificationJSON, options);
    fs.writeFileSync(outputPath, result)
}
else if (mode === "deep-diff") {
    var differences = diff(sourceSpecificationJSON, destinationSpecificationJSON);
    fs.writeFileSync(outputPath, JSON.stringify(differences, null, 4))
}
else {
    throw console.error("Mode not supported");
}
