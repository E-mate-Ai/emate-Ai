import type { StudyPlanFormData, StudyPlan, SubjectProgress } from './studyPlan';

export interface StudyTask {
  id: string;
  timeSlot: string;
  subject: string;
  topic: string;
  type: 'Theory & Concepts' | 'Problem Solving' | 'Active Recall & Notes' | 'Mock Practice' | 'Quick Revision';
  durationMinutes: number;
  completed: boolean;
}

export interface DaySchedule {
  dayName: string;
  focusTheme: string;
  subjects: string[];
  hours: number;
  tasks: string[];
}

export interface SubjectStrategy {
  subject: string;
  weightPercentage: number;
  dailyHours: number;
  highYieldTopics: string[];
  keyAdvice: string;
}

export interface RevisionMilestone {
  phase: string;
  timeframe: string;
  milestoneTitle: string;
  objective: string;
  actions: string[];
}

export interface StructuredPlan {
  summary: string;
  dailyRoutine: StudyTask[];
  weeklyRoadmap: DaySchedule[];
  subjectStrategies: SubjectStrategy[];
  revisionMilestones: RevisionMilestone[];
  highYieldTips: string[];
}

/**
 * Intelligent algorithmic generator that guarantees a high-grade, realistic,
 * day-by-day exam schedule even if network/AI is unavailable.
 */
