export const dynamic = "force-dynamic";

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import { User } from '@/lib/models/User';
import { mapToRecord } from '@/lib/userModelUtils';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findOne({ email: session.user.email }).select('userModel');
    if (!user) return Response.json({ error: 'User not found' }, { status: 404 });

    const um = user.userModel;
    return Response.json({
      success: true,
      userModel: {
        adherence:         mapToRecord(um?.adherence as any),
        effectiveness:     mapToRecord(um?.effectiveness as any),
        rcMultipliers:     mapToRecord(um?.rcMultipliers as any),
        calibrationNeeded: um?.calibrationNeeded ?? false,
        lastCalibration:   um?.lastCalibration ?? null,
      },
    });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
