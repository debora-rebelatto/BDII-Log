const express = require('express');
const fs = require('fs/promises');
const metadado = require('./logFiles/metadado.json');
const client = require('./db');

const app = express();
const port = 4000;

require('dotenv').config()
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', async (req, res) => {
  try {
    const res = await getMetadata();
    return res;
  } catch (err) {
    console.log(err);
    return res.status(500).send(err);
  }
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})


async function getMetadata() {
  const selectquery = 'SELECT * FROM metadado';

  return await client
    .query(selectquery)
    .then(res => console.log(res.rows))
    .catch(e => console.error(e.stack))

}

async function readLog() {
  try {
    // split log file by line
    const data = await fs.readFile('./src/logFiles/entradaLog', { encoding: 'utf8' });

    const lines = data.split('\r');

    await client.connect();

    await createMetadadoTable();

    await insertInitialData();

    console.log("Inserido dados iniciais")

    await getMetadata();

    console.log("Inicia leitura de log")

    // console.log(lines);

    lines.forEach(line => {

      // do nothing if line is empty
      if(line === "") {
        return;
      }

      console.log("Line: ", line);

      if(line.includes("start") || line.includes("commit") || line.includes("rollback")) {
        console.log("Command: ", line);
        checkCommand(line);
      } else if(line.includes("cpkt")) {
        console.log("Checkpoint: ");
      } else if(line.includes(",")) {
        console.log("Transaction: ");
        createTransaction(line);
      }



      // if(lineArray > 2) {
      //   createTransaction(lineArray);
      // } else {
      //   checkCommand(lineArray);
      // }


    });
  } catch (err) {
    console.log(err);
  }
}

async function createMetadadoTable() {
  client.query('DROP TABLE IF EXISTS metadado');

  client
    .query('CREATE TABLE IF NOT EXISTS metadado (id VARCHAR(255) PRIMARY KEY, A INTEGER, B INTEGER)')
    .then(res => console.log("CREATED TABLE metadado"))
    .catch(e => console.error(e.stack))
}

async function insertInitialData() {
  try {
    let size = metadado.INITIAL.id.length;
    const insertvalues = 'INSERT INTO metadado (id, A, B) VALUES ($1, $2, $3)';

    for(let i = 0; i < size; i++) {
      let values = [
        metadado.INITIAL.id[i],
        metadado.INITIAL.A[i],
        metadado.INITIAL.B[i]
      ];

      await client.query(insertvalues, values)
    }

  } catch (err) {
    console.log(err);
  }
}

async function createTransaction(lineArray) {
  let transaction = lineArray[0];
  let id = lineArray[1];
  let column = lineArray[2];
  let oldValue = lineArray[3];
  let newValue = lineArray[4];

  // console.log(transaction, id, column, oldValue, newValue);
}

async function checkCommand(lineArray) {
  let command = lineArray[0];

  if(command === "start") {
    console.log("Start transaction");
  } else if(command === "commit") {
    console.log("Commit transaction");
  } else if(command === "rollback") {
    console.log("Rollback transaction");
  }
}

readLog();