"use client";

// Standalone stub — no auth, coach mode by default
export function useNavigation() {
  return {
    user: {
      userId: "standalone-coach",
      name: "Coach",
      role: "coach" as const,
      email: "",
    },
  };
}
