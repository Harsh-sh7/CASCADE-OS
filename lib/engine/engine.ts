import { DomainNode } from './graph';
import { detectBottleneck } from './bottleneck';
import { detectFailureLoops } from './loops';
import { generateContextualIntervention } from './recommendation';
import { computeAdjustedLR, computeSystemConfidence, ScoredDomain, scoreDomains } from './adaptive';
import { predictSuccess, predictFailure, computeMLScore } from '@/lib/ml/knn';
import { generateInsights, SystemInsight } from './insights';
import { generateDecisionTriad, classifyDay, DecisionQuad, DayClassification } from './decisions';
import { applyRules, ActiveRule } from './rules';
import { UserModelData, IPolicy } from '@/lib/models/User';
import { IDailyLog } from '@/lib/models/DailyLog';

export interface FullAnalysisResult {
  bottleneck: string;
  leverageRatio: number;
  adjustedLR?: number;
  mode: 'FIX' | 'CONTAINMENT' | 'TRIAGE' | 'RECOVERY';
  chain: string[];
  loops: string[];
  recommendation: {
    action: string;
    gain: string[];
    cost: string[];
    whyThis: string;
    whyNotOthers: string;
    confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';
    confidenceReason: string;
    tradeoff: string;
    bandwidthRequired?: 'LOW' | 'MEDIUM' | 'HIGH';
  };
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  systemMessage: string;
  adaptiveShift: boolean;
  isCounterintuitive: boolean;
  successProbability?: number;
  systemConfidence?: number;
  rankedDomains?: ScoredDomain[];
  insights: SystemInsight[];
  decisions: DecisionQuad;
  dayType: DayClassification;
  activeRules: ActiveRule[];
  cognitiveBandwidth?: number;
  sensoryLoad?: number;
  executiveFriction?: number;
}

export interface EngineContext {
  states: Record<DomainNode, number>;
  resources: { time: number; energy: number; money: number; attention: number; };
  ignoredRecommendationsCount: number;
  rcMultipliers: Record<string, number>;
  userModel?: UserModelData | null;
  historicalLogs?: IDailyLog[];
  policies?: IPolicy[];
  environmentNoisy?: boolean;
  mentallyOverloaded?: boolean;
}

