/**
 * AI-Powered Financial Coaching via Google Gemini
 * 
 * This module wraps the Google Gemini API to generate personalized
 * financial coaching reports based on the user's simulation data.
 * It reads the mathematical outputs from the rules engine and transforms
 * them into empathetic, unique financial advice.
 * 
 * Cost: FREE (Gemini 1.5 Flash free tier — 15 RPM, 1M tokens/day)
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

/* ── Types ── */

export interface AICoachingReport {
  personalizedLetter: string;     // 2-3 paragraph personalized coaching letter
  biggestStrength: string;        // One-line strength summary
  criticalImprovement: string;    // One-line improvement area
  motivationalClosing: string;    // Encouraging closing sentence
  generatedAt: Date;
}

export interface SimulationDataForAI {
  monthlyIncome: number;
  totalMonths: number;
  totalSavings: number;
  totalDebt: number;
  emergencyFund: number;
  investmentValue: number;
  healthScore: number;
  avgHealthScore: number;
  smartDecisions: number;
  riskyDecisions: number;
  avoidantDecisions: number;
  missedEmis: number;
  overspendCount: number;
  longestSavingStreak: number;
  goalsCompleted: number;
  goalsTotal: number;
  archetype: string;
  topDecisions: Array<{
    month: number;
    event: string;
    choice: string;
    impact: string;
  }>;
  conceptsLearned: string[];
}

/* ── Gemini Client ── */

let genAI: GoogleGenerativeAI | null = null;

function getGeminiClient(): GoogleGenerativeAI | null {
  if (genAI) return genAI;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your-gemini-api-key') {
    return null;
  }

  genAI = new GoogleGenerativeAI(apiKey);
  return genAI;
}

const GEMINI_MODEL = 'gemini-2.5-flash';

/** Retry wrapper — 1 retry with 2s delay */
async function withRetry<T>(fn: () => Promise<T>, label: string): Promise<T | null> {
  try {
    return await fn();
  } catch (err: any) {
    const msg = err?.message || String(err);
    if (msg.includes('429') || msg.includes('RATE_LIMIT')) {
      console.warn(`[${label}] Rate limited, retrying in 2s...`);
      await new Promise(r => setTimeout(r, 2000));
      try { return await fn(); } catch (e2) {
        console.error(`[${label}] Retry also failed:`, e2);
        return null;
      }
    }
    if (msg.includes('API_KEY') || msg.includes('PERMISSION')) {
      console.error(`[${label}] API key invalid or permission denied — check GEMINI_API_KEY`);
    } else if (msg.includes('NOT_FOUND') || msg.includes('deprecated')) {
      console.error(`[${label}] Model not found — may be deprecated. Update GEMINI_MODEL.`);
    } else {
      console.error(`[${label}] AI call failed:`, msg);
    }
    return null;
  }
}

/* ── Prompt Builder ── */

