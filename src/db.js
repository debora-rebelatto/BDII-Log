const { Client } = require('pg');

// cria client de banco com as informações de conexão do .env
const client = new Client({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: 'bdlog',
  password: process.env.DB_PASSWORD || "admin",
  port: 5432,
});

// e exporta para ser usado em outros arquivos
module.exports = client;