const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('cascade_os');
    console.log("Connected to MongoDB");
    await db.collection('users').deleteMany({});
    await db.collection('accounts').deleteMany({});
    await db.collection('sessions').deleteMany({});
    await db.collection('verification_tokens').deleteMany({});
    console.log("Wiped auth collections");
  } finally {
    await client.close();
  }
}
run().catch(console.dir);
