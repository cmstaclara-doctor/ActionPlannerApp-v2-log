// ─── Goal Templates for LEAP 99 ──────────────────────────────────────────────
// Standard endDate for all templates: 2026-06-19 (Friday before Graduation Jun 21)
// Weekly target % defaults follow the LEAP 99 schedule progression

export interface TemplateQuestion {
  id: string;
  label: string;
  placeholder?: string;
  type: "number" | "text" | "select" | "multiselect" | "schedule";
  options?: string[];
  unit?: string;
  defaultValue?: string;
  hint?: string;
  /** Only show this question when:
   *  - value present: answers[id] includes value
   *  - notEmpty: true: answers[id] is non-empty (any value filled in) */
  dependsOn?: { id: string; value?: string; notEmpty?: boolean };
}

export interface TemplateWeek {
  weekNumber: number;
  description: string;
  actions: Array<{ text: string; days: number[] }>;
  results: Array<{ text: string }>;
  cumulativePercentage: number;
}

export interface GoalTemplate {
  id: string;
  goalType: "enrollment" | "personal" | "professional";
  subType: string;
  name: string;
  description: string;
  wheelAreaHint?: string;
  safetyNote?: string;
  /** If present, wizard shows a soft peso warning when answers[pesoCaution.field] < pesoCaution.min */
  pesoCaution?: { field: string; min: number };
  questions: TemplateQuestion[];
  smarter: (a: Record<string, string>) => {
    goalStatement?: string;      // optional full sentence — overrides assembled preview
    specificDetails: string;
    measurableCriteria: string;
    achievableResources: string;
    relevantAlignment: string;
    endDate: string;
    excitingMotivation: string;
    rewardingBenefits: string;
  };
  milestones: (a: Record<string, string>) => TemplateWeek[];
  /** Cross-field risk check — flags when inputs are mismatched with the goal target */
  answerRisks?: (a: Record<string, string>) => Array<{ field?: string; message: string }>;
}

// ── Week-target defaults (LEAP 99 official schedule) ──────────────────────────
// W1:0–25 | W2:25–37.5 | W3:37.5–50 | W4:50–62.5 | W5:62.5–75 | W6:75–87.5 | W7:87.5–100 | W8:100
const WK_PCT = [25, 37.5, 50, 62.5, 75, 87.5, 100, 100];

// ── Enrollment-specific percentages (keyed off FLEX/ALC weekends) ──────────────
// FLEX 1 (May 9–10) = 25% | FLEX 2 (May 16–17) = 50% | ALC 1 (Jun 5–7) = 75% | ALC 2 (Jun 12–14) = 100%
const ENROLL_PCT = [25, 37.5, 50, 57.5, 65, 75, 100, 100];

// ── Day-shorthand ─────────────────────────────────────────────────────────────
const MON_FRI = [0, 1, 2, 3, 4];
const DAILY   = [0, 1, 2, 3, 4, 5, 6];
const SUN     = [6];
const MON     = [0];
const SAT     = [5];

// ── Dynamic day parser ────────────────────────────────────────────────────────
function parseDays(commitDays?: string): number[] {
  if (!commitDays) return MON_FRI;
  const dayMap: Record<string, number> = { Mon:0, Tue:1, Wed:2, Thu:3, Fri:4, Sat:5, Sun:6 };
  const parsed = commitDays.split(",").map(d => dayMap[d.trim()]).filter((n): n is number => n !== undefined);
  return parsed.length > 0 ? parsed : MON_FRI;
}

// Estimated conversations per day based on hours committed (~3 convos/hour)
function convosPerDay(hoursPerDay?: string): number {
  const h = parseFloat(hoursPerDay || "1");
  return Math.max(3, Math.round(h * 3));
}

// ── Schedule helpers ("Mon:1,Tue:2,Fri:3" format) ────────────────────────────
function parseSchedule(schedule?: string, def = "Mon:1,Tue:1,Wed:1,Thu:1,Fri:1"): {day:string,hours:number}[] {
  const src = (schedule && schedule.trim()) || def;
  return src.split(",").filter(Boolean).map(e => {
    const [day, h] = e.split(":");
    return { day: day.trim(), hours: parseFloat(h) || 0 };
  }).filter(e => e.hours > 0);
}
function scheduleCommitDays(schedule?: string, def?: string): number[] {
  const idx: Record<string,number> = {Mon:0,Tue:1,Wed:2,Thu:3,Fri:4,Sat:5,Sun:6};
  return parseSchedule(schedule, def).map(e => idx[e.day]).filter((n): n is number => n !== undefined);
}
function scheduleWeeklyHours(schedule?: string, def?: string): number {
  return parseSchedule(schedule, def).reduce((s,e) => s + e.hours, 0);
}