function buildCoachingPrompt(data: SimulationDataForAI): string {
  return `You are a friendly, encouraging Indian financial coach who just watched a young person complete a 
${data.totalMonths}-month budget simulation game. Based on their performance data below, write them a 
personalized coaching report.

IMPORTANT RULES:
- Use Indian Rupee (₹) for all currency references
- Reference specific Indian financial products (SIP, ELSS, PPF, CIBIL score, Nifty 50)
- Be warm, conversational, and encouraging — like a supportive mentor, not a textbook
- Reference SPECIFIC decisions they made (use the top decisions data below)
- Keep each section concise — no more than 3-4 sentences per paragraph

USER'S SIMULATION DATA:
- Monthly Income: ₹${data.monthlyIncome.toLocaleString('en-IN')}
- Months Played: ${data.totalMonths}
- Final Savings: ₹${data.totalSavings.toLocaleString('en-IN')}
- Final Debt: ₹${data.totalDebt.toLocaleString('en-IN')}
- Emergency Fund: ₹${data.emergencyFund.toLocaleString('en-IN')}
- Investment Portfolio Value: ₹${data.investmentValue.toLocaleString('en-IN')}
- Final Health Score: ${data.healthScore}/100
- Average Health Score: ${data.avgHealthScore}/100
- Smart Decisions: ${data.smartDecisions}
- Risky Decisions: ${data.riskyDecisions}
- Avoidant Decisions: ${data.avoidantDecisions}
- Missed EMI Payments: ${data.missedEmis}
- Times Overspent Budget: ${data.overspendCount}
- Longest Consecutive Saving Streak: ${data.longestSavingStreak} months
- Goals Completed: ${data.goalsCompleted}/${data.goalsTotal}
- Financial Archetype: ${data.archetype}
- Financial Concepts Learned: ${data.conceptsLearned.join(', ') || 'None'}

TOP 3 MOST IMPACTFUL DECISIONS:
${data.topDecisions.map((d, i) => `${i + 1}. Month ${d.month} — "${d.event}": Chose "${d.choice}" → ${d.impact}`).join('\n')}

Respond in this EXACT JSON format (no markdown, no code blocks, pure JSON):
{
  "personalizedLetter": "A 2-3 paragraph personalized coaching letter analyzing their specific journey. Reference their actual decisions, income level, and patterns. Explain what they did well and what hurt them financially.",
  "biggestStrength": "One sentence identifying their single biggest financial strength demonstrated in the simulation",
  "criticalImprovement": "One sentence identifying the most critical area they need to improve",
  "motivationalClosing": "One encouraging sentence motivating them to apply what they learned to real life"
}`;
}

/* ── Main API Call ── */

export async function generateAICoachingReport(
  data: SimulationDataForAI
): Promise<AICoachingReport | null> {
  const client = getGeminiClient();

  if (!client) {
    console.log('[AI Coach] GEMINI_API_KEY not configured — skipping AI report generation');
    return null;
  }

  return withRetry(async () => {
    const model = client.getGenerativeModel({ model: GEMINI_MODEL });
    const prompt = buildCoachingPrompt(data);

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Parse JSON from Gemini response (strip markdown code blocks if present)
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return {
      personalizedLetter: parsed.personalizedLetter || '',
      biggestStrength: parsed.biggestStrength || '',
      criticalImprovement: parsed.criticalImprovement || '',
      motivationalClosing: parsed.motivationalClosing || '',
      generatedAt: new Date()
    };
  }, 'AI Coach');
}

/* ── AI Event Generation ── */

export interface EventGenerationContext {
  monthNumber: number;
  monthlyIncome: number;
  riskLevel: string;
  lifestyleLevel: string;
  totalSavings: number;
  totalDebt: number;
  recentEvents: string[]; // passing recent titles/descriptions to avoid repetition
  activeGoals: Array<{ name: string; targetAmount: number; currentAmount: number }>;
  activeDebts: Array<{ name: string; outstandingBalance: number }>;
  activeInvestments: Array<{ type: string; currentValue: number }>;
}

