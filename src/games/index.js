import flip7Config from './flip7/config.js';
import hldConfig from './happy-little-dinosaurs/config.js';

/**
 * Central game registry.
 * Adding a new game = create a new folder + import its config here.
 */
export const games = [flip7Config, hldConfig];

export const getGame = (id) => games.find((g) => g.id === id);

/**
 * Lazy-load the Calculator component for a game.
 * This keeps the initial bundle small.
 */
export const loadCalculator = (id) => {
  const loaders = {
    'flip7': () => import('./flip7/Calculator.jsx'),
    'happy-little-dinosaurs': () => import('./happy-little-dinosaurs/Calculator.jsx'),
  };
  return loaders[id]?.();
};
