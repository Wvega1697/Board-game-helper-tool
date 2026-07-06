export const wonders = [
  { id: 'alexandria', nameEN: 'Alexandria', nameES: 'Alejandría', effectEN: 'Take the top card from any deck anywhere on the table and place it in front of you.', effectES: 'Toma la carta superior de cualquier mazo de la mesa y ponla delante de ti.' },
  { id: 'ephesus', nameEN: 'Ephesus', nameES: 'Éfeso', effectEN: 'Take the top card from the central deck and place it in front of you.', effectES: 'Toma la carta superior del mazo central y ponla delante de ti.' },
  { id: 'babylon', nameEN: 'Babylon', nameES: 'Babilonia', effectEN: 'Choose 1 Progress token from the 4 available and place it in front of you.', effectES: 'Elige 1 ficha de Progreso de las 4 disponibles y ponla delante de ti.' },
  { id: 'rhodes', nameEN: 'Rhodes', nameES: 'Rodas', effectEN: 'Add 1 Shield to your total Shields.', effectES: 'Añade 1 Escudo a tu total de Escudos.' },
  { id: 'halicarnassus', nameEN: 'Halicarnassus', nameES: 'Halicarnaso', effectEN: 'Take the top 5 cards from the deck to your left or your right. Choose 1 and place it in front of you. Shuffle the other cards back into their deck.', effectES: 'Toma las 5 cartas superiores del mazo a tu izquierda o derecha. Elige 1 y ponla delante de ti. Baraja las demás.' },
  { id: 'olympia', nameEN: 'Olympia', nameES: 'Olimpia', effectEN: 'Take the top card from the decks to your left and your right and place them in front of you.', effectES: 'Toma la carta superior de los mazos a tu izquierda y derecha y ponlas delante de ti.' },
  { id: 'giza', nameEN: 'Giza', nameES: 'Guiza', effectEN: 'This Wonder has no special effect, but provides more Victory points than the other Wonders.', effectES: 'Esta Maravilla no tiene efecto especial, pero da más puntos de Victoria.' },
];

export function getWonderName(wonder, locale) {
  return locale === 'es' && wonder.nameES ? wonder.nameES : wonder.nameEN;
}

export function getWonderEffect(wonder, locale) {
  return locale === 'es' && wonder.effectES ? wonder.effectES : wonder.effectEN;
}
