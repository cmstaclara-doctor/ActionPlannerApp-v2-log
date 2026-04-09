"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const StudentEditorContent = dynamic(
  () => import("@/components/StudentEditorContent").then((m) => m.StudentEditorContent),
  { ssr: false }
);

export default function StudentEditorPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params?.studentId as string;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check killpill
    const cutoffDate = new Date("2026-06-21T23:59:59Z");
    if (new Date() > cutoffDate) {
      document.body.innerHTML =
        '<div style="display: flex; align-items: center; justify-content: center; height: 100vh; font-family: system-ui; background: #0f0f0f; color: #999;"><div style="text-align: center;"><h1 style="font-size: 2rem; margin: 0 0 1rem 0;">Program Ended</h1><p style="font-size: 1rem; margin: 0;">LEAP 99 concluded on June 21, 2026. Thank you for your participation.</p></div></div>';
    }
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card px-4 py-3 flex items-center gap-4">
        <Link href="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          ← Back to Coach Dashboard
        </Link>
        <span className="text-xs text-muted-foreground font-mono">{studentId}</span>
      </div>
      <StudentEditorContent studentId={studentId} />
    </div>
  );
}
