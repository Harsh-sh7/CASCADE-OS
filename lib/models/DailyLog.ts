import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDailyLog extends Document {
  user: mongoose.Types.ObjectId;
  date: string; // YYYY-MM-DD
  morningState: {
    sleep: number;
    work: number;
    money: number;
    energy: number;
    attention: number;
    health: number;
    learning: number;
    relationships: number;
    // ─── Neuro-Adaptive State ───
    cognitiveBandwidth?: number;
    sensoryLoad?: number;
    executiveFriction?: number;
  };
  resources: {
    time: number;
    energy: number;
    money: number;
    attention: number;
  };
  systemAnalysis: {
    bottleneck: string;
    leverageRatio: number;
    adjustedLR?: number;
    mode: 'FIX' | 'CONTAINMENT' | 'TRIAGE' | 'RECOVERY';
    loops: string[];
    recommendation: {
      action: string;
      gain: string[];
      cost: string[];
      whyThis: string;
      whyNotOthers: string;
      confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';
      confidenceReason: string;
      bandwidthRequired?: 'LOW' | 'MEDIUM' | 'HIGH';
    };
    isCounterintuitive: boolean;
    adaptiveShift: boolean;
    systemMessage: string;
    successProbability?: number;   
    systemConfidence?: number;     
    insights: any[];
    decisions: any;
    dayType: any;
    activeRules: any[];
  };
  followUp: {
    completed: boolean;
    feedback?: string;
  };
  feedback?: {
    rating: 'up' | 'down';
    reason?: 'too_hard' | 'no_time' | 'not_relevant' | 'ineffective' | 'other' | 'EXECUTION_BLOCKED';
    submittedAt: Date;
  };
  eveningState?: {
    sleep: number;
    work: number;
    money: number;
    energy: number;
    attention: number;
    health: number;
    learning: number;
    relationships: number;
  };
  outcomeDelta?: Record<string, number>;
  outcomeSuccess?: boolean;
  notifications: {
    emailSent: boolean;
    telegramSent: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const DailyLogSchema: Schema<IDailyLog> = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true },
    morningState: {
      sleep:         { type: Number, required: true },
      work:          { type: Number, required: true },
      money:         { type: Number, required: true },
      energy:        { type: Number, required: true },
      attention:     { type: Number, required: true },
      health:        { type: Number, required: true },
      learning:      { type: Number, required: true },
      relationships: { type: Number, required: true },
      cognitiveBandwidth: { type: Number },
      sensoryLoad:        { type: Number },
      executiveFriction:  { type: Number },
    },
    resources: {
      time:      { type: Number, default: 5 },
      energy:    { type: Number, default: 5 },
      money:     { type: Number, default: 5 },
      attention: { type: Number, default: 5 },
    },
    systemAnalysis: {
      bottleneck:    { type: String, required: true },
      leverageRatio: { type: Number, required: true },
      adjustedLR:    { type: Number },
      mode:          { type: String, enum: ['FIX', 'CONTAINMENT', 'TRIAGE', 'RECOVERY'], required: true },
      loops:         { type: [String], default: [] },
      recommendation: {
        action:           { type: String, required: true },
        gain:             { type: [String], required: true },
        cost:             { type: [String], required: true },
        whyThis:          { type: String, required: true },
        whyNotOthers:     { type: String, required: true },
        confidenceLevel:  { type: String, enum: ['HIGH', 'MEDIUM', 'LOW'], required: true },
        confidenceReason: { type: String, required: true },
        bandwidthRequired:{ type: String, enum: ['LOW', 'MEDIUM', 'HIGH'] },
      },
      isCounterintuitive: { type: Boolean, default: false },
      adaptiveShift:      { type: Boolean, default: false },
      systemMessage:      { type: String, required: true },
      successProbability: { type: Number },
      systemConfidence:   { type: Number },
      insights:           { type: Schema.Types.Mixed },
      decisions:          { type: Schema.Types.Mixed },
      dayType:            { type: Schema.Types.Mixed },
      activeRules:        { type: Schema.Types.Mixed },
    },
    followUp: {
      completed: { type: Boolean, default: false },
      feedback:  { type: String },
    },
    feedback: {
      rating:      { type: String, enum: ['up', 'down'] },
      reason:      { type: String, enum: ['too_hard', 'no_time', 'not_relevant', 'ineffective', 'other', 'EXECUTION_BLOCKED'] },
      submittedAt: { type: Date },
    },
    eveningState: {
      sleep:         { type: Number },
      work:          { type: Number },
      money:         { type: Number },
      energy:        { type: Number },
      attention:     { type: Number },
      health:        { type: Number },
      learning:      { type: Number },
      relationships: { type: Number },
    },
    outcomeDelta:  { type: Map, of: Number },
    outcomeSuccess:{ type: Boolean },
    notifications: {
      emailSent:    { type: Boolean, default: false },
      telegramSent: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

// Compound index to enforce one log per user per day
DailyLogSchema.index({ user: 1, date: 1 }, { unique: true });

export const DailyLog: Model<IDailyLog> =
  mongoose.models.DailyLog || mongoose.model<IDailyLog>('DailyLog', DailyLogSchema);
