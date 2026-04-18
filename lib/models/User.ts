import mongoose, { Schema, Document, Model } from 'mongoose';

export interface UserModelData {
  adherence: Record<string, number>;       
  effectiveness: Record<string, number>;   
  rcMultipliers: Record<string, number>;   
  calibrationNeeded: boolean;              
  lastCalibration?: Date;
  successRate: number;                     
  ignoreRate: number;                      
  avgOutcomeDelta: number;                 
  bandwidthPerformance: Record<string, number>; // LOW, MEDIUM, HIGH success rates
}

export interface IInsight {
  date: string;
  type: 'recurring_bottleneck' | 'ignore_pattern' | 'domain_correlation' | 'weekly';
  title: string;
  body: string;
  seen: boolean;
}

export interface IPolicy {
  id: string;
  conditionDomain: string; // e.g. energy, sleep
  conditionOp: 'lt' | 'gt' | 'eq';
  conditionValue: number;
  action: string;
  active: boolean;
}

export interface IUser extends Document {
  email: string;
  name?: string;
  profile: {
    rcMultipliers: Record<string, number>;
    constraints: string[];
  };
  notifications: {
    email: boolean;
    telegram: boolean;
    telegramChatId?: string;
  };
  gamification: {
    xp: number;
    level: string;
    streaks: number;
    badges: string[];
  };
  subscription: {
    plan: 'FREE' | 'PRO' | 'POWER';
    validUntil?: Date;
  };
  policies: IPolicy[];
  userModel: UserModelData;
  insights: IInsight[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String },
    profile: {
      rcMultipliers: { type: Map, of: Number, default: {} },
      constraints: { type: [String], default: [] },
    },
    notifications: {
      email: { type: Boolean, default: true },
      telegram: { type: Boolean, default: false },
      telegramChatId: { type: String },
    },
    gamification: {
      xp: { type: Number, default: 0 },
      level: { type: String, default: 'Observer' },
      streaks: { type: Number, default: 0 },
      badges: { type: [String], default: [] },
    },
    subscription: {
      plan: { type: String, enum: ['FREE', 'PRO', 'POWER'], default: 'FREE' },
      validUntil: { type: Date },
    },
    policies: [
      {
        id: { type: String, required: true },
        conditionDomain: { type: String, required: true },
        conditionOp: { type: String, required: true },
        conditionValue: { type: Number, required: true },
        action: { type: String, required: true },
        active: { type: Boolean, default: true },
      }
    ],
    userModel: {
      adherence:     { type: Map, of: Number, default: {} },
      effectiveness: { type: Map, of: Number, default: {} },
      rcMultipliers: { type: Map, of: Number, default: {} },
      calibrationNeeded: { type: Boolean, default: false },
      lastCalibration: { type: Date },
      successRate:   { type: Number, default: 0.5 },
      ignoreRate:    { type: Number, default: 0.0 },
      avgOutcomeDelta: { type: Number, default: 0.0 },
      bandwidthPerformance: { 
        type: Map, 
        of: Number, 
        default: { LOW: 0.5, MEDIUM: 0.5, HIGH: 0.5 } // Seed all bandwidths with 50% baseline
      },
    },
    insights: [
      {
        date:  { type: String, required: true },
        type:  { type: String, enum: ['recurring_bottleneck', 'ignore_pattern', 'domain_correlation', 'weekly'], required: true },
        title: { type: String, required: true },
        body:  { type: String, required: true },
        seen:  { type: Boolean, default: false },
      },
    ],
  },
  { timestamps: true }
);

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
