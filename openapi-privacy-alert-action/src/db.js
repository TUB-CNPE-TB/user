const parse = require("pg-connection-string").parse;
const { Pool } = require("pg");
const { v4: uuidv4 } = require("uuid");

async function executeTransaction(n, max, client, input, operation, callback) {
  await client.query("BEGIN;");
  while (true) {
    n++;
    if (n === max) {
      throw new Error("Max retry count reached.");
    }
    try {
      await operation(client, input, callback);
      await client.query("COMMIT;");
      return;
    } catch (err) {
      if (err.code !== "40001") {
        return callback(err);
      } else {
        console.log("Transaction failed. Retrying transaction.");
        console.log(err.message);
        await client.query("ROLLBACK;", () => {
          console.log("Rolling back transaction.");
        });
        await new Promise((r) => setTimeout(r, 2 ** n * 1000));
      }
    }
  }
}

async function insertEntry(client, input, callback) {
  const id = await uuidv4();
  const {tableName, serviceName, commit, differences, sourceSpecification, changedSpecification} = input;
  const insertStatement =
    "INSERT INTO " + tableName + " (id, service_name, commit, differences, sourceSpecification, changedSpecification) VALUES ($1, $2, $3, $4, $5, $6);";
  await client.query(insertStatement, [id, serviceName, commit, differences, sourceSpecification, changedSpecification], callback);
}

async function printDatabase(client, input, callback) {
    const tableName = input.tableName;
    const selectBalanceStatement = "SELECT id, service_name, commit, differences FROM " + tableName + ";";
    await client.query(selectBalanceStatement, callback);
}

function queryCallback(err, res) {
  if (err) {
    console.log(err);
    throw err;
  } 

  if (res.rows.length > 0) {
    res.rows.forEach((row) => {
      console.log(row);
    });
  }
}

// Run the transactions in the connection pool
async function insert(connectionString, databaseName, tableName, serviceName, commit, specificationChanges, sourceSpecification, changedSpecification) {
  connectionString = await connectionString.replace(
      "$HOME",
      process.env.HOME
    );

  var config = parse(connectionString);
  config.port = 26257;
  config.database = databaseName;
  const pool = new Pool(config);

  const client = await pool.connect();

  await executeTransaction(0, 15, client, 
    {tableName: tableName, serviceName: serviceName, commit: commit, differences: specificationChanges, sourceSpecification: sourceSpecification, changedSpecification: changedSpecification},
     insertEntry, queryCallback);
}

module.exports = {insert};
