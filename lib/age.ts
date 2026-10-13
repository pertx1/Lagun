export function ageFrom(birthDate: string, now = new Date()): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const birth = new Date(Date.UTC(y, mo - 1, d));
  if (Number.isNaN(birth.getTime()) || birth.getUTCMonth() !== mo - 1) return null;
  let age = now.getUTCFullYear() - y;
  const beforeBirthday = now.getUTCMonth() < mo - 1 || (now.getUTCMonth() === mo - 1 && now.getUTCDate() < d);
  if (beforeBirthday) age -= 1;
  return age;
}

/** Edad mínima para usar Lagun. */
export const MIN_AGE = 13;
/** Edad de consentimiento digital en España (LOPDGDD art. 7). Por debajo, hace falta el de madre/padre/tutor. */
export const DIGITAL_CONSENT_AGE = 14;
