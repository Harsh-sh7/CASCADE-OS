import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import { User } from '@/lib/models/User';
import { DailyLog } from '@/lib/models/DailyLog';
import { runFullAnalysis, EngineContext } from '@/lib/engine/engine';
import { DomainNode } from '@/lib/engine/graph';
import { mapToRecord } from '@/lib/userModelUtils';
import { hasPro } from '@/lib/subscriptionGuard';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { targetDomain, expectedChange } = await req.json();

    if (!targetDomain || typeof expectedChange !== 'number') {
      return Response.json({ error: 'Missing targetDomain or expectedChange' }, { status: 400 });
    }

    await connectDB();
    const dateStr = new Date().toISOString().split('T')[0];

    const cascadeUser = await User.findOne({ email: session.user.email });
    if (!cascadeUser) return Response.json({ error: 'User not found' }, { status: 404 });

    // Enforce gating
    if (!hasPro(cascadeUser)) {
      return Response.json({ error: 'Upgrade required', feature: 'PRO' }, { status: 403 });
    }

    const userId = cascadeUser._id.toString();
    const currentLog = await DailyLog.findOne({ user: userId, date: dateStr });

    if (!currentLog) {
      return Response.json({ error: 'Complete morning check-in first to simulate.' }, { status: 400 });
    }

    // 1. Current State Baseline
    const baselineAnalysis = currentLog.systemAnalysis;
    const initialStates = currentLog.morningState.toObject() as Record<string, number>;

    // 2. Simulated State
    const simulatedStates = { ...initialStates };
    if (simulatedStates[targetDomain] !== undefined) {
      simulatedStates[targetDomain] = Math.min(10, Math.max(1, simulatedStates[targetDomain] + expectedChange));

      // Propagate cascading topological changes downstream
      const { DEPENDENCY_GRAPH } = require('@/lib/engine/graph');
      const edges = DEPENDENCY_GRAPH.filter((e: any) => e.from === targetDomain);
      for (const edge of edges) {
        const downstreamDelta = Math.round(expectedChange * edge.weight);
        if (downstreamDelta !== 0 && simulatedStates[edge.to] !== undefined) {
           simulatedStates[edge.to] = Math.min(10, Math.max(1, simulatedStates[edge.to] + downstreamDelta));
        }
      }
    }

    // 3. Build Context
    const recentLogs = await DailyLog.find({ user: userId }).sort({ date: -1 }).limit(14);
    const ignoredCount = recentLogs.slice(0, 3).filter(
      l => l.followUp.completed && l.followUp.feedback === 'ignored'
    ).length;

    const userModel = cascadeUser.userModel ? {
      adherence:         mapToRecord(cascadeUser.userModel.adherence as any),
      effectiveness:     mapToRecord(cascadeUser.userModel.effectiveness as any),
      rcMultipliers:     mapToRecord(cascadeUser.userModel.rcMultipliers as any),
      calibrationNeeded: cascadeUser.userModel.calibrationNeeded ?? false,
      lastCalibration:   cascadeUser.userModel.lastCalibration,
      successRate:       cascadeUser.userModel.successRate ?? 0.5,
      ignoreRate:        cascadeUser.userModel.ignoreRate ?? 0,
      avgOutcomeDelta:   cascadeUser.userModel.avgOutcomeDelta ?? 0,
      bandwidthPerformance: mapToRecord(cascadeUser.userModel.bandwidthPerformance as any),
    } : null;

    const context: EngineContext = {
      states: simulatedStates,
      resources: currentLog.resources ? {
        time: currentLog.resources.time || 5,
        energy: currentLog.resources.energy || 5,
        money: currentLog.resources.money || 5,
        attention: currentLog.resources.attention || 5,
      } : { time: 5, energy: 5, money: 5, attention: 5 },
      ignoredRecommendationsCount: ignoredCount,
      rcMultipliers: mapToRecord(cascadeUser.profile.rcMultipliers as any),
      userModel,
      historicalLogs: recentLogs,
      policies: cascadeUser.policies || [],
      environmentNoisy: false,
      mentallyOverloaded: false,
    };

    // 4. Run Analysis
    const simulatedAnalysis = runFullAnalysis(context);

    // 5. Compute Deltas
    const domainDelta: Record<string, number> = {};
    for (const key of Object.keys(initialStates)) {
      if (key === '_id' || key === '__v' || key === 'cognitiveBandwidth' || key === 'sensoryLoad' || key === 'executiveFriction') continue;
      domainDelta[key] = (simulatedStates[key] || 0) - (initialStates[key] || 0);
    }

    return Response.json({
      success: true,
      baseline: {
        bottleneck: baselineAnalysis.bottleneck,
        leverageRatio: baselineAnalysis.leverageRatio,
        mode: baselineAnalysis.mode,
      },
      simulation: {
        bottleneck: simulatedAnalysis.bottleneck,
        leverageRatio: simulatedAnalysis.leverageRatio,
        mode: simulatedAnalysis.mode,
        action: simulatedAnalysis.recommendation.action,
        insights: simulatedAnalysis.insights,
      },
      delta: {
        domains: domainDelta,
        bottleneckChanged: baselineAnalysis.bottleneck !== simulatedAnalysis.bottleneck,
        leverageDelta: simulatedAnalysis.leverageRatio - baselineAnalysis.leverageRatio,
      }
    });
  } catch (err: any) {
    console.error('[CASCADE] simulate-impact error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
