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

  try {
    const model = client.getGenerativeModel({ model: 'gemini-2.0-flash' });
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
  } catch (error) {
    console.error('[AI Coach] Failed to generate AI report:', error);
    return null; // Graceful fallback
  }
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
}

export async function generateMonthEventsViaAI(
  context: EventGenerationContext
): Promise<any[] | null> {
  const client = getGeminiClient();

  if (!client) {
    console.log('[AI Event Gen] GEMINI_API_KEY not configured — skipping AI event generation');
    return null;
  }

  try {
    const model = client.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    const prompt = `You are the underlying simulation engine for an Indian gamified financial literacy app. 
You need to generate 1 highly realistic, personalized financial life event (either positive or negative) for the user to face in Month ${context.monthNumber} of the simulation.

USER CONTEXT:
- Monthly Income: ₹${context.monthlyIncome}
- Savings: ₹${context.totalSavings}
- Debt: ₹${context.totalDebt}
- Risk Tolerance: ${context.riskLevel}
- Lifestyle: ${context.lifestyleLevel}
- Recently encountered events (DO NOT REPEAT THESE): ${context.recentEvents.join(', ') || 'None'}

RULES:
1. Generate an event that feels extremely realistic for an Indian young adult. It can be a medical issue, a social pressure event, a household breakdown, or a positive windfall like a bonus or freelance gig.
2. The event MUST require a decision. Provide exactly 3 options:
   - One "smart" financial option (requires discipline, usually lowers healthScore temporarily if painful but good long term, or preserves money).
   - One "risky" financial option (often involves taking debt to solve the problem easily).
   - One "avoidant" financial option (ignoring the problem, short term gain, long term pain).
3. The "financialImpact" must be a positive integer representing the magnitude of the event in Rupees. Make it realistic (e.g. ₹5000 to ₹15000 based on their income).
4. The options MUST define their immediateEffect (a fraction multiplier of the financialImpact). E.g. if the impact is 10000, and immediateEffect.savings is -1, it means -10000 to savings. 

Respond ONLY with a valid JSON array containing exactly 1 event object (no markdown formatting, no comments). Follow this schema strictly:
[
  {
    "eventId": "ai-gen-<random-id>",
    "title": "Short catchy title",
    "description": "2 sentence description of the scenario",
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
        "immediateEffect": { "balance": <fractional multiplier, e.g. -1 or 0>, "savings": <fractional multiplier>, "debt": <fractional multiplier> },
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
      return parsed;
    }
    
    throw new Error('AI returned invalid event JSON structure');
  } catch (error) {
    console.error('[AI Event Gen] Failed to generate AI event:', error);
    return null; // Graceful fallback
  }
}

