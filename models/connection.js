process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0
require('dotenv').config({path : 'variables.env'});
const {Pool, Client} = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  port: 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: true,
});

function getConnection() {
  return pool.connect();
}

async function insertClient (name, last_name){
  let client = await getConnection();
  let query = "INSERT INTO Clientes (nombre,apellido) VALUES ($1,$2) RETURNING *";
  let params = [name,last_name];
  let rs = await client.query(query, params);
  client.release(true);
  console.log(rs);
}

async function insertPedidos (idClient){
  let client = await getConnection();
  let query = "INSERT INTO Pedidos (tipoPago,medio,clienteId) VALUES ('tarjeta de credito','online',$1) RETURNING *";
  let params = [idClient];
  let rs = await client.query(query, params);
  client.release(true);
  console.log(rs);
}

async function ultimaModification(){
  let client = await getConnection();
  let query = "select max(id) from clientes";
  let params = [];
  let rs = await client.query(query, params);
  client.release(true);
  let id = rs.rows[0].max;
  return id;
}

async function guardarSession(usuarioId,sessionId){
  let client = await getConnection();
  let query = "INSERT INTO Sesiones (usuarioId, sessionId) VALUES ($1,$2)";
  let params = [usuarioId,sessionId];
  let rs = await client.query(query, params);
  client.release(true);
  console.log(rs);
}

async function existeSession(usuarioId){
  let existe = false;
  let client = await getConnection();
  let query = "SELECT * FROM Sesiones WHERE usuarioId = $1";
  let params = [usuarioId];
  let rs = await client.query(query, params);
  client.release(true);
  let rows = rs.rowCount;
  if(rows === 0){
      existe = false;
  }else{
      existe = true;
  }
  console.log(rs);
  return existe;
}

async function sessionUsuario(id_facebook){
  let sessionId;
  let client = await getConnection();
  let query = "SELECT * FROM Sesiones WHERE usuarioId = $1";
  let params = [id_facebook];
  let rs = await client.query(query, params);
  client.release(true);
  sessionId = rs.rows[0].sessionid;
  return sessionId;
}

async function actualizarSession(id_facebook,id_session){
  let client = await getConnection();
  let query = "UPDATE Sesiones SET sessionId = $1 WHERE usuarioId = $2";
  let params = [id_session,id_facebook];
  let rs = await client.query(query, params);
  client.release(true);
  console.log(rs);
}


module.exports = {
  insertClient,
  insertPedidos,
  ultimaModification,
  guardarSession,
  existeSession,
  sessionUsuario,
  actualizarSession
}