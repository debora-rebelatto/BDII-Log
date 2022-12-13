const express = require('express');
const fs = require('fs/promises');
const metadado = require('./logFiles/metadado.json');
const client = require('./db');

const app = express();
const port = 4000;

require('dotenv').config() // pega o arquivo oculto .env
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// cria uma rota para a aplicação que retorna o json com os dados
app.get('/', async (req, res) => {
  try {
    const res = await getMetadata();
    return res;
  } catch (err) {
    console.log(err);
    return res.status(500).send(err);
  }
});

// inicia o server node
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})

// faz um select na tabela de metadado e retorna o resultado
async function getMetadata() {
  const selectquery = 'SELECT * FROM metadado';

  return await client
    .query(selectquery)
    .then(res => console.log(res.rows))
    .catch(e => console.error(e.stack))

}

async function readLog() {
  try {
    // load entradaLog file
    const data = await fs.readFile('./src/logFiles/entradaLog', { encoding: 'utf8' });

    // faz split do arquivo em linhas
    const lines = data.split('\r');

    // conecta no banco de dados
    await client.connect();

    // cria a tabela de metadado
    await createMetadadoTable();

    // insere os dados iniciais
    await insertInitialData();

    console.log("Inserido dados iniciais")

    await getMetadata();

    console.log("Inicia leitura de log")

    // percorre as linhas do arquivo
    lines.forEach(line => {
      // verifica se a linha é valida
      if(line === "") {
        return;
      }

      // verifica se a linha é um comando
      if(line.includes("start") || line.includes("commit") || line.includes("rollback")) {
        console.log("Command: ", line);
        checkCommand(line);
      } else if(line.includes("cpkt")) { // verifica se a linha é um checkpoint
        console.log("Checkpoint: ");
      } else if(line.includes(",")) { // verifica se a linha é uma transação
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
  // faz drop na tabela caso ela exista
  client.query('DROP TABLE IF EXISTS metadado');

  // cria a tabela metadado
  client
    .query('CREATE TABLE IF NOT EXISTS metadado (id VARCHAR(255) PRIMARY KEY, A INTEGER, B INTEGER)')
    .then(res => console.log("CREATED TABLE metadado"))
    .catch(e => console.error(e.stack))
}

async function insertInitialData() {
  try {
    // verifica o tamanho do array de dados iniciais
    let size = metadado.INITIAL.id.length;

    // cria a query de inserção
    const insertvalues = 'INSERT INTO metadado (id, A, B) VALUES ($1, $2, $3)';

    // percorre o array de dados iniciais e insere no banco
    for(let i = 0; i < size; i++) {
      let values = [
        metadado.INITIAL.id[i],
        metadado.INITIAL.A[i],
        metadado.INITIAL.B[i]
      ];

      // insere os dados no banco
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

}

// inicia a leitura do arquivo de log
readLog();