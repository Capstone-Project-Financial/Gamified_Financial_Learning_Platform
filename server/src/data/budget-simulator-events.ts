/**
 * Budget Simulator — Random Event Pool
 *
 * Each event has probabilities, impact ranges, decision options,
 * difficulty tier, and cooldowns. All assembled into a static pool.
 *
 * Educational fields per Situated Learning Theory:
 *   - conceptCard: shown BEFORE the user makes a decision
 *   - explanation: shown AFTER the user picks an option
 *   - counterfactual: "if you had chosen the smart option instead…"
 */

export interface DecisionOptionTemplate {
  optionId: string;
  label: string;
  description: string;
  immediateEffect: { balance?: number; savings?: number; debt?: number; investment?: number };
  futureEffect?: {
    monthsAffected: number;
    monthlyImpact: number;
    type: 'expense' | 'income' | 'debt_payment';
  };
  xpModifier: number;
  healthScoreImpact: number;
  behaviorTag: 'smart' | 'risky' | 'avoidant' | 'neutral';
  /** If true, this option requires savings >= |immediateEffect.savings| */
  requiresSavings?: boolean;
  /** If true, this option requires credit headroom */
  requiresCredit?: boolean;
  /** Explanation shown AFTER the user picks this option */
  explanation: string;
  /** What would have happened with the best option instead */
  counterfactual?: string;
}

export interface EventTemplate {
  eventId: string;
  title: string;
  description: string;
  category: 'positive' | 'negative' | 'neutral';
  probability: number;
  /** Base impact as fraction of monthly income (e.g. 0.25 = 25%) */
  impactFraction: number;
  requiresDecision: boolean;
  decisions: DecisionOptionTemplate[];
  minMonth: number;
  cooldownMonths: number;
  difficultyTier: 1 | 2 | 3;
  /** If true, counts as catastrophic for guard-rail purposes */
  isCatastrophic?: boolean;
  /** Concept card shown BEFORE the user makes a decision */
  conceptCard?: {
    title: string;
    body: string;
  };
}

/** The 10 canonical concept names used throughout the simulator */
export const CANONICAL_CONCEPTS = [
  '50/30/20 rule',
  'Emergency fund sizing',
  'Compound interest',
  'Debt-to-income ratio',
  'CIBIL score impact',
  'Lifestyle inflation',
  'SIP investing',
  'Opportunity cost',
  'Discretionary spending',
  'Behavioral finance biases'
] as const;

export type CanonicalConcept = typeof CANONICAL_CONCEPTS[number];

