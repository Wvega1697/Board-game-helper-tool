/**
 * Dinosaur data parsed from dinosaur_traits.csv.
 * Adding a new dinosaur = adding an entry here (or in the CSV).
 */
export const dinosaurs = [
  {
    id: 'nervous-rex',
    nameEN: 'Nervous Rex',
    nameES: 'Nerviosaurio Rex',
    color: '#E74C3C',
    source: 'base',
    traits: { natural: 0, predator: 1, emotional: -1, meteor: 0 },
    traitDescES: 'Obtiene +1 contra desastres de Depredadores, pero -1 contra desastres Emocionales.',
    traitDescEN: 'Gets +1 against Predator disasters, but -1 against Emotional disasters.',
  },
  {
    id: 'stego',
    nameEN: 'Stego',
    nameES: 'Stego',
    color: '#2ECC71',
    source: 'base',
    traits: { natural: 0, predator: 0, emotional: 0, meteor: 1 },
    traitDescES: 'Obtiene +1 contra desastres de Meteoro. Sin otras bonificaciones o penalizaciones.',
    traitDescEN: 'Gets +1 against Meteor disasters. No other bonuses or penalties.',
  },
  {
    id: 'cry-ceratops',
    nameEN: 'Cry Ceratops',
    nameES: 'Lloraceratops',
    color: '#3498DB',
    source: 'base',
    traits: { natural: -1, predator: 0, emotional: 1, meteor: 0 },
    traitDescES: 'Obtiene +1 contra desastres Emocionales, pero -1 contra desastres Naturales.',
    traitDescEN: 'Gets +1 against Emotional disasters, but -1 against Natural disasters.',
  },
  {
    id: 'bad-luck-bronto',
    nameEN: 'Bad Luck Bronto',
    nameES: 'Malasuerte Bronto',
    color: '#F39C12',
    source: 'base',
    traits: { natural: 1, predator: -1, emotional: 0, meteor: 0 },
    traitDescES: 'Obtiene +1 contra desastres Naturales, pero -1 contra desastres de Depredadores.',
    traitDescEN: 'Gets +1 against Natural disasters, but -1 against Predator disasters.',
  },
  {
    id: 'pterry-dactyl',
    nameEN: 'Pterry Dactyl',
    nameES: 'Pterry Dáctilo',
    color: '#9B59B6',
    source: 'expansion',
    traits: { natural: 2, predator: 0, emotional: -2, meteor: 0 },
    traitDescES: 'Obtiene +2 contra desastres Naturales, pero -2 contra desastres Emocionales.',
    traitDescEN: 'Gets +2 against Natural disasters, but -2 against Emotional disasters.',
  },
  {
    id: 'raging-raptor',
    nameEN: 'Raging Raptor',
    nameES: 'Raptor Furioso',
    color: '#E67E22',
    source: 'expansion',
    traits: { natural: 0, predator: -2, emotional: 2, meteor: 0 },
    traitDescES: 'Obtiene +2 contra desastres Emocionales, pero -2 contra desastres de Depredadores.',
    traitDescEN: 'Gets +2 against Emotional disasters, but -2 against Predator disasters.',
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
