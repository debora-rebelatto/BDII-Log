const fs = require('fs');
const util = require('util');
const express = require('express');

const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('Hello World!');
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})

// create function to read file

const readFile = util.promisify(fs.readFile);

// create function to write file
const writeFile = util.promisify(fs.writeFile);

// create function to initialize app
const init = async () => {
  const notes = JSON.parse(await readFile('db/db.json', 'utf8'));
  console.log(notes);
}