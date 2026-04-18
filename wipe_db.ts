import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function wipe() {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    await mongoose.connection.collection('dailylogs').drop().catch(() => console.log('dailylogs not dropped'));
    await mongoose.connection.collection('users').drop().catch(() => console.log('users not dropped'));
    console.log('Collections dropped successfully');
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
wipe();
