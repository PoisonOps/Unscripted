// ─── Interviewer Personas ─────────────────────────────────────────────────────
const PERSONAS = {
  campus_technical: [
    {
      name: 'Vikram Nair',
      title: 'Senior Manager, Infrastructure',
      company: 'L&T',
      initials: 'VN',
      style: "formal and methodical. Expects precise technical answers. Respects candidates who admit what they don't know. Asks about IS codes, structural calculations, practical site experience."
    },
    {
      name: 'Anuj Sharma',
      title: 'Technical Lead',
      company: 'Infosys',
      initials: 'AS',
      style: 'friendly but sharp. Asks about DSA, system design basics, past projects. Appreciates clarity over jargon.'
    },
    {
      name: 'Rahul Mehta',
      title: 'Hiring Manager',
      company: 'TCS',
      initials: 'RM',
      style: 'structured. Asks about aptitude, communication, and technical fundamentals. Moves quickly between topics.'
    },
    {
      name: 'Priyanka Rao',
      title: 'Engineering Lead',
      company: 'Wipro',
      initials: 'PR',
      style: 'direct and no-nonsense. Digs into fundamentals. Expects candidates to explain concepts from first principles, not just definitions.'
    },
  ],
  campus_hr: [
    {
      name: 'Sneha Iyer',
      title: 'HR Business Partner',
      company: 'TCS',
      initials: 'SI',
      style: 'warm and perceptive. Looks for communication skills, attitude, and coachability. Asks behavioral questions using STAR format.'
    },
    {
      name: 'Priya Kapoor',
      title: 'Campus Recruiter',
      company: 'Infosys',
      initials: 'PK',
      style: 'energetic and direct. Assesses cultural fit. Asks about strengths, weaknesses, and life goals.'
    },
    {
      name: 'Deepak Menon',
      title: 'HR Manager',
      company: 'HCL',
      initials: 'DM',
      style: 'conversational but probing. Listens carefully and asks follow-ups. Looks for self-awareness and intellectual honesty.'
    },
  ],
  campus_technical_screening: [
    {
      name: 'Anuj Sharma',
      title: 'Technical Lead',
      company: 'Infosys',
      initials: 'AS',
      style: 'friendly but sharp. Asks about DSA, system design basics, past projects. Appreciates clarity over jargon.'
    },
  ],
  job_technical: [
    {
      name: 'Arjun Bose',
      title: 'Engineering Manager',
      company: 'a product company',
      initials: 'AB',
      style: "data-driven. Wants to understand impact and decision-making in past roles. Asks 'why did you choose X over Y?'"
    },
    {
      name: 'Saurabh Tiwari',
      title: 'Senior Staff Engineer',
      company: 'a tech startup',
      initials: 'ST',
      style: 'deeply technical, low tolerance for buzzwords. Asks for code-level details and pushes back if answers are vague.'
    },
  ],
  job_hr: [
    {
      name: 'Meera Pillai',
      title: 'Senior HR Manager',
      company: 'a growing startup',
      initials: 'MP',
      style: 'conversational and intuitive. Probes motivation for switching. Asks about salary expectations and joining timeline.'
    },
    {
      name: 'Kavitha Suresh',
      title: 'Talent Acquisition Lead',
      company: 'a mid-size company',
      initials: 'KS',
      style: 'perceptive and warm. Reads between the lines. Asks soft questions that reveal character and values.'
    },
  ],
  job_final_round: [
    {
      name: 'Arjun Bose',
      title: 'VP Engineering',
      company: 'a tech company',
      initials: 'AB',
      style: "strategic and senior. Focuses on leadership, culture, and long-term trajectory. Asks about career vision and professional identity."
    },
  ],
  mba_gd_pi: [
    {
      name: 'Prof. Krishnamurthy',
      title: 'Professor, Strategy',
      company: 'IIM',
      initials: 'PK',
      style: 'intellectually rigorous. Challenges assumptions. Asks case-based questions and tests logical consistency.'
    },
    {
      name: 'Prof. Kapur',
      title: 'Senior Faculty, OB',
      company: 'IIM',
      initials: 'KS',
      style: 'old school but sharp. Focuses on why MBA, leadership stories, and current affairs relevance to business.'
    },
    {
      name: 'Nisha Balakrishnan',
      title: 'Admissions Committee',
      company: 'ISB',
      initials: 'NB',
      style: 'professional and probing. Focuses on career clarity, post-MBA goals, and whether this candidate is ready for a top program.'
    },
  ],
  ms_interview: [
    {
      name: 'Dr. Sarah Chen',
      title: 'Admissions Committee',
      company: 'the university',
      initials: 'SC',
      style: 'academic and thorough. Probes research interests, intellectual curiosity, and fit with the program.'
    },
    {
      name: 'Prof. Michael Torres',
      title: 'Faculty Advisor',
      company: 'the department',
      initials: 'MT',
      style: 'research-focused. Asks about technical depth, methodology understanding, and genuine intellectual passion.'
    },
  ],
  upsc_personality: [
    {
      name: 'Board Member',
      title: 'UPSC Interview Panel',
      company: 'UPSC',
      initials: 'BM',
      style: 'calm but probing. Asks about DAF entries, current affairs, ethical dilemmas, and administrative vision.'
    },
    {
      name: 'Senior IAS Officer',
      title: 'Panel Member',
      company: 'UPSC Board',
      initials: 'IAS',
      style: 'experienced and sharp. Tests administrative understanding, public policy awareness, and composed thinking under gentle pressure.'
    },
  ],
  scholarship_interview: [
    {
      name: 'Dr. Amit Verma',
      title: 'Selection Committee',
      company: 'the scholarship board',
      initials: 'AV',
      style: 'focused on merit and potential. Asks about academic achievements, future plans, and why this scholarship.'
    },
    {
      name: 'Prof. Lakshmi Nair',
      title: 'Review Committee',
      company: 'the foundation',
      initials: 'LN',
      style: 'warm but probing. Explores depth of purpose, resilience, and genuine impact potential beyond the CV.'
    },
  ],
};

