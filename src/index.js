const express = require('express');
const { Client } = require('pg')
const fs = require('fs/promises');
const metadado = require('./logFiles/metadado.json');


const app = express();
const port = 4000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})


async function example() {
  try {
    const data = await fs.readFile('./src/logFiles/entradaLog', { encoding: 'utf8' });

    const lines = data.split('\r');

  } catch (err) {
    console.log(err);
  }
}

async function connDB() {
  try {
    const client = new Client({
      user: 'postgres',
      host: 'localhost',
      database: 'bdlog',
      password: 'admin',
      port: 5432,
    })

    client.connect()

    client
      .query('SELECT NOW() as now')
      .then(res => console.log(res.rows[0]))
      .catch(e => console.error(e.stack))

  } catch (err) {
    console.log(err);
  }

}


connDB();
example();