export const EVENT_POOL: EventTemplate[] = [
  // ── TIER 1 (Tutorial) ──
  {
    eventId: 'minor-device-repair',
    title: 'Phone Screen Crack',
    description: 'Your phone screen cracked and needs a repair.',
    category: 'negative',
    probability: 0.20,
    impactFraction: 0.10,
    requiresDecision: true,
    minMonth: 1,
    cooldownMonths: 3,
    difficultyTier: 1,
    conceptCard: {
      title: 'Emergency fund sizing',
      body: 'An emergency fund is money set aside for unplanned expenses — phone repairs, medical bills, or job loss. Financial planners recommend keeping 3–6 months of expenses (₹45,000–₹90,000 for a ₹15,000/mo budget) in a liquid savings account. Without one, even a ₹3,000 repair forces you into credit card debt at 36–42% APR.'
    },
    decisions: [
      {
        optionId: 'pay-savings',
        label: 'Pay from Savings',
        description: 'Use your savings to get it fixed now.',
        immediateEffect: { savings: -1 },
        xpModifier: 15,
        healthScoreImpact: -2,
        behaviorTag: 'smart',
        requiresSavings: true,
        explanation: 'You used your emergency fund for exactly its intended purpose — absorbing an unplanned expense without taking on debt. This is the core reason emergency funds exist. Your CIBIL score stays untouched since no credit was used.',
        counterfactual: 'If you had used a credit card: you\'d pay 36–42% annual interest on this amount, adding ₹500–₹800 in interest over 3 months and creating a new EMI obligation.'
      },
      {
        optionId: 'use-credit',
        label: 'Put on Credit Card',
        description: 'Charge it to your credit card.',
        immediateEffect: { debt: 1 },
        futureEffect: { monthsAffected: 3, monthlyImpact: -1, type: 'debt_payment' },
        xpModifier: 5,
        healthScoreImpact: -5,
        behaviorTag: 'risky',
        requiresCredit: true,
        explanation: 'Credit cards in India charge 36–42% APR (3–3.5% per month). A ₹3,000 repair becomes ₹3,300+ over 3 months of EMIs. This also increases your credit utilization ratio, which can lower your CIBIL score if it exceeds 30% of your limit.',
        counterfactual: 'If you had paid from savings: ₹0 interest paid, no new EMI, no impact on your CIBIL score or debt-to-income ratio.'
      },
      {
        optionId: 'ignore',
        label: 'Ignore It',
        description: 'Use the phone with a cracked screen.',
        immediateEffect: {},
        xpModifier: -10,
        healthScoreImpact: -3,
        behaviorTag: 'avoidant',
        explanation: 'Avoiding the repair saves money short-term but is an avoidant pattern. A cracked screen worsens over time and may lead to a costlier replacement later. Financial health means addressing problems when they\'re small, not delaying until they compound.',
        counterfactual: 'If you had paid from savings: problem solved immediately, no future risk of worse damage, +15 XP earned, and you practiced using your emergency fund correctly.'
      }
    ]
  },
  {
    eventId: 'side-hustle',
    title: 'Side Hustle Opportunity',
    description: 'A friend offers you a freelance gig that pays well.',
    category: 'positive',
    probability: 0.12,
    impactFraction: 0.20,
    requiresDecision: false,
    minMonth: 1,
    cooldownMonths: 2,
    difficultyTier: 1,
    conceptCard: {
      title: 'Opportunity cost',
      body: 'Extra income is powerful — but where you put it matters. Every rupee earned has an opportunity cost: spending it on wants means it can\'t compound in a SIP. ₹5,000 invested monthly at 12% annual returns grows to ₹11.6 lakh in 10 years. Consider directing windfall income to your weakest financial area first.'
    },
    decisions: []
  },
  {
    eventId: 'cashback-reward',
    title: 'Cashback Reward',
    description: 'You received a cashback reward on your purchases!',
    category: 'positive',
    probability: 0.15,
    impactFraction: 0.05,
    requiresDecision: false,
    minMonth: 1,
    cooldownMonths: 2,
    difficultyTier: 1,
    conceptCard: {
      title: 'Compound interest',
      body: 'Small amounts matter because of compound interest. Even ₹500/month in a SIP at 12% annual return grows to ₹1.16 lakh in 10 years — that\'s ₹56,000 in pure interest earned. Albert Einstein reportedly called compound interest the "eighth wonder of the world." Cashback rewards reinvested, not spent, activate this power.'
    },
    decisions: []
  },
  {
    eventId: 'wedding-invitation',
    title: 'Wedding Invitation',
    description: "A close friend's wedding — you need to budget for gifts and travel.",
    category: 'neutral',
    probability: 0.20,
    impactFraction: 0.08,
    requiresDecision: true,
    minMonth: 1,
    cooldownMonths: 4,
    difficultyTier: 1,
    conceptCard: {
      title: 'Discretionary spending',
      body: 'Social expenses are "wants" — not essential, but important for wellbeing and relationships. The skill is attending within your budget, not avoiding events entirely. In the 50/30/20 framework, social spending falls in the 30% "wants" bucket. A ₹25,000/mo earner should limit wants to ₹7,500/mo total.'
    },
    decisions: [
      {
        optionId: 'attend-full',
        label: 'Attend & Gift Generously',
        description: 'Go all out — full outfit, generous gift.',
        immediateEffect: { balance: -1 },
        xpModifier: 5,
        healthScoreImpact: -3,
        behaviorTag: 'neutral',
        explanation: 'You prioritized the relationship, which has real value. But the full cost is a significant chunk of your monthly income. If your "wants" budget was already allocated, this creates an overspend that reduces your savings this month.',
        counterfactual: 'If you had attended on a budget: half the cost, same relationship maintained, +10 more XP earned, and your savings stay on track.'
      },
      {
        optionId: 'attend-budget',
        label: 'Attend on a Budget',
        description: 'Attend but keep expenses modest.',
        immediateEffect: { balance: -0.5 },
        xpModifier: 15,
        healthScoreImpact: -1,
        behaviorTag: 'smart',
        explanation: 'You balanced social obligation with financial discipline — the core skill of personal finance. Spending intentionally, not avoiding spending. Your miscellaneous budget absorbs this without impacting savings goals.',
        counterfactual: 'If you had skipped: you would have saved the full amount but accumulated an "avoidant" behavior tag. Three avoidant decisions reduce your final behavioral score by 15 points.'
      },
      {
        optionId: 'skip',
        label: 'Skip the Wedding',
        description: 'Send your wishes and save the money.',
        immediateEffect: {},
        xpModifier: 0,
        healthScoreImpact: 0,
        behaviorTag: 'avoidant',
        explanation: 'You saved the full amount but this is an avoidant pattern. Consistently skipping social obligations signals financial anxiety, not discipline. Real financial health includes budgeting for social life — the 30% "wants" category exists for this reason.',
        counterfactual: 'If you had attended on a budget: only half the cost, relationship maintained, +15 XP, and no avoidant flag on your profile.'
      }
    ]
  },
  {
    eventId: 'tax-refund',
    title: 'Tax Refund',
    description: 'You received a tax refund from an earlier overpayment.',
    category: 'positive',
    probability: 0.10,
    impactFraction: 0.15,
    requiresDecision: false,
    minMonth: 2,
    cooldownMonths: 6,
    difficultyTier: 1,
    conceptCard: {
      title: '50/30/20 rule',
      body: 'A tax refund is found money — but the 50/30/20 rule applies here too. Consider splitting it: 50% to needs (clear pending bills), 30% to wants (something you\'ve been saving for), and 20% to financial goals (add to SIP or emergency fund). Under Section 80C, you can invest up to ₹1.5 lakh/year in ELSS funds to reduce future tax liability.'
    },
    decisions: []
  },

  // ── TIER 2 (Normal) ──
  {
    eventId: 'medical-emergency',
    title: 'Medical Emergency',
    description: 'An unexpected medical expense requires immediate attention.',
    category: 'negative',
    probability: 0.15,
    impactFraction: 0.30,
    requiresDecision: true,
    minMonth: 3,
    cooldownMonths: 4,
    difficultyTier: 2,
    conceptCard: {
      title: 'Emergency fund sizing',
      body: 'Medical emergencies are the #1 reason Indians fall into debt. The 3–6 month emergency fund rule means keeping ₹45,000–₹90,000 liquid (for a ₹15,000/mo expense level). Health insurance helps, but deductibles and non-covered expenses still hit. Without an emergency fund, a ₹10,000 medical bill forces high-interest borrowing.'
    },
    decisions: [
      {
        optionId: 'pay-savings',
        label: 'Pay from Savings',
        description: 'Cover the full cost from your savings.',
        immediateEffect: { savings: -1 },
        xpModifier: 20,
        healthScoreImpact: -5,
        behaviorTag: 'smart',
        requiresSavings: true,
        explanation: 'Your emergency fund worked exactly as designed. Yes, your savings dropped, but you avoided debt entirely. Rebuilding savings takes discipline — allocate extra to your emergency fund for the next 2–3 months to replenish.',
        counterfactual: 'If you had used a credit card: the same amount at 36–42% APR creates ₹3,000–₹5,000 in interest charges over the repayment period, plus a new EMI reducing your monthly cash flow.'
      },
      {
        optionId: 'use-credit',
        label: 'Use Credit Card',
        description: 'Charge it — pay it off over 3 months.',
        immediateEffect: { debt: 1 },
        futureEffect: { monthsAffected: 3, monthlyImpact: -1, type: 'debt_payment' },
        xpModifier: 5,
        healthScoreImpact: -8,
        behaviorTag: 'risky',
        requiresCredit: true,
        explanation: 'Credit cards charge 36–42% APR in India. A ₹7,500 medical bill on credit becomes ₹8,500+ over 3 months. If you can\'t pay the full outstanding before the due date, interest compounds on the entire balance — not just the unpaid portion. This also increases your credit utilization, potentially lowering your CIBIL score below 750.',
        counterfactual: 'If you had paid from savings: ₹0 interest, no EMI burden, no CIBIL impact. The key lesson: build your emergency fund to at least 3 months of expenses.'
      },
      {
        optionId: 'take-loan',
        label: 'Take a Personal Loan',
        description: 'Take a 6-month loan at 1.5%/mo interest.',
        immediateEffect: { debt: 1 },
        futureEffect: { monthsAffected: 6, monthlyImpact: -1, type: 'debt_payment' },
        xpModifier: 10,
        healthScoreImpact: -6,
        behaviorTag: 'neutral',
        explanation: 'A personal loan at 1.5%/month (18% APR) is cheaper than credit cards (36–42% APR) but still creates a 6-month EMI obligation. Every EMI reduces your monthly disposable income. If another emergency hits during this period, you\'ll have less capacity to handle it.',
        counterfactual: 'If you had paid from savings: no interest, no EMI, full monthly income preserved for future allocation. Personal loans are better than credit cards but worse than having savings.'
      },
      {
        optionId: 'ignore',
        label: 'Delay Treatment',
        description: 'Put off treatment — risk worsening health.',
        immediateEffect: {},
        futureEffect: { monthsAffected: 2, monthlyImpact: -0.5, type: 'expense' },
        xpModifier: -15,
        healthScoreImpact: -12,
        behaviorTag: 'avoidant',
        explanation: 'Delaying medical treatment is the financial equivalent of ignoring a leak — it always gets more expensive. Untreated conditions worsen, leading to higher costs later. This also creates ongoing "hidden expenses" as your health deteriorates and productivity drops.',
        counterfactual: 'If you had paid from savings: one-time cost, problem resolved, health preserved. The delayed cost will likely exceed the original bill within 2 months.'
      }
    ]
  },
  {
    eventId: 'festival-bonus',
    title: 'Festival Bonus',
    description: 'Your employer gives you a festive season bonus!',
    category: 'positive',
    probability: 0.10,
    impactFraction: 0.40,
    requiresDecision: false,
    minMonth: 3,
    cooldownMonths: 6,
    difficultyTier: 2,
    conceptCard: {
      title: 'SIP investing',
      body: 'A bonus is a perfect opportunity to start or top-up a SIP (Systematic Investment Plan). Even a one-time ₹5,000 lump sum into an ELSS mutual fund gives you both market returns (historically 12–15% annually for Indian equity) AND tax savings under Section 80C. Don\'t let lifestyle inflation eat your windfall — invest first, spend what\'s left.'
    },
    decisions: []
  },
  {
    eventId: 'rent-increase',
    title: 'Rent Increase',
    description: 'Your landlord has raised the rent starting next month.',
    category: 'negative',
    probability: 0.08,
    impactFraction: 0.05,
    requiresDecision: true,
    minMonth: 4,
    cooldownMonths: 6,
    difficultyTier: 2,
    conceptCard: {
      title: 'Debt-to-income ratio',
      body: 'Housing should ideally be ≤30% of your gross income (the "30% rule"). For a ₹25,000/mo income, that\'s ₹7,500 max on rent. Banks use your debt-to-income ratio to evaluate loan eligibility — if housing + EMIs exceed 40% of income, most Indian banks will reject your home loan application. A rent hike that pushes you past 30% is a warning signal.'
    },
    decisions: [
      {
        optionId: 'accept',
        label: 'Accept the Increase',
        description: 'Adjust your budget for higher rent.',
        immediateEffect: {},
        futureEffect: { monthsAffected: 12, monthlyImpact: -1, type: 'expense' },
        xpModifier: 5,
        healthScoreImpact: -3,
        behaviorTag: 'neutral',
        explanation: 'Accepting a rent hike without negotiation is passive. While sometimes unavoidable, each ₹500/month increase costs ₹6,000/year permanently. Check if your rent now exceeds 30% of income — if so, your budget is under structural pressure.',
        counterfactual: 'If you had negotiated: even a 50% reduction in the hike saves ₹3,000/year. Negotiation costs nothing but 10 minutes of conversation.'
      },
      {
        optionId: 'negotiate',
        label: 'Try to Negotiate',
        description: 'Ask for a smaller increase — 50% chance of success.',
        immediateEffect: {},
        futureEffect: { monthsAffected: 12, monthlyImpact: -0.5, type: 'expense' },
        xpModifier: 15,
        healthScoreImpact: -1,
        behaviorTag: 'smart',
        explanation: 'Negotiation is a financial life skill. Most Indian landlords expect some back-and-forth. Even partial success saves real money: reducing a ₹1,000 hike to ₹500 saves ₹6,000/year. You maintained the relationship while protecting your budget — this is assertive financial management.',
        counterfactual: 'Moving would have cost more upfront (security deposit, shifting charges) but saved money long-term if your current rent was already above 30% of income.'
      },
      {
        optionId: 'move',
        label: 'Move to a Cheaper Place',
        description: 'Moving costs upfront but lower rent long-term.',
        immediateEffect: { balance: -1 },
        xpModifier: 10,
        healthScoreImpact: 2,
        behaviorTag: 'smart',
        explanation: 'Moving is expensive upfront (security deposit + shifting costs) but smart if your rent was getting unsustainable. The break-even point: if you save ₹2,000/month on rent, the move pays for itself in 3–4 months. Long-term housing cost optimization is a key wealth-building strategy.',
        counterfactual: 'If you had negotiated: lower upfront cost, no disruption, but the saving depends on negotiation success. Both are smart approaches — the right choice depends on your current rent-to-income ratio.'
      }
    ]
  },
  {
    eventId: 'laptop-breakdown',
    title: 'Laptop Breakdown',
    description: 'Your laptop stopped working — you need it for work/studies.',
    category: 'negative',
    probability: 0.12,
    impactFraction: 0.25,
    requiresDecision: true,
    minMonth: 3,
    cooldownMonths: 6,
    difficultyTier: 2,
    conceptCard: {
      title: 'Opportunity cost',
      body: 'Every financial decision has an opportunity cost — what you give up by choosing one option over another. A ₹40,000 laptop on EMI costs ₹40,000 + interest. That same ₹40,000 in a SIP at 12% returns would grow to ₹70,000 in 5 years. A ₹15,000 repair preserves ₹25,000 for investment. Always compare the total cost of each option, not just the sticker price.'
    },
    decisions: [
      {
        optionId: 'repair',
        label: 'Get it Repaired',
        description: 'Cheaper fix, but may not last long.',
        immediateEffect: { balance: -0.5 },
        xpModifier: 10,
        healthScoreImpact: -2,
        behaviorTag: 'smart',
        explanation: 'Repair is the financially optimal choice when the cost is <50% of replacement. You preserved capital that can compound elsewhere. For a student or intern, every ₹5,000 not spent is ₹5,000 that can start earning returns in a SIP.',
        counterfactual: 'If you had bought new on EMI: 6 months of EMI payments reduce your monthly cash flow, accumulate interest, and the opportunity cost is the SIP returns you miss during that period.'
      },
      {
        optionId: 'buy-new',
        label: 'Buy a New Laptop',
        description: 'Expensive but reliable long-term.',
        immediateEffect: { savings: -1 },
        xpModifier: 5,
        healthScoreImpact: -5,
        behaviorTag: 'neutral',
        requiresSavings: true,
        explanation: 'Buying outright avoids interest costs — that\'s smart. But depleting savings for a want (even a necessary one) is risky. If another emergency hits before you rebuild savings, you\'ll be forced into debt. Consider: was repair a viable alternative?',
        counterfactual: 'If you had repaired instead: half the cost, savings preserved for actual emergencies, +5 more XP. The repair-vs-replace decision should be based on repair cost as a percentage of replacement cost.'
      },
      {
        optionId: 'buy-credit',
        label: 'Buy New on EMI',
        description: 'Get a new laptop on 6-month EMI.',
        immediateEffect: { debt: 1 },
        futureEffect: { monthsAffected: 6, monthlyImpact: -1, type: 'debt_payment' },
        xpModifier: 0,
        healthScoreImpact: -7,
        behaviorTag: 'risky',
        requiresCredit: true,
        explanation: 'EMIs feel affordable but the total cost includes interest (typically 15–24% APR for consumer electronics EMIs in India). A ₹40,000 laptop on 6-month EMI at 18% APR costs ₹42,800 total. Plus, EMIs reduce your monthly disposable income, leaving less for savings and investments.',
        counterfactual: 'If you had repaired: no debt, no EMI, no interest. The ₹25,000 difference invested in a SIP at 12% annual returns would grow to ₹44,000 in 5 years.'
      }
    ]
  },
  {
    eventId: 'scholarship',
    title: 'Scholarship / Grant',
    description: 'You received a scholarship or grant for your education!',
    category: 'positive',
    probability: 0.08,
    impactFraction: 0.60,
    requiresDecision: false,
    minMonth: 4,
    cooldownMonths: 8,
    difficultyTier: 2,
    conceptCard: {
      title: 'Compound interest',
      body: 'A scholarship is tax-free income with zero effort. The compound interest principle applies here: if you invest even 50% of a ₹10,000 scholarship in a SIP today, at 12% annual returns it becomes ₹8,800 in 5 years — without you earning another rupee. Early money has the most time to compound. This is why financial advisors say "start investing in your 20s."'
    },
    decisions: []
  },
  {
    eventId: 'market-dip',
    title: 'Investment Market Dip',
    description: 'Markets dropped — your investment portfolio took a hit.',
    category: 'negative',
    probability: 0.10,
    impactFraction: 0.20,
    requiresDecision: true,
    minMonth: 4,
    cooldownMonths: 3,
    difficultyTier: 2,
    conceptCard: {
      title: 'Behavioral finance biases',
      body: 'When markets drop, your brain triggers "loss aversion" — a cognitive bias where losses feel 2x more painful than equivalent gains feel good. This is why people panic-sell at the bottom. Historical data: the Sensex has recovered from every crash within 1–3 years, and investors who stayed invested earned 12–15% annualized returns over 20 years. The real risk is selling low, not holding through dips.'
    },
    decisions: [
      {
        optionId: 'hold',
        label: 'Hold Your Investments',
        description: 'Stay invested — markets recover over time.',
        immediateEffect: {},
        xpModifier: 20,
        healthScoreImpact: 0,
        behaviorTag: 'smart',
        explanation: 'Holding through volatility is the most important investing skill. The Sensex has returned ~12% annually over 30 years despite multiple crashes. SIP investors actually benefit from dips — you buy more units at lower prices (rupee-cost averaging). Your patience will be rewarded.',
        counterfactual: 'If you had panic-sold: you would have locked in losses permanently. Historical data shows that missing just the 10 best trading days in a decade cuts your returns by more than half.'
      },
      {
        optionId: 'panic-sell',
        label: 'Sell Everything',
        description: 'Cash out to prevent further losses.',
        immediateEffect: { balance: 0.5 },
        xpModifier: -10,
        healthScoreImpact: -5,
        behaviorTag: 'avoidant',
        explanation: 'You crystallized a temporary paper loss into a permanent real loss. This is the classic "behavioral finance bias" — loss aversion causing you to sell at the worst possible time. Markets historically recover within 1–3 years, but your sold investments won\'t benefit from that recovery.',
        counterfactual: 'If you had held: your portfolio would likely recover to pre-dip levels within 6–12 months, and you\'d continue earning returns on the full invested amount. The ₹ you cashed out won\'t benefit from the recovery.'
      }
    ]
  },

  // ── TIER 3 (Challenge) ──
  {
    eventId: 'job-loss',
    title: 'Job Loss',
    description: 'You lost your income source. Next month you will receive no income.',
    category: 'negative',
    probability: 0.05,
    impactFraction: 1.0,
    requiresDecision: true,
    minMonth: 8,
    cooldownMonths: 12,
    difficultyTier: 3,
    isCatastrophic: true,
    conceptCard: {
      title: 'Emergency fund sizing',
      body: 'Job loss is the ultimate test of your emergency fund. With no income, your emergency fund is your runway — the number of months you can survive without earning. At ₹15,000/mo expenses, a ₹45,000 fund gives you 3 months. Financial planners in India recommend 6 months for salaried workers and 9–12 months for freelancers. If your fund is empty right now, every decision here gets harder.'
    },
    decisions: [
      {
        optionId: 'use-emergency',
        label: 'Use Emergency Fund',
        description: 'Tap into your emergency savings.',
        immediateEffect: { savings: -1 },
        xpModifier: 15,
        healthScoreImpact: -10,
        behaviorTag: 'smart',
        requiresSavings: true,
        explanation: 'This is exactly what emergency funds are for. Each month your fund covers buys you time to find new income without taking on debt. If you have 3 months of expenses saved, you have 3 months of runway — use this time wisely to find new employment.',
        counterfactual: 'If you had taken a loan: you\'d still have your savings BUT you\'d also have a new EMI obligation starting when you have zero income. If job search takes 2+ months, EMI + living expenses can spiral into a debt trap.'
      },
      {
        optionId: 'take-loan',
        label: 'Take Emergency Loan',
        description: 'Borrow to cover expenses until you find a new job.',
        immediateEffect: { debt: 1 },
        futureEffect: { monthsAffected: 6, monthlyImpact: -1, type: 'debt_payment' },
        xpModifier: 5,
        healthScoreImpact: -15,
        behaviorTag: 'risky',
        explanation: 'Borrowing during unemployment is dangerous. The loan starts accruing interest immediately, but your ability to repay depends on finding new income. If job search takes 3+ months, you\'re paying EMIs from borrowed money — a debt spiral. This is how CIBIL scores drop below 650, making future borrowing harder.',
        counterfactual: 'If you had used your emergency fund: no debt, no interest, no EMI pressure during your job search. The lesson: always prioritize building an emergency fund before investing.'
      },
      {
        optionId: 'cut-expenses',
        label: 'Drastically Cut Expenses',
        description: 'Reduce all non-essential spending immediately.',
        immediateEffect: {},
        xpModifier: 20,
        healthScoreImpact: -5,
        behaviorTag: 'smart',
        explanation: 'Immediately cutting non-essential expenses is strong financial discipline. Cancel subscriptions, reduce food spending, eliminate entertainment costs. Every ₹1,000/month saved extends your runway. Combined with an emergency fund, this approach maximizes your time to find new income without debt.',
        counterfactual: 'Using emergency fund + cutting expenses together is the optimal strategy. If you only cut expenses without tapping savings, you may run out faster than expected.'
      }
    ]
  },
  {
    eventId: 'market-crash',
    title: 'Major Market Crash',
    description: 'A major economic downturn wiped out significant investment value.',
    category: 'negative',
    probability: 0.06,
    impactFraction: 0.40,
    requiresDecision: true,
    minMonth: 10,
    cooldownMonths: 8,
    difficultyTier: 3,
    isCatastrophic: true,
    conceptCard: {
      title: 'Behavioral finance biases',
      body: 'Major crashes trigger multiple cognitive biases simultaneously: loss aversion ("I\'m losing everything"), herd mentality ("everyone is selling"), and recency bias ("markets will never recover"). Historical reality: the 2008 crash saw Sensex fall 60%, but investors who held recovered fully by 2010 and earned 14% annualized returns over the next decade. Crashes are temporary; panic-selling is permanent.'
    },
    decisions: [
      {
        optionId: 'hold',
        label: 'Stay Invested',
        description: 'Markets eventually recover — patience pays off.',
        immediateEffect: {},
        xpModifier: 25,
        healthScoreImpact: -3,
        behaviorTag: 'smart',
        explanation: 'Staying invested during a crash is the hardest but most rewarding financial decision. After the 2020 COVID crash, Sensex recovered in just 9 months. SIP investors who continued actually bought more units at cheaper prices, accelerating their wealth creation during the recovery.',
        counterfactual: 'Liquidating everything locks in maximum losses. Even selling 50% means you miss half the recovery gains.'
      },
      {
        optionId: 'sell-partial',
        label: 'Sell 50% of Portfolio',
        description: 'Reduce exposure while keeping some skin in the game.',
        immediateEffect: { balance: 0.5 },
        xpModifier: 10,
        healthScoreImpact: -5,
        behaviorTag: 'neutral',
        explanation: 'Selling 50% is a compromise — you reduce risk but also reduce recovery upside. The cash provides security, but the sold portion won\'t benefit from the inevitable recovery. This approach is understandable but mathematically suboptimal for long-term investors.',
        counterfactual: 'If you had stayed fully invested: you\'d participate in the full recovery rally, which historically delivers the strongest returns in the 12 months following a crash bottom.'
      },
      {
        optionId: 'sell-all',
        label: 'Liquidate Everything',
        description: 'Cash out completely — lock in losses.',
        immediateEffect: { balance: 1 },
        xpModifier: -15,
        healthScoreImpact: -10,
        behaviorTag: 'avoidant',
        explanation: 'You converted temporary paper losses into permanent real losses. This is the most expensive behavioral finance mistake. The cash feels safe, but you\'ve sold at the worst possible price and will likely re-enter the market later at higher prices — the classic "sell low, buy high" trap.',
        counterfactual: 'If you had stayed invested: history shows 100% of major market crashes have been followed by full recoveries. Your portfolio would have recovered and then continued growing. The cost of selling was not just today\'s loss but all future compound returns.'
      }
    ]
  },
  {
    eventId: 'promotion',
    title: 'Promotion / Raise',
    description: 'Congratulations! Your income has increased permanently.',
    category: 'positive',
    probability: 0.05,
    impactFraction: 0.15,
    requiresDecision: false,
    minMonth: 8,
    cooldownMonths: 12,
    difficultyTier: 3,
    conceptCard: {
      title: 'Lifestyle inflation',
      body: 'A raise feels amazing, but "lifestyle inflation" is the #1 wealth killer for young Indians. If you earn ₹5,000 more but spend ₹5,000 more on upgrades (better phone, eating out, subscriptions), your savings rate stays flat. The 50/30/20 rule applied to a raise: invest 50% of the increment, upgrade lifestyle with 30%, and add 20% to emergency fund. A ₹5,000 raise → ₹2,500 to SIP, ₹1,500 to wants, ₹1,000 to emergency fund.'
    },
    decisions: []
  },
  {
    eventId: 'family-emergency',
    title: 'Family Emergency',
    description: 'A family member needs urgent financial help.',
    category: 'negative',
    probability: 0.08,
    impactFraction: 0.35,
    requiresDecision: true,
    minMonth: 6,
    cooldownMonths: 5,
    difficultyTier: 2,
    conceptCard: {
      title: 'Emergency fund sizing',
      body: 'Family financial emergencies are common in India where social safety nets are limited. Financial planners recommend a separate "family support" allocation within your emergency fund. The challenge: helping without destroying your own financial stability. A useful guideline — never lend more than you can afford to lose, and never borrow to lend.'
    },
    decisions: [
      {
        optionId: 'help-full',
        label: 'Help Fully',
        description: 'Cover the entire amount from savings.',
        immediateEffect: { savings: -1 },
        xpModifier: 15,
        healthScoreImpact: -5,
        behaviorTag: 'smart',
        requiresSavings: true,
        explanation: 'Using savings to help family avoids debt for both you and them. This is the most financially sound way to provide support — but remember to rebuild your emergency fund immediately afterward. Set a timeline: "I\'ll replenish this in 3 months by increasing my savings allocation."',
        counterfactual: 'If you had borrowed to help: you\'d be paying interest on someone else\'s emergency. The principle stands: never borrow at 18–42% interest to give as a gift.'
      },
      {
        optionId: 'help-partial',
        label: 'Help Partially',
        description: 'Contribute what you can without going into debt.',
        immediateEffect: { savings: -0.5 },
        xpModifier: 10,
        healthScoreImpact: -3,
        behaviorTag: 'neutral',
        explanation: 'Helping partially is a balanced approach — you supported your family while preserving some financial stability. This is emotionally harder but financially responsible. If possible, help them explore other options (government schemes, hospital payment plans) for the remainder.',
        counterfactual: 'If you had helped fully from savings: the relationship benefit is the same, but your emergency fund would be fully depleted. Partial help is often the most sustainable approach.'
      },
      {
        optionId: 'borrow-to-help',
        label: 'Borrow to Help',
        description: 'Take a loan to cover the amount.',
        immediateEffect: { debt: 1 },
        futureEffect: { monthsAffected: 4, monthlyImpact: -1, type: 'debt_payment' },
        xpModifier: 0,
        healthScoreImpact: -8,
        behaviorTag: 'risky',
        requiresCredit: true,
        explanation: 'Borrowing to help others is emotionally generous but financially dangerous. You now have EMIs to pay on an amount that isn\'t benefiting you. If the family member can\'t repay, you\'re left with both the debt and the relationship complexity. Personal loans at 18% APR or credit cards at 36–42% APR make this very expensive.',
        counterfactual: 'If you had helped from savings: same family support, zero interest cost, no new EMI, no CIBIL score risk. The lesson: build a larger emergency fund that includes a "family support" buffer.'
      }
    ]
  },
  {
    eventId: 'insurance-payout',
    title: 'Insurance Payout',
    description: 'An old insurance policy matured — you receive a payout.',
    category: 'positive',
    probability: 0.06,
    impactFraction: 0.50,
    requiresDecision: false,
    minMonth: 6,
    cooldownMonths: 12,
    difficultyTier: 2,
    conceptCard: {
      title: 'SIP investing',
      body: 'An insurance payout is a lump sum — the best way to deploy it is through a SIP rather than spending it all at once. A ₹50,000 payout invested as ₹5,000/month over 10 months in an equity mutual fund gives you rupee-cost averaging, reducing market timing risk. Alternatively, a lump sum into a debt fund or FD earns 7–8% safely while you decide your long-term plan.'
    },
    decisions: []
  },
  {
    eventId: 'subscription-price-hike',
    title: 'Subscription Price Hikes',
    description: 'Several of your subscriptions raised their prices.',
    category: 'negative',
    probability: 0.15,
    impactFraction: 0.03,
    requiresDecision: true,
    minMonth: 2,
    cooldownMonths: 4,
    difficultyTier: 1,
    conceptCard: {
      title: 'Lifestyle inflation',
      body: 'Subscriptions are the poster child of lifestyle inflation — small recurring charges that silently eat your budget. The average Indian young professional has 4–6 active subscriptions totaling ₹1,500–₹3,000/month. A quarterly audit of your subscriptions (cancel, downgrade, or keep) is one of the easiest money-saving habits. Ask: "Would I sign up for this today at the new price?"'
    },
    decisions: [
      {
        optionId: 'accept',
        label: 'Keep All Subscriptions',
        description: 'Absorb the cost increase.',
        immediateEffect: {},
        futureEffect: { monthsAffected: 6, monthlyImpact: -1, type: 'expense' },
        xpModifier: 0,
        healthScoreImpact: -2,
        behaviorTag: 'neutral',
        explanation: 'Keeping all subscriptions at higher prices is passive budgeting. While each increase seems small (₹50–₹200), they compound across services and months. Over a year, unchecked subscription inflation can consume ₹3,000–₹6,000 that could have been invested.',
        counterfactual: 'If you had cancelled non-essential ones: the savings might seem small (₹300–₹500/month), but invested in a SIP at 12% returns, that\'s ₹5,000–₹8,500 in 10 years per ₹500/month saved. Small leaks sink big ships.'
      },
      {
        optionId: 'cancel-some',
        label: 'Cancel Non-Essential Ones',
        description: 'Cut back on subscriptions you rarely use.',
        immediateEffect: {},
        xpModifier: 15,
        healthScoreImpact: 2,
        behaviorTag: 'smart',
        explanation: 'Auditing and cutting subscriptions is micro-optimization that adds up. You demonstrated the principle that financial discipline isn\'t about big sacrifices — it\'s about consistently eliminating waste. The money saved can go directly to your SIP or emergency fund.',
        counterfactual: 'Keeping all subscriptions would have cost an additional ₹3,000–₹6,000 per year — money that now stays in your budget for intentional allocation.'
      }
    ]
  }
];
