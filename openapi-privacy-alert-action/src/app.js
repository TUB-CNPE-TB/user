const fs = require('fs');
var diff = require('deep-diff').diff;
const yaml = require("js-yaml");
const db = require("./db");

(async () => {
    const argv = require('minimist')(process.argv.slice(2));

    const sourcePath = argv._[0]
    const destinationPath = argv._[1]
    const connectionString = argv._[2]
    const databaseName = argv._[3]
    const tableName = argv._[4]
    const serviceName = argv._[5]
    const commit = argv._[6]

    const sourceSpecification = fs.readFileSync(sourcePath, 'utf8')
    var sourceSpecificationJSON = undefined;

    if (sourcePath.endsWith(".yml") || sourcePath.endsWith(".yaml")) {
        sourceSpecificationJSON = yaml.load(sourceSpecification);
    }
    else if (sourcePath.endsWith(".json")) {
        sourceSpecificationJSON = JSON.parse(sourceSpecification);
    }
    
    const destinationSpecification = fs.readFileSync(destinationPath, 'utf8')
    var destinationSpecificationJSON = undefined;

    if (destinationPath.endsWith(".yml") || destinationPath.endsWith(".yaml")) {
        destinationSpecificationJSON = yaml.load(destinationSpecification);
    }
    else if (destinationPath.endsWith(".json")) {
        destinationSpecificationJSON = JSON.parse(destinationSpecification);
    }

    if (sourcePath === undefined || destinationPath === undefined) {
        throw Error("Unsupported specification format! Supported formats: YAML, JSON.");
    }

    var differences = diff(sourceSpecificationJSON, destinationSpecificationJSON);

    if (differences) {
        await db.insert(connectionString, databaseName, tableName, serviceName, commit, JSON.stringify(differences), JSON.stringify(sourceSpecificationJSON), JSON.stringify(destinationSpecificationJSON));
    }

    process.exit();

})().catch((err) => console.log(err.stack));