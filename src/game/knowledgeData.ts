import { StudyTip, KnowledgeQuestion, SubjectCategory } from './types';

export const STUDY_TIPS: StudyTip[] = [
  {
    id: 'pomodoro',
    title: 'The 25/5 Rhythm',
    category: 'Focus',
    summary: 'Work for 25 mins, rest for 5. Short sprints beat long slogs.',
    deepDive: 'Your brain stays sharp when it knows a rest is coming soon.',
    actionableStep: 'Turn on a 25-minute timer. Step away when it rings—get water or stretch.',
    iconName: 'timer'
  },
  {
    id: 'active_recall',
    title: 'Active Recall',
    category: 'Memory',
    summary: 'Quiz yourself from memory instead of just re-reading notes.',
    deepDive: 'Struggling to remember something actually locks it into your brain.',
    actionableStep: 'Close the textbook, grab a blank page, and write down what you remember.',
    iconName: 'brain'
  },
  {
    id: 'spaced_repetition',
    title: 'Spaced Review',
    category: 'Retention',
    summary: 'Review after 1 day, then 3 days, then a week.',
    deepDive: 'Reviewing right before you forget permanently flattens the forgetting curve.',
    actionableStep: 'Use flashcards or make quick weekend review lists.',
    iconName: 'calendar'
  },
  {
    id: 'feynman',
    title: 'The Feynman Trick',
    category: 'Understanding',
    summary: 'Explain it simply, like teaching a 10-year-old.',
    deepDive: 'If you need confusing buzzwords to explain it, you do not really understand it yet.',
    actionableStep: 'Try teaching the topic out loud to a friend or an imaginary student.',
    iconName: 'message-square'
  },
  {
    id: 'sleep_hygiene',
    title: 'Sleep Is Free Study',
    category: 'Brain Fuel',
    summary: 'Sleep locks your memories in place. All-nighters wipe them out.',
    deepDive: 'Your brain replays and stores what you learned while you sleep.',
    actionableStep: 'Aim for 8 hours. Put your phone away 30 minutes before bed.',
    iconName: 'moon'
  },
  {
    id: 'interleaving',
    title: 'Mix It Up',
    category: 'Problem Solving',
    summary: 'Shuffle different types of problems in one study session.',
    deepDive: 'Drilling only one problem type makes tests feel harder than they are.',
    actionableStep: 'Mix Chapter 2 and Chapter 4 math problems together.',
    iconName: 'shuffle'
  },
  {
    id: 'dual_coding',
    title: 'Draw What You Read',
    category: 'Visuals',
    summary: 'Pair words with simple sketches, arrows, and diagrams.',
    deepDive: 'Your brain has two separate tracks for words and pictures. Use both!',
    actionableStep: 'Draw a quick flowchart or doodle next to text notes.',
    iconName: 'image'
  },
  {
    id: 'environment',
    title: 'Hide Your Phone',
    category: 'Distraction',
    summary: 'Keep your phone in another room or inside a bag.',
    deepDive: 'Even having your phone sitting on your desk eats up your brainpower.',
    actionableStep: 'Put your phone on silent and drop it inside a backpack during focus blocks.',
    iconName: 'shield'
  }
];

// Checkpoint-specific curated questions (one distinct question per checkpoint)
export const CHECKPOINT_QUESTIONS: KnowledgeQuestion[] = [
  // Checkpoint 1 (Flag 1)
  {
    id: 'cp_1_pomodoro',
    category: 'study_skills',
    question: 'How long should a standard focus sprint last in the Pomodoro technique?',
    options: ['25 minutes', '90 minutes', '10 minutes', '3 hours'],
    correctIndex: 0,
    explanation: '25 minutes of focus followed by 5 minutes off keeps your mind energized.',
    difficulty: 1,
  },
  // Checkpoint 2 (Flag 2)
  {
    id: 'cp_2_recall',
    category: 'study_skills',
    question: 'What is the fastest way to know if you actually memorized a chapter?',
    options: [
      'Close your notes and write it from memory',
      'Highlight sentences in yellow and pink',
      'Re-read the pages three times silently',
      'Listen to music while skimming'
    ],
    correctIndex: 0,
    explanation: 'Testing your own memory (Active Recall) beats passive re-reading every time.',
    difficulty: 1,
  },
  // Checkpoint 3 (Flag 3)
  {
    id: 'cp_3_spacing',
    category: 'study_skills',
    question: 'When is the best moment to review material for long-term memory?',
    options: [
      'Right before you are about to forget it',
      'Immediately after closing the book, then never again',
      '5 minutes before the exam begins',
      'Once a year'
    ],
    correctIndex: 0,
    explanation: 'Spaced repetition resets your forgetting curve and cements long-term memory.',
    difficulty: 2,
  },
  // Checkpoint 4 (Flag 4)
  {
    id: 'cp_4_sleep',
    category: 'study_skills',
    question: 'Why do all-nighters usually backfire on test day?',
    options: [
      'The brain needs sleep to file memories into long-term storage',
      'Coffee tastes worse in the morning',
      'Pens run out of ink faster at night',
      'Sleep only matters for sports'
    ],
    correctIndex: 0,
    explanation: 'Your brain physically files away daytime learning while you sleep.',
    difficulty: 1,
  },
  // Checkpoint 5 (Flag 5)
  {
    id: 'cp_5_feynman',
    category: 'study_skills',
    question: 'How does the Feynman technique help you find blind spots in your knowledge?',
    options: [
      'By forcing you to explain it simply without jargon',
      'By asking you to copy the glossary word-for-word',
      'By reading Wikipedia articles backwards',
      'By memorizing formulas without units'
    ],
    correctIndex: 0,
    explanation: 'If you cannot explain it simply, that shows exactly what you need to review.',
    difficulty: 2,
  },
  // Checkpoint 6 (Flag 6)
  {
    id: 'cp_6_phone',
    category: 'study_skills',
    question: 'Where should your smartphone be while you are studying for focus?',
    options: [
      'Out of sight in a bag or another room',
      'Right next to your keyboard on vibrate',
      'In your hand under the desk',
      'Face down right beside your notebook'
    ],
    correctIndex: 0,
    explanation: 'Even seeing your phone on the desk distracts your working memory.',
    difficulty: 1,
  },
  // Checkpoint 7 (Flag 7)
  {
    id: 'cp_7_mix',
    category: 'study_skills',
    question: 'What is interleaved practice?',
    options: [
      'Mixing different problem types in one study session',
      'Studying only one single subject for 12 hours',
      'Reading two books simultaneously with both eyes',
      'Only doing easy problems first'
    ],
    correctIndex: 0,
    explanation: 'Mixing problems trains your brain to pick the right strategy before solving.',
    difficulty: 2,
  },
  // Checkpoint 8 (Flag 8)
  {
    id: 'cp_8_draw',
    category: 'study_skills',
    question: 'How does drawing diagrams next to your notes help you remember?',
    options: [
      'It creates twin visual and verbal memory paths',
      'It makes notebooks heavier',
      'It uses up excess ink',
      'It replaces the need to understand the topic'
    ],
    correctIndex: 0,
    explanation: 'Dual coding connects visual imagery with text notes for double retention.',
    difficulty: 1,
  },
];

