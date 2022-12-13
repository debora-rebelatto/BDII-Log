const { Client } = require('pg');

const client = new Client({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: 'bdlog',
  password: process.env.DB_PASSWORD || "admin",
  port: 5432,
});

module.exports = client;