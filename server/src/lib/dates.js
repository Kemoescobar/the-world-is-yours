const TZ_DEFAUT = 'Indian/Antananarivo';

export function fuseau() {
  return process.env.TZ || TZ_DEFAUT;
}

/** Jour civil dans le fuseau configuré (défaut: Madagascar). */
export function jourLocal(date = new Date()) {
  const tz = fuseau();
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

/** Heure HH:MM dans le fuseau configuré. */
export function heureLocal(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: fuseau(),
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const h = parts.find((p) => p.type === 'hour')?.value ?? '00';
  const m = parts.find((p) => p.type === 'minute')?.value ?? '00';
  return `${h}:${m}`;
}

/** Heure entière 0–23 dans le fuseau configuré. */
export function heureEntiereLocal(date = new Date()) {
  const h = new Intl.DateTimeFormat('en-GB', {
    timeZone: fuseau(),
    hour: 'numeric',
    hour12: false,
  }).format(date);
  return Number.parseInt(h, 10) || 0;
}
