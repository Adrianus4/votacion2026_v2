const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || 'elecciones2026';

let client;
let db;

/**
 * Conecta una sola vez y reutiliza la conexión (patrón singleton).
 * MongoDB driver ya maneja un pool de conexiones internamente,
 * así que no hace falta abrir/cerrar por cada request.
 */
async function connectMongo() {
  if (db) return db;

  if (!uri) {
    throw new Error('MONGODB_URI no esta configurada');
  }

  client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });

  await client.connect();
  db = client.db(dbName);
  console.log(`[mongodb] Conectado a la base de datos "${dbName}"`);
  return db;
}

function getDb() {
  if (!db) {
    throw new Error('MongoDB no esta conectado todavia. Llama a connectMongo() primero.');
  }
  return db;
}

module.exports = { connectMongo, getDb };
