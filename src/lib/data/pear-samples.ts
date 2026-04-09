// ─── PEAR Samples — 36 mini-templates (3 per subcategory × 12 subcategories) ──
// Each SampleEntry is a lightweight coaching mini-template.
// Heavy logic (questions, smarter(), milestones) lives in goal-templates.ts.
// The contextQ is the coaching moment — honest, confrontational, pivotal.

export interface SampleEntry {
  id: string;
  parentId: string;       // → GoalTemplate.id
  label: string;          // short approach label shown on sample card
  description: string;    // one-line description of this specific angle
  statement: string;      // pre-written PEAR statement
  contextQ: {
    question: string;     // the confrontational coaching question
    options: string[];    // honest first-person options — always ends with "Other"
    pegMap: Record<string, string>; // option text → peg suggestion
  };
}

export const PEAR_SAMPLES: Record<string, SampleEntry[]> = {

  // ── ENROLLMENT ───────────────────────────────────────────────────────────────

  "enrollment-flex-alc": [
    {
      id: "enrollment-flex-alc-1",
      parentId: "enrollment-flex-alc",
      label: "Sharing from personal truth",
      description: "Invite people from your warm network by leading with your own story.",
      statement: "To honor the transformation my Trilogy journey gave me, as a loving, generous, and open person, I share my story with my network at least 3 times a week through genuine conversations, and enroll at least 1 FLEX student and 1 ALC student by June 21, 2026.",
      contextQ: {
        question: "When you think about inviting someone to LEAP — what actually stops you?",
        options: [
          "I hate feeling like I'm selling. I'd rather say nothing than seem pushy.",
          "I start the conversation but back off the moment they seem hesitant.",
          "I'm waiting until I feel more credible — my own transformation isn't done yet.",
          "Nothing stops me. I just haven't been consistent about doing it.",
          "Other",
        ],
        pegMap: {
          "I hate feeling like I'm selling. I'd rather say nothing than seem pushy.": "share from my own truth and let that speak for itself — no pitch, no pressure",
          "I start the conversation but back off the moment they seem hesitant.": "follow through every time, even when it gets uncomfortable — because I believe in what I'm offering",
          "I'm waiting until I feel more credible — my own transformation isn't done yet.": "honor the transformation I received by passing it on before I feel ready",
          "Nothing stops me. I just haven't been consistent about doing it.": "prove to myself that I can show up consistently — not just when I feel like it",
        },
      },
    },
    {
      id: "enrollment-flex-alc-2",
      parentId: "enrollment-flex-alc",
      label: "Consistent outreach commitment",
      description: "Build a weekly outreach rhythm — new contacts, steady follow-through.",
      statement: "To prove to myself that I can create real results through my own outreach, as a committed, courageous, and disciplined person, I reach out to at least 5 warm contacts every week and follow through on every conversation, and enroll at least 1 FLEX student and 1 ALC student by June 21, 2026.",
      contextQ: {
        question: "What does your enrollment activity actually look like right now — honest answer?",
        options: [
          "Sporadic. I do it in bursts and then disappear for days.",
          "I reach out but I don't follow up — I assume a non-answer means no.",
          "I'm active but I'm chasing the wrong people and avoiding the right ones.",
          "I haven't really started. I keep meaning to.",
          "Other",
        ],
        pegMap: {
          "Sporadic. I do it in bursts and then disappear for days.": "build the discipline of showing up every week — not just when I'm motivated",
          "I reach out but I don't follow up — I assume a non-answer means no.": "follow through relentlessly and find out what's actually possible when I don't quit early",
          "I'm active but I'm chasing the wrong people and avoiding the right ones.": "get honest with myself about who I've been avoiding — and reach out to them first",
          "I haven't really started. I keep meaning to.": "finally close the gap between intention and action — this is the week I actually start",
        },
      },
    },
    {
      id: "enrollment-flex-alc-3",
      parentId: "enrollment-flex-alc",
      label: "Service-first invitation",
      description: "Enroll by genuinely serving — not selling — the people you care about.",
      statement: "To be of genuine service to the people around me who are ready for a breakthrough, as a trusting, vulnerable, and abundant person, I consistently invite people from my warm network at least 3 times a week, and enroll at least 1 FLEX student and 1 ALC student by June 21, 2026.",
      contextQ: {
        question: "Is there someone in your life right now who needs this — and you haven't said anything yet?",
        options: [
          "Yes. More than one. I keep telling myself it's not my place.",
          "Yes — but I'm scared they'll think I'm recruiting them for something.",
          "Yes — but our relationship is complicated and I don't want to risk it.",
          "I've been waiting for the perfect moment that never comes.",
          "Other",
        ],
        pegMap: {
          "Yes. More than one. I keep telling myself it's not my place.": "stop making that decision for them and give people the chance to say yes",
          "Yes — but I'm scared they'll think I'm recruiting them for something.": "care enough about them to have the awkward conversation — because it's worth it",
          "Yes — but our relationship is complicated and I don't want to risk it.": "lead with love, not strategy — and trust that real care can bridge any gap",
          "I've been waiting for the perfect moment that never comes.": "be of genuine service right now — not when the timing is better",
        },
      },
    },
  ],

  "enrollment-high-volume": [
    {
      id: "enrollment-high-volume-1",
      parentId: "enrollment-high-volume",
      label: "Double down on what works",
      description: "Go deeper on your strongest channel — consistency beats variety.",
      statement: "To prove to myself that I can walk the talk, as a committed, courageous, and generous person, I show up for enrollment conversations at least 5 times a week and follow through on every referral without excuses, and enroll at least 2 FLEX students and 2 ALC students by June 21, 2026.",
      contextQ: {
        question: "You already know what works for you in enrollment. Why haven't you gone all in on it?",
        options: [
          "I get distracted by trying other approaches instead of mastering one.",
          "I'm scared that if I push too hard, it will stop working.",
          "I haven't been honest with myself about what actually works.",
          "I've been coasting. I know I can do more.",
          "Other",
        ],
        pegMap: {
          "I get distracted by trying other approaches instead of mastering one.": "commit to one thing fully and find out what's possible when I stop spreading myself thin",
          "I'm scared that if I push too hard, it will stop working.": "push past the fear of losing something good — and discover what's on the other side",
          "I haven't been honest with myself about what actually works.": "finally get honest with myself and build from truth, not from wishful thinking",
          "I've been coasting. I know I can do more.": "walk the talk — not just in the program, but in my own actions",
        },
      },
    },
    {
      id: "enrollment-high-volume-2",
      parentId: "enrollment-high-volume",
      label: "Multi-channel sprint",
      description: "FLEX + ALC combined outreach — maximum reach across both enrollment channels.",
      statement: "To honor the transformation I received by genuinely inviting more people into it, as a loving, disciplined, and abundant person, I dedicate time for outreach at least 5 days a week — not to sell, but to connect and serve, and enroll at least 2 FLEX students and 2 ALC students by June 21, 2026.",
      contextQ: {
        question: "If you enrolled 8 people in 8 weeks, what would that prove to you?",
        options: [
          "That I'm not just someone who attends programs — I create results from them.",
          "That I can commit to hard things and see them through without excuses.",
          "That the transformation I received was real enough to pass on.",
          "That I'm bigger than the fear that's been holding me back.",
          "Other",
        ],
        pegMap: {
          "That I'm not just someone who attends programs — I create results from them.": "prove that what I received from this program lives in my actions, not just my memories",
          "That I can commit to hard things and see them through without excuses.": "honor the commitment I made at graduation — not with words but with results",
          "That the transformation I received was real enough to pass on.": "make my own transformation the reason someone else's begins",
          "That I'm bigger than the fear that's been holding me back.": "break the ceiling of what I've believed is possible for me",
        },
      },
    },
    {
      id: "enrollment-high-volume-3",
      parentId: "enrollment-high-volume",
      label: "Referral chain strategy",
      description: "Let your graduates do the enrolling — build a system that multiplies you.",
      statement: "To know what full commitment to enrollment actually feels like — not because I was asked to, but because I chose to, as a trusting, courageous, and generous person, I show up for outreach and follow-up conversations every morning at least 5 days a week, and enroll at least 2 FLEX students and 2 ALC students by June 21, 2026.",
      contextQ: {
        question: "How comfortable are you asking your own graduates to refer others — really?",
        options: [
          "Very uncomfortable. It feels like asking them for a favor I haven't earned.",
          "I ask once and never bring it up again — I don't want to seem needy.",
          "I assume they'll do it on their own if they loved it. They usually don't.",
          "I've never treated this as a real strategy. I've been leaving it to chance.",
          "Other",
        ],
        pegMap: {
          "Very uncomfortable. It feels like asking them for a favor I haven't earned.": "earn the ask by caring so deeply about my graduates that the request comes from love",
          "I ask once and never bring it up again — I don't want to seem needy.": "follow up with the same conviction I used to invite them in the first place",
          "I assume they'll do it on their own if they loved it. They usually don't.": "stop leaving impact to chance and start building it intentionally",
          "I've never treated this as a real strategy. I've been leaving it to chance.": "know what it feels like to fully choose enrollment — not just show up for it",
        },
      },
    },
  ],

  // ── PERSONAL ─────────────────────────────────────────────────────────────────

  "personal-health": [
    {
      id: "personal-health-1",
      parentId: "personal-health",
      label: "Weight & body transformation",
      description: "Numbers-driven: track weight, body measurements, or physical markers.",
      statement: "To show up as my most vibrant and energetic self for the people I love, as a disciplined, loving, and responsible person, I exercise at least 3 times per week and eat clean for at least 2 meals daily, and present my health journal with before-and-after proof by June 21, 2026.",
      contextQ: {
        question: "Be honest — what's the real story behind this goal?",
        options: [
          "I've started this more times than I can count and quit every time.",
          "Something happened recently that made this impossible to ignore.",
          "I've drifted from who I was. I want to come back to myself.",
          "I've never seriously committed to this. This would be my first real attempt.",
          "Other",
        ],
        pegMap: {
          "I've started this more times than I can count and quit every time.": "finally break the cycle and prove to myself I can see this through",
          "Something happened recently that made this impossible to ignore.": "honor what woke me up and show up at my best from here",
          "I've drifted from who I was. I want to come back to myself.": "come back to the person I know I am underneath all of this",
          "I've never seriously committed to this. This would be my first real attempt.": "experience what it actually feels like to follow through on this — for the first time",
        },
      },
    },
    {
      id: "personal-health-2",
      parentId: "personal-health",
      label: "Movement & energy",
      description: "Feel-driven: build consistent movement that restores energy and vitality.",
      statement: "To prepare for long, healthy, and joyful years ahead, as a joyful, committed, and trusting person, I walk at least 8,000 steps daily and follow my doctor-approved meal plan at least 5 days per week, reaching my target by June 21, 2026.",
      contextQ: {
        question: "When did you stop moving — and what did you tell yourself to make it okay?",
        options: [
          "Life got busy and I quietly made peace with being sedentary.",
          "I kept waiting for the right time, the right plan, the right mood.",
          "I had a setback — injury, illness, or loss — and never fully came back.",
          "I move sometimes but it's random, not intentional. It doesn't count.",
          "Other",
        ],
        pegMap: {
          "Life got busy and I quietly made peace with being sedentary.": "stop making peace with less than I deserve — and reclaim my energy",
          "I kept waiting for the right time, the right plan, the right mood.": "stop waiting and start moving — imperfectly, right now",
          "I had a setback — injury, illness, or loss — and never fully came back.": "come back — not to who I was, but to who I'm becoming",
          "I move sometimes but it's random, not intentional. It doesn't count.": "build something real — not sporadic — so I can finally feel the difference",
        },
      },
    },
    {
      id: "personal-health-3",
      parentId: "personal-health",
      label: "Medical markers",
      description: "Doctor-guided: improve specific health numbers with clinical accountability.",
      statement: "To finally feel at home in my body instead of at war with it, as a patient, loving, and disciplined person, I follow my doctor-approved movement and nutrition plan at least 4 times a week, and present documented progress by June 21, 2026.",
      contextQ: {
        question: "What did your doctor say — and how long did you wait before doing something about it?",
        options: [
          "Long enough to be embarrassed. The number scared me but I delayed anyway.",
          "This is recent — I just found out and I'm actually taking it seriously this time.",
          "I've known for a while. I keep managing it, but not really changing it.",
          "No doctor visit yet — but I know something needs to change before it gets worse.",
          "Other",
        ],
        pegMap: {
          "Long enough to be embarrassed. The number scared me but I delayed anyway.": "stop choosing comfort over the life I actually want to live",
          "This is recent — I just found out and I'm actually taking it seriously this time.": "make this the moment I took the warning seriously and changed direction",
          "I've known for a while. I keep managing it, but not really changing it.": "stop managing my health and start taking ownership of it",
          "No doctor visit yet — but I know something needs to change before it gets worse.": "get ahead of this before it makes the decision for me",
        },
      },
    },
  ],

  "personal-beingness": [
    {
      id: "personal-beingness-1",
      parentId: "personal-beingness",
      label: "One quality, fully embodied",
      description: "Pick one essential quality and live it completely for 8 weeks.",
      statement: "To experience the calm, grounded version of myself I know exists, as an intentional, courageous, and loving person, I practice 15 minutes of daily reflection and journaling every morning, and present 8 weeks of entries to my coach by June 21, 2026.",
      contextQ: {
        question: "What quality are you choosing — and what does the version of you that lacks it actually look like?",
        options: [
          "Discipline. I have big visions but I can't seem to follow through on the small things.",
          "Confidence. I shrink in the rooms where I know I belong.",
          "Peace. I'm reactive, anxious, or short-tempered more than I want to admit.",
          "Presence. I'm always somewhere else — mentally, emotionally — even when I'm there.",
          "Other",
        ],
        pegMap: {
          "Discipline. I have big visions but I can't seem to follow through on the small things.": "finally close the gap between who I say I am and what I actually do",
          "Confidence. I shrink in the rooms where I know I belong.": "stop shrinking in the spaces where I deserve to be — and finally take up room",
          "Peace. I'm reactive, anxious, or short-tempered more than I want to admit.": "experience the calm, grounded version of myself I know exists underneath all the noise",
          "Presence. I'm always somewhere else — mentally, emotionally — even when I'm there.": "be fully in my life — not just passing through it",
        },
      },
    },
    {
      id: "personal-beingness-2",
      parentId: "personal-beingness",
      label: "Breaking a pattern",
      description: "Name the recurring pattern you're ready to end — and replace it.",
      statement: "To stop reacting and start choosing who I want to be, as a grounded, disciplined, and trusting person, I do my morning practice at least 5 times a week and track my quality score weekly, presenting my journal and score journey by June 21, 2026.",
      contextQ: {
        question: "What pattern are you ready to name — out loud, to yourself, right now?",
        options: [
          "I self-sabotage right when things are going well. I find a way to blow it.",
          "I people-please until I disappear. I don't know who I am without their approval.",
          "I start strong and vanish — from goals, relationships, commitments.",
          "I live in my head and never fully show up in my actual life.",
          "Other",
        ],
        pegMap: {
          "I self-sabotage right when things are going well. I find a way to blow it.": "prove to myself that I can receive good things — and keep them",
          "I people-please until I disappear. I don't know who I am without their approval.": "discover what I actually want — separate from what everyone else needs from me",
          "I start strong and vanish — from goals, relationships, commitments.": "be someone who finishes what they start — starting with this",
          "I live in my head and never fully show up in my actual life.": "stop reacting and start choosing — consciously, deliberately, every day",
        },
      },
    },
    {
      id: "personal-beingness-3",
      parentId: "personal-beingness",
      label: "Show up differently for others",
      description: "Transform how the people in your life experience you — not just how you feel inside.",
      statement: "To become someone whose presence others feel before I even speak, as a powerful, loving, and centered person, I embody my chosen essence through a dedicated daily practice at least 5 days per week, and share my transformation story with my coach by June 21, 2026.",
      contextQ: {
        question: "Who is being affected by the version of you that hasn't grown yet?",
        options: [
          "My kids. They're watching me — and I don't like what they're learning.",
          "My partner. I'm physically present but emotionally somewhere else.",
          "My team. I lead from an old version of myself I've already outgrown.",
          "Myself. I'm the one I keep disappointing — and I'm done with it.",
          "Other",
        ],
        pegMap: {
          "My kids. They're watching me — and I don't like what they're learning.": "become someone my children are proud of — not someday, but right now",
          "My partner. I'm physically present but emotionally somewhere else.": "show up fully — not just in the house, but in the relationship",
          "My team. I lead from an old version of myself I've already outgrown.": "lead from who I'm becoming — not from who I used to be",
          "Myself. I'm the one I keep disappointing — and I'm done with it.": "become someone whose presence others feel before I even speak",
        },
      },
    },
  ],

  "personal-relationship-deepen": [
    {
      id: "personal-relationship-deepen-1",
      parentId: "personal-relationship-deepen",
      label: "Quality time commitment",
      description: "Show up more often, more intentionally — not just physically present.",
      statement: "To show the person I love most that my word is real, as a present, generous, and loving person, I spend meaningful time with them at least twice a week and plan one real shared experience per month, and present my relationship reflection journal by June 21, 2026.",
      contextQ: {
        question: "When did this relationship start coasting — and what did you tell yourself about it?",
        options: [
          "A while ago. We've both been too busy to notice how far we've drifted.",
          "After something happened — a fight, a change, a loss — and we never recovered.",
          "It hasn't coasted — I just want more depth than we've ever had before.",
          "I've been physically present but completely absent in what actually matters.",
          "Other",
        ],
        pegMap: {
          "A while ago. We've both been too busy to notice how far we've drifted.": "stop letting busyness be the reason the people I love feel alone",
          "After something happened — a fight, a change, a loss — and we never recovered.": "repair what I've been afraid to face — because they deserve the effort",
          "It hasn't coasted — I just want more depth than we've ever had before.": "show the person I love most that my word is real",
          "I've been physically present but completely absent in what actually matters.": "finally be somewhere — fully — not just showing up in body",
        },
      },
    },
    {
      id: "personal-relationship-deepen-2",
      parentId: "personal-relationship-deepen",
      label: "The breakthrough conversation",
      description: "Have the conversation you've been avoiding — the one that changes everything.",
      statement: "To repair and deepen what matters most to me in my family, as a patient, humble, and loving person, I initiate conversations and quality time at least 3 times a week, and share documented proof of our relationship growth by June 21, 2026.",
      contextQ: {
        question: "What's the conversation you've been swallowing — and why haven't you said it?",
        options: [
          "Something I need to say that I've been holding in for too long.",
          "Something I need to ask — and I'm terrified of the answer.",
          "An apology I owe that I've been rationalizing instead of giving.",
          "A dream or need I've never shared because I don't know how they'll react.",
          "Other",
        ],
        pegMap: {
          "Something I need to say that I've been holding in for too long.": "stop swallowing the truth — and trust that honesty is an act of love",
          "Something I need to ask — and I'm terrified of the answer.": "care more about the truth than about staying comfortable",
          "An apology I owe that I've been rationalizing instead of giving.": "repair what I've been too proud to fix — because the relationship is worth more than my ego",
          "A dream or need I've never shared because I don't know how they'll react.": "let myself be truly known — not just loved for the version I let people see",
        },
      },
    },
    {
      id: "personal-relationship-deepen-3",
      parentId: "personal-relationship-deepen",
      label: "Small daily acts",
      description: "Depth through consistency — the micro-actions that compound into closeness.",
      statement: "To be the partner and family member I know I'm capable of being, as a committed, generous, and present person, I show up without excuses at least 3 times a week in their world, and present a written reflection at 8 weeks by June 21, 2026.",
      contextQ: {
        question: "What does neglect look like in this relationship — if you're being honest?",
        options: [
          "Days go by without a real conversation — just logistics and schedules.",
          "I'm on my phone when I'm with them. They've noticed. I've noticed them noticing.",
          "I take them for granted because they're always there. I save my best for elsewhere.",
          "I feel care for them in my head — but I rarely say it or show it out loud.",
          "Other",
        ],
        pegMap: {
          "Days go by without a real conversation — just logistics and schedules.": "make space for what matters — not just manage what's urgent",
          "I'm on my phone when I'm with them. They've noticed. I've noticed them noticing.": "give the people I love something I almost never give anyone — my full attention",
          "I take them for granted because they're always there. I save my best for elsewhere.": "stop saving my presence for people I'm trying to impress and give it to the ones who matter most",
          "I feel care for them in my head — but I rarely say it or show it out loud.": "prove that love is a verb — and say it out loud through what I do every day",
        },
      },
    },
  ],

  "personal-relationship-prepare": [
    {
      id: "personal-relationship-prepare-1",
      parentId: "personal-relationship-prepare",
      label: "Inner work first",
      description: "Become the person you want to be before the relationship finds you.",
      statement: "To become someone I would want to be in a relationship with, as a self-aware, loving, and disciplined person, I do my inner-work practice at least 5 days a week and track my readiness score from 4 to 8, presenting my journal and coach feedback by June 21, 2026.",
      contextQ: {
        question: "What kind of partner are you right now — if you're being completely honest?",
        options: [
          "Unavailable. Too focused on work, goals, or myself to really show up for anyone.",
          "Wounded. I carry past relationships into new ones without fully realizing it.",
          "Guarded. I keep people at a distance because closeness feels like danger.",
          "A work in progress who's finally ready to actually do the work.",
          "Other",
        ],
        pegMap: {
          "Unavailable. Too focused on work, goals, or myself to really show up for anyone.": "become someone who can be fully present for another person — not just for my ambitions",
          "Wounded. I carry past relationships into new ones without fully realizing it.": "heal enough to stop bringing old pain into new possibilities",
          "Guarded. I keep people at a distance because closeness feels like danger.": "learn to be close without disappearing — and let someone in without losing myself",
          "A work in progress who's finally ready to actually do the work.": "become someone I would genuinely want to be in a relationship with",
        },
      },
    },
    {
      id: "personal-relationship-prepare-2",
      parentId: "personal-relationship-prepare",
      label: "Breaking the pattern",
      description: "Identify the pattern you keep repeating in relationships — and end it.",
      statement: "To stop waiting to be ready and start becoming ready, as a courageous, trusting, and open person, I practice the qualities of readiness every day through journaling and honest reflection, and share my progress story by June 21, 2026.",
      contextQ: {
        question: "What's the pattern you keep bringing into relationships — the one you can't seem to escape?",
        options: [
          "I'm drawn to people who aren't available — emotionally or literally.",
          "I lose myself completely. I become whoever I think they want me to be.",
          "I leave before I can be left. I exit the moment it gets real.",
          "I stay too long in things that stopped serving me — I call it loyalty.",
          "Other",
        ],
        pegMap: {
          "I'm drawn to people who aren't available — emotionally or literally.": "stop choosing unavailability and start becoming available to something real",
          "I lose myself completely. I become whoever I think they want me to be.": "know who I am well enough to stay myself — even inside love",
          "I leave before I can be left. I exit the moment it gets real.": "stop running from the depth I've always wanted — and stay",
          "I stay too long in things that stopped serving me — I call it loyalty.": "learn the difference between commitment and self-abandonment",
        },
      },
    },
    {
      id: "personal-relationship-prepare-3",
      parentId: "personal-relationship-prepare",
      label: "Readiness through growth",
      description: "Build the inner capacity for a great relationship — before you're in one.",
      statement: "To enter any future relationship from fullness, not from need, as an abundant, joyful, and grounded person, I commit to weekly self-investment practices at least 4 times per week, and present documented inner growth by June 21, 2026.",
      contextQ: {
        question: "What does 'being ready for a relationship' actually mean to you right now?",
        options: [
          "Having my life together enough that I'm not bringing chaos into someone else's.",
          "Healing enough to stop recreating the same painful dynamics.",
          "Being someone I'd genuinely want to be with — not just someone who wants love.",
          "Knowing what I actually want — instead of just taking what comes.",
          "Other",
        ],
        pegMap: {
          "Having my life together enough that I'm not bringing chaos into someone else's.": "build the kind of inner stability that makes me someone worth showing up for",
          "Healing enough to stop recreating the same painful dynamics.": "enter love from a place of wholeness — not from the wounds I haven't addressed",
          "Being someone I'd genuinely want to be with — not just someone who wants love.": "enter any future relationship from fullness — not from need",
          "Knowing what I actually want — instead of just taking what comes.": "know myself well enough to choose love intentionally — not accidentally",
        },
      },
    },
  ],

  "personal-experience-goal": [
    {
      id: "personal-experience-goal-1",
      parentId: "personal-experience-goal",
      label: "The trip or adventure",
      description: "A place to go, an experience to have — purely for yourself.",
      statement: "To finally live a life I'm excited to talk about, as a bold, joyful, and free person, I plan and fully commit to my chosen experience or hobby — dedicating at least 3 sessions per week to it — and present documented proof of the journey by June 21, 2026.",
      contextQ: {
        question: "What keeps you from actually doing this — the real reason?",
        options: [
          "Money — or the story I've been telling myself about money.",
          "Waiting for the right time that keeps not coming.",
          "Waiting for someone to do it with me. I don't want to go alone.",
          "Fear of something going wrong — so I over-plan and never execute.",
          "Other",
        ],
        pegMap: {
          "Money — or the story I've been telling myself about money.": "stop letting money be the excuse and start making this happen within what I actually have",
          "Waiting for the right time that keeps not coming.": "stop waiting for permission to live my life fully",
          "Waiting for someone to do it with me. I don't want to go alone.": "do it alone if I have to — and discover that my own company is enough",
          "Fear of something going wrong — so I over-plan and never execute.": "stop planning the experience and start living it — imperfectly, now",
        },
      },
    },
    {
      id: "personal-experience-goal-2",
      parentId: "personal-experience-goal",
      label: "The creative skill",
      description: "Learn something purely because you love it — not for your career or resume.",
      statement: "To learn something for the pure joy of it — not for my career, not for money, just for me, as a curious, patient, and playful person, I practice at least 3 times a week and complete a beginner-to-capable milestone, presenting a showcase by June 21, 2026.",
      contextQ: {
        question: "When did you stop making time for things you love — and what did you trade them for?",
        options: [
          "When adult responsibilities took over and everything had to be productive to count.",
          "When I compared myself to people who were better and decided it wasn't worth it.",
          "When I failed publicly — performed badly, got criticized — and quietly quit.",
          "I never really started. I've kept this on a wish list for years.",
          "Other",
        ],
        pegMap: {
          "When adult responsibilities took over and everything had to be productive to count.": "give myself permission to do something purely because it makes me feel alive",
          "When I compared myself to people who were better and decided it wasn't worth it.": "be a joyful beginner again — and stop letting comparison steal what I love",
          "When I failed publicly — performed badly, got criticized — and quietly quit.": "reclaim something I gave up too easily — and go back for it",
          "I never really started. I've kept this on a wish list for years.": "stop wishing and start doing — this time for real",
        },
      },
    },
    {
      id: "personal-experience-goal-3",
      parentId: "personal-experience-goal",
      label: "The personal milestone",
      description: "A race, a challenge, an achievement — something to prove to yourself.",
      statement: "To do the thing I've been putting off for years because life was 'too busy', as a courageous, joyful, and self-honoring person, I invest at least 3 dedicated sessions per week into my chosen activity, and present a reflection and portfolio by June 21, 2026.",
      contextQ: {
        question: "What does achieving this actually prove — and to whom?",
        options: [
          "To myself — that I can do hard things when I actually commit.",
          "To people who've underestimated me, including past versions of myself.",
          "To no one else. This is entirely, unapologetically mine.",
          "I'm not fully sure yet. That's part of what I want to find out.",
          "Other",
        ],
        pegMap: {
          "To myself — that I can do hard things when I actually commit.": "discover what I'm actually capable of when I stop holding back",
          "To people who've underestimated me, including past versions of myself.": "prove — to no audience more important than myself — that I am someone who does hard things",
          "To no one else. This is entirely, unapologetically mine.": "do something purely because it makes me feel alive — no audience required",
          "I'm not fully sure yet. That's part of what I want to find out.": "find out — through doing it — what this proves about who I am",
        },
      },
    },
  ],

  // ── PROFESSIONAL ─────────────────────────────────────────────────────────────

  "professional-income-employed": [
    {
      id: "professional-income-employed-1",
      parentId: "professional-income-employed",
      label: "Side service or freelance",
      description: "Earn from your skills outside your job — clients, services, consulting.",
      statement: "To build financial freedom that supports my family's security and my personal dreams, as a resourceful, disciplined, and abundant professional, I dedicate at least 2 hours per day to building and selling my offer, and earn at least ₱10,000 in additional monthly income by June 21, 2026.",
      contextQ: {
        question: "Why haven't you been earning from your skills outside your job yet — honestly?",
        options: [
          "I don't believe people will pay me. Deep down I'm not sure what I offer is valuable.",
          "I've started before but stopped when results were slow or discomfort got high.",
          "The business side — pricing, pitching, selling — intimidates me completely.",
          "I've been waiting for permission that will never come.",
          "Other",
        ],
        pegMap: {
          "I don't believe people will pay me. Deep down I'm not sure what I offer is valuable.": "prove to myself — through actual sales — that what I have is worth paying for",
          "I've started before but stopped when results were slow or discomfort got high.": "stay the course past the point where I've always quit before",
          "The business side — pricing, pitching, selling — intimidates me completely.": "build the part of myself that business requires — not just the part that does the work",
          "I've been waiting for permission that will never come.": "stop waiting and start building — on my own terms, right now",
        },
      },
    },
    {
      id: "professional-income-employed-2",
      parentId: "professional-income-employed",
      label: "Passive or investment income",
      description: "Build income that works without you — assets, investments, systems.",
      statement: "To prove that my skills are worth paying for, as a confident, committed, and excellent professional, I launch my freelance offer in Week 1 and reach out to at least 5 prospects per week, and earn at least ₱10,000 in additional monthly income by June 21, 2026.",
      contextQ: {
        question: "What's your honest relationship with money — not what you want it to be, what it actually is?",
        options: [
          "I earn and spend. I've never had a real plan and I've made peace with that.",
          "I know what to do but I keep finding reasons to delay.",
          "I've tried before, lost money, and the fear of doing that again is real.",
          "I've been comfortable enough to avoid the discomfort of growing.",
          "Other",
        ],
        pegMap: {
          "I earn and spend. I've never had a real plan and I've made peace with that.": "break the earn-and-spend cycle and build something that lasts beyond my next paycheck",
          "I know what to do but I keep finding reasons to delay.": "stop leaving money on the table and finally execute what I already know",
          "I've tried before, lost money, and the fear of doing that again is real.": "face the fear with a better plan — and prove that past losses don't define future results",
          "I've been comfortable enough to avoid the discomfort of growing.": "stop choosing comfort and start building the financial life I actually want",
        },
      },
    },
    {
      id: "professional-income-employed-3",
      parentId: "professional-income-employed",
      label: "Promotion or raise",
      description: "Advance within your current employment — more pay, more recognition, more impact.",
      statement: "To stop leaving money on the table and start building income that compounds, as a creative, disciplined, and abundant professional, I build and sell my offer consistently at least 3 times a week, and earn at least ₱10,000 in additional monthly income by June 21, 2026.",
      contextQ: {
        question: "Why haven't you gotten there yet — the real reason, not the polished version?",
        options: [
          "I've been waiting to be noticed instead of asking for what I want.",
          "I don't think I deserve it yet. I keep raising my own bar to stay safe.",
          "I'm good at the work but I avoid the visibility that advancement requires.",
          "I've been loyal to comfort inside my role instead of committed to growing past it.",
          "Other",
        ],
        pegMap: {
          "I've been waiting to be noticed instead of asking for what I want.": "stop waiting to be discovered and start making myself impossible to overlook",
          "I don't think I deserve it yet. I keep raising my own bar to stay safe.": "decide I deserve it — and then prove it to myself through action",
          "I'm good at the work but I avoid the visibility that advancement requires.": "step into the spotlight I've been hiding from — because the work alone is not enough",
          "I've been loyal to comfort inside my role instead of committed to growing past it.": "choose growth over comfort — and mean it this time",
        },
      },
    },
  ],

  "professional-income-exploring": [
    {
      id: "professional-income-exploring-1",
      parentId: "professional-income-exploring",
      label: "Freelance or gig",
      description: "Sell your skills directly — time, expertise, and effort in exchange for pay.",
      statement: "To experience the freedom of earning on my own terms, as a resourceful, courageous, and disciplined person, I work on my income opportunity at least 6 hours daily and secure my first paying client by Week 3, reaching ₱15,000 per month by June 21, 2026.",
      contextQ: {
        question: "What stops you from charging for what you're good at?",
        options: [
          "The fear of being rejected — and taking it as proof that I'm not good enough.",
          "I don't know how to start. The whole thing overwhelms me into inaction.",
          "I tried once, it didn't work, and I've been using that as the reason to stop.",
          "I keep waiting until I'm 'good enough' — which turns out to be never.",
          "Other",
        ],
        pegMap: {
          "The fear of being rejected — and taking it as proof that I'm not good enough.": "separate my worth from the outcome — and put my work out anyway",
          "I don't know how to start. The whole thing overwhelms me into inaction.": "start before I'm ready and figure it out on the way — like everyone who's ever built something",
          "I tried once, it didn't work, and I've been using that as the reason to stop.": "try again with what I know now — and stop letting one failure write the whole story",
          "I keep waiting until I'm 'good enough' — which turns out to be never.": "decide that I'm good enough now — and let the market tell me if I'm wrong",
        },
      },
    },
    {
      id: "professional-income-exploring-2",
      parentId: "professional-income-exploring",
      label: "Product or content",
      description: "Build something that earns — a product, a course, a content stream.",
      statement: "To prove to myself that I can build income from zero, as a trusting, abundant, and persistent person, I dedicate at least 8 hours per day to my income plan and follow up consistently, and earn ₱15,000 monthly income by June 21, 2026.",
      contextQ: {
        question: "What's the idea you've been sitting on — and why is it still just an idea?",
        options: [
          "I have one but I don't believe it's original enough to be worth building.",
          "I have one but I'm terrified of public judgment if it fails.",
          "I have too many. I can't commit to one long enough to actually build it.",
          "I don't have a clear idea yet — I'm still figuring out what I have to offer.",
          "Other",
        ],
        pegMap: {
          "I have one but I don't believe it's original enough to be worth building.": "stop waiting for originality and start building — execution is rarer than ideas",
          "I have one but I'm terrified of public judgment if it fails.": "build it anyway — and let the fear of judgment be the price of doing something real",
          "I have too many. I can't commit to one long enough to actually build it.": "pick one and stay — and discover what's on the other side of commitment",
          "I don't have a clear idea yet — I'm still figuring out what I have to offer.": "start building before I've figured it out — and let the building show me what I have",
        },
      },
    },
    {
      id: "professional-income-exploring-3",
      parentId: "professional-income-exploring",
      label: "Service business",
      description: "Build recurring clients — a real business with ongoing revenue.",
      statement: "To stop asking and start building, as a courageous, resourceful, and disciplined person, I identify my best opportunity in Week 1 and work at least 40 hours per week building it, reaching ₱15,000 per month by June 21, 2026.",
      contextQ: {
        question: "What version of you does this require — and what's in the way of becoming that person?",
        options: [
          "The version that can survive the uncomfortable early stage without quitting.",
          "The version that believes the value I offer is actually worth paying for.",
          "The version that doesn't disappear when results are slow.",
          "The version that stops overthinking and starts doing.",
          "Other",
        ],
        pegMap: {
          "The version that can survive the uncomfortable early stage without quitting.": "become the person who can stay when it's hard — because that's where everyone else leaves",
          "The version that believes the value I offer is actually worth paying for.": "build something real — and let it show me that what I have is worth paying for",
          "The version that doesn't disappear when results are slow.": "stay the course past the point where results feel impossible — that's where momentum starts",
          "The version that stops overthinking and starts doing.": "stop asking and start building — right now, with what I have",
        },
      },
    },
  ],

  "professional-career-beingness": [
    {
      id: "professional-career-beingness-1",
      parentId: "professional-career-beingness",
      label: "Presence in the room",
      description: "Change how people experience you when you walk in — before you speak.",
      statement: "To become the professional I know I'm meant to be — not just by title but by presence, as a grounded, excellent, and disciplined person, I embody my target quality in every meeting and interaction, and present peer feedback and a coach reflection by June 21, 2026.",
      contextQ: {
        question: "What actually happens to you when you walk into a high-stakes room?",
        options: [
          "I shrink. I go quiet and wait for someone to give me permission to speak.",
          "I perform — I put on a version of myself that feels completely fake.",
          "I'm there but I'm not landing. People don't feel me the way I want them to.",
          "I'm inconsistent — sometimes I own it, sometimes I completely disappear.",
          "Other",
        ],
        pegMap: {
          "I shrink. I go quiet and wait for someone to give me permission to speak.": "stop waiting for permission to take up the space I've already earned",
          "I perform — I put on a version of myself that feels completely fake.": "show up as myself — and trust that who I actually am is enough",
          "I'm there but I'm not landing. People don't feel me the way I want them to.": "close the gap between who I know I am and how the room experiences me",
          "I'm inconsistent — sometimes I own it, sometimes I completely disappear.": "become consistently present — not just when I feel ready",
        },
      },
    },
    {
      id: "professional-career-beingness-2",
      parentId: "professional-career-beingness",
      label: "Reputation and visibility",
      description: "Be known for the right things — build the professional identity you want.",
      statement: "To lead from who I am, not from a title I'm waiting for, as a confident, generous, and committed professional, I practice my target qualities visibly at least 4 days per week through specific actions, and present documented colleague observations by June 21, 2026.",
      contextQ: {
        question: "What's the gap between who you are at work and who people actually think you are?",
        options: [
          "I'm far more capable than what's visible. I hide behind the work and call it humility.",
          "I'm known for old versions of myself — things I've already outgrown.",
          "I'm invisible. I've had my head down so long no one really notices me.",
          "I'm just starting to build a reputation and I want to be intentional about it.",
          "Other",
        ],
        pegMap: {
          "I'm far more capable than what's visible. I hide behind the work and call it humility.": "stop hiding behind the work and let people see who's actually doing it",
          "I'm known for old versions of myself — things I've already outgrown.": "rewrite the professional narrative — and let my actions tell the new story",
          "I'm invisible. I've had my head down so long no one really notices me.": "become visible in the right rooms for the right reasons",
          "I'm just starting to build a reputation and I want to be intentional about it.": "build my professional identity deliberately — not accidentally",
        },
      },
    },
    {
      id: "professional-career-beingness-3",
      parentId: "professional-career-beingness",
      label: "Leadership quality",
      description: "Grow into the leader you're becoming — visible, consistent, human.",
      statement: "To stop acting like someone who's not quite ready yet, as a bold, capable, and present professional, I make at least 3 visible professional moves per week that demonstrate my chosen quality, and share proof of impact with my coach by June 21, 2026.",
      contextQ: {
        question: "What do the people you lead actually get from you right now — be honest?",
        options: [
          "Competence — but not inspiration. I deliver but I don't move people.",
          "My stress. I haven't learned to carry pressure without it leaking onto them.",
          "Distance. I lead professionally but not humanly. I'm behind glass.",
          "A mixed experience. I'm growing — but they feel my inconsistency.",
          "Other",
        ],
        pegMap: {
          "Competence — but not inspiration. I deliver but I don't move people.": "become a leader people remember — not just one they can count on",
          "My stress. I haven't learned to carry pressure without it leaking onto them.": "learn to carry what leadership requires — without making it everyone else's weight",
          "Distance. I lead professionally but not humanly. I'm behind glass.": "lead with my whole self — not just my competence",
          "A mixed experience. I'm growing — but they feel my inconsistency.": "become the steady, present leader I can already sense I'm becoming",
        },
      },
    },
  ],

  "professional-skills": [
    {
      id: "professional-skills-1",
      parentId: "professional-skills",
      label: "Technical or craft skill",
      description: "Learn it, apply it, and prove it with real work.",
      statement: "To prepare for a future that excites me every single morning, as a curious, committed, and creative professional, I practice my target skill for at least 8 hours per week and complete 3 real projects, and present my portfolio showcase by June 21, 2026.",
      contextQ: {
        question: "Why hasn't this skill been built yet — the real reason?",
        options: [
          "I learn and then don't apply. The gap between knowing and doing is embarrassingly real.",
          "I've been waiting for formal training instead of just starting on my own.",
          "I get distracted by the next thing before I master this one.",
          "I'm afraid of the beginner stage — looking incompetent makes me stop.",
          "Other",
        ],
        pegMap: {
          "I learn and then don't apply. The gap between knowing and doing is embarrassingly real.": "close the gap between learning and doing — for real this time",
          "I've been waiting for formal training instead of just starting on my own.": "start without permission and build the credential through the work itself",
          "I get distracted by the next thing before I master this one.": "stay with one thing long enough to actually become good at it",
          "I'm afraid of the beginner stage — looking incompetent makes me stop.": "be a committed beginner — and let the discomfort be proof that I'm actually growing",
        },
      },
    },
    {
      id: "professional-skills-2",
      parentId: "professional-skills",
      label: "Communication or speaking",
      description: "Build your voice — presentations, writing, facilitation, storytelling.",
      statement: "To finally build the skill I've been thinking about for years and prove it with something real, as a disciplined, patient, and creative person, I practice at least 4 sessions per week and build toward my culminating event, presenting proof of mastery by June 21, 2026.",
      contextQ: {
        question: "What happens to your voice when the stakes go up?",
        options: [
          "It disappears. I go blank, ramble, or both — and then replay it for hours afterward.",
          "It comes out wrong. I know exactly what I mean but it doesn't land the way I intend.",
          "I over-prepare, and then freeze when things go off-script.",
          "I avoid the situation entirely — I say yes and then find a reason not to show up.",
          "Other",
        ],
        pegMap: {
          "It disappears. I go blank, ramble, or both — and then replay it for hours afterward.": "build the kind of command in front of a room that I know I'm capable of",
          "It comes out wrong. I know exactly what I mean but it doesn't land the way I intend.": "close the gap between what I mean and what people hear",
          "I over-prepare, and then freeze when things go off-script.": "build the fluency that can't be frozen — grounded in who I am, not what I memorized",
          "I avoid the situation entirely — I say yes and then find a reason not to show up.": "stop disappearing from the rooms where my voice belongs",
        },
      },
    },
    {
      id: "professional-skills-3",
      parentId: "professional-skills",
      label: "Portfolio or showcase",
      description: "Create work worth showing — a body of proof for what you can do.",
      statement: "To earn the right to call myself a practitioner of what I'm building, as a humble, committed, and creative person, I dedicate structured practice at least 3 times per week for 8 weeks, and present my completed project or performance by June 21, 2026.",
      contextQ: {
        question: "Why hasn't this work been put out into the world yet?",
        options: [
          "Perfectionism. It's never quite ready — there's always one more thing to fix.",
          "Fear. Not that no one will care — but that they will, and they'll judge it.",
          "I don't know how to present what I've built. The work exists, the words don't.",
          "I've been building but not documenting. I have the skill but no proof.",
          "Other",
        ],
        pegMap: {
          "Perfectionism. It's never quite ready — there's always one more thing to fix.": "ship it imperfect — and let done be more powerful than perfect",
          "Fear. Not that no one will care — but that they will, and they'll judge it.": "put it out anyway — and discover that the judgment I feared is survivable",
          "I don't know how to present what I've built. The work exists, the words don't.": "build the words that match the work — so what I've created can finally be seen",
          "I've been building but not documenting. I have the skill but no proof.": "create the evidence — and give my work the chance to speak for itself",
        },
      },
    },
  ],

  "professional-workspace-design": [
    {
      id: "professional-workspace-design-1",
      parentId: "professional-workspace-design",
      label: "Physical environment",
      description: "Design the space that matches your ambition — tools, setup, energy.",
      statement: "To create an environment that matches my ambition and protects my most important work, as a structured, intentional, and creative professional, I build my workspace in at least 3 dedicated sessions per week over 8 weeks within my budget, and present a documented before-and-after by June 21, 2026.",
      contextQ: {
        question: "What does your workspace say about how seriously you take your own work?",
        options: [
          "It says I'm disorganized, distracted, and just getting by.",
          "It's functional but uninspiring — it doesn't make me want to show up.",
          "It's borrowed or temporary — I don't really have a space that's mine.",
          "It used to work — but I've outgrown it and haven't admitted that yet.",
          "Other",
        ],
        pegMap: {
          "It says I'm disorganized, distracted, and just getting by.": "build a space that tells the truth about who I'm becoming — not who I've been",
          "It's functional but uninspiring — it doesn't make me want to show up.": "design an environment that makes me want to sit down and do great work every morning",
          "It's borrowed or temporary — I don't really have a space that's mine.": "claim a space that's fully mine — and let it reflect what I'm building",
          "It used to work — but I've outgrown it and haven't admitted that yet.": "stop tolerating an environment designed for an older version of myself",
        },
      },
    },
    {
      id: "professional-workspace-design-2",
      parentId: "professional-workspace-design",
      label: "Systems and routines",
      description: "Design how you work — not just where. Build the daily structure that produces results.",
      statement: "To stop letting my environment hold my performance hostage, as a disciplined, resourceful, and focused person, I design and set up my workspace in at least 2 dedicated sessions per week, completing all phases by Week 4, and present a complete workspace tour by June 21, 2026.",
      contextQ: {
        question: "How much of your working day is designed versus accidental?",
        options: [
          "Almost entirely accidental. I react to whatever comes at me.",
          "I have systems but I abandon them the moment life gets busy.",
          "I'm organized — but the system doesn't match the work I actually want to do.",
          "I've never built a real system. I wing it and call it flexibility.",
          "Other",
        ],
        pegMap: {
          "Almost entirely accidental. I react to whatever comes at me.": "design my day instead of surviving it — and protect the work that actually matters",
          "I have systems but I abandon them the moment life gets busy.": "build a system simple enough to survive a hard week — not just an easy one",
          "I'm organized — but the system doesn't match the work I actually want to do.": "redesign everything around the work I'm becoming — not the work I've been managing",
          "I've never built a real system. I wing it and call it flexibility.": "stop calling chaos flexibility and build the structure that sets me free",
        },
      },
    },
    {
      id: "professional-workspace-design-3",
      parentId: "professional-workspace-design",
      label: "Digital and remote readiness",
      description: "Build the digital infrastructure for the work you actually want — tools, setup, connectivity.",
      statement: "To have a space I'm excited to walk into every morning, as a creative, organized, and intentional professional, I execute my workspace transformation step by step, and share documented proof of the before and after by June 21, 2026.",
      contextQ: {
        question: "If someone watched you work for a full day — what would they actually see?",
        options: [
          "Someone constantly switching tabs, chasing notifications, burning hours without output.",
          "Someone capable — but using tools and setups from years ago that no longer fit.",
          "Someone isolated. Working hard but disconnected from the people and tools that matter.",
          "Someone ready to level up — but without the infrastructure to actually do it.",
          "Other",
        ],
        pegMap: {
          "Someone constantly switching tabs, chasing notifications, burning hours without output.": "build an environment that protects my focus — so my best work can actually happen",
          "Someone capable — but using tools and setups from years ago that no longer fit.": "upgrade the infrastructure to match the professional I'm becoming",
          "Someone isolated. Working hard but disconnected from the people and tools that matter.": "build digital readiness that keeps me connected to what actually moves my work forward",
          "Someone ready to level up — but without the infrastructure to actually do it.": "build the workspace the next version of me deserves — and move into it",
        },
      },
    },
  ],

};

