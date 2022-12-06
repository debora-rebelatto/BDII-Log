const express = require('express');
const fs = require('fs/promises');
const metadado = require('./logFiles/metadado.json');
const client = require('./db');

const app = express();
const port = 4000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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


    const idm = metadado.id;
    const A = metadado.INITIAL.A;
    const B = metadado.INITIAL.B;

    var size = Object.keys(metadado.INITIAL).length;

    const insertvalues = 'INSERT INTO metadado (id, A, B) VALUES ($1, $2, $3)';

    let values = [
      metadado.INITIAL.id[0],
      metadado.INITIAL.A[0],
      metadado.INITIAL.B[0]
    ];

    await client.query(insertvalues, values)

    values = [
      metadado.INITIAL.id[1],
      metadado.INITIAL.A[1],
      metadado.INITIAL.B[1]
    ];

    await client.query(insertvalues, values)

    const selectquery = 'SELECT * FROM metadado';

    await client
      .query(selectquery)
      .then(res => console.log(res.rows))
      .catch(e => console.error(e.stack))


  } catch (err) {
    console.log(err);
  }
}

readLog();