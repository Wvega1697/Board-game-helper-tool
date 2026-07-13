const wpConfig = {
  id: 'wrong-party',
  storagePrefix: 'wp',
  bggId: 336622,
  name: 'Wrong Party',
  minPlayers: 2,
  maxPlayers: 5,
  estimatedTime: '30–60 min',
  tags: ['party', 'cards', 'take-that', 'draft'],
  description: 'wp_description', // i18n key
  icon: '🎉',
  playerNoun: { en: 'Guest', es: 'Invitado' },

  houseRules: [
    {
      id: 'morePlayers',
      labelEN: 'Allow up to 8 players (adjust hand size as needed)',
      labelES: 'Permitir hasta 8 jugadores (ajustar tamaño de mano según sea necesario)',
      default: false,
    },
    {
      id: 'combinePlanners',
      labelEN: 'Combine both Party Planners: if two different types are declared, the theme counts as both',
      labelES: 'Combinar ambos Organizadores: si se declaran dos tipos distintos, el tema cuenta como ambos',
      default: false,
    },
    {
      id: 'hypnotistStack',
      labelEN: 'Multiple Hypnotists cancel each other out (odd = active, even = cancelled)',
      labelES: 'Varios Hipnotistas se cancelan entre sí (impar = activo, par = cancelado)',
      default: false,
    },
  ],
};

export default wpConfig;
