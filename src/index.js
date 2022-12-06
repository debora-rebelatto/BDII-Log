const express = require('express');
const fs = require('fs/promises');
const metadado = require('./logFiles/metadado.json');
const client = require('./db');

const app = express();
const port = 4000;

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

async function getMetadata() {
  const selectquery = 'SELECT * FROM metadado';

  return res.send(
    await client
      .query(selectquery)
      .then(res => console.log(res.rows))
      .catch(e => console.error(e.stack))
  )
}

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})

async function readLog() {
  try {
    const data = await fs.readFile('./src/logFiles/entradaLog', { encoding: 'utf8' });

    const lines = data.split('\r');

    await client.connect();

    client.query('DROP TABLE IF EXISTS metadado');

    client
      .query('CREATE TABLE IF NOT EXISTS metadado (id VARCHAR(255) PRIMARY KEY, A INTEGER, B INTEGER)')
      .then(res => console.log("ok"))
      .catch(e => console.error(e.stack))

    insertInitialData();

    lines.forEach(line => {

      const lineArray = line.split(' ');

      // if lineArray len bigger than 2 then it's a transaction
      if(lineArray.length > 2) {
        createTransaction(lineArray);
      } else {
        checkCommand(lineArray);
      }
      console.log(lineArray);
    });
  } catch (err) {
    console.log(err);
  }
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
  let idTupla = lineArray[0];
  let id = lineArray[1];
  let column = lineArray[2];
  let oldValue = lineArray[3];
  let newValue = lineArray[4];

  // create a transaction
  if (lineArray[0] === 'UPDATE') {
    const updatequery = 'UPDATE metadado SET A = $1, B = $2 WHERE id = $3';

    values = [
      lineArray[1],
      lineArray[2],
      lineArray[3]
    ];

    client.query(updatequery, values)
      .then(res => console.log(res.rows))
      .catch(e => console.error(e.stack))
  }
}

async function checkCommand(lineArray) {
}

readLog();