/**
 * Formate une date calendaire dans le fuseau app (défaut: Madagascar).
 * Madagascar n'a pas d'heure d'été → soustraction 24h fiable pour "hier".
 */
const TZ = () => process.env.APP_TZ || 'Indian/Antananarivo';

export function jourLocal(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ(),
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function hierLocal(date = new Date()) {
  return jourLocal(new Date(date.getTime() - 86_400_000));
}
