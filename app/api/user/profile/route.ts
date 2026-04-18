export const dynamic = "force-dynamic";

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import { User } from '@/lib/models/User';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { rcMultipliers, constraints } = await req.json();
    await connectDB();
    const user = await User.findById(session.user.id);
    if (!user) throw new Error('User not found');
    if (rcMultipliers) user.profile.rcMultipliers = rcMultipliers;
    if (constraints) user.profile.constraints = constraints;
    await user.save();
    return Response.json({ success: true, profile: user.profile });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
