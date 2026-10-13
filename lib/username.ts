/** Reglas del nombre de usuario: 3-20 caracteres, minúsculas, números, punto y guion bajo. */
export const USERNAME_RE = /^[a-z0-9_.]{3,20}$/;

export function normalizeUsername(raw: string) {
  return raw.trim().toLowerCase();
}

export function isValidUsername(u: string) {
  return USERNAME_RE.test(u);
}

/**
 * Supabase Auth necesita un email internamente. Se genera uno técnico a partir
 * del usuario; nunca se muestra ni se usa para enviar correos (la confirmación
 * de email debe estar DESACTIVADA en Supabase).
 */
export function usernameToAuthEmail(username: string) {
  const domain = process.env.AUTH_EMAIL_DOMAIN || "usuarios.lagun.app";
  return `${username}@${domain}`;
}
