/**
 * Dinosaur data parsed from dinosaur_traits.csv.
 * Adding a new dinosaur = adding an entry here (or in the CSV).
 */
export const dinosaurs = [
  {
    id: 'nervous-rex',
    nameEN: 'Nervous Rex',
    nameES: 'Nervous Rex',
    color: '#fec20c',
    source: 'base',
    traits: { natural: 0, predator: 1, emotional: -1, meteor: 0 },
    traitDescES: '+1 Depredadores, -1 Emocionales.',
    traitDescEN: '+1 Predators, -1 Emotional.',
  },
  {
    id: 'stego',
    nameEN: 'Stego',
    nameES: 'Stego',
    color: '#2ECC71',
    source: 'base',
    traits: { natural: 0, predator: 0, emotional: 0, meteor: 1 },
    traitDescES: '+1 Meteoro.',
    traitDescEN: '+1 Meteor.',
  },
  {
    id: 'cry-ceratops',
    nameEN: 'Cry Ceratops',
    nameES: 'Cry Ceratops',
    color: '#ef4263',
    source: 'base',
    traits: { natural: -1, predator: 0, emotional: 1, meteor: 0 },
    traitDescES: '+1 Emocionales, -1 Naturales.',
    traitDescEN: '+1 Emotional, -1 Natural.',
  },
  {
    id: 'bad-luck-bronto',
    nameEN: 'Bad Luck Bronto',
    nameES: 'Bad Luck Bronto',
    color: '#51487b',
    source: 'base',
    traits: { natural: 1, predator: -1, emotional: 0, meteor: 0 },
    traitDescES: '+1 Naturales, -1 Depredadores.',
    traitDescEN: '+1 Natural, -1 Predators.',
  },
  {
    id: 'pterry-dactyl',
    nameEN: 'Pterry Dactyl',
    nameES: 'Pterry Dactyl',
    color: '#e97fb3',
    source: 'expansion',
    traits: { natural: -2, predator: 1, emotional: 1, meteor: 0 },
    traitDescES: '+1 Emocionales, +1 Depredadores, -2 Naturales.',
    traitDescEN: '+1 Emotional, +1 Predators, -2 Natural.',
  },
  {
    id: 'raging-raptor',
    nameEN: 'Raging Raptor',
    nameES: 'Raging Raptor',
    color: '#3d949e',
    source: 'expansion',
    traits: { natural: -1, predator: 2, emotional: -1, meteor: 0 },
    traitDescES: '+2 Depredadores, -1 Emocionales, -1 Naturales.',
    traitDescEN: '+2 Predators, -1 Emotional, -1 Natural.',
  },
  {
    id: 'easygoing-anky',
    nameEN: 'Easygoing Anky',
    nameES: 'Easygoing Anky',
    color: '#cf5e25ff',
    source: 'expansion',
    traits: { natural: -1, predator: 0, emotional: 0, meteor: 0 },
    traitDescES: '-1 Naturales, +1 Peligro.',
    traitDescEN: '-1 Natural, +1 Hazard.',
  },
  {
    id: 'moody-masasaurus',
    nameEN: 'Moody Masasaurus',
    nameES: 'Moody Masasaurus',
    color: '#b3d6fcff',
    source: 'expansion',
    traits: { natural: 0, predator: 0, emotional: 1, meteor: 0 },
    traitDescES: '-1 Emocionales, +1 Peligro.',
    traitDescEN: '-1 Emotional, +1 Hazard.',
  },
];

export function getDinosaur(id) {
  return dinosaurs.find((d) => d.id === id);
}

export function getDinosaurName(dino, locale = 'es') {
  return locale === 'en' ? dino.nameEN : dino.nameES;
}

export function getTraitDesc(dino, locale = 'es') {
  return locale === 'en' ? dino.traitDescEN : dino.traitDescES;
}
