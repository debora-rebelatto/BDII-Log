const express = require("express");
const fs = require("fs/promises");
const metadado = require("./logFiles/metadado.json");
const client = require("./db");

const app = express();
const port = 4000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", async (req, res) => {
  try {
    const res = await getMetadata();
    return res;
  } catch (err) {
    console.log(err);
    return res.status(500).send(err);
  }
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});

async function readLog() {
  try {
    let ckpt = /ckpt/gi;
    let commit = /commit/gi;
    let start = /start/gi;
    let crash = /crash/gi;

    let checkpointArray = [];
    let commitedTransactionArray = [];
    let redoTransactionArray = [];

    const data = await fs.readFile("./src/logFiles/entradaLog", {
      encoding: "utf8",
    });

    if (!crash.exec(data)) return;

    let lines = data.split("\r");
    lines = lines.reverse();

    lines.forEach((line, index) => {
      if(line === "" || line === "\r" || line === "\n") {
        return;
      }

      let lowercaseLine = line.toLowerCase();

      if (ckpt.exec(lowercaseLine)) {
        let lineArray = line.split(" ");
        checkpointArray = lineArray[1].match(/\(([^)]+)\)/)[1].split(",");
      } else if (commit.exec(lowercaseLine)) {
        if (checkpointArray.length > 0) return;

      if(ckpt.exec(lowercaseLine)) {
        let lineArray = line.split(' ');
        transactionArray = lineArray[1].match(/\(([^)]+)\)/)[1].split(',');

        console.log("Transações que serão commitadas", transactionArray);

        // check if transaction is in commitedTransactionArray
        transactionArray.forEach((transactionId, index) => {
          if(commitedTransactionArray.includes(transactionId)) {
            console.log("Transação fez REDO", transactionId);
            transactionArray.splice(index, 1);
            // push to redoTransactionArray
            redoTransactionArray.push(transactionId);
          }
        })

      } else if(commit.exec(lowercaseLine)) {
        console.log("Inicia commit", line);
        let lineArray = line.split(' ');
        let transactionId = lineArray[1];
        transactionId = transactionId.substring(0, transactionId.length - 1);

        commitedTransactionArray.push(transactionId);
      }
    });

    console.log("Transações que serão commitadas", transactionArray);
    console.log("Transações commitadas", commitedTransactionArray);
    console.log("Transações que serão redo", redoTransactionArray);
  } catch (err) {
    console.log(err);
  }
}

async function createMetadadoTable() {
  client.query("DROP TABLE IF EXISTS metadado");

  client
    .query(
      "CREATE TABLE IF NOT EXISTS metadado (id VARCHAR(255) PRIMARY KEY, A INTEGER, B INTEGER)"
    )
    .then((res) => console.log("CREATED TABLE metadado"))
    .catch((e) => console.error(e.stack));
}

async function insertInitialData() {
  try {
    let size = metadado.INITIAL.id.length;

    const insertvalues = "INSERT INTO metadado (id, A, B) VALUES ($1, $2, $3)";

    for (let i = 0; i < size; i++) {
      let values = [
        metadado.INITIAL.id[i],
        metadado.INITIAL.A[i],
        metadado.INITIAL.B[i],
      ];

      await client.query(insertvalues, values);
    }

    console.log("Inserido dados iniciais");
  } catch (err) {
    console.log(err);
  }
}

async function getMetadata() {
  const selectquery = "SELECT * FROM metadado";

  return await client
    .query(selectquery)
    .then((res) => console.log(res.rows))
    .catch((e) => console.error(e.stack));
}

readLog();