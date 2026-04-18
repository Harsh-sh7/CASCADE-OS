import connectDB from '@/lib/db';
import mongoose from 'mongoose';

export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return Response.json({ error: 'Dev only' }, { status: 403 });
  }

  try {
    await connectDB();
    const db = mongoose.connection.db;
    if (!db) throw new Error('No db connection');

    await db.collection('users').deleteMany({});
    await db.collection('accounts').deleteMany({});
    await db.collection('sessions').deleteMany({});
    await db.collection('verification_tokens').deleteMany({});

    return Response.json({ success: true, message: 'Auth collections wiped successfully.' });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
