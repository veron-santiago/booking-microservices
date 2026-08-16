const SPORT_TRANSLATIONS = {
  FOOTBALL: 'Fútbol',
  TENNIS: 'Tenis',
  BASKETBALL: 'Básquet',
  VOLLEYBALL: 'Vóley',
  HANDBALL: 'Handball',
  SWIMMING: 'Natación',
  PADDLE: 'Pádel',
}

function translateSport(sport) {
  if (!sport) return '-'
  const normalized = String(sport).trim().toUpperCase()
  return SPORT_TRANSLATIONS[normalized] || sport
}

export default translateSport
