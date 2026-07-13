/** Jour civil dans le fuseau configuré (défaut: Madagascar). */
export function jourLocal(date = new Date()) {
  const tz = process.env.TZ || 'Indian/Antananarivo';
  // en-CA → YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function hierLocal(date = new Date()) {
  const d = new Date(date.getTime() - 86400000);
  return jourLocal(d);
}
