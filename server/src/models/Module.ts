import mongoose, { Schema, Document } from 'mongoose';

export interface ILesson {
  lessonId: string;
  title: string;
  duration: string;
  order: number;
}

export interface IModule extends Document {
  moduleId: number;
  title: string;
  icon: string;
  description?: string;
  order: number;
  lessons: ILesson[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LessonSchema = new Schema<ILesson>({
  lessonId: { type: String, required: true },
  title: { type: String, required: true },
  duration: { type: String, required: true },
  order: { type: Number, required: true }
});

const ModuleSchema = new Schema<IModule>(
  {
    moduleId: { type: Number, required: true, unique: true },
    title: { type: String, required: true },
    icon: { type: String, required: true },
    description: { type: String },
    order: { type: Number, required: true },
    lessons: [LessonSchema],
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

// Index for faster queries
ModuleSchema.index({ moduleId: 1 });
ModuleSchema.index({ isActive: 1, order: 1 });

export const ModuleModel = mongoose.model<IModule>('Module', ModuleSchema);
