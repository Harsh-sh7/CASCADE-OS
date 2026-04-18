import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import { DailyLog } from '@/lib/models/DailyLog';
import { User } from '@/lib/models/User';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectDB();
    const cascadeUser = await User.findOne({ email: session.user.email });
    if (!cascadeUser) return Response.json({ error: 'User not found' }, { status: 404 });

    const logs = await DailyLog.find({ user: cascadeUser._id })
      .sort({ date: -1 })
      .limit(30)
      .select('-createdAt -updatedAt');

    return Response.json({ success: true, logs });
  } catch (err: any) {
    console.error(err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