export function runFullAnalysis(context: EngineContext): FullAnalysisResult {
  const { states, resources, ignoredRecommendationsCount, rcMultipliers, userModel, historicalLogs } = context;

  // 0. Compute Neuro-Adaptive State
  const rawBandwidth = ((states.energy + states.attention) / 2) - (context.mentallyOverloaded ? 2 : 0);
  const cognitiveBandwidth = Math.max(0, Math.min(10, rawBandwidth));
  const sensoryLoad = context.environmentNoisy ? 8 : 2;
  const executiveFriction = Math.max(0, 10 - cognitiveBandwidth);

  // 1. Detect bottleneck
  let { bottleneck, leverageRatio, confidence, isCounterintuitive } = detectBottleneck(states, rcMultipliers);

  // Sensory Override
  if (sensoryLoad > 7) {
    bottleneck = 'attention'; // Sensory targets attention directly now
    confidence = 'HIGH';
    isCounterintuitive = true;
  }

  // 2. Day classification + Mode
  const dayType = classifyDay(states, resources);
  let countDistressed = 0;
  Object.values(states).forEach(val => {
    if (val < 3) countDistressed++;
  });

  let mode: 'FIX' | 'CONTAINMENT' | 'TRIAGE' | 'RECOVERY' = 'FIX';
  if (cognitiveBandwidth <= 2) {
    mode = 'RECOVERY';
  } else if (countDistressed >= 3) {
    mode = 'TRIAGE';
  } else if (resources.energy < 3 || resources.time < 3) {
    mode = 'CONTAINMENT';
  }

  // 3. Loops Detection
  const activeLoops = detectFailureLoops(states);
  const loopNames = activeLoops.map(l => l.name);

  // 4. Rule Engine
  const activeRules = applyRules(states, resources, context.policies || []);

  // 5. Adaptive Intelligence Layer
  let adjustedLR: number | undefined;
  let successProbability: number | undefined;
  let systemConfidence: number | undefined;
  let rankedDomains: ScoredDomain[] | undefined;

  if (userModel) {
    adjustedLR = computeAdjustedLR(leverageRatio, bottleneck, userModel);

    const domainScores: Record<string, number> = {};
    const domains: DomainNode[] = ['sleep', 'work', 'money', 'energy', 'attention', 'health', 'learning', 'relationships'];
    domains.forEach(d => {
      const r = detectBottleneck(states, rcMultipliers);
      domainScores[d] = d === r.bottleneck ? r.leverageRatio : r.leverageRatio * 0.5;
    });
    rankedDomains = scoreDomains(domainScores, userModel);

    if (historicalLogs && historicalLogs.length >= 7) {
      const sp = predictSuccess(states, bottleneck, userModel, historicalLogs);
      successProbability = sp.probability;

      const fp = predictFailure(states, bottleneck, userModel, historicalLogs);
      const mlScore = computeMLScore(adjustedLR, sp.probability, fp.probability);

      if (rankedDomains.length > 0 && mode !== 'RECOVERY' && !context.environmentNoisy) {
        const topDomain = rankedDomains[0];
        if (topDomain.domain !== bottleneck && topDomain.finalScore > (adjustedLR / 2) * 1.3) {
          bottleneck = topDomain.domain;
          adjustedLR = topDomain.adjustedLR;
          isCounterintuitive = true;
        }
      }
    }

    const conf = computeSystemConfidence(states, bottleneck, userModel, historicalLogs ?? []);
    systemConfidence = conf.score;
  }

  // 6. Recommendation Engine
  let targetNode = bottleneck;
  if (activeLoops.length > 0 && mode === 'TRIAGE' && !context.environmentNoisy) {
    targetNode = activeLoops[0].breakPoint as string;
    confidence = 'HIGH';
    isCounterintuitive = true;
  }

  let recommendation = generateContextualIntervention(targetNode, states, confidence, cognitiveBandwidth);

  // Emergency Mode Override
  if (mode === 'RECOVERY') {
    recommendation.action = "Lie down, close your eyes, and drink 1 glass of water. Shut down all open loops.";
    recommendation.whyThis = "Cognitive bandwidth is critically low. Processing any information right now will cause further executive collapse.";
    recommendation.whyNotOthers = "Working effectively is biologically impossible in this state. Stop trying.";
    recommendation.bandwidthRequired = 'LOW';
  }

  // 7. Tradeoff computation
  const tradeoff = computeTradeoff(targetNode as DomainNode, states);

  // 8. Trust + Learning System
  let adaptiveShift = false;
  if (ignoredRecommendationsCount >= 3 || (userModel?.calibrationNeeded)) {
    adaptiveShift = true;
    confidence = 'LOW';
    recommendation.confidenceLevel = 'LOW';
    recommendation.action = 'We may be wrong. Adjusting approach. Do ANY one thing today that feels easy. Zero pressure.';
    recommendation.confidenceReason = userModel?.calibrationNeeded
      ? 'System Recalibrating: 3+ consecutive wrong predictions. Resetting assumptions.'
      : 'Ghost Protocol Activated: System admitted failure due to repeated ignored recommendations.';
  } else if (ignoredRecommendationsCount === 2 && countDistressed > 2) {
    confidence = 'LOW';
    recommendation.confidenceLevel = 'LOW';
    recommendation.confidenceReason = 'System is uncertain. Prior recommendations failed to execute, and state is decaying.';
  }

  // 9. System Insights
  const insights = generateInsights(states, targetNode, historicalLogs ?? []);

  // 10. Decision Triad
  let decisions = generateDecisionTriad(recommendation.action, targetNode as string, states, resources, dayType.type);
  if (mode === 'RECOVERY') {
     decisions = { do: recommendation.action, delay: ['All current tasks'], delegate: [], remove: ['Non-essential communications'] };
  }

  // 11. System Message
  let systemMessage = '';
  if (mode === 'RECOVERY') {
    systemMessage = 'EMERGENCY OVERRIDE: Zero cognitive bandwidth detected. Immediate shutdown required.';
  } else if (context.environmentNoisy) {
    systemMessage = 'Sensory overload detected. Environmental friction is crippling baseline capacity.';
  } else if (mode === 'TRIAGE') {
    systemMessage = 'System overloaded. All optimization suspended. Survival only.';
  } else if (mode === 'CONTAINMENT') {
    systemMessage = 'Resources below threshold. Preventing further decay.';
  } else if (adaptiveShift) {
    systemMessage = 'Previous approach failed. Resetting assumptions.';
  } else if (activeLoops.length > 0) {
    systemMessage = activeLoops.length > 1
      ? 'Multiple cascading failures. Breaking the primary loop.'
      : 'Failure loop detected. Targeting the break point.';
  } else {
    systemMessage = isCounterintuitive
      ? 'The obvious fix is a trap. Targeting a counterintuitive leverage point.'
      : 'System stable. Single action, maximum downstream return.';
  }

  if (systemConfidence !== undefined && systemConfidence < 40) {
    systemMessage += ' Confidence is low — still learning your patterns.';
  }

  return {
    bottleneck: targetNode,
    leverageRatio,
    adjustedLR,
    mode,
    chain: [],
    loops: loopNames,
    recommendation: { ...recommendation, tradeoff },
    confidence,
    systemMessage,
    adaptiveShift,
    isCounterintuitive,
    successProbability,
    systemConfidence,
    rankedDomains,
    insights,
    decisions,
    dayType,
    activeRules,
    cognitiveBandwidth,
    sensoryLoad,
    executiveFriction,
  };
}

/**
 * Compute a clear tradeoff sentence for the recommended action.
 */
function computeTradeoff(bottleneck: DomainNode, states: Record<DomainNode, number>): string {
  const tradeoffs: Record<string, string> = {
    sleep: 'Prioritizing sleep tonight sacrifices evening production but unlocks tomorrow\'s full cognitive capacity.',
    work: 'Pushing on work costs energy/attention immediately, but clears financial or systemic debt.',
    money: 'Optimizing capital might cost time/attention now, but yields raw leverage for health and environment control later.',
    energy: 'Physical recovery costs raw output now but prevents a multi-day energy debt cycle.',
    attention: 'Deep focus requires blocking everything else. You gain intense output quality but lose availability/relationships.',
    health: 'Exercise/healing takes energy now but compounds into higher biological ceiling this week.',
    learning: 'Upskilling burns cognitive bandwidth and time, but structurally improves your future work efficiency.',
    relationships: 'Connection breaks your isolated focus rhythm but prevents cortisol/stress from compounding.',
  };
  return tradeoffs[bottleneck] ?? 'Every action has a cost. This one has the highest baseline return.';
}
