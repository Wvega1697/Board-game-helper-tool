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
- **Backend/Proxy:** Cloudflare Workers (`bgg-worker`) for BoardGameGeek API & n8n integration

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
   pnpm install
   ```

3. Start the development server:
   ```bash
   pnpm run dev
   ```

4. Open your browser and navigate to the local URL provided (usually `http://localhost:5173`).

### Building for Production

To create a production build with the PWA service worker enabled:
```bash
pnpm run build
pnpm run preview
```

## 🎮 Supported Games
Currently, the app includes calculators and helpers for:
- **Flip 7:** Calculates base scores and tracks busts, stays, and bonus points.
- **Happy Little Dinosaurs:** Track Escape Route points, disasters, point cards, and instant card modifiers.
- **Munchkin Adventure Time:** Level tracker, combat calculator, and character ability reference.
- **Wrong Party:** Guest card scoring engine with influencer, hypnotist, and special card resolution.
- **7 Wonders Architects:** End-game scoring across all 7 categories with progress tracking.
- **Everdell:** Full scoring calculator for all point sources (workers, cards, events, journey).
- **Harmonies:** Animal habitat scoring with terrain type breakdowns and multi-player comparison.

## 🧩 BoardGameGeek Integration

The application integrates with BoardGameGeek (BGG) to authenticate users and log their game plays directly from the calculators. To ensure security and handle CORS/rate-limiting, API calls are brokered through a secure pipeline: **PWA Client → Cloudflare Worker → n8n Webhook → BGG**.

*(Note: The exact n8n webhook URLs are kept private in the production Cloudflare Worker environment variables and are never exposed in the client frontend).*

### Endpoints Overview

1. **BGG Login**
   - **Purpose:** Authenticates a user against BGG and retrieves an active session token.
   - **Flow:** The client sends the `username` and `password` to the Cloudflare proxy. The proxy forwards it to the n8n webhook, which posts to BGG's `/login/api/v1`. The valid `sessionToken` (Cookies) is returned to the client and stored in-memory.

2. **Log Play**
   - **Purpose:** Submits a completed game's data to BGG's play logger.
   - **Flow:** The client sends the play data along with the `sessionToken`. The n8n webhook formats this JSON data into `x-www-form-urlencoded` format and submits it to BGG's legacy `geekplay.php` endpoint using the session cookies.
   - **Supported Play Data:**
     - **Global Play Info:** Game ID (`bggId`), Date (`playdate`), Location (`location`), Quantity (`quantity`), Length in minutes (`length`), Incomplete flag (`incomplete`), Exclude win stats flag (`nowinstats`), and general Comments (`comments`).
     - **Player Specific Info:** Name (`name`), BGG Username (`username`), Team/Color (`color`), Starting Position (`position`), Score (`score`), Rating (`rating`), Win flag (`win`), and New Player flag (`new`).

## 📄 License
This project is for personal and educational use. Board game names and mechanics belong to their respective creators and publishers.
