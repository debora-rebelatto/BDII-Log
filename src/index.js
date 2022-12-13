const express = require('express');
const fs = require('fs/promises');
const metadado = require('./logFiles/metadado.json'); // pega o arquivo de metadado
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
    let lines = data.split('\r');

    console.log("Inicia conexão com o banco de dados")


    // conecta no banco de dados
    await client.connect();

    // cria a tabela de metadado
    await createMetadadoTable();

    // insere os dados iniciais
    await insertInitialData();

    console.log("Inserido dados iniciais")

    await getMetadata();

    console.log("Inicia leitura de log")

    // revert o array de linhas
    lines = lines.reverse();

    let transactionArray = [];
    let commitedTransactionArray = [];
    let redoTransactionArray = [];

    // percorre as linhas do arquivo
    lines.forEach((line, index) => {
      // verifica se a linha é valida
      if(line === "" || line === "\r" || line === "\n") {
        return;
      }

      // transforma a linha em lowercase para comparar com os comandos
      let lowercaseLine = line.toLowerCase();

      let ckpt = /ckpt/gi;
      let commit = /commit/gi;
      let start = /start/gi;
      let crash = /crash/gi;

      if(ckpt.exec(lowercaseLine)) {
        let lineArray = line.split(' ');
        transactionArray = lineArray[1].match(/\(([^)]+)\)/)[1].split(',');

        console.log("Transações que serão commitadas", transactionArray);

        // check if transaction is in commitedTransactionArray
        transactionArray.forEach((transactionId, index) => {
          if(commitedTransactionArray.includes(transactionId)) {
            console.log("Transação fez REDO", transactionId);
            transactionArray.splice(index, 1);
            // push to redoTransactionArray
            redoTransactionArray.push(transactionId);
          }
        })

      } else if(commit.exec(lowercaseLine)) {
        console.log("Inicia commit", line);
        let lineArray = line.split(' ');
        let transactionId = lineArray[1];
        transactionId = transactionId.substring(0, transactionId.length - 1);

        console.log(transactionId)

        // console.log("Transações que serão commitadas", transactionArray);

        // put transaction in commitedTransactionArray
        commitedTransactionArray.push(transactionId);

        console.log("Transações commitadas", commitedTransactionArray);

        // if transactionId is in transactionArray it has redo
        if(transactionArray.includes(transactionId)) {
          console.log("Transação tem redo", transactionId);
        } else {
          console.log("Transação não tem redo", transactionId);
        }

      } else if(start.exec(lowercaseLine)) {
        let lineArray = line.split(' ');
        let transactionId = lineArray[1];
        console.log("Inicia transação", line);

      } else if(crash.exec(lowercaseLine)) {
        console.log("Linha tem crash", line);
      } else {
        console.log("Linha tem transação", line);
      }

    });

    console.log("Transações que serão commitadas", transactionArray);
    console.log("Transações commitadas", commitedTransactionArray);
    console.log("Transações que serão redo", redoTransactionArray);
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

// inicia a leitura do arquivo de log
readLog();