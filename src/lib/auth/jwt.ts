// Standalone stub — no auth, always returns coach context
export async function getAuthUser() {
  return { id: "standalone-coach", role: "coach" as const, name: "Coach", email: "" };
}

export function isHeadCoach(role: string): boolean {
  void role;
  return false;
}

export async function requireAuth() {
  return getAuthUser();
}
