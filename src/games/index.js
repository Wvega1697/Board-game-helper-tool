import flip7Config from './flip7/config.js';
import hldConfig from './happy-little-dinosaurs/config.js';
import munchkinConfig from './munchkin-adventure-time/config.js';
import wpConfig from './wrong-party/config.js';
import architectsConfig from './7-wonders-architects/config.js';

/**
 * Central game registry.
 * Adding a new game = create a new folder + import its config here.
 */
export const games = [flip7Config, hldConfig, munchkinConfig, wpConfig, architectsConfig];

export const getGame = (id) => games.find((g) => g.id === id);

/**
 * Lazy-load the Calculator component for a game.
 * This keeps the initial bundle small.
 */
export const loadCalculator = (id) => {
  const loaders = {
    'flip7': () => import('./flip7/Calculator.jsx'),
    'happy-little-dinosaurs': () => import('./happy-little-dinosaurs/Calculator.jsx'),
    'munchkin-adventure-time': () => import('./munchkin-adventure-time/Calculator.jsx'),
    'wrong-party': () => import('./wrong-party/Calculator.jsx'),
    '7-wonders-architects': () => import('./7-wonders-architects/Calculator.jsx'),
  };
  return loaders[id]?.();
};
