const KEY = "fleet-track-auth";

export type AuthSession = { email: string };

function parse(raw: string | null): AuthSession | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as AuthSession;
    if (typeof data.email === "string" && data.email.trim()) return { email: data.email.trim() };
  } catch {
    return null;
  }
  return null;
}

export function readAuthSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  return parse(localStorage.getItem(KEY)) ?? parse(sessionStorage.getItem(KEY));
}

export function writeAuthSession(email: string, remember: boolean) {
  const payload = JSON.stringify({ email: email.trim() });
  localStorage.removeItem(KEY);
  sessionStorage.removeItem(KEY);
  if (remember) localStorage.setItem(KEY, payload);
  else sessionStorage.setItem(KEY, payload);
}

export function clearAuthSession() {
  localStorage.removeItem(KEY);
  sessionStorage.removeItem(KEY);
}
