export const dynamic = "force-dynamic";

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import { User } from '@/lib/models/User';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectDB();
    const user = await User.findOne({ email: session.user.email }).select('notifications');
    if (!user) return Response.json({ error: 'User not found' }, { status: 404 });
    return Response.json({ success: true, notifications: user.notifications });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { email, telegram } = await req.json();
    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    if (!user) throw new Error('User not found');
    if (email !== undefined) user.notifications.email = email;
    if (telegram !== undefined) user.notifications.telegram = telegram;
    await user.save();
    return Response.json({ success: true, notifications: user.notifications });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