export async function generateMonthEventsViaAI(
  context: EventGenerationContext
): Promise<any[] | null> {
  const client = getGeminiClient();

  if (!client) {
    console.log('[AI Event Gen] GEMINI_API_KEY not configured — skipping AI event generation');
    return null;
  }

  return withRetry(async () => {
    const model = client.getGenerativeModel({ model: GEMINI_MODEL });
    
    const prompt = `You are the underlying simulation engine for an Indian gamified financial literacy app. 
You need to generate 1 highly realistic, personalized financial life event (either positive or negative) for the user to face in Month ${context.monthNumber} of the simulation.

USER CONTEXT:
- Monthly Income: ₹${context.monthlyIncome}
- Savings: ₹${context.totalSavings}
- Debt: ₹${context.totalDebt}
- Risk Tolerance: ${context.riskLevel}
- Lifestyle: ${context.lifestyleLevel}
- Active Goals: ${context.activeGoals.length > 0 ? JSON.stringify(context.activeGoals) : 'None'}
- Active Debts: ${context.activeDebts.length > 0 ? JSON.stringify(context.activeDebts) : 'None'}
- Active Investments: ${context.activeInvestments.length > 0 ? JSON.stringify(context.activeInvestments) : 'None'}
- Recently encountered events (DO NOT REPEAT THESE): ${context.recentEvents.join(', ') || 'None'}

RULES:
1. Generate an event that feels extremely realistic for an Indian young adult.
2. DEEP CONTEXT REQUIREMENT: If the user has Active Debts, Active Goals, or Active Investments, strongly prioritize generating an event that directly targets or mentions one of those specifically.
3. THEME DIVERSITY: The event THEME must be different from recent events. Pick from: medical, social pressure, career opportunity, household repair, market fluctuation, education, family obligation, technology, lifestyle choice, government policy. But remember: the "category" field in the JSON MUST be ONLY "positive", "negative", or "neutral" (based on financial impact). Never put the theme name in the category field.
4. The event MUST require a decision. Provide exactly 3 options (smart, risky, avoidant).
5. The "financialImpact" must be a positive integer representing the magnitude in Rupees (₹3000 to ₹50000 based on income).
6. The options MUST define their immediateEffect (a fraction multiplier of the financialImpact). Valid keys: balance, savings, debt, investment.

Respond ONLY with a valid JSON array containing exactly 1 event object (no markdown formatting, no comments). Follow this schema strictly:
[
  {
    "eventId": "ai-gen-<random-id>",
    "title": "Short catchy title",
    "description": "2 sentence description of the scenario. Mention their active goals or debts if relevant.",
    "category": "positive or negative or neutral",
    "financialImpact": <number>,
    "requiresDecision": true,
    "resolved": false,
    "dynamicOptions": [
      {
        "optionId": "opt-1",
        "label": "Short button label",
        "description": "What this choice means",
        "behaviorTag": "smart",
        "immediateEffect": { "balance": <fraction multiplier>, "savings": <fraction multiplier>, "investment": <fraction multiplier>, "debt": <fraction multiplier for ADDING new debt> },
        "xpModifier": 15,
        "healthScoreImpact": <number from -15 to +15>,
        "requiresSavings": <true or false>,
        "requiresCredit": <true or false>,
        "explanation": "Why this was the smart choice after they clicked it",
        "counterfactual": "What would have happened if they chose differently"
      },
      ... provide 3 options total (smart, risky, avoidant/neutral)
    ]
  }
]`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);

    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].eventId) {
      if (!parsed[0].eventId.startsWith('ai-gen')) {
        parsed[0].eventId = `ai-gen-${parsed[0].eventId}`;
      }
      return parsed;
    }
    
    throw new Error('AI returned invalid event JSON structure');
  }, 'AI Event Gen');
}

/* ── AI Monthly Insight ── */

export interface MonthInsightContext {
  monthNumber: number;
  monthlyIncome: number;
  balanceStart: number;
  balanceEnd: number;
  totalSavings: number;
  totalDebt: number;
  investmentValue: number;
  emergencyFund: number;
  healthScore: number;
  sipInvested: number;
  emiPaid: number;
  eventTitle: string;
  decisionLabel: string;
  decisionTag: string;
  goalsSummary: string;
}

