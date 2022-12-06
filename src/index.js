// create node server
const express = require('express');
const app = express();
const port = 3000;

// create a GET route
app.get('/', (req, res) => {
  res.send('Hello World!');
}

// start node server
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
}