export function buildStructuredStudyPlan(form: StudyPlanFormData, daysLeft: number): {
  structured: StructuredPlan;
  markdown: string;
} {
  const subjects = form.subjects.length > 0 ? form.subjects : ['General Studies'];
  const dailyHours = form.dailyHours || 4;
  const prepLevel = form.prepLevel || 'Intermediate';
  const examName = form.examName || 'Upcoming Exam';
  const topicsRaw = form.topics?.trim() || '';

  // Parse custom topics if provided
  const customTopics = topicsRaw
    ? topicsRaw
        .split(/[,;\n]+/)
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  // Generate Today's Tasks (Morning, Midday, Afternoon, Evening)
  const taskCount = Math.min(5, Math.max(2, Math.round(dailyHours / 1.5)));
  const todayTasks: StudyTask[] = [];

  const timeSlots = [
    '08:30 – 10:00 AM',
    '10:30 – 12:00 PM',
    '02:00 – 03:30 PM',
    '04:00 – 05:30 PM',
    '07:30 – 09:00 PM',
  ];

  const taskTypes: StudyTask['type'][] = [
    'Theory & Concepts',
    'Problem Solving',
    'Active Recall & Notes',
    'Mock Practice',
    'Quick Revision',
  ];

  for (let i = 0; i < taskCount; i++) {
    const subj = subjects[i % subjects.length];
    const specificTopic =
      customTopics[i % customTopics.length] ||
      `Core High-Yield Chapter (${subj} Unit ${i + 1})`;

    todayTasks.push({
      id: `task-${i + 1}`,
      timeSlot: timeSlots[i] || `Session ${i + 1}`,
      subject: subj,
      topic: specificTopic,
      type: taskTypes[i % taskTypes.length],
      durationMinutes: Math.round((dailyHours / taskCount) * 60),
      completed: false,
    });
  }

  // Weekly Roadmap (7 days)
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const weeklyRoadmap: DaySchedule[] = daysOfWeek.map((day, idx) => {
    if (day === 'Sunday') {
      return {
        dayName: day,
        focusTheme: 'Active Recall, Mock Review & Error Log',
        subjects: subjects,
        hours: Math.max(2, Math.round(dailyHours * 0.75)),
        tasks: [
          'Full-length timed sectional test / question drill',
          'Detailed error notebook analysis — categorize mistakes into conceptual vs calculation',
          'Flashcard sprint for formulas and definitions',
        ],
      };
    }

    const primarySubj = subjects[idx % subjects.length];
    const secondarySubj = subjects[(idx + 1) % subjects.length];
    const activeSubjs = subjects.length === 1 ? [primarySubj] : [primarySubj, secondarySubj];

    return {
      dayName: day,
      focusTheme: `${primarySubj} Deep-Dive ${secondarySubj && secondarySubj !== primarySubj ? `+ ${secondarySubj} Practice` : ''}`,
      subjects: activeSubjs,
      hours: dailyHours,
      tasks: [
        `Master fundamental theory & derivations for ${primarySubj}`,
        `Solve 15-25 past exam questions / numericals with timer`,
        secondarySubj && secondarySubj !== primarySubj
          ? `Review formula sheets and definitions for ${secondarySubj}`
          : 'Self-assessment quiz and flashcard revision',
      ],
    };
  });

  // Subject Strategies
  const subjectWeight = Math.round(100 / subjects.length);
  const subjectStrategies: SubjectStrategy[] = subjects.map((subj, idx) => {
    const hoursAlloc = Number((dailyHours / subjects.length).toFixed(1));
    const matchedTopics = customTopics.filter((t) =>
      t.toLowerCase().includes(subj.toLowerCase())
    );

    const highYield =
      matchedTopics.length > 0
        ? matchedTopics
        : [
            `${subj} Core Principles & Formulas`,
            `High-Frequency Previous Year Questions (PYQs)`,
            `Analytical & Problem-Solving Edge Cases`,
          ];

    const adviceByLevel: Record<string, string> = {
      Beginner: 'Focus on NCERT / standard textbook definitions, clear basic doubts with AI Topper, and solve level-1 problems.',
      Intermediate: 'Spend 60% of time solving moderate-to-hard problems; use blurting technique to verify formula recall.',
      Advanced: 'Focus strictly on full-length timed tests, speed enhancement drills, and tricky edge cases.',
    };

    return {
      subject: subj,
      weightPercentage: idx === 0 ? 100 - subjectWeight * (subjects.length - 1) : subjectWeight,
      dailyHours: hoursAlloc,
      highYieldTopics: highYield,
      keyAdvice: adviceByLevel[prepLevel] || adviceByLevel['Intermediate'],
    };
  });

  // Revision Milestones (Pacing across available days)
  const safeDays = Math.max(3, daysLeft);
  const p1 = Math.max(1, Math.round(safeDays * 0.4));
  const p2 = Math.max(p1 + 1, Math.round(safeDays * 0.7));
  const p3 = Math.max(p2 + 1, Math.round(safeDays * 0.9));

  const revisionMilestones: RevisionMilestone[] = [
    {
      phase: 'Phase 1: Comprehensive Coverage',
      timeframe: `Days 1 to ${p1}`,
      milestoneTitle: 'Concept Mastery & Syllabus Breadth',
      objective: 'Eliminate major knowledge gaps and create concise active-recall study sheets.',
      actions: [
        'Complete primary chapter readings and standard problem sets',
        'Convert key formulas and reactions into digital flashcards',
        'Identify 3 weakest topics across all subjects for priority targeting',
      ],
    },
    {
      phase: 'Phase 2: High-Yield Problem Drill',
      timeframe: `Days ${p1 + 1} to ${p2}`,
      milestoneTitle: 'Application, Speed & Accuracy',
      objective: 'Transition from passive review to active question-solving under timed conditions.',
      actions: [
        'Solve previous 5-10 years question papers chapter-wise',
        'Take twice-weekly timed sectional tests',
        'Maintain a rigorous mistake log with root causes',
      ],
    },
    {
      phase: 'Phase 3: Full-Length Exam Simulation',
      timeframe: `Days ${p2 + 1} to ${p3}`,
      milestoneTitle: 'Endurance & Exam Temperament',
      objective: 'Replicate exact test day environment and master time management.',
      actions: [
        'Attempt 3-5 full-length mock exams at the exact time slot of the actual exam',
        'Analyze question selection strategy — skip trap questions early',
        'Refine revision speed to review an entire subject in under 3 hours',
      ],
    },
    {
      phase: 'Phase 4: Final Polishing & Mental Readiness',
      timeframe: `Final ${Math.max(1, safeDays - p3)} Days`,
      milestoneTitle: 'Confidence & Peak Retention',
      objective: 'Lock in high-yield facts, protect sleep cycle, and maintain calm confidence.',
      actions: [
        'Review formula sheets, summary notes, and error notebooks only — no new topics',
        'Light flashcard runs with spaced repetition',
        'Standardize sleep, hydration, and positive mental visualization',
      ],
    },
  ];

  // High-Yield Tips
  const highYieldTips = [
    'The 80/20 Rule: 80% of exam questions come from 20% of core topics. Prioritize high-frequency questions first.',
    'Active Recall over Re-reading: Test yourself using flashcards or a blank sheet of paper (blurting) instead of passive textbook reading.',
    'Spaced Repetition: Review today\'s notes within 24 hours, then again on Day 3 and Day 7 to permanently solidify neural connections.',
    'Error Notebook Discipline: Never make the same mistake twice. Log every mock exam error and review the log every Sunday.',
    'Exam-Simulation Blocks: Study in 90-minute uninterrupted sprints with 15-minute breaks to match official exam stamina.',
  ];

  const summary = `Personalized ${dailyHours}h/day study roadmap for ${examName} with ${daysLeft} days remaining. Geared for ${prepLevel} level across ${subjects.join(', ')}.`;

  // Build clean markdown representation
  const markdown = `# ${examName} — AI Study Plan

**Exam Date:** ${form.examDate} (${daysLeft} days remaining)  
**Daily Study Commitment:** ${dailyHours} hours/day  
**Preparation Stage:** ${prepLevel}  
**Target Subjects:** ${subjects.join(', ')}  

---

## Today's Study Tasks
${todayTasks.map((t) => `- [ ] **${t.timeSlot}** (${t.subject}): ${t.topic} — *${t.type}* (${t.durationMinutes} mins)`).join('\n')}

---

## Weekly Study Schedule
${weeklyRoadmap.map((d) => `### ${d.dayName} (${d.hours}h) — ${d.focusTheme}\n${d.tasks.map((t) => `- ${t}`).join('\n')}`).join('\n\n')}

---

## Subject-wise Strategy & Allocation
${subjectStrategies.map((s) => `### ${s.subject} (${s.weightPercentage}% allocation · ~${s.dailyHours}h/day)\n- **High-Yield Focus:** ${s.highYieldTopics.join(', ')}\n- **Strategy:** ${s.keyAdvice}`).join('\n\n')}

---

## Revision Milestones & Timeline
${revisionMilestones.map((m) => `### ${m.phase} (${m.timeframe})\n**${m.milestoneTitle}**\n*Objective:* ${m.objective}\n${m.actions.map((a) => `- ${a}`).join('\n')}`).join('\n\n')}

---

## High-Yield Study Tips
${highYieldTips.map((tip) => `- ${tip}`).join('\n')}
`;

  return {
    structured: {
      summary,
      dailyRoutine: todayTasks,
      weeklyRoadmap,
      subjectStrategies,
      revisionMilestones,
      highYieldTips,
    },
    markdown,
  };
}

