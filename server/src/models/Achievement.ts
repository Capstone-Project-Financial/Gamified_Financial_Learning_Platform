import mongoose, { Schema, Document } from 'mongoose';

export interface IAchievement extends Document {
  achievementId: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
  total?: number;
  category: 'learning' | 'trading' | 'streak' | 'quiz' | 'other';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AchievementSchema = new Schema<IAchievement>(
  {
    achievementId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String, required: true },
    xpReward: { type: Number, required: true },
    total: { type: Number },
    category: { 
      type: String, 
      required: true,
      enum: ['learning', 'trading', 'streak', 'quiz', 'other'],
      default: 'other'
    },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

// Indexes for efficient queries
AchievementSchema.index({ achievementId: 1 });
AchievementSchema.index({ category: 1, isActive: 1 });

export const AchievementModel = mongoose.model<IAchievement>('Achievement', AchievementSchema);
