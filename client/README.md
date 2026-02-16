<!-- @format -->

# CoinQuest Academy - Frontend

A gamified financial literacy learning platform for students built with React, TypeScript, and Vite.

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:8080`

## 📁 Project Structure

```
frontend/
├── public/                 # Static assets
├── src/
│   ├── assets/            # Images, fonts, etc.
│   ├── components/        # Reusable UI components
│   │   └── ui/           # shadcn/ui components
│   ├── features/          # Feature-based modules
│   │   ├── auth/         # Authentication (Login, Signup, Landing)
│   │   ├── dashboard/    # Dashboard page
│   │   ├── stocks/       # Stock trading feature
│   │   ├── learning/     # Learning modules & quizzes
│   │   ├── wallet/       # Virtual wallet management
│   │   ├── achievements/ # Achievements & badges
│   │   └── leaderboard/  # Leaderboard & rankings
│   ├── shared/           # Shared utilities & layouts
│   │   └── layouts/      # Layout components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility functions
│   ├── App.tsx           # Main app component
│   ├── main.tsx          # Entry point
│   └── index.css         # Global styles
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.ts
```

## 🎯 Features

- **Interactive Learning**: Bite-sized financial literacy lessons
- **Virtual Stock Trading**: Practice trading with real-time simulations
- **Gamification**: Earn coins, badges, and achievements
- **Quiz Battles**: Compete with friends
- **Leaderboard**: Track your progress against other students
- **Virtual Wallet**: Manage your virtual money

## 🛠️ Tech Stack

- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Routing**: React Router v6
- **State Management**: React Context API
- **Data Fetching**: TanStack Query (React Query)

## 📜 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🎨 Design System

The project uses a custom design system inspired by Duolingo's gamified approach:

- **Primary Color**: Bright Green (#58CC02)
- **Secondary Color**: Bright Blue (#1CB0F6)
- **Accent Color**: Yellow (#FFD900)
- **Typography**: Nunito font family

## 📦 Key Dependencies

- `react` & `react-dom` - UI library
- `react-router-dom` - Routing
- `@tanstack/react-query` - Data fetching
- `lucide-react` - Icon library
- `tailwindcss` - Utility-first CSS
- `vite` - Build tool

## 🔧 Configuration Files

- `vite.config.ts` - Vite configuration
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `components.json` - shadcn/ui configuration

## 📝 Development Guidelines

### Feature Organization

Each feature module should contain:

- Components (pages/views)
- Context providers (if needed)
- Types/interfaces
- index.ts for clean exports

### Naming Conventions

- Components: PascalCase (e.g., `Dashboard.tsx`)
- Files: PascalCase for components, camelCase for utilities
- Folders: lowercase with hyphens (e.g., `shared-components`)

### Import Aliases

- `@/components` - UI components
- `@/features` - Feature modules
- `@/lib` - Utility functions
- `@/hooks` - Custom hooks

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📄 License

MIT License