// ── Peg suggestions — shown in Customize WHY section + "Start from scratch" ──
export const PEG_SUGGESTIONS: Record<string, string[]> = {
  "enrollment-flex-alc": [
    "honor the transformation my LEAP journey gave me",
    "prove I can create real results through my own outreach",
    "genuinely serve people who are ready for a breakthrough",
    "give someone else the breakthrough I was given",
    "show my network what's possible for them",
    "create a ripple effect that goes beyond me",
    "be someone who follows through, not just talks about it",
    "stop waiting until I'm ready and just show up",
    "experience what it feels like to change someone's life",
  ],
  "enrollment-high-volume": [
    "fully live the commitment I made at graduation",
    "walk the talk of everything LEAP gave me",
    "honor the transformation I received by sharing it",
    "know what full commitment actually feels like",
    "break my own ceiling of what I think is possible",
    "be the enroller who surprises even myself",
    "give more than I was given",
    "create the biggest impact I've ever created in 8 weeks",
    "invite more people into something that changed my life",
  ],
  "personal-health": [
    "show up as my most vibrant self for the people I love",
    "prepare for long, healthy, and joyful years ahead",
    "finally feel at home in my body instead of at war with it",
    "have energy that actually matches my ambition",
    "wake up proud of how I'm taking care of myself",
    "live long enough to see the people I love grow",
    "stop making excuses and finally do this for me",
    "prove that it's not too late to change",
    "feel strong, not just skinny",
    "build a body I'm not embarrassed to live in",
  ],
  "personal-beingness": [
    "experience the calm, grounded version of myself I know exists",
    "stop reacting and start choosing who I want to be",
    "become someone whose presence others feel before I speak",
    "live from my essence instead of my old patterns",
    "stop being a stranger to my own best self",
    "show my family who I really am inside",
    "break free from the patterns that keep me small",
    "feel peace in who I am, not just in what I do",
    "become someone my future self will be proud of",
    "finally close the gap between who I am and who I want to be",
  ],
  "personal-relationship-deepen": [
    "show the person I love most that my word is real",
    "repair and deepen what matters most to me",
    "be the partner, parent, or child I know I'm capable of being",
    "stop being too busy for what actually matters",
    "not regret choosing work over people when it's too late",
    "rebuild the trust I know I've been neglecting",
    "experience real closeness — not just proximity",
    "be fully present for someone who deserves it",
    "prove that love is a verb, not just a feeling",
  ],
  "personal-relationship-prepare": [
    "become someone I would want to be in a relationship with",
    "stop waiting to be ready and start becoming ready",
    "enter a future relationship from fullness, not need",
    "build the inner qualities I want to bring to love",
    "stop repeating the same patterns in every relationship",
    "feel whole before someone else comes into my life",
    "love myself enough to become the person I want to attract",
    "face the real reason I've been holding back",
    "be ready — truly ready — when the right person shows up",
  ],
  "personal-experience-goal": [
    "finally live a life I'm excited to talk about",
    "learn something for the pure joy of it — no agenda",
    "do the thing I've been putting off for years",
    "prove that my life is about more than work",
    "stop watching others live and start living myself",
    "have a story worth telling at graduation",
    "give myself permission to be a beginner at something beautiful",
    "discover what I'm actually capable of when I commit",
    "do something purely because it makes me feel alive",
    "build a memory I will carry for the rest of my life",
  ],
  "professional-income-employed": [
    "build financial freedom that supports my family's security",
    "prove that my skills are worth paying for",
    "stop leaving money on the table",
    "create income that doesn't depend on a single paycheck",
    "stop trading time for money as my only option",
    "build something that exists because of my effort alone",
    "experience what it's like to sell something I created",
    "give my family more than a salary can provide",
    "have a financial safety net I built myself",
    "prove I can earn on my own terms without quitting my job",
  ],
  "professional-income-exploring": [
    "experience the freedom of earning on my own terms",
    "prove to myself I can build income from zero",
    "stop asking permission and start building",
    "never feel financially stuck again",
    "build confidence through earning, not just applying",
    "show myself what I can create when I go all in",
    "experience income I control — not income that controls me",
    "build something real with the skills I already have",
    "finally answer the question: what if I actually tried?",
  ],
  "professional-career-beingness": [
    "become the professional I know I'm meant to be",
    "lead from who I am, not a title I'm waiting for",
    "stop acting like someone who's not quite ready yet",
    "be known for the quality I already carry inside me",
    "walk into any room and know exactly who I am",
    "stop shrinking in spaces where I deserve to lead",
    "be remembered for how I made others feel, not just what I delivered",
    "grow into the leader I can already sense I'm becoming",
    "close the gap between how I see myself and how others experience me",
  ],
  "professional-skills": [
    "prepare for a future that excites me every morning",
    "finally build the skill I've been thinking about for years",
    "earn the right to call myself a practitioner",
    "create something real from what I've been learning",
    "stop saying 'I want to learn that someday'",
    "be able to show — not just tell — what I can do",
    "build something I can be proud of forever",
    "open a door I've been afraid to open",
    "graduate with a real skill, not just good intentions",
    "turn curiosity into capability",
  ],
  "professional-workspace-design": [
    "create an environment that matches my ambition",
    "stop letting my environment hold my performance hostage",
    "have a space I'm excited to walk into every morning",
    "build the workspace the next version of me deserves",
    "stop being distracted by the chaos I created around me",
    "eliminate every excuse my environment gives me",
    "wake up excited to sit down and actually work",
    "design a space that tells me — and others — who I'm becoming",
    "make my physical world match what I want my life to look like",
  ],
};
