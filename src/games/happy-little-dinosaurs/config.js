const hldConfig = {
  id: 'happy-little-dinosaurs',
  storagePrefix: 'hld',
  name: 'Happy Little Dinosaurs',
  minPlayers: 2,
  maxPlayers: 6,
  estimatedTime: '30–60 min',
  tags: ['strategy', 'take-that', 'cards'],
  description: 'hld_description',  // i18n key
  icon: '🦕',
  maxEscapeRoute: 50,

  houseRules: [
    {
      id: 'scoreBasedMovement',
      labelEN: 'Move by final calculated score instead of point card value',
      labelES: 'Avanzar por puntuación final calculada en lugar del valor de la carta de puntos',
      default: false,
    },
  ],
};

export default hldConfig;
