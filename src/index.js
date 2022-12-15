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

    let checkpoint = [];
    let commitedTransaction = [];
    let started = [];
    let redoTransactionArray = [];

    const data = await fs.readFile("./src/logFiles/entradaLog", {
      encoding: "utf8",
    });

    if (!crash.exec(data)) return;

    let lines = data.split("\r");
    lines = lines.reverse();

    console.log("Inicia conexão com o banco de dados");
    await client.connect();

    await createMetadadoTable();
    await insertInitialData();
    await getMetadata();

    lines.forEach(async (line, index) => {
      if (line === "" || line === "\r" || line === "\n") return;

      let lowercaseLine = line.toLowerCase();

      if (ckpt.exec(lowercaseLine)) {
        let lineArray = line.split(" ");
        checkpoint = lineArray[1].match(/\(([^)]+)\)/)[1].split(",");
      } else if (commit.exec(lowercaseLine)) {
        if (checkpoint.length > 0) return;

        let lineArray = line.split(" ");
        let transactionId = lineArray[1];
        transactionId = transactionId.substring(0, transactionId.length - 1);

        commitedTransaction.push(transactionId);
      } else if (start.exec(lowercaseLine)) {
        let lineArray = line.split(" ");
        let transactionId = lineArray[1];
        transactionId = transactionId.substring(0, transactionId.length - 1);

        started.push(transactionId);
      }
    });

    checkpoint.forEach((transactionId, index) => {
      if (
        commitedTransaction.includes(transactionId) &&
        !started.includes(transactionId)
      ) {
        redoTransactionArray.push(transactionId);
      }
    });

    console.log("========= Finaliza leitura de log =========");
    console.log("checkpoint", checkpoint);
    console.log("Transações commitadas", commitedTransaction);
    console.log("Transações que serão redo", redoTransactionArray);
    console.log("===========================================");
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