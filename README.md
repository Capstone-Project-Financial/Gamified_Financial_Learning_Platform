<!-- @format -->

# CoinQuest Academy 💰📚

A gamified financial literacy learning platform designed to help students master money management through interactive lessons, virtual stock trading, and fun challenges.

## 📁 Project Structure

```
coinquest-academy/
├── client/            # React + TypeScript + Vite frontend application
├── server/            # Express + TypeScript + MongoDB backend API
├── docs/              # Project-level documentation
└── README.md          # This file
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+) & npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- MongoDB (local or Atlas)

### Client (Frontend)

```bash
cd client
npm install
npm run dev
```

Client will run on `http://localhost:8080`

See [client/README.md](./client/README.md) for detailed frontend documentation.

### Server (Backend)

```bash
cd server
cp .env.example .env   # configure your environment variables
npm install
npm run dev
```

Server will run on `http://localhost:5000` (or the port set in `.env`)

## 🛠 Technologies

### Frontend
- Vite
- TypeScript
- React
- shadcn/ui
- Tailwind CSS

### Backend
- Express.js
- TypeScript
- MongoDB + Mongoose
- JWT Authentication
- Zod Validation
