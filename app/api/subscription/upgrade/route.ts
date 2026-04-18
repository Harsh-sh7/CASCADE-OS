export const dynamic = "force-dynamic";

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import { User } from '@/lib/models/User';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { plan } = await req.json();
    if (!['FREE', 'PRO', 'POWER'].includes(plan)) {
      return Response.json({ error: 'Invalid plan' }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // Grant 30 days of access
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 30);

    user.subscription = {
      plan,
      validUntil,
    };
    
    await user.save();

    return Response.json({ success: true, subscription: user.subscription });
  } catch (err: any) {
    console.error('[CASCADE] upgrade error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
