import { Schema, model, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export interface IUser {
  name: string;
  email: string;
  password: string;
  age?: number;
  grade?: string;
  school?: string;
  knowledgeLevel?: string;
  level: number;
  xp: number;
  currentStreak: number;
  longestStreak: number;
  lastLogin: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  loginOtp?: string;
  loginOtpExpires?: Date;
}

export interface IUserDocument extends IUser, Document {
  comparePassword(candidate: string): Promise<boolean>;
  createPasswordResetToken(): string;
  isResetTokenValid(): boolean;
  createLoginOtp(): string;
}

interface IUserModel extends Model<IUserDocument> {}

const userSchema = new Schema<IUserDocument>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, select: false },
    age: Number,
    grade: String,
    school: String,
    knowledgeLevel: { type: String, default: 'Beginner' },
    level: { type: Number, default: 1 },
    xp: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 1 },
    longestStreak: { type: Number, default: 1 },
    lastLogin: { type: Date, default: () => new Date() },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
    loginOtp: { type: String, select: false },
    loginOtpExpires: { type: Date, select: false }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        const { password, ...rest } = ret;
        return rest;
      }
    }
  }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function (candidate: string) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.createPasswordResetToken = function (): string {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  return resetToken;
};

userSchema.methods.isResetTokenValid = function (): boolean {
  return this.resetPasswordExpires && this.resetPasswordExpires > new Date();
};

userSchema.methods.createLoginOtp = function (): string {
  const otp = String(Math.floor(1000000 + Math.random() * 9000000)); // 7-digit
  this.loginOtp = crypto.createHash('sha256').update(otp).digest('hex');
  this.loginOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  return otp;
};

export const UserModel = model<IUserDocument, IUserModel>('User', userSchema);

