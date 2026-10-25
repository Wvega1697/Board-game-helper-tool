const rollingRealmsConfig = {
  id: 'rolling-realms',
  storagePrefix: 'rolling-realms',
  bggId: 305682,
  name: 'Rolling Realms',
  minPlayers: 1,
  maxPlayers: 6,
  estimatedTime: '30 min',
  tags: ['roll-and-write', 'dice'],
  description: 'rr_description', // i18n key
  icon: '🎲',
  playerNoun: { en: 'Realmer', es: 'Reinante' },
  rounds: 3,
  realmsPerRound: 3,
};

export default rollingRealmsConfig;
