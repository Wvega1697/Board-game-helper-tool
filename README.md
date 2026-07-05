# 🎲 Boardgame Helper

A mobile-first, Progressive Web App (PWA) designed to enhance your board game nights. Built with React, Vite, and modern web standards, Boardgame Helper provides intuitive score calculators and assistant tools for various board games.

## 🌟 Features

- **Game Calculators:** Dedicated, rule-aware calculators for specific games (e.g., *Happy Little Dinosaurs*, *Flip 7*).
- **Mobile-First Design:** A sleek, glassmorphism UI tailored for comfortable use on smartphones during game nights.
- **PWA / Offline Support:** Installable as a native app and works fully offline.
- **Multi-language:** Built-in internationalization (i18n) currently supporting English and Spanish.

## 🛠️ Tech Stack

- **Framework:** React 19 + Vite
- **Styling:** Tailwind CSS v4 (with modern `@theme` variables)
- **PWA:** `vite-plugin-pwa` for service worker generation and manifest
- **Icons & Assets:** Custom glassmorphism styles and emojis

## 🚀 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1. Clone the repository and navigate to the project directory:
   ```bash
   cd board-game-helper-tool
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to the local URL provided (usually `http://localhost:5173`).

### Building for Production

To create a production build with the PWA service worker enabled:
```bash
npm run build
npm run preview
```

## 🎮 Supported Games
Currently, the app includes calculators for:
- **Happy Little Dinosaurs:** Track Escape Route points, disasters, point cards, and instant card modifiers.
- **Flip 7:** Calculates base scores and tracks busts, stays, and bonus points.

## 📄 License
This project is for personal and educational use. Board game names and mechanics belong to their respective creators and publishers.
