/**
 * Munchkin Adventure Time — Character Cards.
 * Each card is double-sided (male/female). BMO has no gender.
 * Powers are placeholder — fill in after reviewing physical cards.
 */

/** @type {{ id: string, maleNameEN: string, femaleNameEN: string, maleNameES: string, femaleNameES: string, noGender: boolean, powerEN: string, powerES: string }[]} */
export const characters = [
  {
    id: 'finn-fionna',
    maleNameEN: 'Finn', femaleNameEN: 'Fionna',
    maleNameES: 'Finn', femaleNameES: 'Fionna',
    noGender: false,
    powerEN: 'You get a +2 BONUS against monsters Level 10 or above.',
    powerES: 'Obtienes un BONUS de +2 contra monstruos de nivel 10 o superior.',
  },
  {
    id: 'jake-cake',
    maleNameEN: 'Jake', femaleNameEN: 'Cake',
    maleNameES: 'Jake', femaleNameES: 'Cake',
    noGender: false,
    powerEN: 'See your character card for details.',
    powerES: 'Ver tu carta de personaje para más detalles.',
  },
  {
    id: 'gumball-bubblegum',
    maleNameEN: 'Prince Gumball', femaleNameEN: 'Princess Bubblegum',
    maleNameES: 'Príncipe Chicle', femaleNameES: 'Princesa Chicle',
    noGender: false,
    powerEN: 'See your character card for details.',
    powerES: 'Ver tu carta de personaje para más detalles.',
  },
  {
    id: 'marshall-marceline',
    maleNameEN: 'Marshall Lee', femaleNameEN: 'Marceline',
    maleNameES: 'Marshall Lee', femaleNameES: 'Marceline',
    noGender: false,
    powerEN: 'See your character card for details.',
    powerES: 'Ver tu carta de personaje para más detalles.',
  },
  {
    id: 'lsp',
    maleNameEN: 'Lumpy Space Prince', femaleNameEN: 'Lumpy Space Princess',
    maleNameES: 'Príncipe del Espacio', femaleNameES: 'Princesa del Espacio',
    noGender: false,
    powerEN: 'See your character card for details.',
    powerES: 'Ver tu carta de personaje para más detalles.',
  },
  {
    id: 'flame',
    maleNameEN: 'Flame Prince', femaleNameEN: 'Flame Princess',
    maleNameES: 'Príncipe Llama', femaleNameES: 'Princesa Llama',
    noGender: false,
    powerEN: 'See your character card for details.',
    powerES: 'Ver tu carta de personaje para más detalles.',
  },
  {
    id: 'monochromicorn-rainicorn',
    maleNameEN: 'Lord Monochromicorn', femaleNameEN: 'Lady Rainicorn',
    maleNameES: 'Lord Monocromicrón', femaleNameES: 'Lady Arcoíris',
    noGender: false,
    powerEN: 'See your character card for details.',
    powerES: 'Ver tu carta de personaje para más detalles.',
  },
  {
    id: 'bmo',
    maleNameEN: 'BMO', femaleNameEN: 'BMO',
    maleNameES: 'BMO', femaleNameES: 'BMO',
    noGender: true,
    powerEN: 'See your character card for details.',
    powerES: 'Ver tu carta de personaje para más detalles.',
  },
];

/**
 * Get display name for a character based on gender and locale.
 * @param {Object} character
 * @param {'male'|'female'|null} gender
 * @param {'en'|'es'} locale
 * @returns {string}
 */
export function getCharacterName(character, gender, locale = 'en') {
  if (!character) return '';
  if (character.noGender) return character.maleNameEN; // BMO
  const side = gender === 'female' ? 'female' : 'male';
  return locale === 'es' ? character[`${side}NameES`] : character[`${side}NameEN`];
}

/**
 * @param {Object} character
 * @param {'en'|'es'} locale
 * @returns {string}
 */
export function getCharacterPower(character, locale = 'en') {
  if (!character) return '';
  return locale === 'es' ? character.powerES : character.powerEN;
}