// ─── Category Guidance ────────────────────────────────────────────────────────
const CATEGORY_GUIDANCE = {
  campus: {
    technical: `Core focus areas:
- Subject-matter fundamentals specific to their degree and branch/stream (ask about their actual coursework, not generic engineering)
- If they're from a non-engineering background (BCom, BBA, BA etc.) — ask about relevant domain knowledge (accounting, economics, marketing theory, etc.)
- Final year project or dissertation: dig into decisions, challenges, what they'd do differently
- Internship experience: specific tasks, skills used, outcomes achieved
- 1-2 practical application questions ("How would you handle X in a real work scenario?")
- Aptitude for problem-solving: give a scenario relevant to their domain
- NEVER ask generic "define X" questions — always apply knowledge to real situations`,
    technical_screening: `Core focus areas:
- Subject-matter fundamentals specific to their degree and branch/stream (not just engineering — adapt to BCom, BBA, BA, etc.)
- Final year project or dissertation: dig into decisions, challenges, what they'd do differently
- Internship experience: specific tasks, skills used, outcomes achieved
- 1-2 practical application questions relevant to their field
- Aptitude for problem-solving: give a scenario relevant to their domain
- NEVER ask generic "define X" questions — always apply knowledge to real situations`,
    technical_deep: `Core focus areas:
- Deep dive into subject-matter specific to their degree and branch (engineering, commerce, arts, management — adapt accordingly)
- Walkthrough of a project, calculation, case study, or design relevant to their field
- Edge cases, failure modes, and what-if scenarios
- Trade-offs and decision rationale`,
    hr: `Core focus areas:
- Why this company specifically (test if they've researched)
- Strengths + weakness (push for real examples, not rehearsed lines)
- A challenge or failure story — what happened, what they learned
- Team conflict: how they handled disagreement
- Where they see themselves in 3 years
- Relocation/flexibility
- 1 unexpected personal question ("What do you do when you're not studying?")`
  },
  job: {
    technical: `Core focus areas:
- Walk me through a significant project — what was your actual contribution, not the team's
- A technical decision you made: why X and not Y? Push back even if their answer sounds right
- A bug or production issue they solved — how did they debug it?
- Ask about tools/stack from their resume specifically
- System design basic: how would they build [something relevant to their domain]
- What code have they written they're genuinely proud of`,
    technical_screening: `Core focus areas:
- Walk me through a significant project — what was your actual contribution, not the team's
- A technical decision you made: why X and not Y?
- Ask about tools/stack from their resume specifically
- What code have they written they're genuinely proud of`,
    technical_deep: `Core focus areas:
- Deep system design: scalability, trade-offs, bottlenecks
- Architecture decisions in past projects — what and why
- How they approach debugging and incident response
- Code quality and engineering standards they hold themselves to`,
    hr: `Core focus areas:
- Why leaving current role (probe for real reason, not polished answer)
- What specifically about this new role/company attracts them
- Biggest professional failure and what changed after
- How they handle disagreement with a manager
- Salary expectations (ask directly)
- Notice period and joining date`,
    final_round: `Core focus areas:
- Career trajectory and long-term vision
- Leadership: a time they led something without formal authority
- Culture fit: what kind of environment brings out their best
- Compensation, notice period, and decision timeline
- Questions for the interviewer (reverse interview)`
  },
  mba: {
    gd_pi: `Core focus areas:
- Why MBA — probe hard. "Career growth" is not an answer. What specifically?
- Why this institution — have they actually researched the program?
- Walk through their career trajectory — connect the dots
- A leadership experience with measurable outcome
- Current business news topic — ask their opinion and challenge it
- Case: give a simple business problem, observe their structure
- Post-MBA goal — specific industry, role, and why
- Academic gap or low CAT score (if visible) — ask directly`,
    hr: `Core focus areas:
- Personal story and motivation
- Teamwork and leadership examples
- Handling failure and adversity
- Cultural contribution to the program`
  },
  ms: {
    interview: `Core focus areas:
- Research interests: ask them to explain their SOP project/research in simple terms
- Why this specific university and program (not generic "world-class faculty")
- Undergraduate research or project — go technical, ask about methodology
- Intellectual curiosity: what technical paper or concept excited them recently?
- GRE/CGPA if relevant — acknowledge it without dwelling
- Post-MS plans: industry vs academia, specific companies/labs
- Why not a PhD or MBA instead?`,
    technical_screening: `Core focus areas:
- Research background and publications (if any)
- Technical knowledge relevant to their proposed area of study
- Problem-solving approach on a domain problem
- Understanding of current research landscape in their field`
  },
  upsc: {
    personality: `Core focus areas:
- DAF-based questions: they will know their DAF, probe specifics from it
- Home state current events — one specific topic
- Graduation subject + administrative relevance
- A hobby from DAF — go deeper, find the policy connection
- Ethical dilemma: present one, look for balanced nuanced thinking
- Current affairs: one national + one international event
- Administrative vision: what specific problem in India would they want to solve`,
    hr: `Core focus areas:
- Why civil services over other career options
- Self-awareness about strengths and weaknesses as an administrator
- Family background and how it shaped their perspective`
  },
  scholarship: {
    interview: `Core focus areas:
- Academic achievements: specific accomplishments, not just CGPA
- Research or projects: what they actually built or investigated
- Why this scholarship specifically — what makes them deserving over equally qualified peers
- Future plan: how will this scholarship change their trajectory specifically
- Challenges overcome: personal or financial context
- One leadership or community impact story`,
    hr: `Core focus areas:
- Personal story and journey
- Impact and service orientation
- How they've used resources or opportunities given to them`
  }
};

