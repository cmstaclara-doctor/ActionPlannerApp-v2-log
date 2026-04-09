"use client";

// Global reusable checkbox approval panel — every AI suggestion goes through this
export interface ApprovalField {
  key: string;
  label: string;
  oldValue?: string | null;
  newValue: string;
  approved: boolean;
}

interface CheckboxApprovalPanelProps {
  fields: ApprovalField[];
  onChange: (fields: ApprovalField[]) => void;
  onApply: (approvedFields: ApprovalField[]) => void;
  onReject: () => void;
  title?: string;
}

export function CheckboxApprovalPanel({
  fields,
  onChange,
  onApply,
  onReject,
  title = "AI Suggestions — Approve to apply",
}: CheckboxApprovalPanelProps) {
  const toggle = (key: string) => {
    onChange(fields.map((f) => (f.key === key ? { ...f, approved: !f.approved } : f)));
  };

  const approveAll = () => onChange(fields.map((f) => ({ ...f, approved: true })));
  const rejectAll = () => onChange(fields.map((f) => ({ ...f, approved: false })));
  const approvedFields = fields.filter((f) => f.approved);

  return (
    <div style={{
      background: "rgba(99,102,241,0.08)",
      border: "1px solid rgba(99,102,241,0.3)",
      borderRadius: 10,
      padding: 16,
      marginTop: 12,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#818cf8" }}>🤖 {title}</span>
        <span style={{
          fontSize: 10, background: "rgba(99,102,241,0.2)", color: "#a5b4fc",
          borderRadius: 4, padding: "2px 6px", fontFamily: "monospace",
        }}>
          {approvedFields.length}/{fields.length} approved
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
        {fields.map((f) => (
          <label key={f.key} style={{
            display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer",
            background: f.approved ? "rgba(99,102,241,0.12)" : "rgba(255,255,255,0.03)",
            border: `1px solid ${f.approved ? "rgba(99,102,241,0.4)" : "rgba(51,65,85,0.6)"}`,
            borderRadius: 8, padding: "10px 12px", transition: "all 0.15s",
          }}>
            <input
              type="checkbox"
              checked={f.approved}
              onChange={() => toggle(f.key)}
              style={{ marginTop: 2, accentColor: "#6366f1", width: 16, height: 16, flexShrink: 0 }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, color: "#64748b", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {f.label}
              </div>
              {f.oldValue && (
                <div style={{ fontSize: 12, color: "#64748b", textDecoration: "line-through", marginBottom: 3 }}>
                  {f.oldValue}
                </div>
              )}
              <div style={{ fontSize: 13, color: f.approved ? "#e2e8f0" : "#94a3b8" }}>
                {f.newValue}
              </div>
            </div>
          </label>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={() => onApply(approvedFields)}
          disabled={approvedFields.length === 0}
          style={{
            flex: 1, padding: "8px 0", borderRadius: 7, border: "none",
            background: approvedFields.length > 0 ? "#6366f1" : "#334155",
            color: approvedFields.length > 0 ? "#fff" : "#475569",
            fontSize: 13, fontWeight: 600, cursor: approvedFields.length > 0 ? "pointer" : "not-allowed",
          }}
        >
          Apply Selected ({approvedFields.length})
        </button>
        <button
          onClick={approveAll}
          style={{
            padding: "8px 12px", borderRadius: 7, border: "1px solid #334155",
            background: "transparent", color: "#94a3b8", fontSize: 12, cursor: "pointer",
          }}
        >
          All
        </button>
        <button
          onClick={onReject}
          style={{
            padding: "8px 12px", borderRadius: 7, border: "1px solid rgba(239,68,68,0.3)",
            background: "transparent", color: "#f87171", fontSize: 12, cursor: "pointer",
          }}
        >
          Reject
        </button>
      </div>
    </div>
  );
}
