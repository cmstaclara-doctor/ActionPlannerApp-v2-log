"use server";

// Standalone stub — no access restrictions
export async function canAccessStudent(
  _userId: string,
  _studentId: string,
  _role: string
): Promise<boolean> {
  return true;
}
