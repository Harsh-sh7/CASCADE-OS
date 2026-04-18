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
    const user = await User.findOne({ email: session.user.email }).select('customRules subscription');
    if (!user) return Response.json({ error: 'User not found' }, { status: 404 });
    
    return Response.json({ 
      success: true, 
      customRules: user.customRules || [],
      plan: user.subscription?.plan || 'FREE',
    });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    
    const { customRules } = await req.json();
    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    if (!user) return Response.json({ error: 'User not found' }, { status: 404 });
    
    if (user.subscription?.plan !== 'POWER') {
      return Response.json({ error: 'POWER plan required' }, { status: 403 });
    }

    if (customRules !== undefined) {
      user.customRules = customRules;
    }
    
    await user.save();
    return Response.json({ success: true, customRules: user.customRules });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
