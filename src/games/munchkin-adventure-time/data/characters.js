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
    powerEN: 'You may discard one card each combat, for a +2 BONUS to either side.',
    powerES: 'Puedes descartar una carta en cada combate, por un BONUS de +2 a cualquier lado.',
  },
  {
    id: 'gumball-bubblegum',
    maleNameEN: 'Prince Gumball', femaleNameEN: 'Princess Bubblegum',
    maleNameES: 'Príncipe Chicle', femaleNameES: 'Princesa Chicle',
    noGender: false,
    powerEN: 'ONE SHOT Items you use that give a bonus to combat strength are worth an extra +1 BONUS.',
    powerES: 'Los objetos de UN SOLO USO que uses y que den un bonus a la fuerza de combate dan +1 BONUS extra.',
  },
  {
    id: 'marshall-marceline',
    maleNameEN: 'Marshall Lee', femaleNameEN: 'Marceline',
    maleNameES: 'Marshall Lee', femaleNameES: 'Marceline',
    noGender: false,
    powerEN: 'You get a +2 BONUS against any monster with the color red on it (use your best judgment), and an extra +2 BONUS for musical instruments you have equipped.',
    powerES: 'Obtienes un BONUS de +2 contra cualquier monstruo con el color rojo en su ilustración, y un BONUS adicional de +2 por los instrumentos musicales que tengas equipados.',
  },
  {
    id: 'lsp',
    maleNameEN: 'Lumpy Space Prince', femaleNameEN: 'Lumpy Space Princess',
    maleNameES: 'Príncipe del Espacio', femaleNameES: 'Princesa del Espacio',
    noGender: false,
    powerEN: 'You get a +2 BONUS when in combat alone.',
    powerES: 'Obtienes un BONUS de +2 cuando luchas solo.',
  },
  {
    id: 'flame',
    maleNameEN: 'Flame Prince', femaleNameEN: 'Flame Princess',
    maleNameES: 'Príncipe Llama', femaleNameES: 'Princesa Llama',
    noGender: false,
    powerEN: 'You may choose to have your attacks count as fire/flame, and you get an extra +1 BONUS for items that already count as fire/flame attacks.',
    powerES: 'Puedes elegir que tus ataques cuenten como fuego/llamas, y obtienes un BONUS adicional de +1 por los objetos que ya cuentan como ataques de fuego/llamas.',
  },
  {
    id: 'monochromicorn-rainicorn',
    maleNameEN: 'Lord Monochromicorn', femaleNameEN: 'Lady Rainicorn',
    maleNameES: 'Lord Monocromicrón', femaleNameES: 'Lady Arcoíris',
    noGender: false,
    powerEN: 'You have +1 to RUN AWAY. You may draw a Door-or-Treasure card when you Loot the Room.',
    powerES: 'Tienes +1 para HUIR. Puedes robar una carta de Puerta o Tesoro cuando saqueas la habitación.',
  },
  {
    id: 'bmo',
    maleNameEN: 'BMO', femaleNameEN: 'BMO',
    maleNameES: 'BMO', femaleNameES: 'BMO',
    noGender: true,
    powerEN: 'You get a +2 BONUS against monsters Level 10 or below. (BMO ignores all gender-related stuff cause I DONT KNOW!?',
    powerES: 'Obtienes un BONUS de +2 contra monstruos de nivel 10 o inferior. (BMO ignora todas las cosas relacionadas con el género ¿¡Porqué NO LO SÉ!?)',
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
