import { seedModules } from './seedModules';
import { seedLessons } from './seedLessons';
import { seedQuizzes } from './seedQuizzes';
import { seedAchievements } from './seedAchievements';
import seedTestimonials from './seedTestimonials';

const seedAll = async () => {
  console.log('🌱 Starting database seeding...\n');

  try {
    await seedModules();
    console.log('');
    
    await seedLessons();
    console.log('');
    
    await seedQuizzes();
    console.log('');
    
    await seedAchievements();
    console.log('');

    await seedTestimonials();
    console.log('');

    console.log('✨ All data seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('💥 Seeding failed:', error);
    process.exit(1);
  }
};

seedAll();
