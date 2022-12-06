const { Client } = require('pg');

const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'bdlog',
  password: "admin",
  port: 5432,
});

module.exports = client;