// Rich secondary question pool for STEM and General Science
export const BONUS_QUESTIONS: KnowledgeQuestion[] = [
  {
    id: 'q_stem_speed',
    category: 'stem',
    question: 'What is the speed of light in a vacuum?',
    options: ['300,000 km/s', '1,500 km/s', '50,000 km/s', '3,000 km/s'],
    correctIndex: 0,
    explanation: 'Light travels at nearly 300,000 kilometers per second in a vacuum.',
    difficulty: 1,
  },
  {
    id: 'q_stem_triangle',
    category: 'stem',
    question: 'If a triangle has sides 3, 4, and 5, what kind of triangle is it?',
    options: ['Right-angled triangle (3² + 4² = 5²)', 'Equilateral triangle', 'Obtuse triangle', 'Isosceles triangle'],
    correctIndex: 0,
    explanation: 'By the Pythagorean theorem (9 + 16 = 25), it is a classic right-angled triangle.',
    difficulty: 1,
  },
  {
    id: 'q_stem_binary',
    category: 'stem',
    question: 'In computer science, what is the binary representation of number 5?',
    options: ['101', '110', '011', '111'],
    correctIndex: 0,
    explanation: 'In binary: (1 × 4) + (0 × 2) + (1 × 1) = 5.',
    difficulty: 1,
  },
  {
    id: 'q_stem_mitochondria',
    category: 'stem',
    question: 'Which cell organelle generates ATP energy for the cell?',
    options: ['Mitochondria', 'Ribosome', 'Nucleus', 'Vacuole'],
    correctIndex: 0,
    explanation: 'Mitochondria are the powerhouses of cells, turning nutrients into ATP.',
    difficulty: 1,
  },
  {
    id: 'q_sci_photosynth',
    category: 'general_science',
    question: 'What gas do plants absorb during photosynthesis?',
    options: ['Carbon Dioxide (CO₂)', 'Oxygen (O₂)', 'Argon (Ar)', 'Helium (He)'],
    correctIndex: 0,
    explanation: 'Plants take in carbon dioxide and sunlight to create sugars and release oxygen.',
    difficulty: 1,
  },
  {
    id: 'q_sci_gravity',
    category: 'general_science',
    question: 'Who formulated the universal law of gravitation in 1687?',
    options: ['Isaac Newton', 'Galileo Galilei', 'Albert Einstein', 'Nikola Tesla'],
    correctIndex: 0,
    explanation: 'Isaac Newton published the universal law of gravitation in the Principia.',
    difficulty: 1,
  },
  {
    id: 'q_sci_water',
    category: 'general_science',
    question: 'What is the chemical formula for pure water?',
    options: ['H₂O', 'CO₂', 'NaCl', 'O₂'],
    correctIndex: 0,
    explanation: 'Two hydrogen atoms bonded with one oxygen atom makes water (H₂O).',
    difficulty: 1,
  },
];

/**
 * Returns a guaranteed unique question for a given checkpoint index and subject category.
 */
export function getCheckpointQuestion(
  checkpointIndex: number,
  category: SubjectCategory,
  usedIds: Set<string>
): KnowledgeQuestion {
  // 1. Try checkpoint-specific question first if category matches study skills or all
  if (category === 'all' || category === 'study_skills') {
    const cpQuestion = CHECKPOINT_QUESTIONS[checkpointIndex % CHECKPOINT_QUESTIONS.length];
    if (cpQuestion && !usedIds.has(cpQuestion.id)) {
      return cpQuestion;
    }
  }

  // 2. Filter from full combined pool matching category
  const allPool = [...CHECKPOINT_QUESTIONS, ...BONUS_QUESTIONS];
  let eligible = allPool.filter(q => {
    if (category === 'all') return true;
    return q.category === category;
  });

  // Filter out already used questions to guarantee freshness
  const unused = eligible.filter(q => !usedIds.has(q.id));
  if (unused.length > 0) {
    const picked = unused[Math.floor(Math.random() * unused.length)];
    return picked;
  }

  // Fallback if all questions exhausted
  return eligible[checkpointIndex % eligible.length] || CHECKPOINT_QUESTIONS[0];
}
