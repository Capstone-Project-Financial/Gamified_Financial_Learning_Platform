import mongoose, { Schema, Document } from 'mongoose';

export interface IQuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  order: number;
}

export interface IQuiz extends Document {
  moduleId: number;
  title: string;
  questions: IQuizQuestion[];
  passingScore: number;
  xpPerQuestion: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const QuizQuestionSchema = new Schema<IQuizQuestion>({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: Number, required: true },
  order: { type: Number, required: true }
}, { _id: false });

const QuizSchema = new Schema<IQuiz>(
  {
    moduleId: { type: Number, required: true, unique: true },
    title: { type: String, required: true },
    questions: [QuizQuestionSchema],
    passingScore: { type: Number, default: 70 },
    xpPerQuestion: { type: Number, default: 10 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

// Index for faster queries
QuizSchema.index({ moduleId: 1 });
QuizSchema.index({ isActive: 1 });

export const QuizModel = mongoose.model<IQuiz>('Quiz', QuizSchema);