// ─────────────────────────────────────────────────────────────────────────────
// ENROLLMENT — Standard (1 FLEX + 1 ALC)
// ─────────────────────────────────────────────────────────────────────────────
const enrollmentStandard: GoalTemplate = {
  id: "enrollment-flex-alc",
  goalType: "enrollment",
  subType: "enrollment",
  name: "Enroll 1 FLEX + 1 ALC Client",
  description: "Standard enrollment goal: 1 FLEX student (May sessions) + 1 ALC student (June sessions) through consistent reaching out at least 3x a week.",
  questions: [
    { id: "flexTarget",            label: "FLEX students to enroll",                  type: "number",      placeholder: "1",           defaultValue: "1" },
    { id: "alcTarget",             label: "ALC students to enroll",                  type: "number",      placeholder: "1",           defaultValue: "1" },
    { id: "warmNetworkSize",       label: "How many people do you know personally?",      type: "number",      placeholder: "50",          defaultValue: "50",
      hint: "Friends, family, colleagues — people who might join or refer someone." },
    { id: "schedule",              label: "Your weekly commitment schedule",          type: "schedule",    defaultValue: "Mon:1,Tue:1,Wed:1,Thu:1,Fri:1",
      hint: "Set hours per day — tap — to skip a day. 1 hr ≈ 3 conversations." },
    { id: "outreachTimeBlock",     label: "When is your dedicated work block?",      type: "multiselect", options: ["morning","midday","evening"], defaultValue: "morning",
      hint: "Pick all that apply — lock these blocks so your goal work is never squeezed out by the day." },
    { id: "channel",               label: "How will you mainly invite people?",                type: "multiselect", options: ["referrals","social media","calls","combination","other"], defaultValue: "referrals" },
    { id: "biggestObstacle",       label: "Biggest obstacle to enrolling",           type: "multiselect", options: ["fear of rejection","finding time","don't know what to say","don't know enough people","following up consistently","other"], defaultValue: "fear of rejection",
      hint: "Name it so your action plan tackles it head-on." },
    { id: "accountabilityPartner", label: "Accountability partner name (optional)",  type: "text",        placeholder: "e.g., Coach Ana",
      hint: "This person checks in with you on your commit days." },
    { id: "essence",               label: "3 essence qualities to embody (pick 3)",   type: "multiselect",
      options: ["loving","courageous","committed","trusting","vulnerable","responsible","worthy","grateful","passionate","joyful","authentic","caring","compassionate","powerful","present","other"], defaultValue: "loving,committed,courageous",
      hint: "LEAP coaches always embody exactly 3 qualities. These 3 become the soul of every conversation." },
    { id: "proofMain", label: "Primary proof — what will you present at Graduation? (choose 1)", type: "select",
      options: ["Photo with your student at Graduation Jun 21 — the ultimate receipt","Photo with student at FLEX (May) + photo at ALC (June) — both captured","Enrollment confirmation screenshots showing both FLEX and ALC","Video testimony from student after completing both FLEX and ALC","Chat proof: student confirms attendance at both FLEX and ALC","Photo journey: first meeting → FLEX door → ALC door → Graduation","Other"],
      defaultValue: "Photo with your student at Graduation Jun 21 — the ultimate receipt",
      hint: "This must prove BOTH FLEX (May) and ALC (June) — your student at Graduation IS the most powerful single receipt." },
    { id: "proofSupport", label: "Supporting evidence (optional — pick 1–2 more)", type: "multiselect",
      options: ["Conversation screenshot from enrollment decision moment","Social media post or story announcing your student's enrollment","WhatsApp/Messenger screenshot showing student in FLEX or ALC group","Video message from your enrolled student (sent to you)","Outreach contact log screenshot showing conversations leading to enrollment","Photo collage: pre-enrollment meeting → enrollment confirmation","other"],
      hint: "Up to 2 extras that support your main proof — powerful but not required." },
  ],
  smarter: (a) => {
    const total = parseInt(a.flexTarget || "1") + parseInt(a.alcTarget || "1");
    const sched = parseSchedule(a.schedule);
    const daysLabel = sched.length > 0 ? sched.map(e => e.day).join("·") : "Mon–Fri";
    const dayCount = sched.length || 5;
    const daysNatural = dayCount >= 7 ? "every day" : dayCount >= 5 ? "weekdays" : `${dayCount} days a week`;
    const weeklyHrs = scheduleWeeklyHours(a.schedule);
    const hrs = dayCount > 0 ? (weeklyHrs / dayCount).toFixed(1) : "1";
    const network = a.warmNetworkSize || "50";
    const block = a.outreachTimeBlock || "morning";
    const ch = a.channel || "referrals";
    const essArr = (a.essence || "loving,committed,courageous").split(",").map(s => s.trim()).filter(Boolean);
    const essLabel = essArr.length >= 2
      ? essArr.slice(0,-1).join(", ") + ", and " + essArr[essArr.length-1]
      : essArr[0] || "loving";
    const fx = parseInt(a.flexTarget || "1");
    const al = parseInt(a.alcTarget || "1");
    return {
      goalStatement: `Throughout 8 weeks, I reach out through ${ch} at least ${dayCount} times a week and enroll ${fx} FLEX student${fx > 1 ? "s" : ""} + ${al} ALC student${al > 1 ? "s" : ""} into the programme, and prove it with ${a.proofMain || "documented evidence"}, by June 19, 2026.`,
      specificDetails:     `${fx} FLEX + ${al} ALC · ${ch} · ${daysLabel} · ${weeklyHrs}h/week`,
      measurableCriteria:  `${fx} FLEX Wk4 · ${al} ALC Wk5 · daily convo log`,
      achievableResources: `${network}-person contact list · ${block} block · pitch scripts Wk1`,
      relevantAlignment:   `First enrollment system · ${total} paying clients · comfort zone edge`,
      endDate:             "June 19, 2026",
      excitingMotivation:  `${essLabel} presence · enrollment goal achieved · testimony at Graduation Jun 21`,
      rewardingBenefits:   `${total} people transformed · proof of your enrollment commitment · relationships built`,
    };
  },
  answerRisks: (a) => {
    const risks: Array<{ field?: string; message: string }> = [];
    const n = parseInt(a.warmNetworkSize || "50");
    const fx = parseInt(a.flexTarget || "1");
    const al = parseInt(a.alcTarget || "1");
    const total = fx + al;
    // Contact list size vs enrollment target
    if (n > 0 && n < 20) {
      risks.push({ field: "warmNetworkSize", message: `${n} people is almost certainly not enough for ${total} enrollment${total > 1 ? "s" : ""}. At 15–20% conversation-to-YES rate you need 30+ real conversations. Build your list to at least 50+ before locking in.` });
    } else if (n > 0 && n < 40) {
      risks.push({ field: "warmNetworkSize", message: `${n} contacts is a tight list for ${total} enrollment${total > 1 ? "s" : ""}. 50+ contacts gives you enough backup options when people say no. Can you add more names?` });
    }
    // Schedule check
    const sched2 = parseSchedule(a.schedule);
    const days = sched2.length;
    const weeklyHrs2 = scheduleWeeklyHours(a.schedule);
    if (weeklyHrs2 < 3.5) {
      risks.push({ field: "schedule", message: `Less than 3.5 hrs/week is very risky for enrollment. Conversations, follow-ups, and prep need at least 5 hrs/week to maintain real momentum.` });
    }
    // Outreach frequency vs enrollment target
    const totalTouches = Math.round(weeklyHrs2 * 3) * 7; // total conversations over 7 active weeks
    const neededTouches = total * 30; // ~30 conversations per enrollment (15–20% conversion)
    if (totalTouches < neededTouches) {
      risks.push({ message: `At ~${weeklyHrs2}h/week × 3 convos/hr × 7 weeks = ~${totalTouches} total conversations. Enrolling ${total} student${total>1?"s":""} needs ${neededTouches}+ conversations (15–20% conversion). Add more hours to your schedule, or reduce target to ${Math.max(1,Math.floor(totalTouches/30))} student${Math.floor(totalTouches/30)>1?"s":""}.` });
    }
    // Commitment days
    if (days < 3) {
      risks.push({ field: "schedule", message: `Only ${days} day${days !== 1 ? "s" : ""}/week is risky for an enrollment goal. You need consistent daily contact to build momentum — aim for at least 5 days/week.` });
    }
    // Proof alignment check
    if (a.proofMain) {
      const validProofKw = ["graduation","photo","flex","alc","both","enrollment","screenshot","confirmation","video","testimony","chat","journey"];
      if (!validProofKw.some((kw: string) => a.proofMain.toLowerCase().includes(kw.toLowerCase()))) {
        risks.push({ field: "proofMain", message: `Your goal declares enrolling 1 student in FLEX + ALC. The most direct proof is a photo with your student at Graduation Jun 21 (they attended both = enrolled both). "${a.proofMain}" may not cover both programs — review with your coach.` });
      }
    }
    return risks;
  },
  milestones: (a) => {
    const commitDays = scheduleCommitDays(a.schedule);
    const avgHrsDay = scheduleWeeklyHours(a.schedule) / Math.max(1, commitDays.length);
    const cpd = Math.max(3, Math.round(avgHrsDay * 3));
    const essArr = (a.essence || "loving,committed,courageous").split(",").map(s => s.trim()).filter(Boolean);
    const essLabel = essArr.length >= 2
      ? essArr.slice(0,-1).join(", ") + ", and " + essArr[essArr.length-1]
      : essArr[0] || "authentic";
    const ch = a.channel || "referrals";
    const network = a.warmNetworkSize || "50";
    const block = a.outreachTimeBlock || "morning";
    const partner = a.accountabilityPartner
      ? `Check in with ${a.accountabilityPartner} —`
      : "Check in with your accountability partner —";
    const obstacle = a.biggestObstacle || "fear of rejection";
    return [
      {
        weekNumber: 1, cumulativePercentage: ENROLL_PCT[0],
        description: `Build your system AND start the game: ${network}-person contact list · FLEX + ALC invitation scripts · ${block} block locked · first 5 conversations OPEN before week ends | Schedule: FLEX 298 May 9–10 · FLEX 299 May 16–17 · ALC 256 Jun 5–7 · ALC 257 Jun 12–14 · Graduation Jun 21`,
        actions: [
          { text: `Build your contact list: ${network}+ people — name, contact, relationship, FLEX or ALC fit`, days: commitDays },
          { text: `Draft ${ch} invitation script — FLEX pitch (May sessions) + ALC pitch (June sessions)`, days: [1, 2] },
          { text: `Lock ${block} calling block in calendar — phone alarm, non-negotiable`, days: [0] },
          { text: `Obstacle plan: "${obstacle}" — write 3 specific moves to push through it`, days: [2] },
          { text: `Open 5 conversations from your contact list before this week ends — the game starts NOW`, days: [3, 4] },
          { text: `${partner} share your contact list + invitation script; agree on weekly check-in day`, days: [4] },
          { text: `Weekly review: how many conversations started? Who is your #1 FLEX prospect right now?`, days: [6] },
        ],
        results: [
          { text: `${network}-person contact list READY — game on!` },
          { text: `FLEX + ALC invitation scripts ready` },
          { text: `5+ conversations OPEN — you are already in the game` },
        ],
      },
      {
        weekNumber: 2, cumulativePercentage: ENROLL_PCT[1],
        description: `PRIMARY FLEX close — goal: 1 person enrolled BEFORE May 9 → they attend FLEX 298 this weekend. Conversations Mon–Thu, close the gap — if enrolled, they are at FLEX 298 this weekend!`,
        actions: [
          { text: `${block} block: ${cpd}+ ${ch} messages/calls daily — your contact list first, then referrals`, days: commitDays },
          { text: `Conduct 5 one-on-one calls Mon–Thu — paint the FLEX 298 picture; after each, note one moment you showed up as ${essLabel}`, days: [0, 1, 2, 3] },
          { text: `Send 2+ FLEX invitations — use "FLEX 298 starts May 9" to help them decide now`, days: [1, 2] },
          { text: `Follow up EVERY open conversation — get a YES, NO, or clear next step before Friday`, days: [2, 3, 4] },
          { text: `FLEX 298 Sat May 9 Abenson HQ Muñoz — if your person enrolled, welcome them at the venue; witness the transformation`, days: [5] },
          { text: `FLEX 298 Closing Sun May 10 — invite the people you’re still talking to; let them witness the transformation; open new conversations after`, days: [6] },
        ],
        results: [
          { text: `5+ one-on-one calls done` },
          { text: `2+ FLEX invitations sent` },
          { text: `PRIMARY FLEX close attempted — YES or clear next step from everyone` },
          { text: `At the door FLEX 298 May 9 — you showed up!` },
        ],
      },
      {
        weekNumber: 3, cumulativePercentage: ENROLL_PCT[2],
        description: `BACKUP FLEX if still open — MUST close before May 16 → FLEX 299. FLEX done? Ask: is your FLEX person also joining ALC? Start ALC conversations NOW.`,
        actions: [
          { text: `Follow up ALL Wk 2 conversations — no one left without a YES or NO`, days: [0, 1, 2] },
          { text: `If not enrolled yet: one-on-one calls Mon–Tue — close FLEX before Saturday!`, days: [0, 1] },
          { text: `If FLEX enrolled: ask them NOW — “Are you also joining ALC (Jun 5–7)?” — same person = same momentum`, days: [0, 1, 2] },
          { text: `Whether same person or new: open 10+ ALC conversations this week`, days: [2, 3, 4] },
          { text: `FLEX 299 Sat May 16 SMX Aura — if your person enrolled, welcome them at the venue; bring others you're still inviting`, days: [5] },
          { text: `FLEX 299 Closing + 1st Workshop Sun May 17 — share your FLEX result; use the room energy to open ALC conversations`, days: [6] },
        ],
        results: [
          { text: `1 FLEX student ENROLLED — primary May 9 OR backup May 16. Either way: YOU WIN!` },
          { text: `ALC path decided: same person continuing, or 10+ new conversations open` },
          { text: `At door FLEX 299 May 16 · 1st Workshop attended` },
        ],
      },
      {
        weekNumber: 4, cumulativePercentage: ENROLL_PCT[3],
        description: `FLEX DONE ✓ — full ALC push: 30+ conversations · 3+ one-on-one calls. 2nd Intensive May 23–24 UP BGC — show up with momentum!`,
        actions: [
          { text: `100% ALC focus this week — ${block} block every day`, days: commitDays },
          { text: `ALC: 30+ conversations · 3+ one-on-one calls — paint the ALC 256 picture (Jun 5–7 SMX Aura)`, days: commitDays },
          { text: `Check in with your FLEX student — document their first wins; this is your testimony in the making`, days: [2] },
          { text: `${partner} FLEX close confirmed + ALC invitation count`, days: [3] },
          { text: `2nd Intensive Sat May 23 UP BGC — welcome your enrolled student at the venue; share FLEX win with coach`, days: [5] },
          { text: `2nd Intensive Sun May 24 — absorb the energy; set your ALC close intention: “I close before Jun 5”`, days: [6] },
        ],
        results: [
          { text: `FLEX DONE ✓ — your first student is in the programme` },
          { text: `ALC: 30+ conversations · 3+ one-on-one calls active` },
          { text: `2nd Intensive May 23–24 attended — ALC intention set` },
        ],
      },
      {
        weekNumber: 5, cumulativePercentage: ENROLL_PCT[4],
        description: `ALC close push — target: 1 enrolled BEFORE Jun 5 → they attend ALC 256 (Jun 5–7). You have one week to make it happen!`,
        actions: [
          { text: `3+ ALC one-on-one calls this week — use "ALC 256 starts Jun 5" to help them decide now`, days: commitDays },
          { text: `Send 2+ ALC invitations; follow up every open conversation daily`, days: commitDays },
          { text: `FLEX student check-in — gather early wins; these are becoming your graduation testimony`, days: [2] },
          { text: `${partner} share: ALC invitation count + FLEX student early win`, days: [3] },
          { text: `Rate your ${essLabel} presence in each conversation (1–10); note what shifted`, days: commitDays },
          { text: `Weekly review Sun: who is your #1 ALC prospect? What is your move to close before Jun 5?`, days: [6] },
        ],
        results: [
          { text: `3+ ALC one-on-one calls done` },
          { text: `2+ ALC invitations sent` },
          { text: `Clear YES target identified — on track to close before Jun 5` },
        ],
      },
      {
        weekNumber: 6, cumulativePercentage: ENROLL_PCT[5],
        description: `PRIMARY ALC close — goal: 1 enrolled → they attend ALC 256 (Jun 5–7 SMX Aura). If not yet, ALC 257 (Jun 12–14) is your last chance — act this week!`,
        actions: [
          { text: `Final ALC follow-ups Mon–Thu — get their YES before Friday`, days: [0, 1, 2, 3] },
          { text: `ALC 256 Fri Jun 5 — message your enrolled ALC student: “You made it! See you at SMX this weekend”`, days: [4] },
          { text: `ALC 256 Sat Jun 6 SMX Aura — welcome your enrolled ALC student at the venue; celebrate their commitment`, days: [5] },
          { text: `ALC 256 Closing Sun Jun 7 — attend with your ALC student; invite people you’re still talking to; open ALC 257 conversations if needed`, days: [6] },
          { text: `Document your FLEX + ALC process: what worked, what you’d do differently`, days: [1, 2] },
        ],
        results: [
          { text: `1 ALC student ENROLLED — primary Jun 5 or ALC 257 backup track active` },
          { text: `At the door ALC 256 Jun 6 — you showed up again!` },
          { text: `Enrollment process documented` },
        ],
      },
      {
        weekNumber: 7, cumulativePercentage: ENROLL_PCT[6],
        description: `GOAL COMPLETE — 1 FLEX + 1 ALC ENROLLED! ALC 257 Jun 12–14 if needed · 2nd Workshop Sun Jun 14 · testimony drafted · celebrate!`,
        actions: [
          { text: `If ALC still open: final close Mon–Wed — MUST enroll before Jun 12 for ALC 257`, days: [0, 1, 2] },
          { text: `ALC 257 Fri Jun 12 — message your ALC student: “You made it!”`, days: [4] },
          { text: `ALC 257 Sat Jun 13 SMX Aura — welcome your ALC student at the venue; celebrate this moment`, days: [5] },
          { text: `Draft enrollment testimony — ${essLabel} shown + obstacle overcome + results achieved`, days: [1, 2, 3] },
          { text: `${partner} goal complete — share your testimony draft`, days: [3] },
          { text: `ALC 257 Closing + 2nd Workshop Sun Jun 14 — share your enrollment journey; this is your WIN moment`, days: [6] },
        ],
        results: [
          { text: `1 FLEX + 1 ALC ENROLLED AND ACTIVE — GOAL COMPLETE!` },
          { text: `Testimony drafted` },
          { text: `2nd Workshop Jun 14 attended — story shared` },
        ],
      },
      {
        weekNumber: 8, cumulativePercentage: ENROLL_PCT[7],
        description: `Both enrolled + active · testimony submitted Jun 19 · ${a.proofMain || "proof"} ready for Graduation Jun 21`,
        actions: [
          { text: `Final check-ins with your FLEX and ALC students — gather their early wins; weave into testimony`, days: [0, 1, 2] },
          { text: `Finalize testimony — distill your enrollment story into a 2-min spoken version`, days: [2, 3] },
          {text:`Compile ${a.proofMain || "your proof"} — your contract receipt; have it ready to present at Graduation Jun 21`,days:[1,2,3]},
          { text: `Submit testimony by Fri Jun 19 — your full FLEX + ALC enrollment story`, days: [4] },
          { text: `YOUR Graduation Sun Jun 21 — celebrate completing LEAP 99 with your fellow students`, days: [6] },
        ],
        results: [
          { text: `Both students enrolled + active ✓` },
          { text: `Testimony submitted Jun 19 ✓` },
          { text: `YOU graduated from LEAP 99 — you played the game and WON!` },{text:`${a.proofMain || "Proof"} COMPLETE ✓ — declaration proven`},
        ],
      },
    ];
  },
};
// ─────────────────────────────────────────────────────────────────────────────
// ENROLLMENT — High Volume (2+ FLEX + 2+ ALC invitations)
// ─────────────────────────────────────────────────────────────────────────────
const enrollmentHighVolume: GoalTemplate = {
  id: "enrollment-high-volume",
  goalType: "enrollment",
  subType: "enrollment-high",
  name: "High-Volume Enrollment (2+ FLEX + 2+ ALC)",
  description: "For those going beyond the standard — enrolling 2 or more students across both FLEX and ALC through consistent daily effort.",
  questions: [
    { id: "flexTarget",           label: "FLEX students to enroll (2–5)",              type: "number",      placeholder: "2", defaultValue: "2" },
    { id: "alcTarget",            label: "ALC students to enroll (2–5)",              type: "number",      placeholder: "2", defaultValue: "2" },
    { id: "warmNetworkSize",      label: "How many people do you know personally?",    type: "number",      placeholder: "100", defaultValue: "100",
      hint: "High-volume needs 100+ contacts across FLEX and ALC tracks. List everyone — then go find more." },
    { id: "schedule",             label: "Your weekly commitment schedule",            type: "schedule",    defaultValue: "Mon:1,Tue:1,Wed:1,Thu:1,Fri:1,Sat:1",
      hint: "HV enrollment needs 5–6 active days. Set hours per day — tap — to skip a day. 1 hr ≈ 3 conversations." },
    { id: "outreachTimeBlock",    label: "When is your dedicated outreach block?",     type: "multiselect", options: ["morning","midday","evening"], defaultValue: "morning,evening",
      hint: "Two blocks (morning + evening) dramatically increases your daily conversations." },
    { id: "channel",              label: "How will you mainly invite people?",          type: "multiselect", options: ["referrals","social media","calls","combination","other"], defaultValue: "referrals" },
    { id: "biggestObstacle",      label: "Biggest obstacle to enrolling at scale",     type: "multiselect", options: ["fear of rejection","finding time","don’t know what to say","not enough people","following up consistently","managing FLEX + ALC simultaneously","other"], defaultValue: "fear of rejection",
      hint: "Name it so your action plan tackles it head-on." },
    { id: "accountabilityPartner",label: "Accountability partner name (optional)",     type: "text",        placeholder: "e.g., Coach Ana",
      hint: "HV coaches need tighter daily accountability — this person checks your daily numbers, not just your mood." },
    { id: "essence",              label: "3 essence qualities to embody (pick 3)",    type: "multiselect",
      options: ["authentic","generous","service-oriented","abundant","courageous","committed","bold","joyful","patient","warm","inspired","other"], defaultValue: "loving,committed,courageous",
      hint: "LEAP coaches always embody exactly 3 qualities. These 3 become the soul of every conversation." },
    { id: "proofMain", label: "Primary proof — what will you present at Graduation? (choose 1)", type: "select",
      options: ["Group photo with ALL your students at Graduation Jun 21 — the ultimate receipt","Individual photos with each student at FLEX (May) + ALC (June)","Enrollment tracker screenshot showing all students active in both FLEX and ALC","Video testimonies from all students after completing both programs","Group journey collage: first meetings → FLEX → ALC → Graduation","Full enrollment confirmation showing all students in both FLEX and ALC","Other"],
      defaultValue: "Group photo with ALL your students at Graduation Jun 21 — the ultimate receipt",
      hint: "This must prove EVERY student enrolled in BOTH FLEX (May) AND ALC (June) — a group Graduation photo is the ultimate single receipt." },
    { id: "proofSupport", label: "Supporting evidence (optional — pick 1–2 more)", type: "multiselect",
      options: ["Conversation screenshots from each student's enrollment decision","Social media posts/stories about your students' enrollments","WhatsApp/Messenger screenshots showing all students in FLEX/ALC groups","Video messages from enrolled students (compiled)","Full outreach tracker screenshot — contacts logged per student","Photo collage: pre-enrollment meetings → enrollment confirmations","other"],
      hint: "Up to 2 extras that support your main proof — powerful but not required." },
  ],
  smarter: (a) => {
    const total = parseInt(a.flexTarget || "2") + parseInt(a.alcTarget || "2");
    const fx2 = parseInt(a.flexTarget || "2");
    const al2 = parseInt(a.alcTarget || "2");
    const sched = parseSchedule(a.schedule, "Mon:1,Tue:1,Wed:1,Thu:1,Fri:1,Sat:1");
    const dayCount = sched.length || 6;
    const daysNatural = dayCount >= 7 ? "every day" : dayCount >= 6 ? "6 days a week" : `${dayCount} days a week`;
    const weeklyHrs = scheduleWeeklyHours(a.schedule, "Mon:1,Tue:1,Wed:1,Thu:1,Fri:1,Sat:1");
    const hrs = dayCount > 0 ? (weeklyHrs / dayCount).toFixed(1) : "3";
    const network = a.warmNetworkSize || "100";
    const block = a.outreachTimeBlock || "morning,evening";
    const ch = a.channel || "referrals";
    const partner = a.accountabilityPartner ? `; accountability: ${a.accountabilityPartner}` : "";
    const essArr = (a.essence || "loving,committed,courageous").split(",").map((s: string) => s.trim()).filter(Boolean);
    const essLabel = essArr.length >= 2 ? essArr.slice(0,-1).join(", ") + ", and " + essArr[essArr.length-1] : essArr[0] || "abundant";
    return {
      goalStatement: `Throughout 8 weeks, I reach out through ${ch} ${daysNatural} and enroll ${fx2} FLEX student${fx2 > 1 ? "s" : ""} + ${al2} ALC student${al2 > 1 ? "s" : ""} into the programme, and prove it with ${a.proofMain || "documented evidence"}, by June 19, 2026.`,
      specificDetails: `Enroll ${fx2} FLEX + ${al2} ALC through simultaneous ${ch} enrollment effort; ${network}-person contact list; ${weeklyHrs}h/week · ${block} blocks; attending all FLEX (May 9–10, May 16–17) and ALC (Jun 5–7, Jun 12–14) as momentum tools${partner}`,
      measurableCriteria: `${fx2} FLEX enrolled by Wk 4; ${al2} ALC enrolled by Wk 5; daily tracker: conversations → calls → invitations → enrollments; ${total} total clients active by Jun 19`,
      achievableResources: `${network}-person contact list; ${weeklyHrs}h/week · ${block} blocks; ${ch} as primary channel; FLEX 298+299 and ALC 256+257 as live motivation; referrals from first enrolled students`,
      relevantAlignment: `Enrolling ${total} paying clients simultaneously pushes well beyond my previous enrollment comfort zone — this requires a daily system I have never maintained at this scale before`,
      endDate: "June 19, 2026",
      excitingMotivation: `Showing up as ${essLabel} — proving I can build a real coaching practice with ${total} clients; the moment all ${total} are active is the moment my business becomes real`,
      rewardingBenefits: `${total} active clients; stable monthly income; referral network activated; enrollment capacity proven; testimony: "I built a coaching practice in 8 weeks"`,
    };
  },
  answerRisks: (a) => {
    const risks: Array<{ field?: string; message: string }> = [];
    const fx = parseInt(a.flexTarget || "2");
    const al = parseInt(a.alcTarget || "2");
    const total = fx + al;
    // Total volume check
    if (total > 6) {
      risks.push({ message: `Enrolling ${fx} FLEX + ${al} ALC = ${total} total students in 8 weeks is extremely ambitious. Most coaches achieve 2–4. Be honest with yourself: is this realistic given your contact list and available time?` });
    }
    if (fx > 3 || al > 3) {
      risks.push({ message: `${fx > 3 ? `${fx} FLEX` : ""}${fx > 3 && al > 3 ? " and " : ""}${al > 3 ? `${al} ALC` : ""} is a very high individual target. Each enrollment needs 30–50 real conversations. Make sure your list can support this.` });
    }
    // Contact list size
    const n = parseInt(a.warmNetworkSize || "100");
    if (n > 0 && n < 50) {
      risks.push({ field: "warmNetworkSize", message: `${n} contacts for ${total} enrollments is very thin. High-volume enrollment needs 100+ people across FLEX and ALC tracks — you need enough backup prospects when people say no at scale.` });
    } else if (n > 0 && n < 80) {
      risks.push({ field: "warmNetworkSize", message: `${n} contacts is a tight list for ${total} enrollments. Aim for 100+ to have enough options across both tracks.` });
    }
    // Schedule check
    const sched2 = parseSchedule(a.schedule, "Mon:1,Tue:1,Wed:1,Thu:1,Fri:1,Sat:1");
    const days = sched2.length;
    const weeklyHrs2 = scheduleWeeklyHours(a.schedule, "Mon:1,Tue:1,Wed:1,Thu:1,Fri:1,Sat:1");
    if (weeklyHrs2 < 10) {
      risks.push({ field: "schedule", message: `${weeklyHrs2}h/week is not enough for high-volume enrollment. 10+ conversations/day across two tracks needs at least 12–18 hrs/week total.` });
    }
    // Commitment days
    if (days < 5) {
      risks.push({ field: "schedule", message: `Only ${days} day${days !== 1 ? "s" : ""}/week for high-volume enrollment is risky. HV coaches need 5–6 days/week to maintain momentum across FLEX and ALC simultaneously.` });
    }
    // Outreach total vs enrollment target
    const totalTouches2 = Math.round(weeklyHrs2 * 3) * 7; // total conversations over 7 active weeks
    const neededTouches2 = total * 30; // ~30 conversations per enrollment
    if (totalTouches2 < neededTouches2) {
      risks.push({ message: `At ~${weeklyHrs2}h/week × 3 convos/hr × 7 weeks = ~${totalTouches2} total conversations. Enrolling ${total} students needs ${neededTouches2}+ conversations (15–20% conversion). Add more hours to your schedule, or reduce your target to ${Math.max(1,Math.floor(totalTouches2/30))} student${Math.floor(totalTouches2/30)>1?"s":""}.` });
    }
    // Proof alignment check
    if (a.proofMain) {
      const validProofKw = ["graduation","group","individual","photo","flex","alc","both","enrollment","tracker","screenshot","confirmation","video","testimony","journey"];
      if (!validProofKw.some((kw: string) => a.proofMain.toLowerCase().includes(kw.toLowerCase()))) {
        risks.push({ field: "proofMain", message: `Your goal declares enrolling multiple students in FLEX + ALC. The most direct proof is a group photo at Graduation Jun 21 (all students attended both = enrolled both). "${a.proofMain}" may not cover all students in both programs — review with your coach.` });
      }
    }
    return risks;
  },
  milestones: (a) => {
    const fx = parseInt(a.flexTarget || "2");
    const al = parseInt(a.alcTarget || "2");
    const total = fx + al;
    const essArr = (a.essence || "loving,committed,courageous").split(",").map((s: string) => s.trim()).filter(Boolean);
    const essLabel = essArr.length >= 2 ? essArr.slice(0,-1).join(", ") + ", and " + essArr[essArr.length-1] : essArr[0] || "abundant";
    const partner = a.accountabilityPartner ? `Check in with ${a.accountabilityPartner} —` : "Weekly review:";
    const block = (a.outreachTimeBlock || "morning,evening").split(",")[0];
    const commitDays = scheduleCommitDays(a.schedule, "Mon:1,Tue:1,Wed:1,Thu:1,Fri:1,Sat:1");
    const avgHrsDay = scheduleWeeklyHours(a.schedule, "Mon:1,Tue:1,Wed:1,Thu:1,Fri:1,Sat:1") / Math.max(1, commitDays.length);
    const cpd = Math.max(3, Math.round(avgHrsDay * 3));
    return [
      { weekNumber:1, cumulativePercentage:ENROLL_PCT[0], description:`Build your FULL system AND start the game: ${a.warmNetworkSize||"100"}+ person list · FLEX + ALC scripts · enrollment tracker · 10 conversations OPEN before week ends | Schedule: FLEX 298 May 9–10 · FLEX 299 May 16–17 · ALC 256 Jun 5–7 · ALC 257 Jun 12–14 · Graduation Jun 21`,
        actions:[
          {text:`Build your ${a.warmNetworkSize||"100"}+ person contact list — note who fits FLEX and who fits ALC`,days:MON_FRI},
          {text:`Draft separate invitation scripts: one for FLEX (May) + one for ALC (June) — via ${a.channel||"referrals"}`,days:[1,2]},
          {text:`Lock ${a.outreachTimeBlock||"morning,evening"} outreach blocks in calendar — non-negotiable`,days:[0]},
          {text:`Obstacle plan: "${a.biggestObstacle||"fear of rejection"}" — write 3 moves to push through it`,days:[2]},
          {text:"Set up enrollment tracker: Contact → Conversation → One-on-One Call → Invited → Enrolled",days:MON},
          {text:"Open 10 conversations from your list before this week ends — the game starts NOW",days:[3,4]},
          {text:`${a.accountabilityPartner ? `Check in with ${a.accountabilityPartner} —` : "Weekly review:"} contact list ready + 10 conversations open?`,days:SUN},
        ],
        results:[
          {text:`${a.warmNetworkSize||"100"}+ person contact list READY — game on!`},
          {text:"Enrollment tracker live"},
          {text:"10+ conversations OPEN — you are in the game"},
        ] },
      { weekNumber:2, cumulativePercentage:ENROLL_PCT[1], description:`1st FLEX enrolled → attends FLEX 298 May 9–10 Abenson HQ. ${cpd}+ conversations/day · 10 one-on-one calls — close the first one!`,
        actions:[
          {text:`${block} block: ${cpd}+ conversations/day across FLEX + ALC tracks`,days:commitDays},
          {text:`Conduct 10 one-on-one calls Mon–Thu — paint the FLEX 298 picture; after each, note 1 moment you showed up as ${essLabel}`,days:[0,1,2,3]},
          {text:"FLEX 298 Sat May 9 Abenson HQ Muñoz — bring people you're inviting; if 1st FLEX enrolled, welcome them at the venue — they are HERE!",days:[5]},
          {text:`FLEX 298 Closing Sun May 10 — celebrate with 1st FLEX student; open new conversations; ${partner} how many in each stage?`,days:[6]},
        ],
        results:[
          {text:"1st FLEX student ENROLLED — attending FLEX 298! Game is ON!"},
          {text:"40+ conversations held"},
          {text:"10+ one-on-one calls done"},
        ] },
      { weekNumber:3, cumulativePercentage:ENROLL_PCT[2], description:`2nd FLEX enrolled → attends FLEX 299 May 16–17 SMX Aura · 1st Workshop May 17 · ALC: 30+ conversations open`,
        actions:[
          {text:`Follow up ALL Wk 2 FLEX invitations — drive 2nd FLEX close before May 16`,days:commitDays},
          {text:`30+ ALC conversations; 5 ALC one-on-one calls — both tracks running simultaneously`,days:commitDays},
          {text:"Referral ask: every enrolled FLEX student gives 1 name for ALC",days:[3]},
          {text:"FLEX 299 Sat May 16 SMX Aura — bring people you’re inviting; welcome 2nd FLEX student at the venue — they made it!",days:[5]},
          {text:`1st Workshop Sun May 17 — celebrate ${fx} FLEX win${fx>1?"s":""}; use room energy to open ALC conversations`,days:[6]},
        ],
        results:[
          {text:`${fx} FLEX students ENROLLED — both attending FLEX 298 + 299! FLEX goal DONE!`},
          {text:"ALC: 30+ conversations open"},
          {text:"1st Workshop attended — momentum building"},
        ] },
      { weekNumber:4, cumulativePercentage:ENROLL_PCT[3], description:`${fx} FLEX DONE ✓ — full ALC push: 50+ conversations · 10 one-on-one calls · 2nd Intensive May 23–24 UP BGC`,
        actions:[
          {text:`100% ALC focus — ${al} ALC students to enroll; ${block} block every day`,days:commitDays},
          {text:`50+ ALC conversations this week — paint the ALC 256 picture (Jun 5–7 SMX Aura)`,days:commitDays},
          {text:`10 ALC one-on-one calls Mon–Thu — after each, note 1 moment you showed up as ${essLabel}`,days:[0,1,2,3]},
          {text:"Send 5+ ALC invitations; referral ask to every enrolled FLEX student — warm introductions",days:[1,2,3]},
          {text:"Send enrolled FLEX students a personal welcome message",days:[3]},
          {text:"2nd Intensive Sat May 23 UP BGC — celebrate FLEX wins with coach; set ALC close intentions",days:[5]},
          {text:`2nd Intensive Sun May 24 — absorb the energy; visualize ${al} ALC student${al>1?"s":""} enrolled`,days:[6]},
        ],
        results:[
          {text:`${fx} FLEX done ✓ · ALC: 50+ conversations · 5+ invitations sent`},
          {text:"2nd Intensive May 23–24 attended — ALC intention locked"},
        ] },
      { weekNumber:5, cumulativePercentage:ENROLL_PCT[4], description:`ALC converge — ${cpd * commitDays.length * 4}+ conversations cumulative; target: all ${al} ALC enrolled BEFORE Jun 5 → ALC 256 Jun 5–7. Final push week!`,
        actions:[
          {text:`${block} block: ${cpd}+ ALC calls and invitations/day — use "ALC 256 starts Jun 5" to help them decide NOW`,days:commitDays},
          {text:"Follow up EVERY open ALC invitation — get a YES, NO, or clear next step",days:commitDays},
          {text:"FLEX student check-in — document wins; these become your graduation testimony",days:[2]},
          {text:"Ask enrolled FLEX students for ALC referrals — warm introductions to their network",days:[3]},
          {text:`${partner} who are the ${al} ALC prospect${al>1?"s":""}? What is the close plan for each?`,days:SUN},
        ],
        results:[
          {text:`ALC invitations active — on track for ${al} enrolled before Jun 5`},
          {text:"FLEX testimony material being gathered"},
        ] },
      { weekNumber:6, cumulativePercentage:ENROLL_PCT[5], description:`1st ALC enrolled → attends ALC 256 Jun 5–7 SMX Aura · all ${total} clients in motion`,
        actions:[
          {text:`Final ALC close Mon–Wed — drive 1st ALC student to YES before Jun 5; show up as ${essLabel}`,days:[0,1,2]},
          {text:"ALC 256 Fri Jun 5 — message enrolled ALC student: 'You made it! See you at SMX'",days:[4]},
          {text:"ALC 256 Sat Jun 6 SMX Aura — welcome your enrolled ALC student at the venue",days:[5]},
          {text:"ALC 256 Closing Sun Jun 7 — celebrate; invite remaining prospects to ALC 257",days:[6]},
          {text:`${partner} 1st ALC confirmed; start testimony draft — essence + process + client outcomes`,days:[3,4]},
        ],
        results:[
          {text:"1st ALC student ENROLLED — attending ALC 256!"},
          {text:"Testimony draft started"},
          {text:`${total}+ clients in motion — momentum is real`},
        ] },
      { weekNumber:7, cumulativePercentage:ENROLL_PCT[6], description:`GOAL COMPLETE — ${fx} FLEX + ${al} ALC ENROLLED! 2nd ALC enrolled → ALC 257 Jun 12–14 · 2nd Workshop Jun 14 · testimony finalized`,
        actions:[
          {text:`Drive 2nd ALC close Mon–Tue — MUST enroll before Jun 12 for ALC 257; show up as ${essLabel}`,days:[0,1]},
          {text:"ALC 257 Fri Jun 12 — message 2nd ALC student: 'You made it!'",days:[4]},
          {text:"ALC 257 Sat Jun 13 SMX Aura — welcome 2nd ALC student at the venue; celebrate their commitment",days:[5]},
          {text:`2nd Workshop Sun Jun 14 — share your ${total}-client enrollment journey with your coach`,days:[6]},
          {text:`Finalize testimony — ${essLabel} shown + obstacles overcome + ${total} results achieved`,days:[1,2,3]},
          {text:`${partner} goal complete! Share testimony draft`,days:[3]},
        ],
        results:[
          {text:`${fx} FLEX + ${al} ALC ENROLLED — GOAL COMPLETE! You played, you WON!`},
          {text:"Testimony finalized ✓"},
          {text:"2nd Workshop Jun 14 attended — story shared"},
        ] },
      { weekNumber:8, cumulativePercentage:ENROLL_PCT[7], description:`All ${total} clients enrolled + active · testimony submitted Jun 19 · ${a.proofMain || "proof"} ready for Graduation Jun 21`,
        actions:[
          {text:`Final check-ins with all ${total} clients — gather their wins; weave into testimony`,days:[0,1,2]},
          {text:`Finalize testimony — distill your ${total}-client enrollment story into a 2-min spoken version`,days:[2,3]},
          {text:`Compile ${a.proofMain || "your proof"} — your contract receipt; have it ready to present at Graduation Jun 21`,days:[1,2,3]},
          {text:"Submit testimony by Fri Jun 19 — your full enrollment story",days:[4]},
          {text:"YOUR Graduation Sun Jun 21 — celebrate completing LEAP 99 with your fellow students. You did it!",days:[6]},
        ],
        results:[
          {text:"All "+total+" clients enrolled + active ✓"},
          {text:"Testimony submitted Jun 19 ✓"},
          {text:"YOU graduated from LEAP 99 — you played the game and WON!"},{text:`${a.proofMain || "Proof"} COMPLETE ✓ — declaration proven`},
        ] },
    ];
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// PERSONAL — Health & Wellness
// ─────────────────────────────────────────────────────────────────────────────
const personalHealth: GoalTemplate = {
  id: "personal-health",
  goalType: "personal",
  subType: "health",
  name: "Health & Wellness",
  description: "Doctor-first health goal supporting weight loss, body measurements, medical test improvement, and/or fitness targets over 8 weeks with maintenance in Wk 8.",
  wheelAreaHint: "Area A: Physical Health",
  safetyNote: "⚕️ Doctor consultation required as first action. Max 1 kg/week weight loss.",
  questions: [
    { id: "primaryTarget", label: "Health target(s) — pick all that apply", type: "multiselect",
      options: ["Weight loss (kg)","Body measurements","Medical test result","General fitness level","other"],
      defaultValue: "Weight loss (kg)",
      hint: "Select multiple if you're combining targets (e.g., weight + waist)." },

    // ── Weight loss fields ───────────────────────────────────────────────────
    { id: "weightCurrent", label: "Current weight (kg)", type: "number", placeholder: "78",
      hint: "Safe rate: max 1 kg/week. 7 execution weeks = 7 kg maximum.",
      dependsOn: { id: "primaryTarget", value: "Weight loss (kg)" } },
    { id: "weightTarget",  label: "Target weight (kg)", type: "number", placeholder: "72",
      dependsOn: { id: "primaryTarget", value: "Weight loss (kg)" } },

    // ── Body measurements — pick parts as pills, each reveals its own current+target ──
    { id: "bodyParts", label: "Which body part(s) to track?", type: "multiselect",
      options: ["waist","hips","chest","arms","thighs"],
      hint: "Use cm or inches — pick one and stay consistent.",
      dependsOn: { id: "primaryTarget", value: "Body measurements" } },
    { id: "waistCurrent", label: "Waist — current", type: "number", placeholder: "90", dependsOn: { id: "bodyParts", value: "waist" } },
    { id: "waistTarget",  label: "Waist — target",  type: "number", placeholder: "82", dependsOn: { id: "bodyParts", value: "waist" } },
    { id: "hipsCurrent",  label: "Hips — current", type: "number", placeholder: "105", dependsOn: { id: "bodyParts", value: "hips" } },
    { id: "hipsTarget",   label: "Hips — target",   type: "number", placeholder: "95",  dependsOn: { id: "bodyParts", value: "hips" } },
    { id: "chestCurrent", label: "Chest — current", type: "number", placeholder: "100", dependsOn: { id: "bodyParts", value: "chest" } },
    { id: "chestTarget",  label: "Chest — target",  type: "number", placeholder: "90",  dependsOn: { id: "bodyParts", value: "chest" } },
    { id: "armsCurrent",  label: "Arms — current",  type: "number", placeholder: "35",  dependsOn: { id: "bodyParts", value: "arms" } },
    { id: "armsTarget",   label: "Arms — target",   type: "number", placeholder: "30",  dependsOn: { id: "bodyParts", value: "arms" } },
    { id: "thighsCurrent",label: "Thighs — current",type: "number", placeholder: "62",  dependsOn: { id: "bodyParts", value: "thighs" } },
    { id: "thighsTarget", label: "Thighs — target", type: "number", placeholder: "55",  dependsOn: { id: "bodyParts", value: "thighs" } },

    // ── Medical markers — pick markers as pills, each reveals its own current+target ──
    { id: "healthMarkers", label: "Which health markers to improve?", type: "multiselect",
      options: ["cholesterol","blood sugar (fasting)","blood pressure","uric acid","HbA1c","triglycerides","creatinine","other"],
      hint: "⚕️ Doctor-prescribed targets required for all. Select all you're tracking.",
      dependsOn: { id: "primaryTarget", value: "Medical test result" } },
    { id: "cholCurrent",  label: "Cholesterol — current (mg/dL)",        type: "number", placeholder: "220", dependsOn: { id: "healthMarkers", value: "cholesterol" } },
    { id: "cholTarget",   label: "Cholesterol — doctor's target (mg/dL)", type: "number", placeholder: "180", dependsOn: { id: "healthMarkers", value: "cholesterol" } },
    { id: "bgCurrent",    label: "Blood sugar — current fasting (mg/dL)", type: "number", placeholder: "130", dependsOn: { id: "healthMarkers", value: "blood sugar" } },
    { id: "bgTarget",     label: "Blood sugar — doctor's target (mg/dL)", type: "number", placeholder: "100", dependsOn: { id: "healthMarkers", value: "blood sugar" } },
    { id: "bpCurrent",    label: "Blood pressure — current (e.g. 140/90)", type: "text", placeholder: "140/90", dependsOn: { id: "healthMarkers", value: "blood pressure" } },
    { id: "bpTarget",     label: "Blood pressure — doctor's target",       type: "text", placeholder: "120/80", dependsOn: { id: "healthMarkers", value: "blood pressure" } },
    { id: "uaCurrent",    label: "Uric acid — current (mg/dL)",           type: "number", placeholder: "8.5", dependsOn: { id: "healthMarkers", value: "uric acid" } },
    { id: "uaTarget",     label: "Uric acid — doctor's target (mg/dL)",   type: "number", placeholder: "6.5", dependsOn: { id: "healthMarkers", value: "uric acid" } },
    { id: "hba1cCurrent", label: "HbA1c — current (%)",                   type: "number", placeholder: "7.5", dependsOn: { id: "healthMarkers", value: "HbA1c" } },
    { id: "hba1cTarget",  label: "HbA1c — doctor's target (%)",           type: "number", placeholder: "6.5", dependsOn: { id: "healthMarkers", value: "HbA1c" } },
    { id: "trigCurrent",  label: "Triglycerides — current (mg/dL)",       type: "number", placeholder: "200", dependsOn: { id: "healthMarkers", value: "triglycerides" } },
    { id: "trigTarget",   label: "Triglycerides — doctor's target (mg/dL)",type: "number", placeholder: "150", dependsOn: { id: "healthMarkers", value: "triglycerides" } },
    { id: "creatCurrent", label: "Creatinine — current (mg/dL)",          type: "number", placeholder: "1.5", dependsOn: { id: "healthMarkers", value: "creatinine" } },
    { id: "creatTarget",  label: "Creatinine — doctor's target (mg/dL)",  type: "number", placeholder: "1.0", dependsOn: { id: "healthMarkers", value: "creatinine" } },
    { id: "otherMarkerName",    label: "Other marker — test name", type: "text", placeholder: "e.g., hemoglobin / ALT / PSA", dependsOn: { id: "healthMarkers", value: "other" } },
    { id: "otherMarkerUnit",    label: "Unit", type: "text", placeholder: "e.g., g/dL", dependsOn: { id: "healthMarkers", value: "other" } },
    { id: "otherMarkerCurrent", label: "Current value", type: "number", placeholder: "", dependsOn: { id: "healthMarkers", value: "other" } },
    { id: "otherMarkerTarget",  label: "Doctor's target", type: "number", placeholder: "", dependsOn: { id: "healthMarkers", value: "other" } },

    // ── General fitness ──────────────────────────────────────────────────────
    { id: "fitnessNow", label: "Current fitness level", type: "multiselect",
      options: ["no exercise habit","occasional light walking","can't climb stairs without winding","light exercise 1–2x/week","moderate exercise 3x/week","already somewhat active","other"],
      dependsOn: { id: "primaryTarget", value: "General fitness level" } },
    { id: "fitnessTarget", label: "Target fitness activity by Wk 7", type: "multiselect",
      options: ["run 3km non-stop","run 5km","complete a 5K race","do 20 push-ups","do 50 push-ups","bike 50km total","swim 500m","plank 2 minutes","attend gym 5x/week","finish a fun run","other"],
      dependsOn: { id: "primaryTarget", value: "General fitness level" } },

    // ── Common fields ────────────────────────────────────────────────────────
    { id: "movement",   label: "Preferred movement / exercise", type: "multiselect",
      options: ["gym","home workout","running","walking + steps","cycling","swimming","sport","yoga / pilates","other"], defaultValue: "gym" },
    { id: "dietary",    label: "Dietary approach", type: "multiselect",
      options: ["calorie-aware","intermittent fasting","clean eating","doctor-prescribed","balanced meals","plant-based","low-carb","other"], defaultValue: "calorie-aware" },
    { id: "sessionsPerWeek", label: "Sessions per week", type: "select",
      options: ["2","3","4","5","6"], defaultValue: "4",
      hint: "How many sessions per week will you commit to consistently?" },
    { id: "doctorDone", label: "Doctor check-up done?", type: "select",
      options: ["Yes — cleared to proceed","No — Wk 1 is the consultation"], defaultValue: "No — Wk 1 is the consultation" },
    { id: "proofMain", label: "Primary proof — what will you present at Graduation? (choose 1)", type: "select",
      options: ["Before/after photos (full body)","Before/after measurement chart (printed or digital)","Medical test results comparison (before vs. after)","Side-by-side progress photo collage","Health app / tracker screenshot export (weight log)","Fitness achievement screenshot (Strava / Google Fit / GPS trace)","Other"],
      defaultValue: "Before/after photos (full body)",
      hint: "This directly answers: how do we know you reached your number? Show the transformation visually." },
    { id: "proofSupport", label: "Supporting evidence (optional — pick 1–2 more)", type: "multiselect",
      options: ["written testimony (printed + signed)","blog post / article","LinkedIn post / social media post","Instagram / Facebook Reel or TikTok","digital photo album (Google Photos / iCloud)","printed scrapbook","short film (1–3 min)","personal website / portfolio page","Canva PDF presentation","Notion page / digital portfolio","presentation to LEAP batch at Graduation","letter to my future self","music video / creative video","artwork / painting / illustration","handwritten journal (printed + bound)","other"],
      hint: "Up to 2 extras that support your main proof — powerful but not required." },
  ],
  smarter: (a) => {
    const targets = (a.primaryTarget || "Weight loss (kg)").split(",").map(s => s.trim());
    const hasWeight  = targets.some(t => t.includes("Weight"));
    const hasMeasure = targets.some(t => t.includes("Body"));
    const hasMedical = targets.some(t => t.includes("Medical"));
    const hasFitness = targets.some(t => t.includes("fitness"));

    // Build body measurement summaries from per-part fields
    const bodyPartsList = (a.bodyParts || "").split(",").map(s => s.trim()).filter(Boolean);
    const measures: string[] = [];
    if (bodyPartsList.includes("waist")  && a.waistCurrent  && a.waistTarget)  measures.push(`waist ${a.waistCurrent}→${a.waistTarget}`);
    if (bodyPartsList.includes("hips")   && a.hipsCurrent   && a.hipsTarget)   measures.push(`hips ${a.hipsCurrent}→${a.hipsTarget}`);
    if (bodyPartsList.includes("chest")  && a.chestCurrent  && a.chestTarget)  measures.push(`chest ${a.chestCurrent}→${a.chestTarget}`);
    if (bodyPartsList.includes("arms")   && a.armsCurrent   && a.armsTarget)   measures.push(`arms ${a.armsCurrent}→${a.armsTarget}`);
    if (bodyPartsList.includes("thighs") && a.thighsCurrent && a.thighsTarget) measures.push(`thighs ${a.thighsCurrent}→${a.thighsTarget}`);

    // Build medical marker summaries from per-marker fields
    const healthMarkersList = (a.healthMarkers || "").split(",").map(s => s.trim()).filter(Boolean);
    const medMarkers: string[] = [];
    if (healthMarkersList.includes("cholesterol")         && a.cholCurrent)      medMarkers.push(`cholesterol ${a.cholCurrent}→${a.cholTarget||"180"} mg/dL`);
    if (healthMarkersList.includes("blood sugar (fasting)") && a.bgCurrent)      medMarkers.push(`blood sugar ${a.bgCurrent}→${a.bgTarget||"100"} mg/dL`);
    if (healthMarkersList.includes("blood pressure")      && a.bpCurrent)        medMarkers.push(`BP ${a.bpCurrent}→${a.bpTarget||"120/80"}`);
    if (healthMarkersList.includes("uric acid")           && a.uaCurrent)        medMarkers.push(`uric acid ${a.uaCurrent}→${a.uaTarget||"6.5"} mg/dL`);
    if (healthMarkersList.includes("HbA1c")               && a.hba1cCurrent)     medMarkers.push(`HbA1c ${a.hba1cCurrent}→${a.hba1cTarget||"6.5"}%`);
    if (healthMarkersList.includes("triglycerides")       && a.trigCurrent)      medMarkers.push(`triglycerides ${a.trigCurrent}→${a.trigTarget||"150"} mg/dL`);
    if (healthMarkersList.includes("creatinine")          && a.creatCurrent)     medMarkers.push(`creatinine ${a.creatCurrent}→${a.creatTarget||"1.0"} mg/dL`);
    if (healthMarkersList.includes("other")               && a.otherMarkerName)  medMarkers.push(`${a.otherMarkerName} ${a.otherMarkerCurrent||"?"}→${a.otherMarkerTarget||"?"} ${a.otherMarkerUnit||""}`);

    const specific: string[] = [];
    if (hasWeight && a.weightCurrent && a.weightTarget)
      specific.push(`weight ${a.weightCurrent}→${a.weightTarget} kg (${Math.abs(+a.weightCurrent - +a.weightTarget)} kg loss)`);
    else if (hasWeight) specific.push("weight loss (amount set with doctor)");
    if (hasMeasure && measures.length) specific.push(measures.join("; "));
    if (hasMedical && medMarkers.length) specific.push(medMarkers.join("; "));
    if (hasFitness && a.fitnessTarget)
      specific.push(`fitness: "${a.fitnessNow||"current level"}" → "${a.fitnessTarget}"`);
    const specificGoal = specific.length ? specific.join(" + ") : "health improvement";

    const measurable: string[] = [];
    if (hasWeight) measurable.push(`Sunday weigh-in (${a.weightCurrent||"?"}→${a.weightTarget||"?"} kg)`);
    if (hasMeasure && measures.length) measurable.push(`${measures.map(m=>m.split(" ")[0]).join("+")} measured monthly`);
    if (hasMedical && medMarkers.length) measurable.push(`${medMarkers.map(m=>m.split(" ")[0]).join("+")} retested Wk 4 + Wk 7`);
    if (hasFitness) measurable.push("fitness milestone logged weekly");

    return {
      goalStatement: `Throughout 8 weeks, I follow my ${(a.movement || "exercise").split(",")[0]} and ${(a.dietary || "clean eating").split(",")[0]} plan at least ${a.sessionsPerWeek || "4"} times per week and achieve ${specificGoal || "my health target"}, and prove it with ${a.proofMain || "documented evidence"}, by June 19, 2026.`,
      specificDetails: `Achieve ${specificGoal} through ${a.movement || "gym"} ${a.sessionsPerWeek || "4"}x/week + ${a.dietary || "calorie-aware"} eating 5 days/week; doctor-cleared plan from Wk 1; consistent routine for 8 weeks`,
      measurableCriteria: `${measurable.join("; ") || "weekly measurements logged"}; food/activity log 5 days/week; energy score rated weekly; doctor follow-up Wk 4`,
      achievableResources: `Doctor consultation ${a.doctorDone === "Yes — cleared to proceed" ? "complete" : "booked for Wk 1"}; ${a.movement || "gym"} accessible; ${a.dietary || "calorie-aware"} meal plan ready; LEAP accountability structure`,
      relevantAlignment: `Sustaining ${a.movement || "gym"} + ${a.dietary || "clean eating"} through Intensives, Workshops, and social events is new territory — this time it is doctor-supervised and LEAP-accountable`,
      endDate: "June 19, 2026",
      excitingMotivation: `The confidence and energy to show up fully in every area of LEAP; the version of myself at graduation photos knowing I kept the hardest commitment to my own body`,
      rewardingBenefits: `${specificGoal} achieved; maintenance week complete; doctor confirms improvement; testimony: "I became the person I committed to be"`,
    };
  },
  answerRisks: (a) => {
    const risks: Array<{ field?: string; message: string }> = [];
    const wStart = parseFloat(a.weightCurrent || "0");
    const wEnd   = parseFloat(a.weightTarget  || "0");
    if (wStart > 0 && wEnd > 0 && wStart > wEnd) {
      const totalLoss  = wStart - wEnd;
      const weeklyRate = totalLoss / 7; // 7 execution weeks (Wk2–Wk8)
      if (weeklyRate > 1) {
        risks.push({
          field: "weightTarget",
          message: `${totalLoss.toFixed(1)} kg in 7 weeks = ${weeklyRate.toFixed(2)} kg/week. The safe medical maximum is 1 kg/week. Adjust your target to ${Math.ceil(wStart - 7)} kg or higher, or get explicit doctor sign-off for this rate.`,
        });
      } else if (weeklyRate > 0.85) {
        risks.push({
          field: "weightTarget",
          message: `${weeklyRate.toFixed(2)} kg/week is near the safe ceiling of 1 kg/week. Achievable, but only with very consistent exercise AND diet — confirm this is doctor-cleared.`,
        });
      }
    }
    // Sessions per week — student LEAP obligations: welcome enrollee before 9am at doors open (FLEX Sat, ALC Fri+Sat), free after; attend graduation 6pm last day + Workshop Sun
    const sess = parseInt(a.sessionsPerWeek || "4");
    if (sess >= 6) {
      risks.push({
        field: "sessionsPerWeek",
        message: `6 sessions/week is very aggressive alongside LEAP. Your weekday evenings must be consistently free. On LEAP Sundays with Workshop or Graduation events, protect the evening — gym in the morning and rest by 5pm.`,
      });
    }
    // Proof alignment check
    if (a.proofMain) {
      const validProofKw = ["before/after","measurement chart","medical test","progress photo","health app","fitness achievement","gps","doctor"];
      if (!validProofKw.some((kw: string) => a.proofMain.toLowerCase().includes(kw.toLowerCase()))) {
        risks.push({ field: "proofMain", message: `Your goal declares a specific health number (weight, measurement, or medical marker). The most direct proof is before/after photos, a measurement chart, or medical test results showing the number changed. "${a.proofMain}" may not directly show your result was achieved — review with your coach.` });
      }
    }
    return risks;
  },
  milestones: (a) => {
    const targets = (a.primaryTarget || "Weight loss (kg)").split(",").map(s => s.trim());
    const hasWeight  = targets.some(t => t.includes("Weight"));
    const hasMeasure = targets.some(t => t.includes("Body"));
    const hasMedical = targets.some(t => t.includes("Medical"));
    const hasFitness = targets.some(t => t.includes("fitness"));
    const sess = parseInt(a.sessionsPerWeek || "4");

    // Weight loss week-by-week interpolation
    const wStart = parseFloat(a.weightCurrent || "0");
    const wEnd   = parseFloat(a.weightTarget  || "0");
    const wLoss  = Math.max(0, wStart - wEnd);
    const wAt = (wk: number) => wStart > 0 && wLoss > 0
      ? `${Math.round((wStart - wLoss * ((wk - 1) / 7)) * 10) / 10} kg`
      : null;

    // Measurement interpolation from per-part pill fields
    const bpList = (a.bodyParts || "").split(",").map(s => s.trim()).filter(Boolean);
    const mSlots = [
      { part: "waist",  s: parseFloat(a.waistCurrent||"0"),  e: parseFloat(a.waistTarget||"0") },
      { part: "hips",   s: parseFloat(a.hipsCurrent||"0"),   e: parseFloat(a.hipsTarget||"0") },
      { part: "chest",  s: parseFloat(a.chestCurrent||"0"),  e: parseFloat(a.chestTarget||"0") },
      { part: "arms",   s: parseFloat(a.armsCurrent||"0"),   e: parseFloat(a.armsTarget||"0") },
      { part: "thighs", s: parseFloat(a.thighsCurrent||"0"), e: parseFloat(a.thighsTarget||"0") },
    ].filter(m => bpList.includes(m.part) && m.s > 0 && m.e > 0);

    const mAt = (wk: number) => mSlots.length
      ? mSlots.map(m => `${m.part} ${Math.round((m.s - (m.s - m.e)*((wk-1)/7))*10)/10} cm`).join(", ")
      : null;

    // Medical labels from per-marker pill fields
    const hmList = (a.healthMarkers || "").split(",").map(s => s.trim()).filter(Boolean);
    const medLabels: string[] = [];
    if (hmList.includes("cholesterol"))          medLabels.push("cholesterol");
    if (hmList.includes("blood sugar (fasting)")) medLabels.push("blood sugar");
    if (hmList.includes("blood pressure"))        medLabels.push("BP");
    if (hmList.includes("uric acid"))             medLabels.push("uric acid");
    if (hmList.includes("HbA1c"))                 medLabels.push("HbA1c");
    if (hmList.includes("triglycerides"))         medLabels.push("triglycerides");
    if (hmList.includes("creatinine"))            medLabels.push("creatinine");
    if (hmList.includes("other") && a.otherMarkerName) medLabels.push(a.otherMarkerName);

    const wkTarget = (wk: number) => {
      const parts: string[] = [];
      if (hasWeight  && wAt(wk))    parts.push(`weight ${wAt(wk)}`);
      if (hasMeasure && mAt(wk))    parts.push(mAt(wk)!);
      if (hasMedical && wk === 7 && medLabels.length)
        parts.push(`${medLabels.join("+")} targets reached`);
      if (hasFitness) parts.push(wk >= 7 ? `"${a.fitnessTarget||"target"}" achieved` : "fitness progressing");
      return parts.join(" + ") || "on track";
    };

    const baselineText = () => {
      const parts: string[] = [];
      if (hasWeight  && a.weightCurrent) parts.push(`weight: ${a.weightCurrent} kg`);
      if (hasMeasure && mSlots.length)   parts.push(mSlots.map(m=>`${m.part}: ${m.s} cm`).join(", "));
      if (hasMedical && medLabels.length) {
        const currMap: Record<string,string> = {
          "cholesterol": a.cholCurrent||"?", "blood sugar": a.bgCurrent||"?",
          "BP": a.bpCurrent||"?", "uric acid": a.uaCurrent||"?",
          "HbA1c": a.hba1cCurrent||"?", "triglycerides": a.trigCurrent||"?",
          "creatinine": a.creatCurrent||"?",
        };
        parts.push(medLabels.map(n => `${n}: ${currMap[n] ?? a.otherMarkerCurrent ?? "?"}`).join("; "));
      }
      if (hasFitness && a.fitnessNow)    parts.push(`fitness: "${a.fitnessNow}"`);
      return parts.join("; ") || "baseline";
    };

    return [
      { weekNumber:1, cumulativePercentage:WK_PCT[0],
        description:`Doctor consultation → cleared → FIRST sessions done. Baseline logged. Schedule locked. Game starts NOW.`,
        actions:[
          {text:`Doctor consultation — get clearance + confirm targets: ${baselineText()}`,days:[1]},
          {text:`Log all baselines in GoalGetter — this is your starting line`,days:MON},
          {text:`Set up ${a.movement||"gym"} schedule — ${sess}+ sessions/week locked in calendar`,days:MON},
          {text:`First ${a.movement||"gym"} session this week — even if just 30 min, do it before Sunday`,days:[2,3]},
          {text:`Start ${a.dietary||"calorie-aware"} eating plan — first day’s meals prepped`,days:[2]},
          {text:`Sunday meal prep for Wk 2 + first week reflection`,days:SUN},
        ],
        results:[
          {text:`Baselines logged: ${baselineText()}`},
          {text:"Doctor clearance confirmed"},
          {text:`FIRST ${a.movement||"gym"} session done — you started!`},
          {text:`${a.movement||"gym"} schedule locked`},
        ] },
      { weekNumber:2, cumulativePercentage:WK_PCT[1],
        description:`${a.movement||"gym"} ${sess} sessions + ${a.dietary||"calorie-aware"} log 5 days; check: ${wkTarget(2)}`,
        actions:[
          {text:`${a.movement||"gym"} — ${sess} sessions this week; FLEX 298 Sat May 9 + Sun May 10 — welcome your enrollee before 9am Sat (free after), attend closing Sun; gym Sat after 9am or any weekday`,days:[0,1,2,4,5]},
          {text:`${a.dietary||"calorie-aware"} food log — at least 5 days this week`,days:[0,1,2,3,4]},
          {text:`Sunday check: ${hasWeight?"weigh-in":"measurement"} + energy score`,days:SUN},
          {text:"Meal prep for Wk 3",days:SUN},
        ],
        results:[{text:`${sess} gym sessions complete ✔`},{text:`Check: ${wkTarget(2)}`}] },
      { weekNumber:3, cumulativePercentage:WK_PCT[2],
        description:`${a.movement||"gym"} ${sess} sessions kept; routine holds through busy weekend; check: ${wkTarget(3)}`,
        actions:[
          {text:`${a.movement||"gym"} — ${sess} sessions this week; FLEX 299 Sat May 16 — welcome enrollee before 9am (free after); 1st Workshop Sun May 17 — gym Sat or early Sun before workshop`,days:[0,1,2,3,4,5]},
          {text:"Pre-pack meals before 1st Workshop (May 17)",days:[5]},
          {text:"1st Workshop May 17 — stay on plan",days:[6]},
          {text:`Sunday check: ${hasWeight?"weigh-in":"measurement"} + share progress`,days:SUN},
        ],
        results:[{text:"Routine survived Workshop weekend"},{text:`Check: ${wkTarget(3)}`}] },
      { weekNumber:4, cumulativePercentage:WK_PCT[3],
        description:`Midpoint: ${wkTarget(4)}; ${hasMedical?"doctor re-test done":"coach check-in done"}; plan adjusted if needed`,
        actions:[
          {text:`${a.movement||"gym"} — ${sess} sessions this week; 2nd Intensive Sat May 23 + Sun May 24 — welcome enrollee before 9am Sat (free after), attend closing Sun; gym Sat after 9am or any weekday`,days:[0,1,2,3,4,5]},
          {text:"2nd Intensive May 23–24 UP BGC — protect routine; healthy options at the venue",days:[5,6]},
          {text:"Midpoint doctor/coach check-in — adjust plan if needed",days:[3]},
          {text:`Sunday: ${hasMedical?"doctor re-test scheduled?":"measurement"} + midpoint celebration`,days:SUN},
        ],
        results:[{text:`Midpoint check: ${wkTarget(4)}`},{text:"Doctor/coach check-in done"},{text:"Plan adjusted if needed"}] },
      { weekNumber:5, cumulativePercentage:WK_PCT[4],
        description:`${a.movement||"gym"} ${sess} sessions; check: ${wkTarget(5)}; progress shared with coach`,
        actions:[
          {text:`${a.movement||"gym"} — ${sess} sessions this week; by now this should feel like you`,days:[0,1,2,4]},
          {text:"Share progress in LEAP community",days:[1]},
          {text:`Sunday check: ${wkTarget(5)}`,days:SUN},
          {text:"Plan Wk 6 meals — ALC weekend coming",days:[4]},
        ],
        results:[{text:`Check: ${wkTarget(5)}`},{text:"Progress shared publicly"}] },
      { weekNumber:6, cumulativePercentage:WK_PCT[5],
        description:`${a.movement||"gym"} ${sess} sessions kept; routine holds through intensive weekend; check: ${wkTarget(6)}`,
        actions:[
          {text:`${a.movement||"gym"} — ${sess} sessions this week; ALC 256 Fri Jun 5–Sun Jun 7 — welcome enrollee before 9am Fri+Sat (free after); graduation Sun Jun 7 at 6pm — gym Fri after 9am, Sat freely, or Sun morning`,days:[0,1,2,3,4,5]},
          {text:"ALC 256 Fri Jun 5 – Sun Jun 7 SMX Aura — bring healthy snacks; stay on meal plan",days:[4,5,6]},
          {text:`Sunday check: ${wkTarget(6)}`,days:SUN},
          {text:"Plan final 2-week push",days:SUN},
        ],
        results:[{text:"Routine protected through ALC weekend"},{text:`Check: ${wkTarget(6)}`}] },
      { weekNumber:7, cumulativePercentage:WK_PCT[6],
        description:`TARGET HIT — ${wkTarget(7)}; routine documented; maintenance plan ready`,
        actions:[
          {text:`${a.movement||"gym"} — ${sess} sessions final push; ALC 257 Fri Jun 12–Sun Jun 14 — welcome enrollee before 9am Fri+Sat (free after); graduation + 2nd Workshop Sun Jun 14 — gym Fri after 9am or Sat freely`,days:[0,1,2,3,4,5]},
          {text:"ALC 257 Fri Jun 12 – Sun Jun 14 + 2nd Workshop — celebrate your health win with your coach",days:[4,5,6]},
          {text:"Document what worked — routine, meals, mindset",days:[2]},
          {text:`Sunday final measurement — confirm ${wkTarget(7)}`,days:SUN},
        ],
        results:[{text:`TARGET REACHED: ${wkTarget(7)} ✓`},{text:"Success documented"},{text:"Maintenance plan designed"}] },
      { weekNumber:8, cumulativePercentage:WK_PCT[7],
        description:`${wkTarget(7)} maintained; ${a.proofMain || "proof"} ready for Graduation Jun 21`,
        actions:[
          {text:`Maintain ${a.movement||"gym"} — 3–4 sessions this week (graduation week — protect the habit, not perfect the number)`,days:[0,1,2,4]},
          {text:`Final measurement Jun 18 — confirm maintenance of ${wkTarget(7)}`,days:[3]},
          {text:"Graduation Sun Jun 21 — arrive as the person you committed to become",days:[6]},
          {text:`Compile ${a.proofMain || "your proof"} — your contract receipt; have it ready to present at Graduation Jun 21`,days:[1,2,3]},
          {text:"Testimony complete by Jun 19",days:[4]},
        ],
        results:[{text:`${wkTarget(7)} maintained ✓`},{text:"Testimony ready Jun 19"},{text:"Health identity confirmed"},{text:`${a.proofMain || "Proof"} COMPLETE ✓ — declaration proven`}] },
    ];
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// PERSONAL — Being-ness & Essence (includes Purpose/Legacy sub-option)
// ─────────────────────────────────────────────────────────────────────────────
const personalBeingness: GoalTemplate = {
  id: "personal-beingness",
  goalType: "personal",
  subType: "beingness",
  name: "Being-ness & Essence",
  description: "Embed 1–3 essence qualities into daily life through a consistent practice — BECOMING who you choose to be, not just doing a routine.",
  wheelAreaHint: "Area B: Mental Wellness · Area L: Purpose/Legacy",
  questions: [
    { id: "qualities",   label: "Essence quality/qualities to embody (pick 1–3)", type: "multiselect",
      options: ["disciplined","present","joyful","calm","confident","courageous","loving","generous","patient","grateful","focused","resilient","bold","humble","authentic","peaceful","abundant","purposeful","playful","free","other"],
      hint: "Pick 1–3 qualities. These become your daily identity target." },
    { id: "experience", label: "What do you want to experience/feel by graduation?", type: "multiselect",
      options: ["inner peace","deep confidence","real joy","clarity of purpose","emotional freedom","a sense of aliveness","total presence","unshakeable discipline","genuine connection","radical self-acceptance","other"],
      hint: "Choose what you want your inner life to feel like — not just what you want to do." },
    { id: "practice",   label: "Daily practice to build it", type: "multiselect",
      options: ["journaling","morning workout","meditation","prayer","visualization","cold shower","gratitude practice","reading","breathwork","evening reflection","other"],
      hint: "Can combine: journaling + workout + meditation. Pick all that apply." },
    { id: "timing",     label: "When do you do your practice?", type: "multiselect", options: ["morning","midday","evening"], defaultValue: "morning" },
    { id: "currentScore",label: "Current self-score for this quality (1–10)", type: "number", placeholder: "4", defaultValue: "4" },
    { id: "targetScore", label: "Target self-score by Wk 7",                 type: "number", placeholder: "8", defaultValue: "8" },
    { id: "purpose",    label: "Include a legacy/purpose dimension?", type: "select",
      options: ["No — focus on personal being-ness only","Yes — leave a mark (family / community / work / the world)"], defaultValue: "No — focus on personal being-ness only" },
    { id: "purposeDescription", label: "What mark do you want to leave?", type: "text",
      placeholder: "e.g., be a present father, build something for my community, inspire my team",
      hint: "This becomes the legacy thread woven into your weekly milestones.",
      dependsOn: { id: "purpose", value: "Yes" } },
    { id: "proofMain", label: "Primary proof — what will you present at Graduation? (choose 1)", type: "select",
      options: ["Beingness journal — 30+ quality moments documented","Video diary compilation — moments of quality on camera","Testimonial from someone who witnessed the change","Written testimony — \"Before vs. After\" story","Photo scrapbook of quality-building moments","Audio/video declaration — \"I am [quality]\" recorded Day 1 and Day 56","Other"],
      defaultValue: "Beingness journal — 30+ quality moments documented",
      hint: "This proves the score shift is REAL — 30+ entries showing your quality in action, not just in your head." },
    { id: "proofSupport", label: "Supporting evidence (optional — pick 1–2 more)", type: "multiselect",
      options: ["written testimony (printed + signed)","blog post / article","LinkedIn post / social media post","Instagram / Facebook Reel or TikTok","digital photo album (Google Photos / iCloud)","printed scrapbook","short film (1–3 min)","personal website / portfolio page","Canva PDF presentation","Notion page / digital portfolio","presentation to LEAP batch at Graduation","letter to my future self","music video / creative video","artwork / painting / illustration","handwritten journal (printed + bound)","other"],
      hint: "Up to 2 extras that support your main proof — powerful but not required." },
  ],
  smarter: (a) => ({
    goalStatement: `Throughout 8 weeks, I practice ${(a.practice || "journaling + reflection").split(",")[0]} at least 5 days per week and ${a.purpose?.startsWith("Yes") && a.purposeDescription ? `show up as the ${a.purposeDescription} I am committed to be` : `grow my ${a.qualities?.split(",")[0]?.trim() || "essence quality"} self-score from ${a.currentScore || 4} to ${a.targetScore || 8}`}, and prove it with ${a.proofMain || "documented evidence"}, by June 19, 2026.`,
    specificDetails: `Embody ${a.qualities || "chosen essence quality"} through a consistent ${a.timing || "morning"} practice (${a.practice || "journaling + movement"}), 5 days/week for 8 weeks${a.purpose?.startsWith("Yes") ? `; channel this quality into a legacy action: ${a.purposeDescription || "leave a mark on family/community"}` : ""}`,
    measurableCriteria: `Practice tracked (target 5 days/week); self-score for ${a.qualities || "quality"} from ${a.currentScore || 4} → ${a.targetScore || 8} (rated every Sunday); 1 meaningful insight shared with coach weekly${a.experience ? `; target experience: ${a.experience}` : ""}`,
    achievableResources: `${a.timing || "Morning"} time block protected; journal and materials ready; LEAP accountability structure weekly; 8-week programme as the container that holds the commitment`,
    relevantAlignment: `I have tried and stopped this practice before — this time LEAP structure + public declaration makes this the first time I sustain it for 8 weeks; going from score ${a.currentScore || 4} to ${a.targetScore || 8} is new identity territory`,
    endDate: "June 19, 2026",
    excitingMotivation: `Starting every day as the ${a.qualities || "quality"} person I am becoming — not fighting myself, but being myself${a.experience ? `; experiencing ${a.experience} for real by graduation` : ""}; the moment I can say "this is who I am now" with full conviction`,
    rewardingBenefits: `Score ${a.currentScore || 4} → ${a.targetScore || 8}; 48+ days of consistent practice; proven identity shift that outlasts LEAP; testimony at graduation${a.purpose?.startsWith("Yes") ? `; legacy action complete: ${a.purposeDescription || "mark left"}` : ""}`,
  }),
  answerRisks: (a) => {
    const risks: Array<{ field?: string; message: string }> = [];
    const curr = parseInt(a.currentScore || "4");
    const targ = parseInt(a.targetScore  || "8");
    if (curr > 0 && targ > 0 && curr >= targ) {
      risks.push({ field: "targetScore", message: `Your starting score (${curr}) is already at or above your target (${targ}). Set a higher target to make this goal worth doing.` });
    } else if (targ - curr > 6) {
      risks.push({ field: "targetScore", message: `Jumping from ${curr} to ${targ} in 7 weeks is a very large shift. A realistic ceiling is 5–6 points in 8 weeks. Consider setting your target at ${curr + 5} and pushing from there.` });
    }
    // Proof alignment check
    if (a.proofMain) {
      const validProofKw = ["journal","video diary","testimonial","testimony","scrapbook","audio","recording","declaration"];
      if (!validProofKw.some((kw: string) => a.proofMain.toLowerCase().includes(kw.toLowerCase()))) {
        risks.push({ field: "proofMain", message: `Your goal declares a score shift from daily practice. The most direct proof is a beingness journal (30+ documented moments), video diary, or testimonial from someone who witnessed the change. "${a.proofMain}" may not directly show your result was achieved — review with your coach.` });
      }
    }
    return risks;
  },
  milestones: (a) => [
    { weekNumber:1, cumulativePercentage:WK_PCT[0], description:`Declare quality publicly; design practice; first 7-day streak; baseline score ${a.currentScore || 4}`,
      actions:[{text:`Declare ${a.qualities || "your quality"} publicly — share with coach + at least 1 person`,days:MON},{text:`Set up ${a.timing || "morning"} practice: alarm, journal, materials`,days:MON},{text:`Practice 5x this week — ${a.practice || "journaling + movement"}`,days:[0,1,2,3,4]},{text:"Sunday score rating + first insight logged",days:SUN}],
      results:[{text:`Quality declared: ${a.qualities || "chosen quality"}`},{text:`7-day practice streak started`},{text:`Baseline score: ${a.currentScore || 4}`}] },
    { weekNumber:2, cumulativePercentage:WK_PCT[1], description:`12/14 days; patterns surfacing; score ${parseInt(a.currentScore||"4")+1}; first insight shared with coach`,
      actions:[{text:`${a.timing || "Morning"} practice — ${a.practice || "journaling + movement"} — 5x this week`,days:[0,1,2,3,4]},{text:"Journal reflection: where did this quality show up? (3x this week)",days:[0,2,4]},{text:`Coaching call: share 1 insight about ${a.qualities || "quality"} this week`,days:[2]},{text:"Sunday score + pattern reflection",days:SUN}],
      results:[{text:"12/14 days completed"},{text:`Score ${parseInt(a.currentScore||"4")+1}`},{text:"First insight shared"}] },
    { weekNumber:3, cumulativePercentage:WK_PCT[2], description:`18/21 days; identity language emerging; practice survives any schedule`,
      actions:[{text:`Practice — ${a.practice || "journaling + movement"} — 5x this week`,days:[0,1,2,3,4]},{text:"1st Workshop May 17 — practice the MORNING OF the workshop",days:[6]},{text:`Journal: "I am ${a.qualities || "quality"}" — identity statement (3x this week)`,days:[0,2,4]},{text:"Sunday score + breakthrough noted",days:SUN}],
      results:[{text:"18/21 days complete"},{text:`Practice survived Workshop weekend`},{text:`Score ${parseInt(a.currentScore||"4")+2}`}] },
    { weekNumber:4, cumulativePercentage:WK_PCT[3], description:`Quality showed up WITHOUT effort — documented; score ${parseInt(a.currentScore||"4")+3}; midpoint identity confirmed`,
      actions:[{text:`Practice — 5x this week Mon–Fri; Sat–Sun at 2nd Intensive = live test of your quality`,days:[0,1,2,3,4]},{text:"2nd Intensive May 23–24 UP BGC — note: which moment did your quality show up?",days:[5,6]},{text:`Journal entry: "It happened without thinking — I just WAS ${a.qualities || "quality"}"`,days:[3]},{text:"Midpoint score + coaching check-in",days:SUN}],
      results:[{text:"24/28 days complete"},{text:"Quality showed up effortlessly — documented"},{text:`Score ${parseInt(a.currentScore||"4")+3}`}] },
    { weekNumber:5, cumulativePercentage:WK_PCT[4], description:`30/35 days; new pattern chosen 3+ times — documented; score ${parseInt(a.currentScore||"4")+4}`,
      actions:[{text:`Practice — 5x this week; habit by now`,days:[0,1,2,3,4]},{text:`Share how ${a.qualities || "quality"} is changing your relationships`,days:[2]},{text:"Journal: 3 situations where you chose your quality over old patterns (3x this week)",days:[0,2,4]},{text:"Sunday score",days:SUN}],
      results:[{text:"30/35 days complete"},{text:`Score ${parseInt(a.currentScore||"4")+4}`}] },
    { weekNumber:6, cumulativePercentage:WK_PCT[5], description:`Quality visible to others — coach or peer names it; score ${parseInt(a.currentScore||"4")+4}+`,
      actions:[{text:`Practice — 5x this week`,days:[0,1,2,3,4]},{text:`Ask coach or 1 friend: "Do you notice any change in me?"`,days:[2]},{text:"ALC 256 Jun 5–7 — carry your quality into the event; note how it shows up",days:[4,5,6]},{text:"Sunday score",days:SUN}],
      results:[{text:"Quality recognized externally ✓"},{text:`Score approaching ${parseInt(a.targetScore||"8")-1}`}] },
    { weekNumber:7, cumulativePercentage:WK_PCT[6], description:`Score ${a.targetScore || 8} — TARGET HIT; next-level expression designed`,
      actions:[{text:`Practice — 5x this week — final push to score ${a.targetScore || 8}`,days:[0,1,2,3,4]},{text:"2nd Workshop Jun 14 — share your being-ness journey with your coach",days:[6]},{text:`Journal: "How will I express ${a.qualities || "quality"} beyond LEAP?"`,days:[4,5]},{text:"Sunday final score measurement",days:SUN}],
      results:[{text:`Score ${a.targetScore || 8} REACHED ✓`},{text:"Journey shared at 2nd Workshop"},{text:"Next-level expression designed"}] },
    { weekNumber:8, cumulativePercentage:WK_PCT[7], description:`Quality documented as permanent identity; ${a.proofMain || "proof"} ready for Graduation Jun 21`,
      actions:[{text:`Compile ${a.proofMain || "your proof"} — your contract receipt; have it ready to present at Graduation Jun 21`,days:[1,2,3]},
          {text:`Practice — 3x this week (graduation week — protect the habit)`,days:[0,2,4]},{text:`Compile ${a.proofMain || "your proof"} — your contract receipt; have it ready to present at Graduation Jun 21`,days:[1,2,3]},
          {text:"Write final testimony: 'Before LEAP → After LEAP' identity shift",days:[1,2]},{text:"Graduation Sun Jun 21 — show up AS the quality",days:[6]},{text:"Submit testimony by Jun 19",days:[4]}],
      results:[{text:`Quality: ${a.qualities || "quality"} is permanent ✓`},{text:`Identity: ${a.qualities || "quality"} is permanent`},{text:"Testimony ready Jun 19"},{text:`${a.proofMain || "Proof"} COMPLETE ✓ — declaration proven`}] },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// PERSONAL — Relationship: Deepening an Existing Bond
// ─────────────────────────────────────────────────────────────────────────────
const personalRelationshipDeepen: GoalTemplate = {
  id: "personal-relationship-deepen",
  goalType: "personal",
  subType: "relationship-deepen",
  name: "Deepening a Relationship",
  description: "Grow a real relationship through YOUR consistent showing up — not changing the other person, but measuring your own presence and actions.",
  wheelAreaHint: "Area C: Relationships · Area E: Family & Home",
  questions: [
    { id: "relation",      label: "Who is this with?", type: "select",
      options: ["partner","parent","sibling","close friend","child","mentor","grandparent","estranged family member","housemate / roommate","teammate / colleague"], defaultValue: "partner" },
    { id: "currentScore",  label: "Current closeness score (1–10)",  type: "number", placeholder: "5", defaultValue: "5" },
    { id: "targetScore",   label: "Target closeness score",          type: "number", placeholder: "8", defaultValue: "8" },
    { id: "sessionsPerWk", label: "Quality sessions per week you commit to", type: "number", placeholder: "3", defaultValue: "3" },
    { id: "sessionLength", label: "Duration per quality session (e.g., 1 hr)", type: "text", placeholder: "1 hr", defaultValue: "1 hr" },
    { id: "proofMain", label: "Primary proof — what will you present at Graduation? (choose 1)", type: "select",
      options: ["Photo/memory album — 8 weeks with [person]","Written letter to [person] about the 8-week journey","Testimonial from [person] about changes they noticed","Scrapbook of shared memories and experiences","Video message to or from [person]","Joint photo at a meaningful shared moment","Other"],
      defaultValue: "Photo/memory album — 8 weeks with [person]",
      hint: "This proves the relationship GREW through real shared moments — not just in your heart, but visible to both of you." },
    { id: "proofSupport", label: "Supporting evidence (optional — pick 1–2 more)", type: "multiselect",
      options: ["written testimony (printed + signed)","blog post / article","LinkedIn post / social media post","Instagram / Facebook Reel or TikTok","digital photo album (Google Photos / iCloud)","printed scrapbook","short film (1–3 min)","personal website / portfolio page","Canva PDF presentation","Notion page / digital portfolio","presentation to LEAP batch at Graduation","letter to my future self","music video / creative video","artwork / painting / illustration","handwritten journal (printed + bound)","other"],
      hint: "Up to 2 extras that support your main proof — powerful but not required." },
  ],
  smarter: (a) => ({
    goalStatement: `Throughout 8 weeks, I show up for my ${a.relation || "partner"} with ${a.sessionsPerWk || 3} quality sessions per week and at least 1 meaningful gesture weekly, growing our closeness from ${a.currentScore || 5} to ${a.targetScore || 8}, and prove it with ${a.proofMain || "documented evidence"}, by June 19, 2026.`,
    specificDetails: `Show up for my ${a.relation || "partner"} with ${a.sessionsPerWk || 3} × ${a.sessionLength || "1-hr"} phone-free quality sessions/week + 1 meaningful gesture/week for 8 weeks; presence and vulnerability as the practice`,
    measurableCriteria: `Track ${a.sessionsPerWk || 3} sessions + 1 gesture/week in GoalGetter; closeness score ${a.currentScore || 5} → ${a.targetScore || 8} (rated Sunday); journal 1 meaningful moment/week`,
    achievableResources: `Schedule protected; phone-basket rule established; commitment communicated to ${a.relation || "partner"}; LEAP accountability partner for reflection; coaching call check-ins`,
    relevantAlignment: `Work and busyness have consistently eroded my presence — for the first time I am treating this relationship as a committed goal, not an intention; going from score ${a.currentScore || 5} to ${a.targetScore || 8} requires real behavior change`,
    endDate: "June 19, 2026",
    excitingMotivation: `Building the relationship I always wanted through MY actions — being the person who shows up every time, not the person who means to; the closeness I create over 8 weeks will be real and earned`,
    rewardingBenefits: `Closeness score ${a.currentScore || 5} → ${a.targetScore || 8}; ${parseInt(a.sessionsPerWk || "3") * 8 * parseInt((a.sessionLength || "1 hr").match(/\d+/)?.[0] || "1")}+ quality hours given; identity as a present and reliable person; graduation testimony`,
  }),
  answerRisks: (a) => {
    const risks: Array<{ field?: string; message: string }> = [];
    const curr = parseInt(a.currentScore || "5");
    const targ = parseInt(a.targetScore  || "8");
    if (curr > 0 && targ > 0 && curr >= targ) {
      risks.push({ field: "targetScore", message: `Your starting score (${curr}) is already at or above your target (${targ}). Set a higher target to make this goal worth doing.` });
    } else if (targ - curr > 6) {
      risks.push({ field: "targetScore", message: `Jumping from ${curr} to ${targ} in 7 weeks is a very large shift. A realistic ceiling is 5–6 points. Consider setting your target at ${curr + 5} and pushing from there.` });
    }
    // Proof alignment check
    if (a.proofMain) {
      const validProofKw = ["album","letter","testimonial","scrapbook","video message","joint photo","memory"];
      if (!validProofKw.some((kw: string) => a.proofMain.toLowerCase().includes(kw.toLowerCase()))) {
        risks.push({ field: "proofMain", message: `Your goal declares a closeness score shift through consistent sessions. The most direct proof is a photo/memory album, written letter to or from the person, or their testimonial about changes they noticed. "${a.proofMain}" may not directly show your result was achieved — review with your coach.` });
      }
    }
    return risks;
  },
  milestones: (a) => [
    { weekNumber:1, cumulativePercentage:WK_PCT[0], description:`Commitment conversation done; schedule protected; baseline ${a.currentScore || 5} logged; phone-basket rule set`,
      actions:[{text:`Have commitment conversation with ${a.relation || "partner"} — share goal and schedule`,days:MON},{text:"Set up phone-basket rule (phones away during sessions)",days:MON},{text:`Week 1: ${a.sessionsPerWk || 3} quality sessions completed`,days:MON_FRI},{text:"Sunday closeness score + 1 meaningful moment journaled",days:SUN}],
      results:[{text:`Commitment communicated`},{text:`Baseline: ${a.currentScore || 5}`},{text:`${a.sessionsPerWk || 3} sessions held`}] },
    { weekNumber:2, cumulativePercentage:WK_PCT[1], description:`${(parseInt(a.sessionsPerWk||"3")*2)} sessions; first gesture done; score ${parseInt(a.currentScore||"5")+.5}; first vulnerable share logged`,
      actions:[{text:`${a.sessionsPerWk || 3} quality sessions this week — phones away`,days:MON_FRI},{text:"Do 1 meaningful gesture (surprise, act of service, handwritten note)",days:[2]},{text:"Share 1 vulnerable feeling or thought during a session",days:[3]},{text:"Sunday score + reflection",days:SUN}],
      results:[{text:`${(parseInt(a.sessionsPerWk||"3")*2)} total sessions complete`},{text:"1 gesture done"},{text:"First vulnerable share logged"}] },
    { weekNumber:3, cumulativePercentage:WK_PCT[2], description:`${parseInt(a.sessionsPerWk||"3")*3} sessions cumulative; quality deepening; score ${parseInt(a.currentScore||"5")+1}`,
      actions:[{text:`${a.sessionsPerWk || 3} sessions — protect schedule around 1st Workshop (May 17)`,days:MON_FRI},{text:"Plan 1 shared experience this week (walk, meal, outing)",days:[1,2]},{text:"1st Workshop May 17 — share your relationship goal in your testimony",days:[6]},{text:"Sunday closeness score",days:SUN}],
      results:[{text:"Sessions maintained through Workshop weekend"},{text:`Score ${parseInt(a.currentScore||"5")+1}`}] },
    { weekNumber:4, cumulativePercentage:WK_PCT[3], description:`${parseInt(a.sessionsPerWk||"3")*4} sessions cumulative; 1 meaningful shared experience created; closeness ${parseInt(a.currentScore||"5")+2}`,
      actions:[{text:`${a.sessionsPerWk || 3} sessions`,days:MON_FRI},{text:"Create 1 meaningful shared experience or memory this week",days:[3,4]},{text:`2nd Intensive May 23–24 UP BGC — tell ${a.relation || 'your person'} why this matters; send a message from the event`,days:[5]},{text:"Sunday score",days:SUN}],
      results:[{text:"Shared experience created"},{text:`Closeness score ${parseInt(a.currentScore||"5")+2}`}] },
    { weekNumber:5, cumulativePercentage:WK_PCT[4], description:`${parseInt(a.sessionsPerWk||"3")*5} sessions cumulative; ${a.relation || "person"} notices change; score ${parseInt(a.currentScore||"5")+3}`,
      actions:[{text:`${a.sessionsPerWk || 3} sessions`,days:MON_FRI},{text:`Ask ${a.relation || "your person"}: "Have you noticed anything different about us lately?"`,days:[2]},{text:"Journal: how has your own presence changed? (3x this week)",days:[0,2,4]},{text:"Sunday score",days:SUN}],
      results:[{text:`${a.relation || "Person"} confirms positive change noticed ✓`},{text:`Score ${parseInt(a.currentScore||"5")+3}`}] },
    { weekNumber:6, cumulativePercentage:WK_PCT[5], description:`${parseInt(a.sessionsPerWk||"3")*6} sessions cumulative; new shared ritual created; score approaching target`,
      actions:[{text:`${a.sessionsPerWk || 3} sessions — protect around ALC 256 Jun 5–7`,days:MON_FRI},{text:"Create and lock a new shared weekly ritual",days:[1]},{text:"Document the most memorable moment of the 8 weeks so far",days:[4]},{text:"Sunday score",days:SUN}],
      results:[{text:"New ritual created"},{text:"Memorable moment documented"},{text:`Score ${parseInt(a.currentScore||"5")+3.5}`}] },
    { weekNumber:7, cumulativePercentage:WK_PCT[6], description:`${parseInt(a.sessionsPerWk||"3")*7} sessions cumulative; closeness ${a.targetScore || 8} — TARGET HIT`,
      actions:[{text:`${a.sessionsPerWk || 3} sessions`,days:MON_FRI},{text:"2nd Workshop Jun 14 — share your relationship growth journey with your coach",days:[6]},{text:"Write: 'This is who I am now in this relationship'",days:[4,5]},{text:"Sunday final score",days:SUN}],
      results:[{text:`Closeness ${a.targetScore || 8} REACHED ✓`},{text:"Journey shared at 2nd Workshop"}] },
    { weekNumber:8, cumulativePercentage:WK_PCT[7], description:`${parseInt(a.sessionsPerWk||"3")*8} sessions COMPLETE; score ${a.targetScore || 8} confirmed; ${a.proofMain || "proof"} ready for Graduation Jun 21`,
      actions:[{text:`Compile ${a.proofMain || "your proof"} — your contract receipt; have it ready to present at Graduation Jun 21`,days:[1,2,3]},
          {text:`${a.sessionsPerWk || 3} sessions — final week`,days:MON_FRI},{text:"Write final testimony: before/after in this relationship",days:[1,2]},{text:`Graduation Sun Jun 21 — bring ${a.relation || "your person"} in spirit or in person`,days:[6]},{text:"Submit testimony by Jun 19",days:[4]}],
      results:[{text:`Final closeness score: ${a.targetScore || 8} ✓`},{text:"Testimony ready Jun 19"},{text:`${a.proofMain || "Proof"} COMPLETE ✓ — declaration proven`}] },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// PERSONAL — Becoming Partner-Ready
// ─────────────────────────────────────────────────────────────────────────────
const personalRelationshipPrepare: GoalTemplate = {
  id: "personal-relationship-prepare",
  goalType: "personal",
  subType: "relationship-prepare",
  name: "Becoming Partner-Ready",
  description: "Build the essence qualities and self-capacity for the relationship you want — 100% your actions, 100% your control, no specific target person.",
  wheelAreaHint: "Area D: Romance",
  questions: [
    { id: "prepFor",      label: "Preparing for?", type: "select",
      options: ["romantic relationship","deep friendship","family healing","rekindling a past bond"], defaultValue: "romantic relationship" },
    { id: "qualities",    label: "2–3 qualities to embody in relationship", type: "multiselect",
      options: ["loving","present","secure","patient","open","warm","committed","honest","vulnerable","playful","calm","generous","other"],
      hint: "Pick 2–3 qualities you want to BE in this relationship — these become your daily identity target." },
    { id: "currentScore", label: "Current self-score for these qualities (1–10)", type: "number", placeholder: "4", defaultValue: "4" },
    { id: "targetScore",  label: "Target score",                                   type: "number", placeholder: "8", defaultValue: "8" },
    { id: "practice",     label: "Practice(s) to build these qualities", type: "multiselect",
      placeholder: "e.g., journaling + therapy",
      options: ["journaling","therapy / counseling","social activities","mindfulness","prayer","volunteering / service","reading","support group","other"],
      hint: "Can combine multiple practices." },
    { id: "dating",       label: "Include dating as an action step?", type: "select",
      options: ["Yes — going on dates and meeting people builds real confidence","No — focus on inner work only"], defaultValue: "No — focus on inner work only" },
    { id: "datingFrequency", label: "Dates or social outings per week?", type: "number",
      placeholder: "1", defaultValue: "1",
      hint: "Even 1 outing/week over 8 weeks = 8 real-world practice opportunities.",
      dependsOn: { id: "dating", value: "Yes" } },
    { id: "proofMain", label: "Primary proof — what will you present at Graduation? (choose 1)", type: "select",
      options: ["Testimony journal — printed and compiled","Written declaration \"I am partner-ready\" — printed and signed","Testimonial from coach or therapist","Video declaration recorded on Day 1 and Day 56 — the shift is visible","Photo scrapbook of quality-building moments","Written evidence entries — 3 real-situation moments per week logged","Other"],
      defaultValue: "Testimony journal — printed and compiled",
      hint: "This proves your readiness was BUILT, not just felt — documented quality moments over 8 weeks that any coach can read." },
    { id: "proofSupport", label: "Supporting evidence (optional — pick 1–2 more)", type: "multiselect",
      options: ["written testimony (printed + signed)","blog post / article","LinkedIn post / social media post","Instagram / Facebook Reel or TikTok","digital photo album (Google Photos / iCloud)","printed scrapbook","short film (1–3 min)","personal website / portfolio page","Canva PDF presentation","Notion page / digital portfolio","presentation to LEAP batch at Graduation","letter to my future self","music video / creative video","artwork / painting / illustration","handwritten journal (printed + bound)","other"],
      hint: "Up to 2 extras that support your main proof — powerful but not required." },
  ],
  smarter: (a) => ({
    goalStatement: `Throughout 8 weeks, I practice ${(a.practice || "journaling + inner work").split(",")[0]} at least 5 days per week and grow my ${a.prepFor?.split(" ")[0] || "relationship"} readiness score from ${a.currentScore || 4} to ${a.targetScore || 8}, and prove it with ${a.proofMain || "documented evidence"}, by June 19, 2026.`,
    specificDetails: `Embody ${a.qualities || "loving, present, secure"} in preparation for a ${a.prepFor || "romantic relationship"} through ${a.practice || "journaling + therapy"}, 5×/week for 8 weeks${a.dating?.startsWith("Yes") ? "; include dating/meeting people as active practice" : ""}`,
    measurableCriteria: `Daily practice tracked; combined quality score ${a.currentScore || 4} → ${a.targetScore || 8} (rated Sunday); coaching/therapist check-in monthly; 1 real-situation test documented weekly`,
    achievableResources: `Journal and materials ready; ${a.practice || "therapy"} sessions booked; 30 min/day dedicated; LEAP accountability structure as container; ${a.dating?.startsWith("Yes") ? "social calendar for meeting new people" : "reflection practice"}`,
    relevantAlignment: `Past patterns of dependence or avoidance have blocked me from this quality — for the first time I am building from the inside out; going from score ${a.currentScore || 4} to ${a.targetScore || 8} requires real identity work, not just wishful thinking`,
    endDate: "June 19, 2026",
    excitingMotivation: `Showing up ready for love that lasts — not desperate, not closed, but genuinely whole; the version of me at graduation who knows "I did the work" and is no longer waiting`,
    rewardingBenefits: `Score ${a.currentScore || 4} → ${a.targetScore || 8}; documented evidence of new patterns; "I am partner-ready" identity confirmed at graduation; testimony: "I built the person I want to be in relationship"`,
  }),
  answerRisks: (a) => {
    const risks: Array<{ field?: string; message: string }> = [];
    const curr = parseInt(a.currentScore || "4");
    const targ = parseInt(a.targetScore  || "8");
    if (curr > 0 && targ > 0 && curr >= targ) {
      risks.push({ field: "targetScore", message: `Your starting score (${curr}) is already at or above your target (${targ}). Set a higher target to make this goal worth doing.` });
    } else if (targ - curr > 6) {
      risks.push({ field: "targetScore", message: `Jumping from ${curr} to ${targ} in 7 weeks is a very large shift. A realistic ceiling is 5–6 points. Consider setting your target at ${curr + 5} and pushing from there.` });
    }
    // Proof alignment check
    if (a.proofMain) {
      const validProofKw = ["journal","declaration","testimonial","video declaration","scrapbook","evidence","testimony"];
      if (!validProofKw.some((kw: string) => a.proofMain.toLowerCase().includes(kw.toLowerCase()))) {
        risks.push({ field: "proofMain", message: `Your goal declares a readiness score shift built through daily practice. The most direct proof is a compiled testimony journal, written declaration, or testimonial from your coach/therapist. "${a.proofMain}" may not directly show your result was achieved — review with your coach.` });
      }
    }
    return risks;
  },
  milestones: (a) => [
    { weekNumber:1, cumulativePercentage:WK_PCT[0], description:`Qualities declared; practice designed; ${a.dating?.startsWith("Yes") ? "social calendar set; " : ""}baseline ${a.currentScore || 4} logged`,
      actions:[{text:`Declare qualities publicly: "${a.qualities || "loving, present, secure"}" — share with coach`,days:MON},{text:`Start ${a.practice || "journaling"} daily — first entry`,days:MON},{text:a.dating?.startsWith("Yes") ? "Plan 2 social outings this month for meeting people" : "Book therapy/coaching session for Wk 2",days:[2]},{text:"Sunday score + reflection on old pattern",days:SUN}],
      results:[{text:`Qualities declared`},{text:`Baseline: ${a.currentScore || 4}`},{text:"Practice started"}] },
    { weekNumber:2, cumulativePercentage:WK_PCT[1], description:`10/14 sessions; past pattern identified; first insight; score ${parseInt(a.currentScore||"4")+1}`,
      actions:[{text:`${a.practice || "Journaling"} — 5 days this week`,days:[0,1,2,3,4]},{text:"Identify and name 1 old pattern from past relationships",days:[2]},{text:a.dating?.startsWith("Yes") ? "Go on 1 date or social outing — practice presence" : "Therapy/coaching session — explore pattern root",days:[3]},{text:"Sunday score",days:SUN}],
      results:[{text:"Old pattern named and documented"},{text:`Score ${parseInt(a.currentScore||"4")+1}`}] },
    { weekNumber:3, cumulativePercentage:WK_PCT[2], description:`Identity language emerging; practice survives any schedule; score ${parseInt(a.currentScore||"4")+2}`,
      actions:[{text:`${a.practice || "Journaling"} — "I am ${a.qualities || 'partner-ready'}" identity statement (5x this week)`,days:[0,1,2,3,4]},{text:"1st Workshop May 17 — practice quality at the event itself",days:[6]},{text:a.dating?.startsWith("Yes") ? "1 social interaction this week — practice being present" : "Therapy session — progress check",days:[3]},{text:"Sunday score",days:SUN}],
      results:[{text:"Identity language emerging in journal"},{text:`Score ${parseInt(a.currentScore||"4")+2}`}] },
    { weekNumber:4, cumulativePercentage:WK_PCT[3], description:`Quality showed up in real situation — documented; score ${parseInt(a.currentScore||"4")+3}; midpoint confirmed`,
      actions:[{text:`${a.practice || "Your daily practice"} — 5x this week; mission: catch your quality showing up in a real situation and document it`,days:[0,1,2,3,4]},{text:"2nd Intensive May 23–24 — how does your quality show up when you're surrounded by growth?",days:[5,6]},{text:"Document: 'Quality showed up without effort today — here's what happened'",days:[3]},{text:"Sunday midpoint score",days:SUN}],
      results:[{text:"Real-situation quality evidence documented ✓"},{text:`Score ${parseInt(a.currentScore||"4")+3}`}] },
    { weekNumber:5, cumulativePercentage:WK_PCT[4], description:`Pattern of reactivity interrupted; new response chosen; score ${parseInt(a.currentScore||"4")+4}`,
      actions:[{text:`${a.practice || "Your daily practice"} — 5x this week; mission: interrupt 3 old patterns before they play out`,days:[0,1,2,3,4]},{text:"Catch 1 old reactive pattern — choose new response — document it (3x this week)",days:[0,2,4]},{text:a.dating?.startsWith("Yes") ? "1 social/dating interaction — practice your qualities in real time" : "Coaching/therapy check-in",days:[3]},{text:"Sunday score",days:SUN}],
      results:[{text:"Old pattern consciously interrupted ✓"},{text:`Score ${parseInt(a.currentScore||"4")+4}`}] },
    { weekNumber:6, cumulativePercentage:WK_PCT[5], description:`Quality recognized by others; score ${parseInt(a.targetScore||"8")-1}`,
      actions:[{text:`${a.practice || "Your daily practice"} — 5x this week; mission: be so visibly changed that someone names it without being asked`,days:[0,1,2,3,4]},{text:`Ask coach or trusted friend: "Do you see ${a.qualities || "the qualities"} in how I carry myself now?"`,days:[2]},{text:`ALC 256 Jun 5–7 — carry your quality into the weekend`,days:[4,5,6]},{text:"Sunday score",days:SUN}],
      results:[{text:`Quality recognized externally ✓`},{text:`Score ${parseInt(a.targetScore||"8")-1}`}] },
    { weekNumber:7, cumulativePercentage:WK_PCT[6], description:`Score ${a.targetScore || 8} — EMBODIED, NOT PERFORMED; testimony written`,
      actions:[{text:`${a.practice || "Your daily practice"} — final push to score ${a.targetScore || 8} — 5x this week; write “I am ready” on Sunday`,days:[0,1,2,3,4]},{text:"2nd Workshop Jun 14 — share your partner-readiness journey with your coach",days:[6]},{text:"Write: 'This is who I am now — ready and whole'",days:[4,5]},{text:"Sunday final score",days:SUN}],
      results:[{text:`Score ${a.targetScore || 8} — embodied, not performed ✓`},{text:"Journey shared at 2nd Workshop"}] },
    { weekNumber:8, cumulativePercentage:WK_PCT[7], description:`Score confirmed; ${a.proofMain || "proof"} ready for Graduation Jun 21`,
      actions:[{text:`Practice — 3x this week (graduation week — protect the habit)`,days:[0,2,4]},{text:"Write final testimony: 'I built the person I want to be in relationship'",days:[1,2]},{text:"Graduation Sun Jun 21 — show up whole",days:[6]},{text:"Submit testimony by Jun 19",days:[4]}],
      results:[{text:`Score ${a.targetScore || 8} confirmed ✓`},{text:"Testimony: 'I am partner-ready' ✓"},{text:`${a.proofMain || "Proof"} COMPLETE ✓ — declaration proven`}] },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// PROFESSIONAL — Extra Income (Employed)
// ─────────────────────────────────────────────────────────────────────────────
const professionalIncomeEmployed: GoalTemplate = {
  id: "professional-income-employed",
  goalType: "professional",
  subType: "income-employed",
  name: "Extra Income (Employed)",
  description: "Generate additional monthly income alongside employment — offer built in Wk 1, reaching out starts Wk 2, consistent income by Wk 5, target hit by Wk 7.",
  wheelAreaHint: "Area J: Income/Financial",
  pesoCaution: { field: "targetExtra", min: 5000 },
  questions: [
    { id: "currentIncome", label: "Current monthly income (₱)", type: "number", placeholder: "30000", defaultValue: "30000" },
    { id: "targetExtra",   label: "Target EXTRA monthly income (₱)", type: "number", placeholder: "15000", defaultValue: "15000" },
    { id: "source",        label: "Extra income source", type: "multiselect",
      options: ["freelance skills","side coaching","selling products","affiliate marketing","part-time job","content creation","training/facilitation","other"], defaultValue: "freelance skills" },
    { id: "offerReady",    label: "Offer ready?", type: "select",
      options: ["Yes — I know what I'm selling and at what price","No — Wk 1 builds the offer"], defaultValue: "No — Wk 1 builds the offer" },
    { id: "offerDescription", label: "What will you sell?", type: "multiselect",
      options: ["graphic design / branding","coaching sessions","training / facilitation","baked goods / food products","handmade / craft products","photography / videography","social media management","writing / copywriting","tutoring / academic coaching","virtual assistant services","tech / IT support","other"],
      hint: "Pick all that apply — or choose 'other' to type your own.",
      dependsOn: { id: "offerReady", value: "Yes" } },
    { id: "pricePerUnit",  label: "Price per session/unit (₱)", type: "number",
      placeholder: "3000",
      dependsOn: { id: "offerReady", value: "Yes" } },
    { id: "unitsPerMonth", label: "Sessions/units per month (target)", type: "number",
      placeholder: "5",
      hint: "Projected monthly income = price × units/month",
      dependsOn: { id: "offerReady", value: "Yes" } },
    { id: "schedule",      label: "Your weekly commitment schedule",  type: "schedule", defaultValue: "Mon:1,Tue:1,Wed:1,Thu:1,Fri:1",
      hint: "Set hours per day for this goal — 1 hr ≈ 3 follow-ups or conversations." },
    { id: "proofMain", label: "Primary proof — what will you present at Graduation? (choose 1)", type: "select",
      options: ["Payment receipt screenshots","Income tracker export / spreadsheet","Bank / GCash / Maya transfer screenshot","Client invoice + payment confirmation","Client testimonial or review message","Screenshot of completed projects + total earnings","Other"],
      defaultValue: "Payment receipt screenshots",
      hint: "This proves money MOVED — your declaration was to earn ₱X extra. A receipt is the only evidence that counts." },
    { id: "proofSupport", label: "Supporting evidence (optional — pick 1–2 more)", type: "multiselect",
      options: ["written testimony (printed + signed)","blog post / article","LinkedIn post / social media post","Instagram / Facebook Reel or TikTok","digital photo album (Google Photos / iCloud)","printed scrapbook","short film (1–3 min)","personal website / portfolio page","Canva PDF presentation","Notion page / digital portfolio","presentation to LEAP batch at Graduation","letter to my future self","music video / creative video","artwork / painting / illustration","handwritten journal (printed + bound)","other"],
      hint: "Up to 2 extras that support your main proof — powerful but not required." },
  ],
  smarter: (a) => {
    const weeklyHrs = scheduleWeeklyHours(a.schedule);
    const avgHrs = (weeklyHrs / Math.max(1, parseSchedule(a.schedule).length)).toFixed(1);
    return {
    goalStatement: `Throughout 8 weeks, I dedicate ${weeklyHrs}h/week to building and selling my ${(a.source || "freelance").split(",")[0]} offer, reaching 5+ people per week, and earn at least ₱${a.targetExtra || "15,000"} in additional monthly income, and prove it with ${a.proofMain || "documented evidence"}, by June 19, 2026.`,
    specificDetails: `Generate +₱${a.targetExtra || "15,000"}/month extra through ${a.source || "freelance"} work${a.offerReady?.startsWith("Yes") && a.offerDescription ? ` selling ${a.offerDescription} at ₱${a.pricePerUnit || "TBD"}/unit` : ""}; offer ${a.offerReady?.startsWith("Yes") ? "already ready" : "built in Wk 1"}; ${avgHrs}h/day avg reaching out starting Wk 2; daily conversations tracked`,
    measurableCriteria: `Track conversations/week (10+); proposals sent (3+/week); income logged weekly; target +₱${a.targetExtra || "15,000"}/month by Jun 19${a.pricePerUnit && a.unitsPerMonth ? `; projected: ₱${a.pricePerUnit} × ${a.unitsPerMonth} units = ₱${parseInt(a.pricePerUnit)*parseInt(a.unitsPerMonth)}/month` : ""}; income tracker in GoalGetter`,
    achievableResources: `${avgHrs} hrs/day avg available; ${a.offerDescription ? `offer: ${a.offerDescription}` : "skills identified"}; 30+ people you know to reach out to; ${a.source || "freelance"} offer ${a.offerReady?.startsWith("Yes") ? "ready now" : "built Wk 1"}; LEAP community for referrals`,
    relevantAlignment: `I have never consistently generated income outside my salary — building this extra income stream from zero is genuinely new territory and requires daily reaching out discipline I haven't maintained before`,
    endDate: "June 19, 2026",
    excitingMotivation: `Proving that my earning potential isn't capped by my job title — building something that outlasts LEAP and gives me options; the moment I receive the first payment from my own effort`,
    rewardingBenefits: `+₱${a.targetExtra || "15,000"}/month active; income identity shift; "I create my own income" identity at graduation; testimony: "I built a new income stream in 8 weeks"`,
    };
  },
  answerRisks: (a) => {
    const risks: Array<{ field?: string; message: string }> = [];
    const weeklyHrs = scheduleWeeklyHours(a.schedule);
    const target = parseInt(a.targetExtra  || "15000");
    if (weeklyHrs < 5) {
      risks.push({
        field: "schedule",
        message: `${weeklyHrs}h/week is very tight for an income goal. Reaching out, follow-ups, and delivery all take real time — even a ₱${Math.min(target,5000).toLocaleString()}/month target needs at least 5 hrs/week of focused effort.`,
      });
    } else if (weeklyHrs < 7.5 && target >= 20000) {
      risks.push({
        field: "schedule",
        message: `Earning ₱${target.toLocaleString()}/month extra with only ${weeklyHrs}h/week is ambitious. You need time to reach out, follow up, AND deliver. Aim for at least 10 hours/week for a target this size.`,
      });
    }
    const pricePerUnit  = parseInt(a.pricePerUnit  || "0");
    const unitsPerMonth = parseInt(a.unitsPerMonth || "0");
    if (pricePerUnit > 0 && unitsPerMonth > 0) {
      const projected = pricePerUnit * unitsPerMonth;
      if (projected < target) {
        risks.push({
          field: "unitsPerMonth",
          message: `₱${pricePerUnit.toLocaleString()} × ${unitsPerMonth} units = ₱${projected.toLocaleString()}/month — this is below your ₱${target.toLocaleString()} target. Increase your units/month or adjust your price.`,
        });
      }
    }
    // Proof alignment check
    if (a.proofMain) {
      const validProofKw = ["payment receipt","income tracker","bank","gcash","maya","invoice","client testimonial","completed projects","earnings"];
      if (!validProofKw.some((kw: string) => a.proofMain.toLowerCase().includes(kw.toLowerCase()))) {
        risks.push({ field: "proofMain", message: `Your goal declares earning a specific peso amount. The most direct proof is payment receipts, income tracker export, or bank/GCash transfer screenshots showing actual money received. "${a.proofMain}" may not directly show your result was achieved — review with your coach.` });
      }
    }
    return risks;
  },
  milestones: (a) => [
    { weekNumber:1, cumulativePercentage:WK_PCT[0], description:`Define offer + build contact list + send FIRST messages — game starts NOW, not next week`,
      actions:[
        {text:`Define offer: skill + ideal client + rate (₱${Math.round(parseInt(a.targetExtra||"15000")/4)}/project or /hr)`,days:MON},
        {text:`Lock your daily calling block in calendar — non-negotiable`,days:[0]},
        {text:"Build your 30-person contact list — note who is most likely to hire you",days:[1,2]},
        {text:"Draft pitch message and conversation opener",days:[2]},
        {text:"Send first 3 reach-out messages from your contact list — do not wait until next week",days:[3,4]},
        {text:"Weekly review: who responded? Who is your #1 prospect right now?",days:SUN},
      ],
      results:[
        {text:"Offer defined and priced"},
        {text:"30-person contact list ready"},
        {text:"3+ messages sent — game started!"},
      ] },
    { weekNumber:2, cumulativePercentage:WK_PCT[1], description:`10+ conversations; 3 one-on-one calls; 1+ proposal sent — first payment possible this week`,
      actions:[{text:`Daily calling block — 10+ conversations this week`,days:MON_FRI},{text:"Conduct 3 one-on-one calls — listen for needs, worries, and budget",days:[1,2,3]},{text:"Send 1 proposal with pricing and timeline — if they say yes, collect payment NOW",days:[3,4]},{text:"Start income tracker — log all reaching out + proposals + any payments",days:MON}],
      results:[{text:"10+ conversations held"},{text:"3 one-on-one calls done"},{text:"1+ proposal sent"},{text:`First payment? Log it: ₱${Math.round(parseInt(a.targetExtra||"15000")*.1).toLocaleString()} early = ahead of pace`}] },
    { weekNumber:3, cumulativePercentage:WK_PCT[2], description:`Proposals followed up; FIRST INCOME EARNED ≥ ₱${Math.round(parseInt(a.targetExtra||"15000")*.1).toLocaleString()} logged; momentum real`,
      actions:[{text:`Follow up all Wk 2 proposals — close or learn why not`,days:MON_FRI},{text:"Send 3 new proposals",days:[1,2,3]},{text:"1st Workshop May 17 — reflection: what's working in your reaching out?",days:[6]},{text:`Log first payment when it arrives — screenshot and celebrate; target this week: ₱${Math.round(parseInt(a.targetExtra||"15000")*.1).toLocaleString()}+`,days:[1,3]}],
      results:[{text:`First income earned ✓ ≥ ₱${Math.round(parseInt(a.targetExtra||"15000")*.1).toLocaleString()} logged`},{text:"3+ proposals in progress"}] },
    { weekNumber:4, cumulativePercentage:WK_PCT[3], description:`Income growing; referrals activated; monthly pace ≥ ₱${Math.round(parseInt(a.targetExtra||"15000")*.3).toLocaleString()} — on track`,
      actions:[{text:`Daily calling block`,days:MON_FRI},{text:"Ask every current client/gig for 1 referral name",days:[2]},{text:"2nd Intensive May 23–24 — abundance mindset; share income wins with coach",days:[5,6]},{text:`Monthly income tally: on track for ₱${a.targetExtra}?`,days:SUN}],
      results:[{text:"Cumulative income tracked"},{text:"Referrals started"},{text:`Monthly pace ≥ ₱${Math.round(parseInt(a.targetExtra||"15000")*.3).toLocaleString()} ✓`}] },
    { weekNumber:5, cumulativePercentage:WK_PCT[4], description:`Income stream consistent; 2 active clients/gigs; monthly run rate ≥ ₱${Math.round(parseInt(a.targetExtra||"15000")*.5).toLocaleString()} — halfway mark`,
      actions:[{text:`Daily calls and messages`,days:MON_FRI},{text:"Deliver excellent work to current clients — document testimonials",days:MON_FRI},{text:"2 active clients/gigs confirmed",days:[1]},{text:`Calculate: current monthly run rate vs. ₱${a.targetExtra} target`,days:SUN}],
      results:[{text:"2+ active clients/gigs ✓"},{text:`Monthly run rate ≥ ₱${Math.round(parseInt(a.targetExtra||"15000")*.5).toLocaleString()} ✓`}] },
    { weekNumber:6, cumulativePercentage:WK_PCT[5], description:`Run rate ₱${Math.round(parseInt(a.targetExtra||"15000")*.7)}+; testimonials captured; next month pre-sold`,
      actions:[{text:`Daily calls and messages`,days:MON_FRI},{text:"Capture 2 client testimonials for marketing",days:[2]},{text:"ALC 256 Jun 5–7 — energy investment for final push",days:[4,5,6]},{text:"Reach out to the best people for next month's run",days:[1,2,3]}],
      results:[{text:`Run rate ₱${Math.round(parseInt(a.targetExtra||"15000")*.7)}+ ✓`},{text:"2 testimonials captured"}] },
    { weekNumber:7, cumulativePercentage:WK_PCT[6], description:`TARGET +₱${a.targetExtra || "15,000"} HIT or confirmed; income model documented`,
      actions:[{text:`Daily calls and messages`,days:MON_FRI},{text:"2nd Workshop Jun 14 — share your income breakthrough journey with your coach",days:[6]},{text:"Document your income system: offer, reaching out process, close method",days:[4,5]},{text:"Month-to-date income confirmation",days:SUN}],
      results:[{text:`+₱${a.targetExtra || "15,000"}/month HIT or confirmed ✓`},{text:"Income model documented"},{text:"Testimony ready"}] },
    { weekNumber:8, cumulativePercentage:WK_PCT[7], description:`Month confirmed; extra income active; ${a.proofMain || "proof"} ready for Graduation Jun 21`,
      actions:[{text:`Continue reaching out and delivery`,days:MON_FRI},{text:`Compile ${a.proofMain || "your proof"} — your contract receipt; have it ready to present at Graduation Jun 21`,days:[1,2,3]},
          {text:"Final income tally — ₱"+a.targetExtra+" confirmed this month",days:[3]},{text:"Graduation Sun Jun 21",days:[6]},{text:"Submit testimony by Jun 19",days:[4]}],
      results:[{text:`+₱${a.targetExtra || "15,000"}/month active ✓`},{text:"Testimony: 'I built a new income stream' ✓"},{text:`${a.proofMain || "Proof"} COMPLETE ✓ — declaration proven`}] },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// PROFESSIONAL — Finding Income (Unemployed/Exploring)
// ─────────────────────────────────────────────────────────────────────────────
const professionalIncomeExploring: GoalTemplate = {
  id: "professional-income-exploring",
  goalType: "professional",
  subType: "income-exploring",
  name: "Finding Income (Unemployed / Exploring)",
  description: "Create your own income from zero through daily proactive effort — first income by Wk 3, consistent by Wk 5, target achieved by Wk 7.",
  wheelAreaHint: "Area J: Income/Financial",
  pesoCaution: { field: "targetIncome", min: 5000 },
  questions: [
    { id: "situation",    label: "Current situation", type: "select",
      options: ["unemployed","in career transition","exploring options","building a business","freelancing / self-employed"], defaultValue: "unemployed" },
    { id: "targetIncome", label: "Target monthly income (₱)", type: "number", placeholder: "25000", defaultValue: "25000" },
    { id: "opportunity",  label: "Income opportunity type(s)", type: "multiselect",
      options: ["employment (full-time / part-time)","freelance services","online business","gig work (delivery / transport)","coaching / training / facilitation","content creation (YouTube / TikTok / blog)","selling products (physical / digital)","affiliate marketing","other"],
      hint: "Pick all that apply." },
    { id: "skills",       label: "Skills/strengths to monetize", type: "multiselect",
      options: ["facilitation / training","writing / content creation","graphic design / visual arts","photography / videography","social media management","coaching / counseling","cooking / baking / food","sales / business development","tech / programming / IT","admin / virtual assistance","teaching / tutoring","other"],
      hint: "Pick all your monetizable strengths." },
    { id: "schedule",     label: "Your weekly commitment schedule",  type: "schedule", defaultValue: "Mon:1,Tue:1,Wed:1,Thu:1,Fri:1",
      hint: "Set hours per day for building your main income — 1 hr = ~3 reach-outs or conversations." },
    { id: "proofMain", label: "Primary proof — what will you present at Graduation? (choose 1)", type: "select",
      options: ["Payment receipt screenshots","Income tracker export / spreadsheet","Bank / GCash / Maya transfer screenshot","Client invoice + payment confirmation","Portfolio of work delivered + earnings summary","Client testimonial or review messages (2+)","Other"],
      defaultValue: "Payment receipt screenshots",
      hint: "This proves income was CREATED, not just attempted — actual payment received is the only real proof." },
    { id: "proofSupport", label: "Supporting evidence (optional — pick 1–2 more)", type: "multiselect",
      options: ["written testimony (printed + signed)","blog post / article","LinkedIn post / social media post","Instagram / Facebook Reel or TikTok","digital photo album (Google Photos / iCloud)","printed scrapbook","short film (1–3 min)","personal website / portfolio page","Canva PDF presentation","Notion page / digital portfolio","presentation to LEAP batch at Graduation","letter to my future self","music video / creative video","artwork / painting / illustration","handwritten journal (printed + bound)","other"],
      hint: "Up to 2 extras that support your main proof — powerful but not required." },
  ],
  smarter: (a) => {
    const weeklyHrs = scheduleWeeklyHours(a.schedule);
    const avgHrs = (weeklyHrs / Math.max(1, parseSchedule(a.schedule).length)).toFixed(1);
    return {
    goalStatement: `Throughout 8 weeks, I dedicate ${weeklyHrs}h/week to building my ${(a.opportunity || "income opportunity").split(",")[0]}, secure my first paying client by Week 3, and reach ₱${a.targetIncome || "25,000"} per month, and prove it with ${a.proofMain || "documented evidence"}, by June 19, 2026.`,
    specificDetails: `Secure ₱${a.targetIncome || "25,000"}/month through ${a.opportunity || "freelance + coaching"} leveraging ${a.skills || "my skills"}; ${avgHrs} hrs/day avg; first income by Wk 3; ${a.situation || "building from zero"} with full focus`,
    measurableCriteria: `Track pitches/week (5+); conversations (10+/week); applications/proposals sent (3+); income logged weekly; target ₱${a.targetIncome || "25,000"}/month by Wk 7`,
    achievableResources: `${avgHrs} hrs/day avg; ${a.skills || "skills"} portfolio ready Wk 1; LEAP community for referrals; GoalGetter accountability; coaching support`,
    relevantAlignment: `I have never built income independently in this way — creating ₱${a.targetIncome || "25,000"}/month from zero requires daily discipline and consistency I haven't demonstrated at this level before`,
    endDate: "June 19, 2026",
    excitingMotivation: `Building MY income on MY terms — proving that I create opportunity where none existed; the moment ₱${a.targetIncome || "25,000"} appears in my account from work I sourced myself`,
    rewardingBenefits: `₱${a.targetIncome || "25,000"}/month by Jun 19; "I create my own income" identity; financial confidence; graduation testimony; foundation for ₱${Math.round(parseInt(a.targetIncome||"25000")*1.5)} next`,
    };
  },
  answerRisks: (a) => {
    const risks: Array<{ field?: string; message: string }> = [];
    const weeklyHrs = scheduleWeeklyHours(a.schedule);
    const target = parseInt(a.targetIncome  || "25000");
    if (weeklyHrs < 10) {
      risks.push({
        field: "schedule",
        message: `${weeklyHrs}h/week is not enough to build income from zero. Finding clients, following up, and delivering all take real time. You need at least 15 hrs/week minimum to generate ₱${target.toLocaleString()}/month.`,
      });
    } else if (weeklyHrs < 20 && target >= 20000) {
      risks.push({
        field: "schedule",
        message: `Building ₱${target.toLocaleString()}/month from zero with ${weeklyHrs}h/week is tight. A target this size needs 20–30 focused hours/week — for outreach, follow-up, interviews/proposals, AND delivery.`,
      });
    }
    // Proof alignment check
    if (a.proofMain) {
      const validProofKw = ["payment receipt","income tracker","bank","gcash","maya","invoice","client testimonial","portfolio","earnings"];
      if (!validProofKw.some((kw: string) => a.proofMain.toLowerCase().includes(kw.toLowerCase()))) {
        risks.push({ field: "proofMain", message: `Your goal declares reaching a specific monthly income target from zero. The most direct proof is payment receipts, income tracker export, or bank/GCash transfer screenshots showing actual money received. "${a.proofMain}" may not directly show your result was achieved — review with your coach.` });
      }
    }
    return risks;
  },
  milestones: (a) => [
    { weekNumber:1, cumulativePercentage:WK_PCT[0], description:`Skills/offer defined; portfolio updated; 5 ideal clients; first 5 reaching out messages sent`,
      actions:[{text:`Define your offer package: "${a.skills || "skills"} → specific deliverable → rate"`,days:MON},{text:"Update portfolio/LinkedIn/resume to highlight "+a.skills,days:[1,2]},{text:"Identify 5 ideal clients or employers; send first 5 reaching out messages",days:[3,4]},{text:`Set up ₱${a.targetIncome || "25,000"} income tracker`,days:MON}],
      results:[{text:"Offer defined and packaged"},{text:"Portfolio updated"},{text:"5 reaching out messages sent"}] },
    { weekNumber:2, cumulativePercentage:WK_PCT[1], description:`10+ conversations; 3 one-on-one calls; 2 proposals/applications — first payment possible this week`,
      actions:[{text:`Daily reaching out block — 10+ conversations`,days:MON_FRI},{text:"Conduct 3 one-on-one calls or job interviews",days:[1,2,3]},{text:"Send 2+ proposals or applications — if they say yes, collect or confirm payment NOW",days:[3,4]},{text:"Income tracker: log all activity + any early payments",days:SUN}],
      results:[{text:"10+ conversations held"},{text:"3 calls done"},{text:"2 proposals sent"},{text:`First payment? Log it: ₱${Math.round(parseInt(a.targetIncome||"25000")*.1).toLocaleString()} early = ahead of pace`}] },
    { weekNumber:3, cumulativePercentage:WK_PCT[2], description:`FIRST INCOME EARNED ≥ ₱${Math.round(parseInt(a.targetIncome||"25000")*.1).toLocaleString()} logged; model validated; momentum real`,
      actions:[{text:`Follow up all proposals — close or learn why not`,days:MON_FRI},{text:"Send 3 new proposals",days:[1,2,3]},{text:"1st Workshop May 17 — reflect: what income activity has worked best?",days:[6]},{text:`Log first payment — no amount too small; target this week: ₱${Math.round(parseInt(a.targetIncome||"25000")*.1).toLocaleString()}+`,days:[1,3]}],
      results:[{text:`First income earned ✓ ≥ ₱${Math.round(parseInt(a.targetIncome||"25000")*.1).toLocaleString()} logged`},{text:"Model validation in progress"}] },
    { weekNumber:4, cumulativePercentage:WK_PCT[3], description:`3+ income sources in progress; monthly pace ≥ ₱${Math.round(parseInt(a.targetIncome||"25000")*.3).toLocaleString()} — on track`,
      actions:[{text:`Daily calling block`,days:MON_FRI},{text:"2nd Intensive May 23–24 — share income progress with coach; abundance mindset",days:[5,6]},{text:"3+ income sources actively in motion",days:[3]},{text:`Monthly pace calculation: on track for ₱${a.targetIncome}?`,days:SUN}],
      results:[{text:"3+ income sources in progress"},{text:`Monthly pace ≥ ₱${Math.round(parseInt(a.targetIncome||"25000")*.3).toLocaleString()} ✓`}] },
    { weekNumber:5, cumulativePercentage:WK_PCT[4], description:`Consistent income — first regular client/gig; monthly run rate ≥ ₱${Math.round(parseInt(a.targetIncome||"25000")*.5).toLocaleString()} — halfway mark`,
      actions:[{text:`Daily calls and messages`,days:MON_FRI},{text:"First recurring client or gig locked — deliver exceptional work",days:MON_FRI},{text:"Ask every client for 1 referral",days:[2]},{text:"Stop chasing people who are clearly not interested; focus on your top 3",days:[4]}],
      results:[{text:"1+ recurring income source active ✓"},{text:`Monthly run rate ≥ ₱${Math.round(parseInt(a.targetIncome||"25000")*.5).toLocaleString()} ✓`},{text:"Referral ask made to all clients"}] },
    { weekNumber:6, cumulativePercentage:WK_PCT[5], description:`Monthly pace ₱${Math.round(parseInt(a.targetIncome||"25000")*.6)}+; offer refined; final push begun`,
      actions:[{text:`Daily calls and messages`,days:MON_FRI},{text:"Refine offer based on what's closing — drop what isn't",days:[1,2]},{text:"ALC 256 Jun 5–7 SMX Aura — bring your hustle energy into the room",days:[4,5,6]},{text:"Month-to-date tally",days:SUN}],
      results:[{text:`Monthly pace ₱${Math.round(parseInt(a.targetIncome||"25000")*.6)}+ ✓`},{text:"Offer refined"}] },
    { weekNumber:7, cumulativePercentage:WK_PCT[6], description:`TARGET ₱${a.targetIncome || "25,000"} HIT OR CONFIRMED; income model documented`,
      actions:[{text:`Daily calls and messages`,days:MON_FRI},{text:"2nd Workshop Jun 14 — share your income creation journey with your coach",days:[6]},{text:"Document your full income-creation process",days:[4,5]},{text:"Month income confirmation",days:SUN}],
      results:[{text:`₱${a.targetIncome || "25,000"}/month HIT or confirmed ✓`},{text:"Testimony ready"}] },
    { weekNumber:8, cumulativePercentage:WK_PCT[7], description:`Income secured; work rhythm established; ${a.proofMain || "proof"} ready for Graduation Jun 21`,
      actions:[{text:`Continue delivery and reaching out`,days:MON_FRI},{text:`Compile ${a.proofMain || "your proof"} — your contract receipt; have it ready to present at Graduation Jun 21`,days:[1,2,3]},
          {text:"Final income tally",days:[3]},{text:"Graduation Sun Jun 21",days:[6]},{text:"Submit testimony by Jun 19",days:[4]}],
      results:[{text:`₱${a.targetIncome || "25,000"}/month active ✓`},{text:"Testimony: 'I create my own income' ✓"},{text:`${a.proofMain || "Proof"} COMPLETE ✓ — declaration proven`}] },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// PROFESSIONAL — Career Being-ness (Career Identity)
// ─────────────────────────────────────────────────────────────────────────────
const professionalCareerBeingness: GoalTemplate = {
  id: "professional-career-beingness",
  goalType: "professional",
  subType: "career-beingness",
  name: "Career Identity (Professional Being-ness)",
  description: "Embody the professional qualities of the role you want — 100% your actions, not dependent on a promotion or anyone else's decision.",
  wheelAreaHint: "Area G: Career/Work · Area K: Professional Growth",
  questions: [
    { id: "roleTarget",  label: "Professional role/identity to grow into", type: "multiselect",
      options: ["manager","senior contributor / specialist","team lead","project lead","entrepreneur / business owner","trusted expert / go-to person","executive / director","thought leader / speaker","mentor / coach","creative professional","other"],
      hint: "Pick the role(s) that describe who you are becoming." },
    { id: "qualities",   label: "2–3 essence qualities of that role", type: "multiselect",
      options: ["reliable","strategic","visionary","decisive","collaborative","empathetic","systematic","innovative","proactive","accountable","organized","inspiring","calm under pressure","solution-focused","other"],
      hint: "Pick 2–3. These become the qualities you consciously embody daily at work." },
    { id: "currentScore",label: "Current self-score (1–10)", type: "number", placeholder: "5", defaultValue: "5" },
    { id: "targetScore", label: "Target score",              type: "number", placeholder: "8", defaultValue: "8" },
    { id: "visibleAction",label:"Visible action(s) to showcase these qualities", type: "multiselect",
      options: ["lead a project from start to finish","speak up / contribute in at least 3 meetings/week","mentor or coach 1 colleague","present to leadership or a group","volunteer for a stretch assignment","drive a team initiative","document and share a process improvement","other"],
      hint: "Pick 1–3 visible actions you will do every week." },
    { id: "proofMain", label: "Primary proof — what will you present at Graduation? (choose 1)", type: "select",
      options: ["Peer or manager recognition — email or screenshot","Project delivered — file, link, or screenshot","Written feedback from manager or peer","LinkedIn post documenting your professional growth","Certificate / award / badge received","Performance review excerpt showing score improvement","Other"],
      defaultValue: "Peer or manager recognition — email or screenshot",
      hint: "This proves the identity shift is VISIBLE externally — someone else named the change. That is the real test." },
    { id: "proofSupport", label: "Supporting evidence (optional — pick 1–2 more)", type: "multiselect",
      options: ["written testimony (printed + signed)","blog post / article","LinkedIn post / social media post","Instagram / Facebook Reel or TikTok","digital photo album (Google Photos / iCloud)","printed scrapbook","short film (1–3 min)","personal website / portfolio page","Canva PDF presentation","Notion page / digital portfolio","presentation to LEAP batch at Graduation","letter to my future self","music video / creative video","artwork / painting / illustration","handwritten journal (printed + bound)","other"],
      hint: "Up to 2 extras that support your main proof — powerful but not required." },
  ],
  smarter: (a) => ({
    goalStatement: `Throughout 8 weeks, I show up as a ${(a.roleTarget || "senior professional").split(",")[0]} through ${(a.visibleAction || "leading projects and contributing in meetings").split(",")[0]} at least 5 days per week and grow my professional presence score from ${a.currentScore || 5} to ${a.targetScore || 8}, and prove it with ${a.proofMain || "documented evidence"}, by June 19, 2026.`,
    specificDetails: `Embody ${a.qualities || "chosen professional qualities"} through ${a.visibleAction || "leading a project + contributing in meetings"} for 8 weeks; show up as a ${a.roleTarget || "senior professional"} in every interaction`,
    measurableCriteria: `Track ${a.visibleAction || "project milestones + meeting contributions"}; self-score ${a.currentScore || 5} → ${a.targetScore || 8} (rated Sunday); peer or coach observation weekly; 1 visible leadership moment documented per week`,
    achievableResources: `Project or meeting access confirmed; ${a.visibleAction || "visibility commitment"} mapped; LEAP coaching for reflection; commitment to speak up even when uncomfortable`,
    relevantAlignment: `Imposter syndrome has held me back — I have the skills of a ${a.roleTarget || "senior professional"} but haven't been playing at that level; going from score ${a.currentScore || 5} to ${a.targetScore || 8} requires showing up consistently, not waiting for permission`,
    endDate: "June 19, 2026",
    excitingMotivation: `Being the ${a.roleTarget || "professional"} I KNOW I can be — not waiting for a promotion to start acting like one; the day my team or peers see me as a ${a.qualities?.split(",")[0]?.trim() || "leader"} because I earned it`,
    rewardingBenefits: `Score ${a.currentScore || 5} → ${a.targetScore || 8}; ${a.visibleAction || "project"} delivered; "I lead like a ${a.roleTarget || "professional"}" identity confirmed; graduation testimony; advancement conversation now has substance`,
  }),
  answerRisks: (a) => {
    const risks: Array<{ field?: string; message: string }> = [];
    const curr = parseInt(a.currentScore || "5");
    const targ = parseInt(a.targetScore  || "8");
    if (curr > 0 && targ > 0 && curr >= targ) {
      risks.push({ field: "targetScore", message: `Your starting score (${curr}) is already at or above your target (${targ}). Set a higher target to make this goal worth doing.` });
    } else if (targ - curr > 6) {
      risks.push({ field: "targetScore", message: `Jumping from ${curr} to ${targ} in 7 weeks is a very large shift. A realistic ceiling is 5–6 points. Consider setting your target at ${curr + 5} and pushing from there.` });
    }
    // Proof alignment check
    if (a.proofMain) {
      const validProofKw = ["recognition","project delivered","feedback","linkedin","certificate","performance review","award","peer"];
      if (!validProofKw.some((kw: string) => a.proofMain.toLowerCase().includes(kw.toLowerCase()))) {
        risks.push({ field: "proofMain", message: `Your goal declares a professional identity shift visible to others. The most direct proof is peer/manager recognition (email or screenshot), delivered project, or written feedback from colleagues. "${a.proofMain}" may not directly show your result was achieved — review with your coach.` });
      }
    }
    return risks;
  },
  milestones: (a) => [
    { weekNumber:1, cumulativePercentage:WK_PCT[0], description:`Qualities declared; ${a.visibleAction || "project + visibility action"} committed; baseline ${a.currentScore || 5}; first week of speaking up`,
      actions:[{text:`Declare publicly: "I am becoming ${a.roleTarget || 'a senior professional'}"`,days:MON},{text:`Commit to ${a.visibleAction || "leading 1 project"} — lock schedule`,days:MON},{text:"Speak up or lead at minimum once every day",days:MON_FRI},{text:"Sunday score + 1 leadership moment documented",days:SUN}],
      results:[{text:`Baseline: ${a.currentScore || 5}`},{text:"Visibility commitment locked"}] },
    { weekNumber:2, cumulativePercentage:WK_PCT[1], description:`Visible contributions; ${a.visibleAction?.includes("project") ? "project Wk 1 milestone done" : "first week tracked"}; score ${parseInt(a.currentScore||"5")+.5}`,
      actions:[{text:`Daily visible contribution: ${a.visibleAction || "lead meeting, speak up, mentor"}`,days:MON_FRI},{text:"Document 3 leadership moments from this week",days:[5]},{text:"Seek feedback from 1 peer or mentor",days:[3]},{text:"Sunday score",days:SUN}],
      results:[{text:"3 leadership moments documented"},{text:`Score ${parseInt(a.currentScore||"5")+ .5}`}] },
    { weekNumber:3, cumulativePercentage:WK_PCT[2], description:`Team feedback received; leadership lens applied actively; score ${parseInt(a.currentScore||"5")+1}`,
      actions:[{text:`Daily visible contribution: ${a.visibleAction || "speak up, lead, mentor"}`,days:MON_FRI},{text:"Ask 1 team member for honest professional feedback",days:[2]},{text:"1st Workshop May 17 — apply your leadership lens to LEAP sessions",days:[6]},{text:"Sunday score",days:SUN}],
      results:[{text:"External feedback received"},{text:`Score ${parseInt(a.currentScore||"5")+1}`}] },
    { weekNumber:4, cumulativePercentage:WK_PCT[3], description:`Key decision made independently; score ${parseInt(a.currentScore||"5")+2}; identity deepening documented`,
      actions:[{text:`Daily visible contribution: ${a.visibleAction || "speak up, lead, mentor"}`,days:MON_FRI},{text:"Make 1 significant professional decision independently — document it",days:[2,3]},{text:"2nd Intensive May 23–24 — what does your leadership identity feel like?",days:[5,6]},{text:"Sunday score",days:SUN}],
      results:[{text:"Independent decision made and documented ✓"},{text:`Score ${parseInt(a.currentScore||"5")+2}`}] },
    { weekNumber:5, cumulativePercentage:WK_PCT[4], description:`Progress visible to others; recognized as ${a.qualities?.split(",")[0]?.trim() || "reliable"}; score ${parseInt(a.currentScore||"5")+3}`,
      actions:[{text:`Daily visible contribution: ${a.visibleAction || "speak up, lead, mentor"}`,days:MON_FRI},{text:"Ask manager or peer: 'Have you noticed a change in my leadership presence?'",days:[3]},{text:"Journal: 3 situations where you led with confidence (3x this week)",days:[0,2,4]},{text:"Sunday score",days:SUN}],
      results:[{text:`Recognized as ${a.qualities?.split(",")[0]?.trim() || "reliable"} by others ✓`},{text:`Score ${parseInt(a.currentScore||"5")+3}`}] },
    { weekNumber:6, cumulativePercentage:WK_PCT[5], description:`Score 7+; near completion of ${a.visibleAction || "project"}; mentor/teach 1 person`,
      actions:[{text:`Daily visible contribution: ${a.visibleAction || "speak up, lead, mentor"}`,days:MON_FRI},{text:"Mentor or teach 1 colleague — share what you've learned",days:[2,3]},{text:`${a.visibleAction?.includes("project") ? "Project approaching completion — document wins" : "Document visible leadership wins"}`,days:[4]},{text:"Sunday score",days:SUN}],
      results:[{text:"Mentored 1 colleague ✓"},{text:`Score ${parseInt(a.currentScore||"5")+3.5}`}] },
    { weekNumber:7, cumulativePercentage:WK_PCT[6], description:`${a.visibleAction?.includes("project") ? "PROJECT COMPLETE;" : "TARGET MET;"} score ${a.targetScore || 8}; testimony drafted`,
      actions:[{text:`${a.visibleAction?.includes("project") ? "Complete project deliverable" : "Final visible leadership action"}`,days:MON_FRI},{text:"2nd Workshop Jun 14 — share your professional identity journey with your coach",days:[6]},{text:"Write: 'This is the professional I am now'",days:[4,5]},{text:"Sunday final score",days:SUN}],
      results:[{text:`${a.visibleAction || "Goal"} COMPLETE ✓`},{text:`Score ${a.targetScore || 8} HIT ✓`},{text:"Journey shared at 2nd Workshop"}] },
    { weekNumber:8, cumulativePercentage:WK_PCT[7], description:`Score confirmed; process documented; ${a.proofMain || "proof"} ready for Graduation Jun 21`,
      actions:[{text:`Compile ${a.proofMain || "your proof"} — your contract receipt; have it ready to present at Graduation Jun 21`,days:[1,2,3]},
          {text:`Maintain visible leadership contributions`,days:MON_FRI},{text:"Document your leadership process for replication",days:[1,2]},{text:"Graduation Sun Jun 21",days:[6]},{text:"Submit testimony by Jun 19",days:[4]}],
      results:[{text:`Score ${a.targetScore || 8} confirmed ✓`},{text:"Testimony: 'I lead like a "+a.roleTarget+"' ✓"},{text:`${a.proofMain || "Proof"} COMPLETE ✓ — declaration proven`}] },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// PROFESSIONAL — Skill Building with Culminating Activity
// ─────────────────────────────────────────────────────────────────────────────
const professionalSkills: GoalTemplate = {
  id: "professional-skills",
  goalType: "professional",
  subType: "skills",
  name: "Skill Building with Culminating Activity",
  description: "Build a creative or professional skill over 8 weeks — capped by a real showcase event that proves the skill is real.",
  wheelAreaHint: "Area I: Skills",
  questions: [
    { id: "skill",         label: "Skill to build", type: "multiselect",
      options: ["baking / cooking","dancing","singing / vocal performance","painting / drawing / visual art","photography","public speaking / storytelling","playing an instrument","graphic design","video editing / filmmaking","gardening / landscaping","driving","language learning","writing / creative writing","pottery / crafts","other"],
      hint: "Pick 1 main skill (or combine related ones)." },
    { id: "culmination",   label: "Culminating activity / showcase event", type: "multiselect",
      options: ["taste feast / dinner for friends","recital or live performance","art exhibit / gallery showing","photography exhibit or portfolio launch","language conversation demo","public speech or presentation","driving test / road test","song recording or cover release","video project premiere","garden open house / walkthrough","craft / product launch","other"],
      hint: "Pick 1 event that proves the skill is real — this is your graduation milestone." },
    { id: "sessionsPerWk", label: "Practice sessions per week", type: "number", placeholder: "4", defaultValue: "4" },
    { id: "sessionLength", label: "Duration per session (e.g., 1.5 hr)", type: "text", placeholder: "1.5 hr", defaultValue: "1.5 hr" },
    { id: "currentLevel",  label: "Current level", type: "select",
      options: ["complete beginner","some basics","intermediate","advanced but rusty"], defaultValue: "complete beginner" },
    { id: "proofMain", label: "Primary proof — what will you present at Graduation? (choose 1)", type: "select",
      options: ["Video of the showcase / performance (full recording)","Photos with guests at the showcase","3 signature works / pieces produced (photos or files)","Skill portfolio — Behance / Google Drive / physical folder","Audio or video recording of the performance","Guest feedback / testimonials from the showcase","Other"],
      defaultValue: "Video of the showcase / performance (full recording)",
      hint: "The showcase IS the proof — video captures everything: skill level, guests, real reaction. Non-negotiable evidence." },
    { id: "proofSupport", label: "Supporting evidence (optional — pick 1–2 more)", type: "multiselect",
      options: ["written testimony (printed + signed)","blog post / article","LinkedIn post / social media post","Instagram / Facebook Reel or TikTok","digital photo album (Google Photos / iCloud)","printed scrapbook","short film (1–3 min)","personal website / portfolio page","Canva PDF presentation","Notion page / digital portfolio","presentation to LEAP batch at Graduation","letter to my future self","music video / creative video","artwork / painting / illustration","handwritten journal (printed + bound)","other"],
      hint: "Up to 2 extras that support your main proof — powerful but not required." },
  ],
  smarter: (a) => ({
    goalStatement: `Throughout 8 weeks, I practice ${(a.skill || "my chosen skill").split(",")[0]} for ${a.sessionsPerWk || 4} sessions per week and complete my ${(a.culmination || "showcase").split(",")[0]} as documented proof of mastery, and prove it with ${a.proofMain || "documented evidence"}, by June 19, 2026.`,
    specificDetails: `Build ${a.skill || "chosen skill"} from ${a.currentLevel || "beginner"} to competent through ${a.sessionsPerWk || 4} × ${a.sessionLength || "1.5-hr"} sessions/week for 8 weeks; culminate in ${a.culmination || "showcase event"} by Wk 8`,
    measurableCriteria: `Track sessions completed/week (${a.sessionsPerWk || 4} target); complexity/quality score 1→5 rated every 2 weeks; external evaluation by Wk 7 (taste test / rehearsal audience); ${a.culmination || "showcase"} hosted by Jun 19`,
    achievableResources: `Equipment and materials accessible; ${a.sessionsPerWk || 4}-session weekly schedule locked; progression plan from Wk 1; accountability partner for check-ins; LEAP structure as the commitment container`,
    relevantAlignment: `I have never built ${a.skill || "this skill"} beyond dabbling — committing to ${parseInt(a.sessionsPerWk || "4") * 8} sessions and a real ${a.culmination || "showcase"} is the first time I treat this as a serious goal, not a hobby attempt`,
    endDate: "June 19, 2026",
    excitingMotivation: `The look on my guests' / audience's faces during ${a.culmination || "the showcase"}; proving skill from zero in 8 weeks; showing up at graduation with concrete, shareable, tangible proof`,
    rewardingBenefits: `${parseInt(a.sessionsPerWk || "4") * 8}+ sessions completed; ${a.culmination || "showcase"} hosted; 3 signature pieces / skills mastered; graduation testimony: "I proved I can build anything I commit to"`,
  }),
  answerRisks: (a) => {
    const risks: Array<{ field?: string; message: string }> = [];
    const sess = parseInt(a.sessionsPerWk || "4");
    const lenMatch = (a.sessionLength || "1.5 hr").match(/[\d.]+/);
    const len  = lenMatch ? parseFloat(lenMatch[0]) : 1.5;
    const weeklyHrs = sess * len;
    if (sess < 2) {
      risks.push({ field: "sessionsPerWk", message: `${sess} session/week over 8 weeks is not enough to build a real skill. You need at least 3 sessions/week (24 total) to show meaningful progress by the showcase. Increase to 3–5 sessions/week.` });
    }
    if (weeklyHrs > 14) {
      risks.push({ field: "sessionsPerWk", message: `${sess} sessions × ${len} hr = ${weeklyHrs.toFixed(1)} hrs/week of practice. That's a very heavy load on top of LEAP activities. Consider reducing sessions or session length to stay sustainable.` });
    }
    // Proof alignment check
    if (a.proofMain) {
      const validProofKw = ["video","photos with guests","signature works","portfolio","recording","guest feedback","showcase","skill"];
      if (!validProofKw.some((kw: string) => a.proofMain.toLowerCase().includes(kw.toLowerCase()))) {
        risks.push({ field: "proofMain", message: `Your goal declares a hosted showcase event after building a skill. The most direct proof is a video of the showcase/performance, photos with guests, or your produced works/pieces. "${a.proofMain}" may not directly show your result was achieved — review with your coach.` });
      }
    }
    return risks;
  },
  milestones: (a) => {
    const sess = parseInt(a.sessionsPerWk || "4");
    return [
      { weekNumber:1, cumulativePercentage:WK_PCT[0], description:`Equipment ready; skill progression mapped; first practice sessions; baseline logged`,
        actions:[{text:`Gather all equipment/materials for ${a.skill || "skill"}`,days:MON},{text:"Map 8-week progression: beginner → intermediate → showcase level",days:MON},{text:`First ${Math.min(sess,3)} practice sessions — basics only`,days:[1,3,5]},{text:"Log baseline: what can you do day 1?",days:MON}],
        results:[{text:"Equipment/materials ready"},{text:"8-week progression plan mapped"},{text:`First ${Math.min(sess,3)} sessions done`}] },
      { weekNumber:2, cumulativePercentage:WK_PCT[1], description:`${sess*2} sessions; skill improving; first external taste/test; quality score 1.5→2`,
        actions:[{text:`${sess} sessions this week`,days:MON_FRI},{text:`Practice 3+ variations / techniques in ${a.skill || "skill"}`,days:MON_FRI},{text:"First household or self evaluation — rate quality 1-5",days:[6]},{text:"Sunday: what improved? what needs more work?",days:SUN}],
        results:[{text:`${sess*2} total sessions complete`},{text:"Quality score 1.5–2"}] },
      { weekNumber:3, cumulativePercentage:WK_PCT[2], description:`${sess*3} sessions; first external feedback received; quality score 2.5`,
        actions:[{text:`${sess} sessions`,days:MON_FRI},{text:"Share your skill with 1 friend/family member — get honest feedback",days:[4]},{text:"1st Workshop May 17 — practice the morning of; bring skill energy into LEAP",days:[6]},{text:"Quality score update",days:SUN}],
        results:[{text:`${sess*3} total sessions`},{text:"External feedback received"},{text:"Quality score 2.5"}] },
      { weekNumber:4, cumulativePercentage:WK_PCT[3], description:`${sess*4} sessions; first complex technique attempted; quality score 3`,
        actions:[{text:`${sess} sessions — attempt first complex technique`,days:MON_FRI},{text:"2nd Intensive May 23–24 UP BGC — keep practice going; midpoint celebration",days:[5,6]},{text:"Document: what breakthrough happened this week?",days:[4]},{text:"Quality score 3",days:SUN}],
        results:[{text:`${sess*4} total sessions`},{text:"Complex technique attempted"},{text:"Quality score 3"}] },
      { weekNumber:5, cumulativePercentage:WK_PCT[4], description:`${sess*5} sessions cumulative; 3 techniques reliably consistent; mini showcase done; quality score 3.5`,
        actions:[{text:`${sess} sessions — focus on consistency over complexity`,days:MON_FRI},{text:`Mini showcase: demonstrate skill for 3 people; get feedback`,days:[6]},{text:"Identify 3 signature pieces/techniques for the culmination",days:[4]},{text:"Quality score 3.5",days:SUN}],
        results:[{text:`Mini showcase done ✓`},{text:"3 signature pieces identified"},{text:"Quality score 3.5"}] },
      { weekNumber:6, cumulativePercentage:WK_PCT[5], description:`${sess*6} sessions cumulative; 5+ people preview done; quality score 4`,
        actions:[{text:`${sess} sessions`,days:MON_FRI},{text:`Preview your skill for 5+ people — incorporate feedback`,days:[4]},{text:"ALC 256 Jun 5–7 — bring something from your skill to share if possible",days:[4,5,6]},{text:"Quality score 4",days:SUN}],
        results:[{text:"5+ person preview done"},{text:"Feedback incorporated"},{text:"Quality score 4"}] },
      { weekNumber:7, cumulativePercentage:WK_PCT[6], description:`${sess*7} sessions cumulative; CULMINATION REHEARSAL — full run-through; guests confirmed; quality score 4.5`,
        actions:[{text:`${sess} sessions — full rehearsal with all planned elements`,days:MON_FRI},{text:`Rehearsal: run full ${a.culmination || "showcase"} from start to finish`,days:[4]},{text:"2nd Workshop Jun 14 — share your skill journey with your coach",days:[6]},{text:"Quality score 4.5",days:SUN}],
        results:[{text:`Full rehearsal complete ✓`},{text:`Guests confirmed for ${a.culmination || "showcase"}`},{text:"Journey shared at 2nd Workshop"}] },
      { weekNumber:8, cumulativePercentage:WK_PCT[7], description:`${sess*8} sessions COMPLETE; ${(a.culmination || "SHOWCASE").toUpperCase()} HOSTED; ${a.proofMain || "proof"} ready for Graduation Jun 21`,
        actions:[{text:`Final practice sessions before ${a.culmination || "showcase"}`,days:[1,2]},{text:`HOST ${(a.culmination || "showcase").toUpperCase()} — fully commit, enjoy it`,days:[3]},{text:"Photo/video evidence captured",days:[3]},{text:`Compile ${a.proofMain || "your proof"} — video evidence, photos, guest feedback; present at Graduation Jun 21`,days:[4]},{text:"Write testimony; Graduation Sun Jun 21",days:[4,6]}],
        results:[{text:`${a.culmination || "Showcase"} HOSTED ✓`},{text:"Evidence documented"},{text:"Testimony: 'I built this skill from zero' ✓"},{text:`${a.proofMain || "Proof"} COMPLETE ✓ — declaration proven`}] },
    ];
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// PERSONAL — The Experience Goal (Fun & Recreation)
// ─────────────────────────────────────────────────────────────────────────────
const personalExperienceGoal: GoalTemplate = {
  id: "personal-experience-goal",
  goalType: "personal",
  subType: "experience-goal",
  name: "Experience, Hobby & Personal Skill",
  description: "Commit to a real experience, learn something for the joy of it, or dedicate 8 weeks to a hobby — a trip, a language, an instrument, a sport, a creative project. Not for work. Not for money. Just for you.",
  wheelAreaHint: "Area F: Fun & Recreation",
  questions: [
    { id: "experience", label: "Type of experience", type: "multiselect",
      options: ["adventure / outdoor challenge","local travel (province / region)","international travel","creative project / artistic event","bucket list item","sports / athletic challenge","live music / cultural event","wellness retreat / healing experience","community / volunteer experience","learning immersion (course, camp, workshop)","family reunion / bonding experience","other"],
      hint: "Pick the type that best describes it." },
    { id: "specificExperience", label: "Describe it in 1 line (e.g., 'Climb Mt. Pulag with my brother')", type: "text", placeholder: "e.g., Solo trip to Siargao, surf lessons included" },
    { id: "deferring", label: "How long have you been putting this off?", type: "select",
      options: ["Less than a year","1–2 years","3–5 years","More than 5 years","This is new — inspired to start now"], defaultValue: "1–2 years" },
    { id: "blockingBelief", label: "What has stopped you before?", type: "multiselect",
      options: ["I don't deserve it until I've worked hard enough","Not practical / responsible","Other people need me first","I'll do it when I have more money / time / energy","Afraid of how much I'll enjoy it then miss it","No one to go with","Fear of the unknown","I keep saying 'someday'","other"],
      hint: "Naming the block is the first step to breaking it." },
    { id: "solo_group", label: "Solo or with others?", type: "select",
      options: ["Solo — this is for me alone","With 1 person I love","Small group (3–6 people)","Family experience"], defaultValue: "Solo — this is for me alone" },
    { id: "timing", label: "When will this happen?", type: "select",
      options: ["Week 3–4 (early — use LEAP energy)","Week 5–6 (midpoint — reward progress)","Week 7–8 (culmination — graduation gift to self)","Multiple smaller experiences spread through 8 weeks"], defaultValue: "Week 7–8 (culmination — graduation gift to self)" },
    { id: "cost", label: "Estimated cost (₱)", type: "number", placeholder: "5000", defaultValue: "5000" },
    { id: "savingNeeded", label: "Do you need to save or budget for this?", type: "select",
      options: ["Yes — I need to set aside money","No — budget already available"], defaultValue: "Yes — I need to set aside money" },
    { id: "savingsPerWeek", label: "Weekly savings target (₱)", type: "number", placeholder: "1000", defaultValue: "1000",
      dependsOn: { id: "savingNeeded", value: "Yes — I need to set aside money" } },
    { id: "essence", label: "Essence quality this experience will build in you", type: "multiselect",
      options: ["aliveness","joy","freedom","courage","presence","spontaneity","adventure","rest","playfulness","connection","gratitude","other"],
      hint: "This isn't just a fun trip — it's a declaration: 'I am the person who lives fully.'" },
    { id: "proofMain", label: "Primary proof — what will you present at Graduation? (choose 1)", type: "select",
      options: ["Photo album from the experience","Video from the experience (vlog / short film)","GPS activity trace (Strava / Komoot / Google Maps screenshot)","Performance video (for dance, music, sport, recital)","Exhibition photos + attendee / guest book","Ticket stub + location selfie","Other"],
      defaultValue: "Photo album from the experience",
      hint: "This proves you LIVED it — real photos/video from the actual place, moment, or performance. Not a plan. Evidence." },
    { id: "proofSupport", label: "Supporting evidence (optional — pick 1–2 more)", type: "multiselect",
      options: ["written testimony (printed + signed)","blog post / article","LinkedIn post / social media post","Instagram / Facebook Reel or TikTok","digital photo album (Google Photos / iCloud)","printed scrapbook","short film (1–3 min)","personal website / portfolio page","Canva PDF presentation","Notion page / digital portfolio","presentation to LEAP batch at Graduation","letter to my future self","music video / creative video","artwork / painting / illustration","handwritten journal (printed + bound)","other"],
      hint: "Up to 2 extras that support your main proof — powerful but not required." },
  ],
  smarter: (a) => ({
    goalStatement: `Throughout 8 weeks, I commit fully to ${a.specificExperience || (a.experience || "my chosen experience").split(",")[0]}${a.savingNeeded?.startsWith("Yes") ? " — saving ₱"+(a.savingsPerWeek||"1,000")+"/week toward ₱"+(a.cost||"5,000") : " — budget ₱"+(a.cost||"5,000")+" confirmed"}, booked by Week 2, and experienced with full presence and documented evidence, and prove it with ${a.proofMain || "documented evidence"}, by June 19, 2026.`,
    specificDetails: `Experience: ${a.specificExperience || a.experience || "chosen experience"} — ${a.solo_group || "solo or with others"}; happening in ${a.timing?.split(" (")[0] || "Week 7–8"}; cost: ₱${a.cost || "5,000"}${a.savingNeeded?.startsWith("Yes") ? `; save ₱${a.savingsPerWeek || "1,000"}/week` : ""}; weekly preparation milestones build toward this`,
    measurableCriteria: `Experience booked or committed to by Wk 2; savings on track${a.savingNeeded?.startsWith("Yes") ? ` (₱${parseInt(a.savingsPerWeek||"1000")*8} total)` : ""}; ${a.essence || "aliveness"} score (1–10) tracked every Sunday; post-experience reflection written and submitted`,
    achievableResources: `Budget ₱${a.cost || "5,000"}${a.savingNeeded?.startsWith("Yes") ? ` (₱${a.savingsPerWeek || "1,000"}/week saved)` : " — already available"}; ${a.solo_group?.startsWith("Solo") ? "no coordination needed — fully in my control" : "companions identified and invited Wk 1"}; LEAP schedule supports this; commitment declared to coach`,
    relevantAlignment: `I have been deferring this for ${a.deferring?.split(" (")[0] || "years"} because of: ${a.blockingBelief || "practical excuses"}. For the first time I am treating joy and aliveness as a real goal — not something to earn after everything else is done. This experience breaks the 'someday' pattern.`,
    endDate: "June 19, 2026",
    excitingMotivation: `The version of me at graduation who has lived fully during LEAP — not just worked hard. The story: "I was in the most intense personal development programme of my life and I still went." The feeling of ${a.essence || "aliveness"} carrying into everything else I do.`,
    rewardingBenefits: `${a.specificExperience || "Experience"} completed; ${a.essence || "aliveness"} embodied; savings habit built${a.savingNeeded?.startsWith("Yes") ? ` (₱${parseInt(a.savingsPerWeek||"1000")*8} saved)` : ""}; identity shift: "I am someone who lives fully"; testimony: "I didn't just survive LEAP — I lived it"`,
  }),
  answerRisks: (a) => {
    const risks: Array<{ field?: string; message: string }> = [];
    const needsSave = a.savingNeeded?.startsWith("Yes");
    if (needsSave) {
      const weekly = parseInt(a.savingsPerWeek || "1000");
      const cost   = parseInt(a.cost || "5000");
      const saved  = weekly * 7; // 7 weeks of saving (Wk1–Wk7)
      if (saved < cost) {
        const shortfall = cost - saved;
        risks.push({
          field: "savingsPerWeek",
          message: `At ₱${weekly.toLocaleString()}/week × 7 weeks = ₱${saved.toLocaleString()} saved — but your experience costs ₱${cost.toLocaleString()}. Shortfall: ₱${shortfall.toLocaleString()}. Increase your weekly savings or reduce the cost, or confirm you have the gap covered.`,
        });
      }
    }
    // Proof alignment check
    if (a.proofMain) {
      const validProofKw = ["photo album","video","gps","performance video","exhibition","ticket","photos from","film"];
      if (!validProofKw.some((kw: string) => a.proofMain.toLowerCase().includes(kw.toLowerCase()))) {
        risks.push({ field: "proofMain", message: `Your goal declares completing a specific experience. The most direct proof is photos or video FROM the actual experience (the place, moment, or performance) — not just preparation. "${a.proofMain}" may not directly show your result was achieved — review with your coach.` });
      }
    }
    return risks;
  },
  milestones: (a) => {
    const early  = a.timing?.includes("Week 3–4");
    const mid    = a.timing?.includes("Week 5–6");
    const series = a.timing?.includes("Multiple");
    const exp    = a.specificExperience || a.experience || "the experience";
    const save   = a.savingNeeded?.startsWith("Yes");
    const sav    = `₱${a.savingsPerWeek || "1,000"}`;
    const ess    = a.essence || "aliveness";
    const savTotal = (n: number) => `₱${parseInt(a.savingsPerWeek||"1000")*n} saved`;
    return [
      { weekNumber:1, cumulativePercentage:WK_PCT[0],
        description:`Declare the experience publicly; make 1 concrete booking step; name and break your blocking belief; ${save?"start savings":"confirm budget"}`,
        actions:[
          {text:`Declare: "${exp} — I am doing this by ${early?"Week 3–4":mid?"Week 5–6":"Week 7–8"}" — share with coach`,days:MON},
          {text:save?`Set up weekly savings: ${sav}/week — first transfer today`:`Confirm ₱${a.cost||"5,000"} budget — earmarked`,days:MON},
          {text:`Name blocking belief: "${a.blockingBelief||"I'll do it someday"}" — write counter-identity statement`,days:[1]},
          {text:a.solo_group?.startsWith("Solo")?"Plan solo itinerary — research first details":"Invite companion(s) — get first YES confirmed",days:[2,3]},
          {text:`Sunday: ${ess} score 1–10 — baseline`,days:SUN},
        ],
        results:[{text:"Experience declared publicly ✓"},{text:save?"Savings started ✓":"Budget confirmed ✓"},{text:"Blocking belief named and countered"}] },
      { weekNumber:2, cumulativePercentage:WK_PCT[1],
        description:`Experience BOOKED or concretely committed; itinerary drafted; ${save?sav+" transferred ("+savTotal(2)+")":"preparation in motion"}`,
        actions:[
          {text:`Book or lock in ${exp} — ticket, reservation, or public date set`,days:MON},
          {text:"Draft itinerary or experience plan — what happens, when, how",days:[1,2]},
          {text:save?`Transfer ${sav} — Week 2`:"Confirm all logistics: companions, transport, accommodation",days:[3]},
          {text:"Share full plan with coach — accountability confirmation",days:[4]},
          {text:`${ess} score`,days:SUN},
        ],
        results:[{text:`${exp} BOOKED ✓`},{text:save?savTotal(2):"Plan confirmed"},{text:"Itinerary drafted"}] },
      { weekNumber:3, cumulativePercentage:WK_PCT[2],
        description:early?`EXPERIENCE WEEK — ${exp} — lived fully; documentation complete; ${ess} score at peak`:`Preparation deepens; ${ess} score rising; booking/logistics confirmed`,
        actions:early?[
          {text:`${exp} — LIVE IT FULLY; phones managed intentionally`,days:[3,4,5]},
          {text:"Document: photos, voice notes, journal — capture every feeling",days:[3,4,5]},
          {text:"1st Workshop May 17 — bring your aliveness energy into the room",days:[6]},
          {text:`${ess} score — expect peak`,days:SUN},
        ]:[
          {text:save?`Transfer ${sav} — Week 3`:"Confirm bookings and logistics",days:MON},
          {text:"Research or prepare 1 specific element of the experience in detail",days:[1,2]},
          {text:series?"Do Experience #1 this week — small, intentional":"Tell 3 people what experience you've committed to",days:[3,4]},
          {text:"1st Workshop May 17 — how does this experience connect to who you're becoming?",days:[6]},
          {text:`${ess} score`,days:SUN},
        ],
        results:early?[{text:`${exp} EXPERIENCED ✓`},{text:"Documentation complete"},{text:`${ess} score — peak`}]:[{text:save?savTotal(3):"Preparation on track"},{text:series?"Experience #1 done ✓":"Commitment shared publicly"}] },
      { weekNumber:4, cumulativePercentage:WK_PCT[3],
        description:early?`Post-experience integration; what shifted in you? ${ess} habits forming`:mid?`EXPERIENCE happening this week — fully committed; ${ess} score rising`:`Midpoint; ${save?savTotal(4):"logistics confirmed"}; experience on track`,
        actions:[
          {text:early?"Write: 'Before and after — what shifted in me?'":mid?`Final logistics for ${exp} confirmed`:`${save?`Transfer ${sav} — Week 4`:"Final headcount / booking confirmation"}`,days:MON},
          {text:"2nd Intensive May 23–24 UP BGC — carry your essence quality into the room",days:[5,6]},
          {text:early?"Share experience story with 1 person who needs inspiration":mid?`${exp} — LIVE IT FULLY`:series?"Do Experience #2 this week":"Practice the presence / mindset you want to bring to the experience",days:[2,3]},
          {text:`${ess} score`,days:SUN},
        ],
        results:[{text:early?"Integration written ✓":mid?`${exp} EXPERIENCED ✓`:save?savTotal(4):"Midpoint milestone hit"},{text:"2nd Intensive attended"}] },
      { weekNumber:5, cumulativePercentage:WK_PCT[4],
        description:mid?`Post-experience integration; ${ess} habits built into daily life`:early?`${ess} habits from experience embedded; score stays elevated`:series?"Experience #3 this week; pattern of joy established":`Savings on track ${save?"("+savTotal(5)+")":""}; countdown building`,
        actions:mid?[
          {text:`Write: 'Before and after — what shifted in me after ${exp}?'`,days:MON},
          {text:`Build 1 '${ess} ritual' inspired by the experience into your daily routine`,days:[1,2]},
          {text:"Share your experience story at LEAP or with your accountability partner",days:[3]},
          {text:`${ess} score`,days:SUN},
        ]:[
          {text:save?`Transfer ${sav} — Week 5`:"Confirm final participants",days:MON},
          {text:early?`Build 1 '${ess} ritual' into your daily routine`:series?"Experience #3 — document how joy is becoming normal":"Visualize the experience — write exactly how it will feel",days:[1,2,3]},
          {text:`Ask: 'Am I living like someone who does experiences like ${exp} regularly?'`,days:[4]},
          {text:`${ess} score`,days:SUN},
        ],
        results:mid?[{text:`${ess} habit built ✓`},{text:"Experience story shared"}]:[{text:save?savTotal(5):"Preparation on track"},{text:early?`${ess} ritual established ✓`:series?"3 experiences done ✓":"Countdown begun ✓"}] },
      { weekNumber:6, cumulativePercentage:WK_PCT[5],
        description:`${early||mid?`Post-experience ${ess} habits embedded in daily life; aliveness score elevated`:"Final countdown — everything confirmed; logistics locked"}`,
        actions:[
          {text:save?`Transfer ${sav} — Week 6`:"Final logistics locked and confirmed",days:MON},
          {text:"ALC 256 Jun 5–7 — bring your aliveness energy into the weekend",days:[4,5,6]},
          {text:early||mid?"Share your experience story at ALC if invited":"Complete preparation checklist — nothing left to chance",days:[3]},
          {text:series?"Experience #4 this week":`Ask your coach: 'Do you see ${ess} in how I show up now?'`,days:[2]},
          {text:`${ess} score`,days:SUN},
        ],
        results:[{text:save?savTotal(6):"All logistics confirmed"},{text:early||mid?"Aliveness visible to others ✓":"Final prep complete ✓"}] },
      { weekNumber:7, cumulativePercentage:WK_PCT[6],
        description:(!early&&!mid&&!series)?`EXPERIENCE WEEK — ${exp} — lived fully; documentation complete; ${ess} score at peak`:`${ess} at peak; journey documented; testimony drafted`,
        actions:(!early&&!mid&&!series)?[
          {text:`${exp} — LIVE IT FULLY; document every moment`,days:[3,4,5]},
          {text:"2nd Workshop Jun 14 — share your experience journey with your coach",days:[6]},
          {text:"Photos / videos / journal captured",days:[3,4,5]},
          {text:`${ess} score — peak`,days:SUN},
        ]:[
          {text:"2nd Workshop Jun 14 — share how this experience changed you",days:[6]},
          {text:series?"Experience #5 (if planned)":`Integration: 'How has living fully changed the rest of my life?'`,days:[3,4]},
          {text:"Write testimony: 'I am the person who does experiences like this'",days:[4,5]},
          {text:`${ess} score`,days:SUN},
        ],
        results:[{text:(!early&&!mid&&!series)?`${exp} EXPERIENCED ✓`:"Journey documented"},{text:"Shared at 2nd Workshop ✓"}] },
      { weekNumber:8, cumulativePercentage:WK_PCT[7],
        description:`Experience completed; ${a.proofMain || "proof"} compiled and ready for Graduation Jun 21`,
        actions:[
          {text:"Write final testimony: 'I lived fully during LEAP, not just worked hard'",days:[1,2]},
          {text:`Compile ${a.proofMain || "your proof"} — your contract receipt; have it ready to present at Graduation Jun 21`,days:[1,2]},
          {text:"Compile supporting evidence: photos, savings records, journal entries, aliveness scores",days:[2,3]},
          {text:"Graduation Sun Jun 21 — carry your aliveness identity into the room",days:[6]},
          {text:"Submit testimony by Jun 19",days:[4]},
        ],
        results:[{text:`${exp} — DONE ✓`},{text:"Evidence compiled"},{text:"Testimony: 'I am someone who lives fully' ✓"},{text:`${a.proofMain || "Proof"} COMPLETE ✓ — declaration proven`}] },
    ];
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// PROFESSIONAL — Workspace by Design (Work / Study / Business Environment)
// ─────────────────────────────────────────────────────────────────────────────
const professionalWorkspace: GoalTemplate = {
  id: "professional-workspace-design",
  goalType: "professional",
  subType: "workspace-design",
  name: "Workspace by Design",
  description: "Build a workspace that reflects your ambition — whether you're employed, studying, or running a business. Dedicated space + systems + routine = an environment that performs as hard as you do.",
  wheelAreaHint: "Area H: Work Environment",
  questions: [
    { id: "context", label: "Your current situation", type: "select",
      options: ["employed (office / WFH)","student / still studying","freelancer / self-employed","starting a business","running a business","career transition"], defaultValue: "employed (office / WFH)" },
    { id: "spaceType", label: "What kind of workspace are you building?", type: "multiselect",
      options: ["dedicated home office / desk setup","study station / learning environment","business space (studio / shop / salon / home office)","shared space optimization","digital workspace (tools / apps / systems / files)","outdoor / mobile workspace","other"],
      hint: "Pick all that apply." },
    { id: "currentPain", label: "Current pain points in your environment", type: "multiselect",
      options: ["no dedicated workspace","cluttered / disorganized","noisy / full of distractions","poor lighting or ergonomics","missing key equipment or tools","digital chaos (messy files, too many tabs, no systems)","no separation between work and rest","uninspiring — no energy when I sit there","uncomfortable (no proper chair / desk / monitor)","shared space with others who disrupt focus","no work / study startup routine","toxic coworkers or classmates","other"],
      hint: "Name exactly what's broken — this becomes your improvement target." },
    { id: "targetOutcome", label: "Target outcomes by Week 8", type: "multiselect",
      options: ["dedicated workspace fully set up","ergonomic setup (desk, chair, monitor, lighting)","organization system complete (files, storage, labeling)","digital systems running (cloud, tools, apps, folder structure)","distraction management system in place","daily work / study routine locked (6/7 days)","professional / inspiring atmosphere established","business-ready space (for clients / calls / operations)","other"],
      hint: "Pick everything you want to say 'done' on by Week 8." },
    { id: "budget", label: "Budget available (₱)", type: "number", placeholder: "5000", defaultValue: "5000",
      hint: "Even ₱2,000 spent with intention transforms a space." },
    { id: "keyPurchase", label: "Top items to buy or set up", type: "multiselect",
      options: ["proper desk","ergonomic chair","monitor / second screen","desk lamp / lighting upgrade","noise-cancelling headphones","desk organizer / shelves / storage bins","whiteboard or corkboard","cable management","laptop riser / standing desk attachment","faster WiFi router / ethernet cable","plants / decor (environment = mood)","keyboard / mouse upgrade","cloud storage / backup system","printer","other"],
      hint: "Be specific — vague intentions don't get purchased." },
    { id: "skillGoal", label: "Is there a skill or career goal attached to this workspace?", type: "select",
      options: ["No — the environment upgrade is the full goal","Yes — building this to get employed / land a job","Yes — building this to start or grow a business","Yes — building this to level up as a freelancer","Yes — building this to develop a specific skill"], defaultValue: "No — the environment upgrade is the full goal" },
    { id: "skillType", label: "Skill or goal type", type: "multiselect",
      options: ["job application & interview skills","portfolio / resume building","coding / tech skills","business plan / model","social media marketing","sales & outreach","client-facing communication","content creation (writing / video / design)","financial management / bookkeeping","operations & systems","graphic design","online store / shop setup","certification / licensure prep","other"],
      hint: "What do you need to build, know, or prove in 8 weeks?",
      dependsOn: { id: "skillGoal", notEmpty: true } },
    { id: "skillOutcome", label: "Skill outcome by Week 8 (e.g., 'Land 1 job interview', 'Open Shopee store')", type: "text", placeholder: "e.g., Launch Notion client portal, pass 1 job interview",
      dependsOn: { id: "skillGoal", notEmpty: true } },
    { id: "proofMain", label: "Primary proof — what will you present at Graduation? (choose 1)", type: "select",
      options: ["Before/after photos of workspace (Day 1 vs Day 56)","Video tour of the completed workspace","Before/after photo collage (printed or framed)","Screenshot of environment score progression (1 → 8+)","Photos of key purchased items installed and arranged","Short walk-through video showing the transformation","Other"],
      defaultValue: "Before/after photos of workspace (Day 1 vs Day 56)",
      hint: "This proves the environment was BUILT, not just planned — visible transformation from the same angle, same room." },
    { id: "proofSupport", label: "Supporting evidence (optional — pick 1–2 more)", type: "multiselect",
      options: ["written testimony (printed + signed)","blog post / article","LinkedIn post / social media post","Instagram / Facebook Reel or TikTok","digital photo album (Google Photos / iCloud)","printed scrapbook","short film (1–3 min)","personal website / portfolio page","Canva PDF presentation","Notion page / digital portfolio","presentation to LEAP batch at Graduation","letter to my future self","music video / creative video","artwork / painting / illustration","handwritten journal (printed + bound)","other"],
      hint: "Up to 2 extras that support your main proof — powerful but not required." },
  ],
  smarter: (a) => {
    const hasSkill = !a.skillGoal?.startsWith("No");
    return {
      goalStatement: `Throughout 8 weeks, I invest ₱${a.budget || "5,000"} across 3 build sessions/week to achieve ${(a.targetOutcome || "a workspace that performs as hard as I do").split(",")[0]} — environment score rising from baseline to 8+${hasSkill ? `, and deliver ${a.skillOutcome || a.skillType || "my skill goal"}` : ""}, and prove it with ${a.proofMain || "documented evidence"}, by June 19, 2026.`,
      specificDetails: `Build a ${a.spaceType || "dedicated workspace"} for a ${a.context || "professional"} — address: ${a.currentPain || "current pain points"}; achieve: ${a.targetOutcome || "functional workspace"}; budget ₱${a.budget || "5,000"}; key items: ${a.keyPurchase || "desk, organization, digital tools"}${hasSkill ? `; attached skill goal: ${a.skillOutcome || a.skillType || "professional skill"}` : ""}`,
      measurableCriteria: `Weekly environment score (1–10) tracked; all target outcomes complete by Wk 7; budget ₱${a.budget || "5,000"} tracked; work / study routine at 6/7 days by Wk 5${hasSkill ? `; skill outcome: ${a.skillOutcome || "delivered by Wk 7"}` : ""}`,
      achievableResources: `Budget ₱${a.budget || "5,000"} allocated; Lazada / Shopee / 2nd-hand for key items; ${a.context?.includes("student") ? "study community and school resources available" : a.context?.includes("business") ? "business community and LEAP network for referrals" : "WFH flexibility and time block protection"}; accountability coach weekly`,
      relevantAlignment: `My current environment (${a.currentPain || "cluttered, uninspiring, distracting"}) costs me daily performance and mental energy. For the first time I am treating my workspace as infrastructure — not an afterthought. As a ${a.context || "professional"}, my environment should reflect my standards.`,
      endDate: "June 19, 2026",
      excitingMotivation: `Sitting at my workspace after it's done and feeling: "This is built for someone serious." The focus sessions I'll have, the quality of work produced, the identity of being the kind of person whose environment reflects their ambition.${hasSkill ? ` Plus: ${a.skillOutcome || "the skill outcome"} achieved.` : ""}`,
      rewardingBenefits: `${a.targetOutcome || "Workspace"} complete; environment score 3 → 8+; daily routine locked; ₱${a.budget || "5,000"} invested in self with purpose${hasSkill ? `; ${a.skillOutcome || "skill goal"} delivered` : ""}; testimony: "I built a space that performs as hard as I do"`,
    };
  },
  answerRisks: (a) => {
    const risks: Array<{ field?: string; message: string }> = [];
    const budget = parseInt(a.budget || "5000");
    const hasSkill = !a.skillGoal?.startsWith("No");
    if (budget < 1000) {
      risks.push({ field: "budget", message: `₱${budget.toLocaleString()} is very tight for a workspace goal. Even basic improvements (a proper chair, desk organizer, lighting) cost ₱1,000–3,000. Consider raising your budget or narrowing your target outcomes to what ₱${budget.toLocaleString()} can actually achieve.` });
    }
    if (hasSkill && !a.skillOutcome?.trim()) {
      risks.push({ field: "skillOutcome", message: `You've added a skill goal but haven't described the outcome. What specifically will you have built, delivered, or demonstrated by Week 7? Name it — it becomes the measurable target your milestones track toward.` });
    }
    // Proof alignment check
    if (a.proofMain) {
      const validProofKw = ["before/after","video tour","photo collage","environment score","photos of key","transformation","walk-through"];
      if (!validProofKw.some((kw: string) => a.proofMain.toLowerCase().includes(kw.toLowerCase()))) {
        risks.push({ field: "proofMain", message: `Your goal declares a workspace transformation (environment score rise). The most direct proof is before/after photos of the workspace or a video tour showing the transformation from Day 1 to Day 56. "${a.proofMain}" may not directly show your result was achieved — review with your coach.` });
      }
    }
    return risks;
  },
  milestones: (a) => {
    const hasSkill  = !a.skillGoal?.startsWith("No");
    const isStudent = a.context?.includes("student");
    const isBiz     = a.context?.includes("business");
    const label     = isStudent ? "study station" : isBiz ? "business workspace" : "workspace";
    const skillLabel = a.skillType || "professional skill";
    const skillOut   = a.skillOutcome || "skill outcome";
    return [
      { weekNumber:1, cumulativePercentage:WK_PCT[0],
        description:`Full environment audit; priority purchase list built; top 2 items ordered; digital declutter started; baseline score logged`,
        actions:[
          {text:`Photograph current space; list every pain point from your list: ${a.currentPain || "your audit"}`,days:MON},
          {text:`Build priority list (max ₱${a.budget||"5,000"}); order top 2 items now (Lazada / Shopee / 2nd hand)`,days:MON},
          {text:"Clear 1 full surface — declutter ruthlessly; physical space reflects mental state",days:[1,2]},
          {text:"Digital declutter: organize desktop, close unused apps, set up 1 folder system",days:[3]},
          {text:`Log environment score (1–10) — baseline`,days:MON},
          ...(hasSkill?[{text:`Research: ${skillLabel} — find 1 resource (course / book / video) and start`,days:[4]}]:[]),
        ],
        results:[{text:"Space audited — pain list documented"},{text:"Top 2 items ordered ✓"},{text:`Baseline environment score logged`},...(hasSkill?[{text:`${skillLabel} — first resource found ✓`}]:[])] },
      { weekNumber:2, cumulativePercentage:WK_PCT[1],
        description:`Purchased items installed; core ${label} takes shape; digital systems set up; work / study routine drafted; score target: 4`,
        actions:[
          {text:"Install / assemble all purchased items; rearrange furniture if needed",days:MON},
          {text:"Set up digital system: cloud storage, folder structure, or productivity app",days:[1,2]},
          {text:`Draft your ${isStudent?"study":"work"} startup routine: first 15 min at desk = sacred focus time`,days:[3]},
          {text:"Take 'Week 1 → Week 2 progress' photos — document the transformation",days:[4]},
          ...(hasSkill?[{text:`${skillLabel} — first practice session or application submitted`,days:[2,3]}]:[]),
          {text:"Environment score — target 4",days:SUN},
        ],
        results:[{text:"Key items installed ✓"},{text:"Digital system set up ✓"},...(hasSkill?[{text:`First ${skillLabel} session done ✓`}]:[])] },
      { weekNumber:3, cumulativePercentage:WK_PCT[2],
        description:`Work / study routine running 5+ days; organization system built; environment score improving; score target: 5`,
        actions:[
          {text:`Run ${isStudent?"study":"work"} routine 5 days this week — protect the first 15 min`,days:MON_FRI},
          {text:"Build organization system: physical (storage, labels, bins) + digital (file naming, folders)",days:[1,2]},
          {text:"1st Workshop May 17 — how does a designed workspace connect to who you're becoming?",days:[6]},
          ...(hasSkill?[{text:`${skillLabel} — 3+ sessions this week`,days:MON_FRI}]:[]),
          {text:"Environment score — target 5",days:SUN},
        ],
        results:[{text:"Routine 5+ days ✓"},{text:"Organization system in place ✓"},...(hasSkill?[{text:`${skillLabel}: 3+ sessions done ✓`}]:[])] },
      { weekNumber:4, cumulativePercentage:WK_PCT[3],
        description:`Optimization round 2; distraction management working; routine survives any schedule; score target: 6`,
        actions:[
          {text:"Identify what's still not working — buy or fix 1 more thing",days:MON},
          {text:"Set up distraction management: phone rules, noise solution, do-not-disturb signal",days:[1,2]},
          {text:"2nd Intensive May 23–24 UP BGC — keep workspace routine going even during the intensive",days:[5,6]},
          ...(hasSkill?[{text:`${skillLabel} — midpoint milestone: what has the workspace enabled?`,days:[3,4]}]:[]),
          {text:"Environment score — target 6",days:SUN},
        ],
        results:[{text:"Distraction system working ✓"},...(hasSkill?[{text:`${skillLabel} midpoint done ✓`}]:[{text:"Optimization round 2 complete ✓"}])] },
      { weekNumber:5, cumulativePercentage:WK_PCT[4],
        description:`${label} fully functional; routine at 6/7 days; score target: 7+ — test: has performance actually improved?`,
        actions:[
          {text:"Run routine 5 days this week — protect your startup block",days:[0,1,2,3,4]},
          {text:"Self-test: rate output quality / focus hours vs. Week 1 — document the delta",days:[3]},
          {text:isBiz?"Workspace is client-ready — do 1 test call or client meeting in it":isStudent?"Deep study session: 2+ uninterrupted hours — measure focus time":"Deep work: 2+ uninterrupted hours in your designed workspace",days:[2,4]},
          ...(hasSkill?[{text:`${skillLabel} — push week; adjust pace if behind`,days:MON_FRI}]:[]),
          {text:"Environment score — target 7+ by now",days:SUN},
        ],
        results:[{text:"Routine 6/7 days ✓"},{text:"Performance self-test done — improvement documented ✓"},...(hasSkill?[{text:`${skillLabel} on track for ${skillOut}`}]:[])] },
      { weekNumber:6, cumulativePercentage:WK_PCT[5],
        description:`Final touches done; routine holds through intensive weekend; ${hasSkill?"skill nearing completion; environment score 8+":"environment score 8+"}`,
        actions:[
          {text:"ALC 256 Jun 5–7 — protect routine even through intensive weekend",days:[4,5,6]},
          {text:"Final touch: 1 thing that makes the space feel like yours (plant, inspiration board, photo)",days:[1,2]},
          {text:isBiz?"Client-facing workspace ready — test with 1 real session":isStudent?"Space optimized for upcoming exams / finals":"Ask: 'Would I be proud to show my coach this workspace?'",days:[3]},
          ...(hasSkill?[{text:`${skillLabel} — critical push; ${skillOut} in sight`,days:MON_FRI}]:[]),
          {text:"Environment score — target 8",days:SUN},
        ],
        results:[{text:"Final touches done ✓"},...(hasSkill?[{text:`${skillLabel} approaching completion ✓`}]:[{text:"Environment score 8+ ✓"}])] },
      { weekNumber:7, cumulativePercentage:WK_PCT[6],
        description:`${hasSkill?skillOut+" DELIVERED":"Workspace complete"}; transformation evidence compiled; testimony written`,
        actions:[
          {text:hasSkill?`Complete and deliver ${skillOut}`:"Take final 'after' photos — before/after transformation documented",days:MON_FRI},
          {text:"2nd Workshop Jun 14 — share your workspace transformation story with your coach",days:[6]},
          {text:"Write: 'My environment now reflects my ambition — here is the evidence'",days:[4,5]},
          {text:`Ask: 'Would you know from my ${label} that I take ${isStudent?"my studies":"my work"} seriously?'`,days:[3]},
          {text:"Environment score — target 8+",days:SUN},
        ],
        results:[{text:hasSkill?`${skillOut} DELIVERED ✓`:"Transformation complete ✓"},{text:"Testimony ready"},{text:"Shared at 2nd Workshop ✓"}] },
      { weekNumber:8, cumulativePercentage:WK_PCT[7],
        description:`Final score confirmed; evidence compiled; ${a.proofMain || "proof"} ready for Graduation Jun 21`,
        actions:[
          {text:`Compile ${a.proofMain || "your proof"} — your contract receipt; have it ready to present at Graduation Jun 21`,days:[1,2]},
          {text:"Compile transformation: before photos → after photos → environment scores → outcomes",days:[1,2]},
          {text:"Write final testimony: 'I built a space that performs as hard as I do'",days:[2,3]},
          {text:"Graduation Sun Jun 21 — your workspace waits for you when you return",days:[6]},
          {text:"Submit testimony by Jun 19",days:[4]},
        ],
        results:[{text:"Environment score 8+ confirmed ✓"},...(hasSkill?[{text:`${skillOut} complete ✓`}]:[{text:"All target outcomes met ✓"}]),{text:"Testimony submitted ✓"},{text:`${a.proofMain || "Proof"} COMPLETE ✓ — declaration proven`}] },
    ];
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Export all templates
// ─────────────────────────────────────────────────────────────────────────────
export const GOAL_TEMPLATES: GoalTemplate[] = [
  enrollmentStandard,
  enrollmentHighVolume,
  personalHealth,
  personalBeingness,
  personalRelationshipDeepen,
  personalRelationshipPrepare,
  personalExperienceGoal,
  professionalIncomeEmployed,
  professionalIncomeExploring,
  professionalCareerBeingness,
  professionalSkills,
  professionalWorkspace,
];

// Sub-category selection → template ID mapping
export const SUBCATEGORY_TO_TEMPLATE: Record<string, string> = {
  "enrollment":                  "enrollment-flex-alc",
  "enrollment-high":             "enrollment-high-volume",
  "health":                      "personal-health",
  "beingness":                   "personal-beingness",
  "relationship-deepen":         "personal-relationship-deepen",
  "relationship-prepare":        "personal-relationship-prepare",
  "experience-goal":             "personal-experience-goal",
  "income-employed":             "professional-income-employed",
  "income-exploring":            "professional-income-exploring",
  "career-beingness":            "professional-career-beingness",
  "skills":                      "professional-skills",
  "workspace-design":            "professional-workspace-design",
};

// Wheel area → suggested template(s)
export const WHEEL_AREA_SUGGESTIONS: Record<string, string[]> = {
  "A": ["personal-health"],
  "B": ["personal-beingness"],
  "C": ["personal-relationship-deepen"],
  "D": ["personal-relationship-prepare"],
  "E": ["personal-relationship-deepen","personal-beingness"],
  "F": ["personal-experience-goal","personal-beingness"],
  "G": ["professional-career-beingness"],
  "H": ["professional-workspace-design","professional-career-beingness"],
  "I": ["professional-skills"],
  "J": ["professional-income-employed","professional-income-exploring"],
  "K": ["professional-career-beingness","professional-skills"],
  "L": ["personal-beingness"],
};