export async function generateMonthlyInsight(
  ctx: MonthInsightContext
): Promise<string | null> {
  const client = getGeminiClient();
  if (!client) return null;

  return withRetry(async () => {
    const model = client.getGenerativeModel({ model: GEMINI_MODEL });
    const prompt = `You are an Indian financial coach analyzing a user's monthly budget simulation results. Write exactly 3-4 sentences of personalized insight.

MONTH ${ctx.monthNumber} DATA:
- Income: ₹${ctx.monthlyIncome} | Balance: ₹${ctx.balanceStart} → ₹${ctx.balanceEnd}
- Savings: ₹${ctx.totalSavings} | Emergency Fund: ₹${ctx.emergencyFund}
- Debt: ₹${ctx.totalDebt} | EMI Paid: ₹${ctx.emiPaid}
- SIP Invested: ₹${ctx.sipInvested} | Portfolio Value: ₹${ctx.investmentValue}
- Health Score: ${ctx.healthScore}/100
- Event: "${ctx.eventTitle}" → Decision: "${ctx.decisionLabel}" (${ctx.decisionTag})
- Goals: ${ctx.goalsSummary || 'None set'}

RULES:
- Explain WHY their balance changed (connect expenses + event impact + SIP deduction + EMI payment)
- If they have debt, warn about interest accumulation
- If their investment grew, praise the compounding effect
- Reference their specific decision and its ripple effect on goals/debt/savings
- Use ₹ and Indian context. Be encouraging but honest.
- Return ONLY plain text, no JSON, no markdown.`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  }, 'AI Insight');
}

/* ── AI Goal Suggestions ── */

export async function generateGoalSuggestions(
  income: number, savings: number, debt: number, investmentValue: number, existingGoals: string[]
): Promise<Array<{ name: string; type: string; targetAmount: number; reason: string }> | null> {
  const client = getGeminiClient();
  if (!client) return null;

  return withRetry(async () => {
    const model = client.getGenerativeModel({ model: GEMINI_MODEL });
    const prompt = `You are an Indian financial advisor. Suggest exactly 3 personalized financial goals for a user.

USER DATA:
- Monthly Income: ₹${income}
- Current Savings: ₹${savings}
- Current Debt: ₹${debt}
- Investment Portfolio: ₹${investmentValue}
- Existing Goals (DO NOT repeat these): ${existingGoals.join(', ') || 'None'}

Respond ONLY with a valid JSON array (no markdown, no code blocks):
[
  { "name": "Goal name", "type": "savings_target|purchase|emergency_fund|investment_milestone|debt_payoff", "targetAmount": <number>, "reason": "1 sentence why this goal matters" }
]`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  }, 'AI Goals');
}

/* ── AI Portfolio & Debt Advice ── */

