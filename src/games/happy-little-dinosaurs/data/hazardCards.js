/**
 * Hazard cards data — parsed from Localizacion_Hazard_Cards_Final.csv.
 * These are persistent penalties attached to players.
 */
export const hazardCards = [
  {
    id: 'brittle-bones',
    nameEN: 'Brittle Bones',
    effectES: 'Solo puedes recolectar hasta 7 puntos al final de la ronda.',
    effectEN: 'You can only collect up to 7 points at the end of the round.',
    scoringModifier: 'cap-7',
  },
  {
    id: 'icy-roads',
    nameEN: 'Icy Roads',
    effectES: 'No puedes jugar cartas Disaster Insurance durante la fase de puntuación.',
    effectEN: 'You cannot play Disaster Insurance during the scoring phase.',
    scoringModifier: 'no-insurance',
  },
  {
    id: 'juice-cleanse',
    nameEN: 'Juice Cleanse',
    effectES: 'Ignora las ventajas de tu Rasgo de dinosaurio durante la fase de puntuación.',
    effectEN: 'Ignore your Dinosaur Trait advantages during the scoring phase.',
    scoringModifier: 'no-trait-bonus',
  },
  {
    id: 'leechy-keen',
    nameEN: 'Leechy Keen',
    effectES: 'No puedes jugar más de 1 carta Instantánea por ronda.',
    effectEN: 'You cannot play more than 1 Instant card per round.',
    scoringModifier: 'limit-instants',
  },
  {
    id: 'live-laugh-lava',
    nameEN: 'Live. Laugh. Lava.',
    effectES: 'Los efectos de las cartas Score Sapper y Score Booster que juegues se reducen a la mitad.',
    effectEN: 'Score Sapper and Score Booster effects you play are halved.',
    scoringModifier: 'halve-boosters',
  },
  {
    id: 'ollie-oops',
    nameEN: 'Ollie Oops',
    effectES: 'Resta 2 del valor de las cartas de Puntos que juegues durante la Muerte súbita.',
    effectEN: 'Subtract 2 from Point card values you play during Sudden Death.',
    scoringModifier: 'sudden-death-penalty',
  },
  {
    id: 'restraining-order',
    nameEN: 'Restraining Order',
    effectES: 'No puedes jugar cartas Score Sapper durante la fase de puntuación.',
    effectEN: 'You cannot play Score Sapper during the scoring phase.',
    scoringModifier: 'no-sapper',
  },
  {
    id: 'rex-marks-the-spot',
    nameEN: 'Rex Marks The Spot',
    effectES: 'Resta 1 punto de tu puntuación por cada carta Instantánea que juegues durante la fase de puntuación.',
    effectEN: 'Subtract 1 point from your score for each Instant card you play during the scoring phase.',
    scoringModifier: 'instant-penalty',
  },
  {
    id: 'rock-slide',
    nameEN: 'Rock Slide',
    effectES: 'Duplica las desventajas de tu Rasgo de dinosaurio durante la fase de puntuación.',
    effectEN: 'Double your Dinosaur Trait disadvantages during the scoring phase.',
    scoringModifier: 'double-trait-penalty',
  },
  {
    id: 'slippery-slope',
    nameEN: 'Slippery Slope',
    effectES: 'Cada ronda, después de que se hayan calculado las puntuaciones, mueve tu peón de dinosaurio 1 espacio hacia atrás en tu Ruta de escape.',
    effectEN: 'Each round, after scores are calculated, move your dinosaur meeple 1 space back on your Escape Route.',
    scoringModifier: 'move-back',
  },
  {
    id: 'tarnished-plans',
    nameEN: 'Tarnished Plans',
    effectES: 'No puedes jugar cartas Score Booster durante la fase de puntuación.',
    effectEN: 'You cannot play Score Booster during the scoring phase.',
    scoringModifier: 'no-booster',
  },
  {
    id: 'up-in-flames',
    nameEN: 'Up In Flames',
    effectES: 'Resta 1 punto de tu puntuación por cada carta de Peligro en tu Área de peligros durante la fase de puntuación.',
    effectEN: 'Subtract 1 point from your score for each Hazard card in your Hazard Area during the scoring phase.',
    scoringModifier: 'hazard-penalty',
  },
];

export function getHazardName(card) {
  return card.nameEN;
}

export function getHazardEffect(card, locale = 'es') {
  return locale === 'en' ? (card.effectEN || card.effectES) : card.effectES;
}