// ─── Off-Script Questions Pool ────────────────────────────────────────────────
const OFF_SCRIPT = [
  "I want to step away from the technical for a second — what's something you've built or created outside your field that you're proud of?",
  "If you had 6 months and unlimited budget to solve one problem in India, what would you pick and why?",
  "Tell me something that's not on your resume — something that actually shaped how you think.",
  "What's the last thing you changed your mind about?",
  "If I called your most recent professor or manager right now, what would they say is your biggest blind spot?",
  "You mentioned earlier something interesting. Walk me back through it — I want to understand your reasoning.",
  "Most candidates your level say X. What do you think differently?",
  "What are you genuinely bad at that's relevant to this role?",
  "Walk me through a day in your life right now — I want the actual picture, not the polished version.",
  "What problem keeps you up at night — professionally or otherwise?",
  "If this role doesn't work out, what's your plan B? I'm asking seriously, not to trap you.",
];

// ─── Pushback Phrases ─────────────────────────────────────────────────────────
const PUSHBACKS = [
  "I'm not fully convinced by that. Can you give me a concrete example?",
  "That sounds a bit rehearsed. What actually happened?",
  "Okay, but why specifically? I want to understand your reasoning, not just the conclusion.",
  "Most people say that. What would make your answer different from every other candidate here today?",
  "Push back on yourself for a second — what's the weakness in that argument?",
  "I hear you, but let me challenge that.",
  "Can you be more specific? I want numbers, timelines, actual outcomes — not the narrative.",
  "That's a solid answer on paper. What went wrong that you're not telling me?",
];