export async function generatePortfolioAdvice(
  income: number, savings: number, debt: number, investmentValue: number,
  sipAmount: number, emiAmount: number, healthScore: number
): Promise<{ investmentAdvice: string; debtAdvice: string } | null> {
  const client = getGeminiClient();
  if (!client) return null;

  return withRetry(async () => {
    const model = client.getGenerativeModel({ model: GEMINI_MODEL });
    const prompt = `You are an Indian financial advisor. Give brief personalized advice.

USER DATA:
- Monthly Income: ₹${income} | Savings: ₹${savings}
- Active Debt: ₹${debt} | Monthly EMI: ₹${emiAmount}
- Investment Portfolio: ₹${investmentValue} | Monthly SIP: ₹${sipAmount}
- Health Score: ${healthScore}/100

Respond in this EXACT JSON format (no markdown, no code blocks):
{
  "investmentAdvice": "2 sentences of specific investment advice referencing their SIP amount and portfolio value. Mention specific Indian instruments like Nifty 50, ELSS, PPF.",
  "debtAdvice": "2 sentences of specific debt advice. If no debt, suggest maintaining the streak. If debt exists, recommend a payoff strategy."
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  }, 'AI Advice');
}
/* ── AI Budget Impact Narrative ── */

export interface BudgetNarrativeContext {
  monthNumber: number;
  monthlyIncome: number;
  balanceStart: number;
  balanceEnd: number;
  totalSavings: number;
  emergencyFund: number;
  totalDebt: number;
  investmentPL: { totalInvested: number; currentValue: number; gain: number; gainPercent: number; sipDeductedThisMonth: number; marketReturnThisMonth: number } | null;
  debtDetails: Array<{ type: string; principal: number; outstanding: number; emiPaid: number; interestPortion: number; principalPortion: number; missed: boolean }>;
  decisions: Array<{ eventTitle: string; choiceLabel: string; behaviorTag: string; balanceEffect: number; savingsEffect: number; debtEffect: number; investmentEffect: number }>;
  autoEvents: Array<{ title: string; category: string; impact: number }>;
  livingExpenses: number;
  savingsAllocated: number;
  efAllocated: number;
  sipAllocated: number;
  emiTotal: number;
  goalSnapshots: Array<{ name: string; type: string; progress: number; changeThisMonth: number; status: string; whatDrivesIt: string }>;
  healthScore: number;
}

export async function generateBudgetNarrative(
  ctx: BudgetNarrativeContext
): Promise<string | null> {
  const client = getGeminiClient();
  if (!client) return null;

  return withRetry(async () => {
    const model = client.getGenerativeModel({ model: GEMINI_MODEL });

    const prompt = `You are an Indian financial coach explaining a student's monthly budget simulation results. Write a clear, cause-and-effect narrative that makes EVERY money movement traceable.

MONTH ${ctx.monthNumber} RAW DATA:
- Income: ₹${ctx.monthlyIncome} | Balance: ₹${ctx.balanceStart} → ₹${ctx.balanceEnd}
- Living Expenses: ₹${ctx.livingExpenses} | Savings Allocated: ₹${ctx.savingsAllocated} | Emergency Fund: ₹${ctx.efAllocated}
- Total Savings: ₹${ctx.totalSavings} | Emergency Fund Total: ₹${ctx.emergencyFund}
- SIP Deducted: ₹${ctx.sipAllocated}${ctx.investmentPL ? ` | Portfolio: ₹${ctx.investmentPL.currentValue} (invested: ₹${ctx.investmentPL.totalInvested}, gain: ₹${ctx.investmentPL.gain}, ${ctx.investmentPL.gainPercent}%)` : ''}
- EMI Total: ₹${ctx.emiTotal} | Debt: ₹${ctx.totalDebt}
${ctx.debtDetails.length > 0 ? '- Debt Breakdown: ' + ctx.debtDetails.map(d => `${d.type}: ₹${d.emiPaid} EMI (₹${d.principalPortion} principal + ₹${d.interestPortion} interest), ₹${d.outstanding} outstanding${d.missed ? ' ⚠️MISSED' : ''}`).join('; ') : ''}
${ctx.decisions.length > 0 ? '- Decisions: ' + ctx.decisions.map(d => `"${d.eventTitle}" → "${d.choiceLabel}" (${d.behaviorTag}) → balance:${d.balanceEffect}, savings:${d.savingsEffect}, debt:${d.debtEffect}, investment:${d.investmentEffect}`).join('; ') : ''}
${ctx.autoEvents.length > 0 ? '- Auto Events: ' + ctx.autoEvents.map(e => `"${e.title}" (${e.category}: ₹${e.impact})`).join('; ') : ''}
${ctx.goalSnapshots.length > 0 ? '- Goals: ' + ctx.goalSnapshots.map(g => `"${g.name}" (${g.type}): ${g.progress}%, changed by ₹${g.changeThisMonth} — ${g.whatDrivesIt}`).join('; ') : ''}
- Health Score: ${ctx.healthScore}/100

RULES:
1. Write in FIRST PERSON addressing the user as "you"
2. Show EVERY money movement as a chain: income → expenses → savings → SIP → EMI → events → final balance
3. Explain HOW each decision connected to goals/debt/investments — e.g. "Because you chose X, your savings dropped, which slowed your goal Y progress"
4. If SIP was deducted, CLEARLY say this is NOT a loss but money moved from cash to portfolio
5. If EMI was paid, show principal vs interest split and explain how it reduces the debt goal
6. Explain goal progress changes: why did each goal increase/decrease this month
7. Keep it 5-8 sentences, warm and educational tone
8. Use ₹ for all amounts, Indian context
9. Return ONLY plain text, no JSON, no markdown`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  }, 'AI Narrative');
}
