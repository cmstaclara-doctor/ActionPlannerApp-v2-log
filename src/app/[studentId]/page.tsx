import { ActionPlannerTab } from "@/components/dashboard/ActionPlannerTab";
import Link from "next/link";

interface Props {
  params: Promise<{ studentId: string }>;
}

export default async function PlannerPage({ params }: Props) {
  const { studentId } = await params;

  return (
    <main className="min-h-screen bg-background">
      <div className="border-b border-border bg-card px-4 py-3 flex items-center gap-4">
        <Link href="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          ← All Students
        </Link>
        <span className="text-xs text-muted-foreground font-mono">{studentId}</span>
      </div>
      <div className="p-4">
        <ActionPlannerTab studentId={studentId} />
      </div>
    </main>
  );
}
