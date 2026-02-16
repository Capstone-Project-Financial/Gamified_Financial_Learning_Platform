# Frontend Integration Checklist

This document outlines how to switch each React context/page from `localStorage` mocks to live API calls.

## 1. HTTP Client
- Create `src/lib/api.ts` that exports a configured `axios` instance with:
  - `baseURL = import.meta.env.VITE_API_BASE_URL`
  - `Authorization: Bearer <token>` header (token stored after login).
  - Response interceptors to handle `{ status: 'error' }` payloads.
- Expose helpers: `setAuthToken(token: string)`, `clearAuthToken()`.

## 2. AuthContext
- Replace localStorage logic with API calls:
  - `signup` → `POST /api/auth/signup`, store `{ token, user }`.
  - `login` → `POST /api/auth/login`, store token & user.
  - `logout` → `POST /api/auth/logout`, clear token.
  - On provider mount, call `GET /api/auth/me` if token exists to restore the session.
  - `updateUser` → `PATCH /api/auth/me`.
  - `addXP` → `POST /api/auth/xp` (only when XP changes independently of lessons/quizzes; otherwise rely on learning endpoints).

## 3. ProgressContext / Learning Pages
- Fetch combined data via `GET /api/learning/modules` to hydrate modules + `progress`.
- `completeLesson` → `POST /api/learning/lessons/:moduleId/:lessonId/complete`.
- `completeQuiz` → `POST /api/learning/quizzes/:moduleId/submit` with `{ answers, timeSpent }`.
- Use returned `{ progress, user, wallet }` payloads to update contexts optimistically.
- For lesson content, fetch on-demand from `GET /api/learning/lessons/:moduleId/:lessonId`.

## 4. WalletContext
- Initial load: `GET /api/wallet` → `{ wallet, transactions }`.
- `addToLucre` → `POST /api/wallet/earn`.
- `deductFromDiscretionary` → `POST /api/wallet/discretionary/deduct`.
- `addToDiscretionary` → `POST /api/wallet/discretionary/add`.
- `processWeeklyPayout` → `POST /api/wallet/payout`.
- `allocateExpenses` → `PUT /api/wallet/expenses`.
- Refresh achievements after major wallet updates by calling `POST /api/achievements/check`.

## 5. StockContext & Pages
- Load ticker via `GET /api/stocks`.
- `buyStock` → `POST /api/stocks/:symbol/buy`.
- `sellStock` → `POST /api/stocks/:symbol/sell`.
- Portfolio view → `GET /api/stocks/portfolio`.
- Optionally trigger `POST /api/stocks/refresh` (auth required) before showing dashboards to simulate live prices.

## 6. Achievements & Leaderboard
- Hydrate achievements via `GET /api/achievements` during dashboard load and after completing lessons/quizzes/trades.
- Leaderboard page:
  - `GET /api/leaderboard?limit=15` for the table.
  - `GET /api/leaderboard/me` for the “Your Ranking” card.

## 7. Routing Guards
- Use the auth context’s `user` to gate any routes that call protected endpoints. If the token expires, a 401 response should trigger logout + redirect to `/login`.

## 8. Environment Variables
- Frontend `.env`: `VITE_API_BASE_URL=http://localhost:5000/api`.
- Backend `.env`: set `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL=http://localhost:5173`.

## 9. Testing Workflow
- Run `npm run seed` in `/backend` after providing the Mongo URI to populate stocks.
- Start backend: `npm run dev` (backend) + `npm run dev` (frontend). Verify:
  - Signup/login works and persists state after refresh.
  - Completing lessons/quizzes updates XP, wallet, and achievements.
  - Stock trades adjust discretionary balance and portfolio summaries.
  - Leaderboard reflects XP order, `/leaderboard/me` shows logged-in user stats.

