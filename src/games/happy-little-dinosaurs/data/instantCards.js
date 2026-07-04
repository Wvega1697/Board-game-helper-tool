/**
 * Instant cards data — parsed from Localizacion_Cartas_Happy_Little_Dinosaurs.csv.
 * Each card has EN name, ES effect, and categorization for the calculator.
 */
export const instantCards = [
  // --- Scoring Modifiers ---
  {
    id: 'score-booster',
    nameEN: 'Score Booster',
    effectES: 'Juega esta carta durante la fase de puntuación. Añade 2 puntos a la puntuación de cualquier jugador en esta ronda.',
    effectEN: 'Play this card during the scoring phase. Add 2 points to any player\'s score this round.',
    category: 'scoring',
    scoringPhase: true,
    modifier: 2,
  },
  {
    id: 'score-sapper',
    nameEN: 'Score Sapper',
    effectES: 'Juega esta carta durante la fase de puntuación. Resta 2 puntos de la puntuación de cualquier jugador en esta ronda.',
    effectEN: 'Play this card during the scoring phase. Subtract 2 points from any player\'s score this round.',
    category: 'scoring',
    scoringPhase: true,
    modifier: -2,
  },
  {
    id: 'score-inversion',
    nameEN: 'Score Inversion',
    effectES: 'Juega esta carta durante la fase de puntuación. Intercambia la puntuación del jugador con la puntuación más alta con la del jugador con la puntuación más baja después de que se hayan calculado los totales.',
    effectEN: 'Play this card during the scoring phase. Swap the highest and lowest player scores after totals are calculated.',
    category: 'scoring',
    scoringPhase: true,
    modifier: 0,
    special: 'inversion',
  },
  {
    id: 'mouth-trap',
    nameEN: 'Mouth Trap',
    effectES: 'Durante la fase de puntuación de esta ronda, intercambia la puntuación del jugador con la puntuación más alta con la del jugador con la puntuación más baja después de que se hayan calculado los totales.',
    effectEN: 'During this round\'s scoring phase, swap the highest and lowest player scores after totals are calculated.',
    category: 'scoring',
    scoringPhase: true,
    modifier: 0,
    special: 'inversion',
  },
  {
    id: 'special-star-fruit',
    nameEN: 'Special Star Fruit',
    effectES: 'Durante la fase de puntuación de esta ronda, duplica los efectos de las cartas Score Booster y Score Sapper.',
    effectEN: 'During this round\'s scoring phase, double the effects of Score Booster and Score Sapper cards.',
    category: 'scoring',
    scoringPhase: true,
    modifier: 0,
    special: 'double-boosters',
  },
  {
    id: 'rock-candy',
    nameEN: 'Rock Candy',
    effectES: 'Durante la fase de puntuación de esta ronda, añade 2 puntos a tu puntuación por cada carta de Peligro en tu Área de peligros.',
    effectEN: 'During this round\'s scoring phase, add 2 points to your score for each Hazard card in your Hazard Area.',
    category: 'scoring',
    scoringPhase: true,
    modifier: 0,
    special: 'rock-candy',
  },

  // --- Point Card Manipulation ---
  {
    id: 'delicious-smoothie',
    nameEN: '"Delicious" Smoothie',
    effectES: 'Puedes descartar una carta de Puntos con un efecto de tu mano, luego suma su valor en puntos a tu puntuación de esta ronda.',
    effectEN: 'Discard a Point card with an effect from your hand, then add its point value to your score this round.',
    category: 'point-manipulation',
    scoringPhase: false,
  },
  {
    id: 'pet-rock',
    nameEN: 'Pet Rock',
    effectES: 'Puedes descartar una carta de Puntos de tu mano, luego suma su valor en puntos a tu puntuación de esta ronda.',
    effectEN: 'Discard a Point card from your hand, then add its point value to your score this round.',
    category: 'point-manipulation',
    scoringPhase: false,
  },
  {
    id: 'helping-hand',
    nameEN: 'Helping Hand',
    effectES: 'Juega esta carta durante la fase de puntuación. Descarta cualquier número de cartas de Puntos con un valor de 1, 2 o 3 de tu mano, luego añade el valor en puntos de las cartas descartadas a tu puntuación de esta ronda.',
    effectEN: 'Play during scoring. Discard any number of Point cards with value 1, 2, or 3 from your hand, then add their point values to your score.',
    category: 'point-manipulation',
    scoringPhase: true,
  },
  {
    id: 'good-luck-rod',
    nameEN: 'Good Luck Rod',
    effectES: 'Puedes mirar las 3 cartas superiores del mazo. Si al menos una de ellas es una carta de Puntos, elige una y añade su valor en puntos a tu puntuación de esta ronda, luego descarta las 3 cartas.',
    effectEN: 'Look at the top 3 deck cards. If at least one is a Point card, choose one and add its value to your score, then discard all 3.',
    category: 'point-manipulation',
    scoringPhase: false,
  },

  // --- Card Swapping ---
  {
    id: 'grappling-snake',
    nameEN: 'Grappling Snake',
    effectES: 'Puedes intercambiar esta carta por la carta de Puntos del jugador a tu derecha o izquierda. No puedes intercambiarla por una carta que tenga efecto.',
    effectEN: 'Swap this card with the Point card of the player to your left or right. Cannot swap for a card with an effect.',
    category: 'swap',
    scoringPhase: false,
  },
  {
    id: 'hungry-plant',
    nameEN: 'Hungry Plant',
    effectES: 'Puedes intercambiar las cartas de Puntos de cualquier otro par de jugadores.',
    effectEN: 'Swap the Point cards of any other pair of players.',
    category: 'swap',
    scoringPhase: false,
  },
  {
    id: 'isapod-swap',
    nameEN: 'Isapod Swap',
    effectES: 'Puedes intercambiar esta carta con la carta de Puntos de otro jugador. No puedes intercambiarla por una carta que tenga efecto.',
    effectEN: 'Swap this card with another player\'s Point card. Cannot swap for a card with an effect.',
    category: 'swap',
    scoringPhase: false,
  },

  // --- Disruption ---
  {
    id: 'flaming-chainsaw',
    nameEN: 'Flaming Chainsaw',
    effectES: 'Durante esta ronda, se ignoran todos los efectos de las demás cartas de Puntos.',
    effectEN: 'During this round, all other Point card effects are ignored.',
    category: 'disruption',
    scoringPhase: false,
  },
  {
    id: 'behemoth-blade',
    nameEN: 'Behemoth Blade',
    effectES: 'Durante la fase de puntuación de esta ronda, ningún jugador puede jugar cartas Instantáneas.',
    effectEN: 'During this round\'s scoring phase, no player may play Instant cards.',
    category: 'disruption',
    scoringPhase: true,
  },
  {
    id: 'swiss-shears',
    nameEN: 'Swiss Shears',
    effectES: 'Durante la fase de puntuación de esta ronda, los efectos de las cartas Score Booster y Score Sapper jugadas por cualquier otro jugador se reducen a la mitad.',
    effectEN: 'During this round\'s scoring phase, Score Booster and Score Sapper effects from other players are halved.',
    category: 'disruption',
    scoringPhase: true,
  },
  {
    id: 'epic-flail',
    nameEN: 'Epic Flail',
    effectES: 'No puedes jugar cartas Instantáneas esta ronda.',
    effectEN: 'You cannot play Instant cards this round.',
    category: 'disruption',
    scoringPhase: false,
  },
  {
    id: 'voodoo-dino',
    nameEN: 'Voodoo Dino',
    effectES: 'Puedes descartar cualquier número de cartas de Puntos de tu mano. Por cada carta descartada, puedes restar 1 punto a la puntuación de cualquier jugador en esta ronda.',
    effectEN: 'Discard any number of Point cards from your hand. For each card discarded, subtract 1 point from any player\'s score.',
    category: 'scoring',
    scoringPhase: false,
  },

  // --- Disaster Management ---
  {
    id: 'disaster-insurance',
    nameEN: 'Disaster Insurance',
    effectES: 'Juega esta carta si fueras a añadir una carta de Desastre a tu Área de desastres esta ronda. En su lugar, mueve esa carta de Desastre a la parte inferior del mazo de desastres.',
    effectEN: 'Play if you would add a Disaster card to your Disaster Area. Instead, move that card to the bottom of the disaster deck.',
    category: 'disaster',
    scoringPhase: false,
  },
  {
    id: 'disaster-redirect',
    nameEN: 'Disaster Redirect',
    effectES: 'Juega esta carta si fueras a añadir una carta de Desastre a tu Área de desastres esta ronda. En su lugar, añade esa carta de Desastre al Área de desastres de otro jugador.',
    effectEN: 'Play if you would add a Disaster card to your Disaster Area. Instead, add it to another player\'s Disaster Area.',
    category: 'disaster',
    scoringPhase: false,
  },
  {
    id: 'molotov-crocktail',
    nameEN: 'Molotov Crocktail',
    effectES: 'Puedes eliminar una carta de Peligro de tu Área de peligros.',
    effectEN: 'Remove a Hazard card from your Hazard Area.',
    category: 'hazard',
    scoringPhase: false,
  },

  // --- Hazard Tokens ---
  {
    id: 'hazard-redirect',
    nameEN: 'Hazard Redirect',
    effectES: 'Juega esta carta si fueras a añadir una ficha de Peligro a tu Ruta de escape esta ronda. En su lugar, añade esa ficha de Peligro a la Ruta de escape de otro jugador.',
    effectEN: 'Play if you would add a Hazard token to your Escape Route. Instead, add it to another player\'s Escape Route.',
    category: 'hazard',
    scoringPhase: false,
  },
  {
    id: 'a-bone-to-flick',
    nameEN: 'A Bone to Flick',
    effectES: 'Descarta hasta 3 cartas y añade una ficha de Peligro a la Ruta de escape de otro jugador.',
    effectEN: 'Discard up to 3 cards and add a Hazard token to another player\'s Escape Route.',
    category: 'hazard',
    scoringPhase: false,
  },
  {
    id: 'coconut-bolas',
    nameEN: 'Coconut Bolas',
    effectES: 'Si tienes la puntuación más alta al final de la fase de puntuación de esta ronda, puedes añadir una ficha de Peligro a la Ruta de escape de otro jugador.',
    effectEN: 'If you have the highest score at the end of scoring, add a Hazard token to another player\'s Escape Route.',
    category: 'hazard',
    scoringPhase: true,
  },
  {
    id: 'spiky-shroom',
    nameEN: 'Spiky Shroom',
    effectES: 'Si tienes la puntuación más baja al final de la fase de puntuación de esta ronda, puedes añadir una ficha de Peligro a la Ruta de escape de otro jugador.',
    effectEN: 'If you have the lowest score at the end of scoring, add a Hazard token to another player\'s Escape Route.',
    category: 'hazard',
    scoringPhase: true,
  },
  {
    id: 'suck-up',
    nameEN: 'Suck Up',
    effectES: 'Si tienes la puntuación más baja al final de la fase de puntuación de esta ronda, puedes eliminar una ficha de Peligro de tu Ruta de escape.',
    effectEN: 'If you have the lowest score at the end of scoring, remove a Hazard token from your Escape Route.',
    category: 'hazard',
    scoringPhase: true,
  },

  // --- Utility ---
  {
    id: 'dino-grabber',
    nameEN: 'Dino Grabber',
    effectES: 'Puedes mirar la mano de otro jugador. Elige una carta y añádela a tu mano.',
    effectEN: 'Look at another player\'s hand. Choose a card and add it to your hand.',
    category: 'utility',
    scoringPhase: false,
  },
  {
    id: 'fire-spray',
    nameEN: 'Fire Spray',
    effectES: 'Puedes descartar hasta 3 cartas de tu mano.',
    effectEN: 'Discard up to 3 cards from your hand.',
    category: 'utility',
    scoringPhase: false,
  },
  {
    id: 'treenoculars',
    nameEN: 'Treenoculars',
    effectES: 'Puedes mirar las 2 cartas superiores del mazo. Elige una carta y añádela a tu mano. Descarta la otra carta.',
    effectEN: 'Look at the top 2 deck cards. Choose one for your hand and discard the other.',
    category: 'utility',
    scoringPhase: false,
  },
];

export function getCardName(card, locale = 'es') {
  // Card names stay in English (they're proper names), but effect text is localized
  return card.nameEN;
}

export function getCardEffect(card, locale = 'es') {
  return locale === 'en' ? (card.effectEN || card.effectES) : card.effectES;
}

export function getScoringCards() {
  return instantCards.filter((c) => c.scoringPhase && c.category === 'scoring');
}
