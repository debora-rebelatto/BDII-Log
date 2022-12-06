const fs = require('fs/promises');

const util = require('util');
const express = require('express');
const Sequelize = require('sequelize');
const metadado = require('./logFiles/metadado.json');

const sequelize = new Sequelize('postgres://postgres@localhost:5432/crud', {dialect: 'postgres'});

const app = express();
const port = 4000;

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})

async function example() {
  try {
    const data = await fs.readFile('./src/logFiles/entradaLog', { encoding: 'utf8' });
    console.log(data);
  } catch (err) {
    console.log(err);
  }
}

example();