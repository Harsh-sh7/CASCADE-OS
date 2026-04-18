export const dynamic = "force-dynamic";

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import { User } from '@/lib/models/User';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const user = await User.findOne({ email: session.user.email }).select('policies');
    return Response.json({ policies: user?.policies || [] });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { policies } = body;

    await connectDB();
    const user = await User.findOneAndUpdate(
      { email: session.user.email },
      { $set: { policies } },
      { new: true }
    );

    return Response.json({ policies: user.policies });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