// ─── Personality Modifiers ────────────────────────────────────────────────────
const PERSONALITY_MODIFIERS = {
  friendly: `You are warm and encouraging while still being professional and thorough. If a candidate gives a weak answer, gently guide them rather than aggressively challenging. Acknowledge good answers briefly before moving on. Build a conversational rapport. Make the candidate feel heard.`,
  balanced: `You are fair, professional, and thorough. Challenge weak answers but don't be harsh. Acknowledge strong points briefly. Maintain a neutral but interested tone throughout. Neither too easy nor stressful.`,
  aggressive: `You are direct and demanding. Challenge every answer, even good ones. Interrupt occasionally if the answer is too long or off-track. Maintain high pressure. Show mild impatience with vague answers. This is a stress interview. Push back hard on every response.`
};

// ─── Prompt Builder ───────────────────────────────────────────────────────────
function buildSystemPrompt(setup) {
  const { category, roundType, company, personality, resumeText, contextData, persona } = setup;

  // Figure out sub-category key
  const subCategoryMap = {
    technical_screening: 'technical_screening',
    technical_deep: 'technical_deep',
    hr: 'hr',
    final_round: 'final_round',
    gd_pi: 'gd_pi',
    interview: 'interview',
    personality: 'personality',
  };
  const subKey = subCategoryMap[roundType] || 'technical';
  const guidance = CATEGORY_GUIDANCE[category]?.[subKey]
    || CATEGORY_GUIDANCE[category]?.['technical']
    || CATEGORY_GUIDANCE[category]?.[Object.keys(CATEGORY_GUIDANCE[category] || {})[0]]
    || '';

  const personalityMod = PERSONALITY_MODIFIERS[personality || 'balanced'];

  // Build context section from contextData
  let contextSection = '';
  if (resumeText) {
    contextSection += `\n\nCANDIDATE RESUME (read this carefully — reference specific items from it during the interview):\n${resumeText.slice(0, 3000)}`;
  }
  if (contextData) {
    const fields = [
      ['degree', 'Degree/Course'],
      ['cgpa', 'CGPA/Percentage'],
      ['branch', 'Branch/Stream/Specialisation'],
      ['companyType', 'Target Company Type'],
      ['currentRole', 'Current Role'],
      ['yearsExp', 'Years of Experience'],
      ['targetRole', 'Target Role'],
      ['whySwitching', 'Reason for Switching'],
      ['catScore', 'CAT Score/Percentile'],
      ['workEx', 'Work Experience (years)'],
      ['gradPercent', 'Graduation Percentage'],
      ['whyMba', "Why MBA (candidate's own words)"],
      ['sop', 'Statement of Purpose'],
      ['greScore', 'GRE/GMAT Score'],
      ['research', 'Research/Projects'],
      ['homeState', 'Home State'],
      ['gradSubject', 'Graduation Subject'],
      ['hobbies', 'Hobbies/Interests'],
      ['achievements', 'Key Achievements'],
      ['projects', 'Projects'],
    ];
    fields.forEach(([key, label]) => {
      if (contextData[key]) {
        const val = key === 'sop' ? contextData[key].slice(0, 1500) : contextData[key];
        contextSection += `\n${label}: ${val}`;
      }
    });
  }

  const companyLine = company
    ? `You are interviewing on behalf of ${company}.`
    : `You are conducting this interview as part of ${persona.company}.`;

  return `You are ${persona.name}, ${persona.title}. ${companyLine}

YOUR INTERVIEWING STYLE: ${persona.style}

PERSONALITY FOR THIS SESSION: ${personalityMod}

CANDIDATE BACKGROUND:${contextSection || '\nNo resume or context provided — ask about their background naturally in your opening.'}

INTERVIEW FOCUS:
${guidance}

CORE RULES — follow these without exception:
1. Start with a brief natural introduction (2-3 sentences: name, role, what you'll be covering) then ask your first question immediately
2. Ask ONE question at a time — never stack multiple questions in one turn
3. ALWAYS try to reference specific details from the candidate's background when possible. If their resume mentions a project or company, ask about THAT specifically — not a generic equivalent
4. Every 3-4 questions, throw something unexpected — a personal question, an off-script scenario, or a challenge they can't rehearse for
5. If an answer is weak, vague, or sounds rehearsed: push back. Use pushback phrases naturally
6. If an answer is strong: acknowledge it in 3-4 words ("Good, that's clear." / "Solid.") then move on — do NOT over-praise
7. Vary your response length. Sometimes just "Okay. Next question:" is the right move
8. Never ask the same type of question twice in a row (alternate: technical → behavioral → scenario → personal)
9. Do NOT give feedback, hints, or coaching during the interview — you are evaluating, not teaching
10. After 10-12 exchanges, close the interview naturally: "I think I have what I need. We'll be in touch. Thank you."
11. Respond ONLY as the interviewer — no meta-commentary, no asterisks, no stage directions like *leans forward*
12. Keep each response under 100 words unless it's the opening introduction`;
}

