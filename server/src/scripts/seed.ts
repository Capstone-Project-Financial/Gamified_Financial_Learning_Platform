import { connectDatabase, disconnectDatabase } from '../config/database';
import logger from '../utils/logger';
import { stockSeeds } from '../data/stocks';
import { StockModel } from '../models/Stock';

const run = async () => {
  await connectDatabase();
  logger.info('Seeding data...');

  for (const seed of stockSeeds) {
    await StockModel.findOneAndUpdate({ symbol: seed.symbol }, seed, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true
    });
  }

  logger.info('Seed completed');
  await disconnectDatabase();
  process.exit(0);
};

run().catch((error) => {
  logger.error({ err: error }, 'Seed failed');
  process.exit(1);
});

