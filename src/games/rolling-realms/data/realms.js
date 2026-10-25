// Realm names are Stonemaier game titles — identical in EN/ES, so only the scoring hint is localized.
export const realms = [
  { id: 'between-two-castles', name: 'Between Two Castles', scoreEN: '1 ★ per completed row (3 per castle).', scoreES: '1 ★ por fila completada (3 por castillo).' },
  { id: 'charterstone', name: 'Charterstone', scoreEN: '1 ★ per marked crate.', scoreES: '1 ★ por caja marcada.' },
  { id: 'between-two-cities', name: 'Between Two Cities', scoreEN: 'Lower ★ of the other 2 realms, max = filled squares. Enter filled squares.', scoreES: 'Menor ★ de los otros 2 reinos, máx. = casillas rellenadas. Ingresa las casillas rellenadas.' },
  { id: 'euphoria', name: 'Euphoria', scoreEN: '1 ★ each time an area sums 4–10 (max 6).', scoreES: '1 ★ cada vez que un área suma 4–10 (máx. 6).' },
  { id: 'my-little-scythe', name: 'My Little Scythe', scoreEN: '2 ★ per resource type gained 6+ times this round.', scoreES: '2 ★ por tipo de recurso obtenido 6+ veces esta ronda.' },
  { id: 'the-society', name: 'The Society', scoreEN: '1 ★ per completed card set, +1 ★ if all filled.', scoreES: '1 ★ por conjunto de cartas completado, +1 ★ si rellenas todas.' },
  { id: 'pendulum', name: 'Pendulum', scoreEN: 'Per hourglass completed: ★ in outlined octagons.', scoreES: 'Por reloj de arena completado: ★ en octógonos contorneados.' },
  { id: 'scythe', name: 'Scythe', scoreEN: '1 ★ per marked bottom-row number.', scoreES: '1 ★ por número marcado en la fila inferior.' },
  { id: 'tapestry', name: 'Tapestry', scoreEN: '1 ★ per completed big row/column (max 6).', scoreES: '1 ★ por fila/columna grande completada (máx. 6).' },
  { id: 'wingspan', name: 'Wingspan', scoreEN: '1 ★ per filled star square + 1 ★ per bird summing to its wingspan.', scoreES: '1 ★ por casilla de estrella rellenada + 1 ★ por ave que sume su envergadura.' },
  { id: 'viticulture', name: 'Viticulture', scoreEN: '2 ★ per marked wine order.', scoreES: '2 ★ por pedido de vino marcado.' },
];

export function getRealm(id) {
  return realms.find((r) => r.id === id);
}

export function getRealmScoreHint(realm, locale) {
  return locale === 'es' && realm.scoreES ? realm.scoreES : realm.scoreEN;
}
