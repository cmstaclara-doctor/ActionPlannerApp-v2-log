"use client";

import { StudentGoalPage } from "@/components/StudentGoalPage";
import { useParams } from "next/navigation";
import { getStudents } from "@/lib/storage";

export default function StudentPage() {
  const params = useParams();
  const studentId = params.studentId as string;
  const students = getStudents();
  const student = students.find(s => s.id === studentId);

  return <StudentGoalPage studentId={studentId} studentName={student?.name || "Student"} />;
}
