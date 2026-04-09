import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// --- Batches ---
export const batches = sqliteTable("batches", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  startDate: text("start_date"),
  endDate: text("end_date"),
  currentWeek: integer("current_week").notNull().default(8),
  totalWeeks: integer("total_weeks").notNull().default(12),
  // JSON arrays of date strings (YYYY-MM-DD)
  intensiveDates: text("intensive_dates"),  // e.g. ["2026-02-14","2026-04-10"]
  breakfastDates: text("breakfast_dates"),  // e.g. ["2026-02-07","2026-02-14",...]
  // JSON: { mon:"09:00", tue:"09:00", wed:"", thu:"09:00", fri:"", sat:"", sun:"" }
  callTimes: text("call_times"),
  // weekly meeting: day + time
  weeklyMeetingDay: text("weekly_meeting_day"),  // "monday"|"tuesday"|...
  weeklyMeetingTime: text("weekly_meeting_time"), // "HH:MM"
  // JSON: { "2": 10, "3": 20, ... } — custom weekly target % overrides
  weeklyTargets: text("weekly_targets"),
  // JSON: [{id, name, date}] — special program events (auto-adds to weekly attendance)
  events: text("events"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// --- Users ---
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name"),
  role: text("role", {
    enum: ["head_coach", "coach", "council_leader", "student", "facilitator", "developer"],
  })
    .notNull()
    .default("student"),
  councilId: text("council_id"),
  batchId: text("batch_id"),
  approvalStatus: text("approval_status", {
    enum: ["pending", "approved", "rejected"],
  })
    .notNull()
    .default("approved"),
  approvedBy: text("approved_by"),
  canViewAllCouncils: integer("can_view_all_councils").notNull().default(0),
  permissions: text("permissions"), // JSON: string[] — HC-module access flags e.g. ["canAccessManage","canSeeEavesdrop"]
  wheelOfLife: text("wheel_of_life"), // JSON: Record<AreaKey, number>
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// --- Councils ---
export const councils = sqliteTable("councils", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  theme: text("theme"),
  coachId: text("coach_id").notNull(),
  leaderId: text("leader_id"),
  batchId: text("batch_id").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export type Council = typeof councils.$inferSelect;
export type InsertCouncil = typeof councils.$inferInsert;

// --- Goals ---
export const goals = sqliteTable("goals", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  goalType: text("goal_type", {
    enum: ["enrollment", "personal", "professional"],
  }).notNull(),
  goalStatement: text("goal_statement").notNull(),
  specificDetails: text("specific_details"),
  measurableCriteria: text("measurable_criteria"),
  achievableResources: text("achievable_resources"),
  relevantAlignment: text("relevant_alignment"),
  startDate: text("start_date"),
  endDate: text("end_date"),
  excitingMotivation: text("exciting_motivation"),
  rewardingBenefits: text("rewarding_benefits"),
  valuesDeclaration: text("values_declaration"),
  status: text("status", {
    enum: ["draft", "in_progress", "completed", "archived"],
  })
    .notNull()
    .default("draft"),
  approvalStatus: text("approval_status", {
    enum: ["pending", "approved", "rejected"],
  })
    .notNull()
    .default("pending"),
  approvedBy: text("approved_by"),
  approvedAt: integer("approved_at", { mode: "timestamp" }),
  reviewNote: text("review_note"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export type Goal = typeof goals.$inferSelect;
export type InsertGoal = typeof goals.$inferInsert;

// --- Weekly Milestones ---
export const weeklyMilestones = sqliteTable("weekly_milestones", {
  id: text("id").primaryKey(),
  goalId: text("goal_id").notNull(),
  weekNumber: integer("week_number").notNull(),
  weekStartDate: text("week_start_date"),
  weekEndDate: text("week_end_date"),
  milestoneDescription: text("milestone_description"),
  actions: text("actions"), // JSON: [{text: string, done: boolean}]
  actionSchedule: text("action_schedule"), // JSON: {"0": {"scheduledDate": "2026-02-03", "pendingDate": "2026-02-04"}}
  results: text("results"), // JSON: [{text: string, done: boolean}]
  cumulativePercentage: integer("cumulative_percentage").notNull().default(0),
  supportNeeded: text("support_needed"),
  approvalStatus: text("approval_status", {
    enum: ["pending", "approved", "rejected"],
  })
    .notNull()
    .default("pending"),
  approvedBy: text("approved_by"),
  approvedAt: integer("approved_at", { mode: "timestamp" }),
  reviewNote: text("review_note"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export type WeeklyMilestone = typeof weeklyMilestones.$inferSelect;

// --- Action Plans ---
export const actionPlans = sqliteTable("action_plans", {
  id: text("id").primaryKey(),
  goalId: text("goal_id").notNull(),
  weekNumber: integer("week_number").notNull(),
  actionDescription: text("action_description").notNull(),
  supportNeeded: text("support_needed"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// --- Attendance ---
export const attendance = sqliteTable("attendance", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  weekNumber: integer("week_number").notNull(),
  meetingStatus: text("meeting_status", {
    enum: ["present", "late", "absent", "no_data"],
  }).default("no_data"),
  meetingMon: text("meeting_mon"),
  meetingTue: text("meeting_tue"),
  meetingWed: text("meeting_wed"),
  meetingThu: text("meeting_thu"),
  meetingFri: text("meeting_fri"),
  meetingSat: text("meeting_sat"),
  meetingSun: text("meeting_sun"),
  callMon: text("call_mon"),
  callTue: text("call_tue"),
  callWed: text("call_wed"),
  callThu: text("call_thu"),
  callFri: text("call_fri"),
  callSat: text("call_sat"),
  callSun: text("call_sun"),
  // JSON: {"eventId": "present"|"late"|"absent"|"no_data"} — per-event attendance
  eventAttendance: text("event_attendance"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// --- HC ↔ Coach Messages (head coach communicates with coach about council/students) ---
export const hcCoachMessages = sqliteTable("hc_coach_messages", {
  id: text("id").primaryKey(),
  coachId: text("coach_id").notNull(),   // the coach in the thread
  senderId: text("sender_id").notNull(),  // HC or coach userId
  senderName: text("sender_name"),
  senderRole: text("sender_role"),
  content: text("content").notNull(),
  readAt: integer("read_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export type HcCoachMessage = typeof hcCoachMessages.$inferSelect;

// --- Direct Messages (coach ↔ student private chat) ---
export const directMessages = sqliteTable("direct_messages", {
  id: text("id").primaryKey(),
  studentId: text("student_id").notNull(),   // always the student in the thread
  senderId: text("sender_id").notNull(),      // coach or student userId
  senderName: text("sender_name"),
  senderRole: text("sender_role"),
  content: text("content").notNull(),
  readAt: integer("read_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export type DirectMessage = typeof directMessages.$inferSelect;

// --- Chat Messages ---
export const chatMessages = sqliteTable("chat_messages", {
  id: text("id").primaryKey(),
  senderId: text("sender_id").notNull(),
  recipientId: text("recipient_id").notNull(),
  message: text("message").notNull(),
  type: text("type", { enum: ["coach", "ai"] }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// --- Notifications ---
export const notifications = sqliteTable("notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type", {
    enum: [
      "milestone_reminder",
      "weekly_checkin",
      "goal_completion",
      "council",
      "batch",
      "low_progress",
    ],
  }).notNull(),
  read: integer("read").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// --- Buddies ---
export const buddies = sqliteTable("buddies", {
  id: text("id").primaryKey(),
  studentId: text("student_id").notNull(),
  buddyId: text("buddy_id").notNull(),
  councilId: text("council_id").notNull(),
});

// --- AI Analyses ---
export const aiAnalyses = sqliteTable("ai_analyses", {
  id: text("id").primaryKey(),
  analyzedBy: text("analyzed_by").notNull(),
  summary: text("summary").notNull(),
  issuesFound: integer("issues_found").notNull().default(0),
  issuesResolved: integer("issues_resolved").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export type AiAnalysis = typeof aiAnalyses.$inferSelect;

// --- AI Analysis Issues ---
export const aiAnalysisIssues = sqliteTable("ai_analysis_issues", {
  id: text("id").primaryKey(),
  analysisId: text("analysis_id").notNull(),
  category: text("category", {
    enum: [
      "low_progress",
      "alignment_gap",
      "attendance_concern",
      "missing_data",
      "coach_attention",
      "stalled_momentum",
      "target_performance",
    ],
  }).notNull(),
  severity: text("severity", {
    enum: ["critical", "warning", "info"],
  }).notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  resolutions: text("resolutions"), // JSON array of string
  entityType: text("entity_type", {
    enum: ["student", "coach", "council"],
  }).notNull(),
  entityId: text("entity_id").notNull(),
  entityName: text("entity_name").notNull(),
  councilId: text("council_id"),
  status: text("status", {
    enum: ["open", "in_progress", "resolved", "dismissed"],
  })
    .notNull()
    .default("open"),
  resolvedBy: text("resolved_by"),
  resolvedAt: integer("resolved_at", { mode: "timestamp" }),
  resolvedNote: text("resolved_note"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export type AiAnalysisIssue = typeof aiAnalysisIssues.$inferSelect;

// --- Data Uploads ---
export const dataUploads = sqliteTable("data_uploads", {
  id: text("id").primaryKey(),
  uploadedBy: text("uploaded_by").notNull(),
  filename: text("filename").notNull(),
  fileSize: integer("file_size").notNull(),
  status: text("status", {
    enum: ["processing", "pending_review", "applied", "partially_applied", "rejected", "error"],
  })
    .notNull()
    .default("processing"),
  totalChanges: integer("total_changes").notNull().default(0),
  appliedChanges: integer("applied_changes").notNull().default(0),
  rejectedChanges: integer("rejected_changes").notNull().default(0),
  errorMessage: text("error_message"),
  summary: text("summary"),
  appliedAt: integer("applied_at", { mode: "timestamp" }),
  appliedBy: text("applied_by"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export type DataUpload = typeof dataUploads.$inferSelect;

// --- Data Upload Changes ---
export const dataUploadChanges = sqliteTable("data_upload_changes", {
  id: text("id").primaryKey(),
  uploadId: text("upload_id").notNull(),
  studentName: text("student_name").notNull(),
  studentId: text("student_id"),
  weekNumber: integer("week_number"),
  goalType: text("goal_type", {
    enum: ["enrollment", "personal", "professional"],
  }),
  entityType: text("entity_type", {
    enum: ["action_item", "milestone_desc", "goal_statement", "declaration", "cumulative_pct"],
  }).notNull(),
  entityId: text("entity_id"),
  field: text("field").notNull(),
  oldValue: text("old_value"),
  newValue: text("new_value").notNull(),
  changeType: text("change_type", {
    enum: ["added", "modified", "removed"],
  }).notNull(),
  status: text("status", {
    enum: ["pending", "applied", "rejected", "skipped_conflict"],
  })
    .notNull()
    .default("pending"),
  appliedAt: integer("applied_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export type DataUploadChange = typeof dataUploadChanges.$inferSelect;

// --- Declarations ---
export const declarations = sqliteTable("declarations", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  text: text("text").notNull(),
  approvalStatus: text("approval_status", {
    enum: ["pending", "approved", "rejected"],
  })
    .notNull()
    .default("pending"),
  approvedBy: text("approved_by"),
  approvedAt: integer("approved_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// --- Coach Sessions ---
export const coachSessions = sqliteTable("coach_sessions", {
  id: text("id").primaryKey(),
  coachId: text("coach_id").notNull(),
  studentId: text("student_id"), // NULL = general knowledge entry
  weekNumber: integer("week_number").notNull(),
  sessionType: text("session_type").notNull(), // 'call'|'meeting'|'thought'|'group'
  destination: text("destination").notNull().default("student"), // 'student'|'general'
  transcript: text("transcript"),
  aiSummary: text("ai_summary"), // JSON
  status: text("status").notNull().default("draft"), // 'draft'|'published'
  hcFlag: text("hc_flag"), // null | 'needs_attention' | 'at_risk' | 'great_progress' | 'routine'
  hcOneLiner: text("hc_one_liner"), // AI-generated one-sentence summary for HC
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export type CoachSession = typeof coachSessions.$inferSelect;

// --- Coach Documents ---
export const coachDocuments = sqliteTable("coach_documents", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  studentId: text("student_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  readAt: integer("read_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export type CoachDocument = typeof coachDocuments.$inferSelect;

// ─────────────────────────────────────────────────────────────────────────────
// JOURNEY JOURNAL SYSTEM (JJ)
// ─────────────────────────────────────────────────────────────────────────────

// --- Transcripts (Talk Time backbone) ---
export const transcripts = sqliteTable("transcripts", {
  id: text("id").primaryKey(),
  journeyEntryId: text("journey_entry_id"),           // linked after entry saved
  sourceType: text("source_type", {
    enum: ["oo", "mm", "cc", "pp", "ai_chat"],
  }).notNull(),
  rawText: text("raw_text").notNull(),
  processedText: text("processed_text"),              // Haiku-parsed structured JSON
  studentId: text("student_id").notNull(),
  coachId: text("coach_id").notNull(),
  durationSecs: integer("duration_secs"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export type Transcript = typeof transcripts.$inferSelect;
export type InsertTranscript = typeof transcripts.$inferInsert;

// --- Journey Entries (JJ mother table — all 5 entry types) ---
export const journeyEntries = sqliteTable("journey_entries", {
  id: text("id").primaryKey(),
  studentId: text("student_id").notNull(),
  coachId: text("coach_id").notNull(),
  // OO | MM | CC | PP | AA
  entryType: text("entry_type", {
    enum: ["oo", "mm", "cc", "pp", "aa"],
  }).notNull(),
  entryDate: text("entry_date").notNull(),            // YYYY-MM-DD
  weekNumber: integer("week_number"),
  transcriptId: text("transcript_id"),               // linked transcript

  // ── OO (One & Only — 1on1) fields ──
  win: text("win"),
  committed: text("committed"),
  agenda: text("agenda"),
  homework: text("homework"),

  // ── MM (Meeting Master) fields ──
  meetingType: text("meeting_type"),                 // coaches|council|client|facilitator
  meetingAgendaJson: text("meeting_agenda_json"),    // JSON string[]
  attendeesJson: text("attendees_json"),             // JSON [{name, timeIn, timeOut}]
  resolutions: text("resolutions"),
  meetingMinutes: text("meeting_minutes"),

  // ── CC (Call Center) fields ──
  callerName: text("caller_name"),
  calleeName: text("callee_name"),
  callStartTime: text("call_start_time"),            // HH:MM
  callEndTime: text("call_end_time"),                // HH:MM
  callDurationMins: integer("call_duration_mins"),   // auto-calculated
  callOutcome: text("call_outcome"),

  // ── PP (Performance Points) fields ──
  eventName: text("event_name"),
  moduleTopic: text("module_topic"),
  ppNotes: text("pp_notes"),
  ppScoreNum: integer("pp_score_num"),
  ppScoreDen: integer("pp_score_den"),
  votesJson: text("votes_json"),                     // JSON [{typeId, label, value}]
  choicesJson: text("choices_json"),                 // JSON [{typeId, label, enrolled}]
  coachObservations: text("coach_observations"),

  // ── AA (AI Aider) fields ──
  // AA entries are auto-generated — content stored in meetingMinutes as session summary JSON

  // ── Approval ──
  approvalStatus: text("approval_status", {
    enum: ["draft", "approved"],
  }).notNull().default("draft"),
  approvedFields: text("approved_fields"),           // JSON string[] of coach-approved fields

  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export type JourneyEntry = typeof journeyEntries.$inferSelect;
export type InsertJourneyEntry = typeof journeyEntries.$inferInsert;

// --- PP Config (configurable vote/activity types per batch) ---
export const ppConfig = sqliteTable("pp_config", {
  id: text("id").primaryKey(),
  batchId: text("batch_id").notNull(),
  // JSON: [{id: string, label: string}]
  voteTypesJson: text("vote_types_json").notNull().default(
    '[{"id":"pass","label":"Pass Votes"},{"id":"leader","label":"Leader Votes"}]'
  ),
  // JSON: [{id: string, label: string}]
  activityTypesJson: text("activity_types_json").notNull().default(
    '[{"id":"sing_or_sit","label":"Sing or Sit"}]'
  ),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export type PpConfig = typeof ppConfig.$inferSelect;
export type InsertPpConfig = typeof ppConfig.$inferInsert;

// --- Calendar Events (goal-linked, future-editable) ---
export const calendarEvents = sqliteTable("calendar_events", {
  id: text("id").primaryKey(),
  studentId: text("student_id").notNull(),
  title: text("title").notNull(),
  eventDate: text("event_date").notNull(),           // YYYY-MM-DD
  eventType: text("event_type", {
    enum: ["milestone", "action_step", "jj_entry", "reminder"],
  }).notNull(),
  linkedId: text("linked_id"),                       // id of milestone/actionPlan/journeyEntry
  goalType: text("goal_type", {
    enum: ["enrollment", "personal", "professional"],
  }),
  reminderSent: integer("reminder_sent").notNull().default(0),
  reminderType: text("reminder_type", {
    enum: ["daily", "weekly"],
  }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type InsertCalendarEvent = typeof calendarEvents.$inferInsert;

// --- Action Step Versions (unlimited upgrades, future-only) ---
export const actionStepVersions = sqliteTable("action_step_versions", {
  id: text("id").primaryKey(),
  goalId: text("goal_id").notNull(),
  weekNumber: integer("week_number").notNull(),      // which week this version covers start
  versionNum: integer("version_num").notNull(),      // 1 = original, 2+ = upgrades
  stepsJson: text("steps_json").notNull(),           // JSON [{text, done, weekNum}]
  upgradeReason: text("upgrade_reason"),
  misalignmentSummary: text("misalignment_summary"),// Haiku-generated gap analysis
  suggestionsJson: text("suggestions_json"),         // JSON [{old, new, approved}]
  approvedByCoach: integer("approved_by_coach").notNull().default(0),
  approvedAt: integer("approved_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export type ActionStepVersion = typeof actionStepVersions.$inferSelect;
export type InsertActionStepVersion = typeof actionStepVersions.$inferInsert;

// ─────────────────────────────────────────────────────────────────────────────
// SECURITY — Login Audit Log + Active Sessions
// ─────────────────────────────────────────────────────────────────────────────

// --- Login Audits — every login attempt (success, failed, blocked) ---
export const loginAudits = sqliteTable("login_audits", {
  id: text("id").primaryKey(),
  userId: text("user_id"),          // null when email not found in DB
  email: text("email").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  deviceType: text("device_type"),  // "mobile" | "tablet" | "desktop"
  browser: text("browser"),
  os: text("os"),
  status: text("status", {
    enum: ["success", "failed", "blocked"],
  }).notNull(),
  failReason: text("fail_reason"),  // null on success
  sessionId: text("session_id"),    // links to activeSessions on success
  isSuspicious: integer("is_suspicious").notNull().default(0), // 1 = flagged
  suspicionReason: text("suspicion_reason"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export type LoginAudit = typeof loginAudits.$inferSelect;

// --- Active Sessions — one row per live session ---
export const activeSessions = sqliteTable("active_sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  deviceType: text("device_type"),
  browser: text("browser"),
  os: text("os"),
  lastSeenAt: integer("last_seen_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
});

export type ActiveSession = typeof activeSessions.$inferSelect;