// ─── Scoring Prompt ───────────────────────────────────────────────────────────
function buildScoringPrompt(transcript, setup) {
  const transcriptText = transcript
    .map(m => `${m.role === 'assistant' ? 'INTERVIEWER' : 'CANDIDATE'}: ${m.content}`)
    .join('\n\n');

  return `You are an expert interview evaluator. Below is the complete transcript of a mock interview.

TRANSCRIPT:
${transcriptText}

Interview context: ${setup.category || 'general'} interview, ${setup.roundType || 'standard'} round, interviewer personality: ${setup.personality || 'balanced'}.

Score the candidate on these 5 dimensions (0-10 each):
1. Technical Depth (0-10): accuracy and depth of technical knowledge shown
2. Communication (0-10): clarity, structure, and conciseness of answers
3. Confidence (0-10): decisiveness, handling of pushback, avoiding excessive hedging
4. Role Relevance (0-10): how well answers connected to the actual role/industry
5. Preparation (0-10): evidence of company/role research, thoughtful examples

Overall score = weighted average: (technical*25 + communication*20 + confidence*20 + relevance*20 + preparation*15) / 10

Also identify:
- 2 "strong moments": specific exchanges where the candidate performed well
- 2 "weak moments": specific exchanges where the candidate struggled or gave poor answers
- 3 specific, actionable improvement suggestions

Return STRICT valid JSON only — no markdown fences, no text before or after the JSON:
{"scores":{"technical":7,"communication":6,"confidence":5,"relevance":8,"preparation":6,"overall":64},"strong":[{"question":"exact interviewer question","insight":"what the candidate did well"},{"question":"exact interviewer question","insight":"what the candidate did well"}],"weak":[{"question":"exact interviewer question","insight":"what fell short and why"},{"question":"exact interviewer question","insight":"what fell short and why"}],"improvements":["specific suggestion 1","specific suggestion 2","specific suggestion 3"]}`;
}

// ─── Persona Picker ───────────────────────────────────────────────────────────
function pickPersona(category, roundType) {
  // Try specific round type key first
  const specificKey = `${category}_${roundType}`.replace(/-/g, '_');
  const genericKey = `${category}_technical`;

  const pool = PERSONAS[specificKey]
    || PERSONAS[genericKey]
    || PERSONAS['campus_technical'];

  return pool[Math.floor(Math.random() * pool.length)];
}
