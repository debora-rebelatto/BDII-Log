# :notebook: BD II - Trabalho Prático de Log

### [:paperclip: Descrição da tarefa](https://docs.google.com/document/d/12ExZiKP9j_zXwnjbZfGA74m5fSXff2ErAOLCdfs0ye0/edit)

Objetivo: implementar o mecanismo de log Redo com checkpoint usando o SGBD.

O código, que poderá utilizar qualquer linguagem de programação, deverá ser capaz de ler o arquivo de log (entradaLog) e o arquivo de Metadado e validar as informações no banco de dados através do modelo REDO.

O código receberá como entrada o arquivo de metadados (dados salvos) e os dados da tabela que irá operar no banco de dados.

Exemplo de tabela do banco de dados:

<table>
  <tr>
    <th>ID</th>
    <th>A</th>
    <th>B</th>
  </tr>
  <tr>
    <td>1</td>
    <td>20</td>
    <td>55</td>
  </tr>
  <tr>
    <td>2</td>
    <td>20</td>
    <td>30</td>
  </tr>
</table>

Arquivo de Metadado (json):

```json
{
  "INITIAL": {
    "id": [1, 2],
    "A": [20, 20],
    "B": [55, 30]
  }
}
```

Arquivo de log no formato <transação, “id da tupla”,”coluna”, “valor antigo”, “valor novo”>. Exemplo:

Arquivo de Log:

```
<start T1>
<T1,1, A,20,500>
<start T2>
<commit T1>
<CKPT (T2)>
<T2,2, A,20,50>
<start T3>
<start T4>
<commit T2>
<T4,1, B,55,100>
```

Saída:
“Transação T2 realizou REDO”
“Transação T3 não realizou REDO”
“Transação T4 não realizou REDO”

Imprima as variáveis, exemplo:

```json
{
  "INITIAL": {
    "A": [500, 20],
    "B": [20, 30]
  }
}
```

O checkpoint Redo permite que parte do log já processada seja descartada para evitar o reprocessamento.

## Detalhes

Funções a serem implementadas:
1- carregar o banco de dados com a tabela antes de executar o código do log (para zerar as configurações e dados parciais);
2- Carregar o arquivo de log;
3- Verifique quais transações devem realizar REDO. Imprimir o nome das transações que irão sofrer Redo. Observem a questão do checkpoint;
4- Checar quais valores estão salvos nas tabelas (com o select) e atualizar valores inconsistentes (update);
5- Reportar quais dados foram atualizados;
6- Seguir o fluxo de execução conforme o método de REDO, conforme visto em aula;

## :floppy_disk: Instalação

```
git clone https://github.com/debora-rebelatto/BDII-Log
cd BDII-Log
npm i
```

## :electric_plug: Conectando ao Banco de Dados

O Node-Postgres é um cliente PostgreSQL para Node.js. Ele é escrito em JavaScript e pode ser usado com o Node.js ou com o navegador. Para mais informações, acesse [aqui](https://node-postgres.com/).

## :cd: Inicializando

Remova o ".example" do arquivo ".env.example" e preencha as informações de acordo com o seu banco de dados.
ou

```bash
cp .env.example .env
```

## :computer: Executando

```
node src/index.js
```

ou, para atualização constante, instale o nodemon

```
npm i -g nodemon
```

e rode o seguinte comando no terminal:

```
nodemon
```

## :wrench: Configuração

Crie o Banco de Dados no postgres.

```
CREATE DATABASE bdlog;
```

## Desenvolvimento

Durante o desenvolvimento foi utilizado o banco de dados PostgreSQL, que pode ser baixado [aqui](https://www.postgresql.org/download/).
Para fazer as alterações, foi utilizado o NodePostgres, que pode ser encontrado [aqui](https://node-postgres.com/).

<!-- GET curl-->

<!--
start
commit
CKPT
crash

identifier
data_item
old_value
new_value

Atomicity property of DBMS states that either all the operations of transactions must be performed or none. The modifications done by an aborted transaction should not be visible to database and the modifications done by committed transaction should be visible.

To achieve our goal of atomicity, user must first output to stable storage information describing the modifications, without modifying the database itself. This information can help us ensure that all modifications performed by committed transactions are reflected in the database. This information can also help us ensure that no modifications made by an aborted transaction persist in the database.

Log and log records –
The log is a sequence of log records, recording all the update activities in the database. In a stable storage, logs for each transaction are maintained. Any operation which is performed on the database is recorded is on the log. Prior to performing any modification to database, an update log record is created to reflect that modification.

An update log record represented as: <Ti, Xj, V1, V2> has these fields:

Transaction identifier: Unique Identifier of the transaction that performed the write operation.
Data item: Unique identifier of the data item written.
Old value: Value of data item prior to write.
New value: Value of data item after write operation.
Other type of log records are:

<Ti start>: It contains information about when a transaction Ti starts.
<Ti commit>: It contains information about when a transaction Ti commits.
<Ti abort>: It contains information about when a transaction Ti aborts.
Undo and Redo Operations –
Because all database modifications must be preceded by creation of log record, the system has available both the old value prior to modification of data item and new value that is to be written for data item. This allows system to perform redo and undo operations as appropriate:

Undo: using a log record sets the data item specified in log record to old value.
Redo: using a log record sets the data item specified in log record to new value.
The database can be modified using two approaches –

Deferred Modification Technique: If the transaction does not modify the database until it has partially committed, it is said to use deferred modification technique.
Immediate Modification Technique: If database modification occur while transaction is still active, it is said to use immediate modification technique.
Recovery using Log records –
After a system crash has occurred, the system consults the log to determine which transactions need to be redone and which need to be undone.

Transaction Ti needs to be undone if the log contains the record <Ti start> but does not contain either the record <Ti commit> or the record <Ti abort>.
Transaction Ti needs to be redone if log contains record <Ti start> and either the record <Ti commit> or the record <Ti abort>.
Use of Checkpoints –
When a system crash occurs, user must consult the log. In principle, that need to search the entire log to determine this information. There are two major difficulties with this approach:

The search process is time-consuming.
Most of the transactions that, according to our algorithm, need to be redone have already written their updates into the database. Although redoing them will cause no harm, it will cause recovery to take longer.
To reduce these types of overhead, user introduce checkpoints. A log record of the form <checkpoint L> is used to represent a checkpoint in log where L is a list of transactions active at the time of the checkpoint. When a checkpoint log record is added to log all the transactions that have committed before this checkpoint have <Ti commit> log record before the checkpoint record. Any database modifications made by Ti is written to the database either prior to the checkpoint or as part of the checkpoint itself. Thus, at recovery time, there is no need to perform a redo operation on Ti.

After a system crash has occurred, the system examines the log to find the last <checkpoint L> record. The redo or undo operations need to be applied only to transactions in L, and to all transactions that started execution after the record was written to the log. Let us denote this set of transactions as T. Same rules of undo and redo are applicable on T as mentioned in Recovery using Log records part.

Note that user need to only examine the part of the log starting with the last checkpoint log record to find the set of transactions T, and to find out whether a commit or abort record occurs in the log for each transaction in T. For example, consider the set of transactions {T0, T1, . . ., T100}. Suppose that the most recent checkpoint took place during the execution of transaction T67 and T69, while T68 and all transactions with subscripts lower than 67 completed before the checkpoint. Thus, only transactions T67, T69, . . ., T100 need to be considered during the recovery scheme. Each of them needs to be redone if it has completed (that is, either committed or aborted); otherwise, it was incomplete, and needs to be undone. -->
