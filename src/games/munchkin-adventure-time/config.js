const munchkinConfig = {
  id: 'munchkin-adventure-time',
  storagePrefix: 'munchkin',
  name: 'Munchkin Adventure Time',
  minPlayers: 3,
  maxPlayers: 6, // ponytail: Calculator caps at characters.length dynamically
  estimatedTime: '60–120 min',
  tags: ['adventure', 'cards', 'take-that', 'level-up'],
  description: 'munchkin_description', // i18n key
  icon: '⚔️',
  targetLevel: 10,
  playerNoun: { en: 'Adventurer', es: 'Aventurero' },
};

export default munchkinConfig;
