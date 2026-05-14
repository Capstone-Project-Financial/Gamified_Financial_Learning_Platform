import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import validate from '../../middleware/validate';
import {
  createProfileSchema,
  updateProfileSchema,
  createSimulationSchema,
  budgetAllocationSchema,
  createGoalSchema,
  updateGoalSchema,
  advanceMonthSchema,
  submitDecisionSchema,
  debtPaymentSchema
} from './budget-simulator.schema';
import * as ctrl from './budget-simulator.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

/* ── Profile ── */
router.get('/profile', ctrl.getProfile);
router.post('/profile', validate(createProfileSchema), ctrl.createProfile);
router.patch('/profile', validate(updateProfileSchema), ctrl.updateProfile);

/* ── Simulation Lifecycle ── */
router.post('/simulation', validate(createSimulationSchema), ctrl.createSimulation);
router.get('/simulation/active', ctrl.getActiveSimulation);
router.get('/simulation/history', ctrl.getSimulationHistory);
router.get('/simulation/:id', ctrl.getSimulation);
router.post('/simulation/:id/end', ctrl.endSimulation);

/* ── Budget ── */
router.post('/simulation/:id/budget', validate(budgetAllocationSchema), ctrl.setBudget);
router.get('/simulation/:id/budget', ctrl.getBudget);

/* ── Goals ── */
router.post('/simulation/:id/goals', validate(createGoalSchema), ctrl.addGoal);
router.patch('/simulation/:id/goals/:goalId', validate(updateGoalSchema), ctrl.updateGoal);
router.delete('/simulation/:id/goals/:goalId', ctrl.deleteGoal);

/* ── Month Cycle ── */
router.post('/simulation/:id/advance', validate(advanceMonthSchema), ctrl.advanceMonth);
router.get('/simulation/:id/month/:monthNum', ctrl.getMonthData);
router.get('/simulation/:id/months', ctrl.getAllMonths);

/* ── Decisions ── */
router.get('/simulation/:id/pending-decisions', ctrl.getPendingDecisions);
router.post('/simulation/:id/decide', validate(submitDecisionSchema), ctrl.submitDecision);

/* ── Reports ── */
router.get('/simulation/:id/report/:monthNum', ctrl.getMonthReport);
router.get('/simulation/:id/summary', ctrl.getFinalSummary);

/* ── Debt & Investments ── */
router.get('/simulation/:id/debts', ctrl.getDebts);
router.post('/simulation/:id/debts/:debtId/pay', validate(debtPaymentSchema), ctrl.payDebt);
router.get('/simulation/:id/investments', ctrl.getInvestments);
router.post('/simulation/:id/investments/withdraw', ctrl.withdrawInvestment);

/* ── Logs (Debug) ── */
router.get('/simulation/:id/logs', ctrl.getSimulationLogs);
router.get('/simulation/:id/logs/:monthNum', ctrl.getMonthLogs);

/* ── AI Suggestions ── */
router.get('/simulation/:id/ai-goal-suggestions', ctrl.getAIGoalSuggestions);
router.get('/simulation/:id/ai-portfolio-advice', ctrl.getAIPortfolioAdvice);

export default router;
