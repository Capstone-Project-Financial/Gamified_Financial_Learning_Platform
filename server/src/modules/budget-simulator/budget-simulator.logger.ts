import { SimulationLogModel, CycleStep } from '../../models/BudgetSimulator';
import logger from '../../utils/logger';

/**
 * Structured simulation logger — writes to both DB (for replay/debug)
 * and Pino (for server-side observability).
 */
export class SimulationLogger {
  static async log(
    simulationId: string,
    monthNumber: number,
    entry: {
      step: CycleStep;
      action: string;
      detail: Record<string, unknown>;
      level?: 'info' | 'warn' | 'error';
    }
  ) {
    const level = entry.level || 'info';

    // Persist to DB
    await SimulationLogModel.create({
      simulation: simulationId,
      monthNumber,
      timestamp: new Date(),
      level,
      step: entry.step,
      action: entry.action,
      detail: entry.detail
    });

    // Also emit to Pino
    logger[level](
      { simulationId, monthNumber, step: entry.step, action: entry.action },
      `SIM: ${entry.action}`
    );
  }

  static async getMonthLogs(simulationId: string, monthNumber: number) {
    return SimulationLogModel.find({
      simulation: simulationId,
      monthNumber
    }).sort({ timestamp: 1 });
  }

  static async getSimulationLogs(
    simulationId: string,
    options?: { level?: string; limit?: number }
  ) {
    const query: Record<string, unknown> = { simulation: simulationId };
    if (options?.level) query.level = options.level;
    return SimulationLogModel.find(query)
      .sort({ timestamp: 1 })
      .limit(options?.limit || 500);
  }
}
