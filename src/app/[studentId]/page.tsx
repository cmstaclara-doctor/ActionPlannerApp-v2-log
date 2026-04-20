"use client";

import { useState, useEffect } from "react";
import { StudentGoalPage } from "@/components/StudentGoalPage";
import { useParams } from "next/navigation";
import { getStudents } from "@/lib/storage";
import type { Student } from "@/lib/types";

export default function StudentPage() {
  const params = useParams();
  const studentId = params.studentId as string;
  const [student, setStudent] = useState<Student | null>(null);

  useEffect(() => {
    (async () => {
      const students = await getStudents();
      const found = students.find(s => s.id === studentId);
      setStudent(found || null);
    })();
  }, [studentId]);

  return <StudentGoalPage studentId={studentId} studentName={student?.name || "Student"} />;
}
