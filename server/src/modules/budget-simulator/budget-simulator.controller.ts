import { Request, Response } from 'express';
import asyncHandler from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import * as service from './budget-simulator.service';

/* ── Profile ── */

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const profile = await service.getProfile(req.user!.id);
  sendSuccess(res, profile, profile ? 'Profile found' : 'No profile yet');
});

export const createProfile = asyncHandler(async (req: Request, res: Response) => {
  const profile = await service.createProfile(req.user!.id, req.body);
  sendSuccess(res, profile, 'Financial profile created', 201);
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const profile = await service.updateProfile(req.user!.id, req.body);
  sendSuccess(res, profile, 'Financial profile updated');
});

/* ── Simulation Lifecycle ── */

export const createSimulation = asyncHandler(async (req: Request, res: Response) => {
  const sim = await service.createSimulation(req.user!.id, req.body.maxMonths);
  sendSuccess(res, sim, 'Simulation created', 201);
});

export const getActiveSimulation = asyncHandler(async (req: Request, res: Response) => {
  const sim = await service.getActiveSimulation(req.user!.id);
  sendSuccess(res, sim, sim ? 'Active simulation found' : 'No active simulation');
});

export const getSimulation = asyncHandler(async (req: Request, res: Response) => {
  const sim = await service.getSimulation(req.params.id, req.user!.id);
  sendSuccess(res, sim);
});

export const getSimulationHistory = asyncHandler(async (req: Request, res: Response) => {
  const history = await service.getSimulationHistory(req.user!.id);
  sendSuccess(res, history);
});

export const endSimulation = asyncHandler(async (req: Request, res: Response) => {
  const sim = await service.endSimulation(req.params.id, req.user!.id);
  sendSuccess(res, sim, 'Simulation completed');
});

/* ── Budget ── */

export const setBudget = asyncHandler(async (req: Request, res: Response) => {
  const sim = await service.setBudget(req.params.id, req.user!.id, req.body);
  sendSuccess(res, sim.currentBudget, 'Budget updated');
});

export const getBudget = asyncHandler(async (req: Request, res: Response) => {
  const budget = await service.getBudget(req.params.id, req.user!.id);
  sendSuccess(res, budget);
});

/* ── Goals ── */

export const addGoal = asyncHandler(async (req: Request, res: Response) => {
  const goals = await service.addGoal(req.params.id, req.user!.id, req.body);
  sendSuccess(res, goals, 'Goal added', 201);
});

export const updateGoal = asyncHandler(async (req: Request, res: Response) => {
  const goals = await service.updateGoal(req.params.id, req.user!.id, req.params.goalId, req.body);
  sendSuccess(res, goals, 'Goal updated');
});

export const deleteGoal = asyncHandler(async (req: Request, res: Response) => {
  const goals = await service.deleteGoal(req.params.id, req.user!.id, req.params.goalId);
  sendSuccess(res, goals, 'Goal removed');
});

/* ── Month Cycle ── */

export const advanceMonth = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.advanceMonth(req.params.id, req.user!.id, req.body);
  const lastMonth = result[result.length - 1];
  const awaiting = lastMonth?.status === 'awaiting_decisions';
  sendSuccess(
    res,
    { months: result, awaitingDecisions: awaiting },
    awaiting ? 'Events require your decisions' : `Month${result.length > 1 ? 's' : ''} advanced`
  );
});

export const getMonthData = asyncHandler(async (req: Request, res: Response) => {
  const month = await service.getMonthData(req.params.id, req.user!.id, parseInt(req.params.monthNum));
  sendSuccess(res, month);
});

export const getAllMonths = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 6;
  const result = await service.getAllMonths(req.params.id, req.user!.id, page, limit);
  sendSuccess(res, result);
});

/* ── Decisions ── */

export const getPendingDecisions = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.getPendingDecisions(req.params.id, req.user!.id);
  sendSuccess(res, result);
});

export const submitDecision = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.submitDecision(req.params.id, req.user!.id, req.body.eventId, req.body.optionId);
  sendSuccess(res, result, 'Decision submitted');
});

/* ── Reports ── */

export const getMonthReport = asyncHandler(async (req: Request, res: Response) => {
  const month = await service.getMonthData(req.params.id, req.user!.id, parseInt(req.params.monthNum));
  sendSuccess(res, month);
});

export const getFinalSummary = asyncHandler(async (req: Request, res: Response) => {
  const sim = await service.getSimulation(req.params.id, req.user!.id);
  if (!sim.finalSummary) {
    sendSuccess(res, null, 'Simulation not completed yet');
    return;
  }
  sendSuccess(res, { summary: sim.finalSummary, behaviorMetrics: sim.behaviorMetrics });
});

/* ── Debt & Investments ── */

export const getDebts = asyncHandler(async (req: Request, res: Response) => {
  const debts = await service.getDebts(req.params.id, req.user!.id);
  sendSuccess(res, debts);
});

export const payDebt = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.payDebt(req.params.id, req.user!.id, req.params.debtId, req.body.amount);
  sendSuccess(res, result, 'Payment applied');
});

export const getInvestments = asyncHandler(async (req: Request, res: Response) => {
  const investments = await service.getInvestments(req.params.id, req.user!.id);
  sendSuccess(res, investments);
});

export const withdrawInvestment = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.withdrawInvestment(req.params.id, req.user!.id);
  sendSuccess(res, result, 'Investments withdrawn');
});

/* ── Logs ── */

export const getSimulationLogs = asyncHandler(async (req: Request, res: Response) => {
  const level = req.query.level as string | undefined;
  const limit = parseInt(req.query.limit as string) || 500;
  const logs = await service.getSimulationLogs(req.params.id, req.user!.id, { level, limit });
  sendSuccess(res, logs);
});

export const getMonthLogs = asyncHandler(async (req: Request, res: Response) => {
  const logs = await service.getMonthLogs(req.params.id, req.user!.id, parseInt(req.params.monthNum));
  sendSuccess(res, logs);
});

/* ── AI Suggestions ── */

export const getAIGoalSuggestions = asyncHandler(async (req: Request, res: Response) => {
  const suggestions = await service.getAIGoalSuggestions(req.params.id, req.user!.id);
  sendSuccess(res, suggestions, suggestions ? 'AI goal suggestions generated' : 'AI suggestions unavailable');
});

export const getAIPortfolioAdvice = asyncHandler(async (req: Request, res: Response) => {
  const advice = await service.getAIPortfolioAdvice(req.params.id, req.user!.id);
  sendSuccess(res, advice, advice ? 'AI advice generated' : 'AI advice unavailable');
});
