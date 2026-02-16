import mongoose, { Schema, Document } from 'mongoose';

// Slide content types
interface IIntroSlide {
  type: 'intro';
  content: {
    image: string;
    text?: string;
  };
  order: number;
}

interface IContentSlide {
  type: 'content';
  content: {
    image: string;
    text?: string;
  };
  order: number;
}

interface IStorySlide {
  type: 'story';
  content: {
    image: string;
    story?: string;
    lesson?: string;
  };
  order: number;
}

interface IQuestionSlide {
  type: 'question';
  content: {
    question: string;
    options: Array<{
      id: string;
      text: string;
      correct: boolean;
    }>;
    multiSelect?: boolean;
  };
  order: number;
}

interface ICompletionSlide {
  type: 'completion';
  content: {
    message: string;
    xp: number;
    badge?: string | null;
  };
  order: number;
}

export type ISlide = IIntroSlide | IContentSlide | IStorySlide | IQuestionSlide | ICompletionSlide;

export interface ILesson extends Document {
  moduleId: number;
  lessonId: string;
  title: string;
  slides: ISlide[];
  xpReward: number;
  lucreReward: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SlideSchema = new Schema({
  type: { 
    type: String, 
    required: true, 
    enum: ['intro', 'content', 'story', 'question', 'completion'] 
  },
  content: { type: Schema.Types.Mixed, required: true },
  order: { type: Number, required: true }
}, { _id: false });

const LessonSchema = new Schema<ILesson>(
  {
    moduleId: { type: Number, required: true },
    lessonId: { type: String, required: true },
    title: { type: String, required: true },
    slides: [SlideSchema],
    xpReward: { type: Number, default: 50 },
    lucreReward: { type: Number, default: 30 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

// Compound index for efficient queries
LessonSchema.index({ moduleId: 1, lessonId: 1 }, { unique: true });
LessonSchema.index({ isActive: 1 });

export const LessonModel = mongoose.model<ILesson>('Lesson', LessonSchema);
