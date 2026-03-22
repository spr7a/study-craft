function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString();
}

function hoursAgo(n) {
  return new Date(Date.now() - n * 3600000).toISOString();
}

const studyProfile = {
  name: "Arjun Sharma",
  exam: "JEE Advanced",
  examDate: daysFromNow(67),
  dailyHours: 8,
  subjects: [
    { name: "Physics",     level: "Intermediate" },
    { name: "Chemistry",   level: "Beginner"      },
    { name: "Mathematics", level: "Advanced"       }
  ]
};

const topicHistory = {
  entries: [
    {
      id: "th_001",
      subject: "Chemistry",
      topic: "Organic Chemistry — Hydrocarbons",
      questionCount: 10,
      difficulty: "JEE/NEET Level",
      lastUsed: daysAgo(1),
      lastAccuracy: 40,
      timesUsed: 2
    },
    {
      id: "th_002",
      subject: "Physics",
      topic: "Laws of Motion",
      questionCount: 10,
      difficulty: "JEE/NEET Level",
      lastUsed: daysAgo(1),
      lastAccuracy: 60,
      timesUsed: 3
    },
    {
      id: "th_003",
      subject: "Mathematics",
      topic: "Integration",
      questionCount: 10,
      difficulty: "JEE/NEET Level",
      lastUsed: daysAgo(3),
      lastAccuracy: 90,
      timesUsed: 4
    },
    {
      id: "th_004",
      subject: "Physics",
      topic: "Kinematics",
      questionCount: 10,
      difficulty: "JEE/NEET Level",
      lastUsed: daysAgo(5),
      lastAccuracy: 80,
      timesUsed: 2
    },
    {
      id: "th_005",
      subject: "Chemistry",
      topic: "Electrochemistry",
      questionCount: 8,
      difficulty: "Hard",
      lastUsed: daysAgo(8),
      lastAccuracy: 37,
      timesUsed: 2
    },
    {
      id: "th_006",
      subject: "Mathematics",
      topic: "Limits and Continuity",
      questionCount: 10,
      difficulty: "JEE/NEET Level",
      lastUsed: daysAgo(8),
      lastAccuracy: 70,
      timesUsed: 2
    },
    {
      id: "th_007",
      subject: "Physics",
      topic: "Work, Energy and Power",
      questionCount: 10,
      difficulty: "JEE/NEET Level",
      lastUsed: daysAgo(10),
      lastAccuracy: 60,
      timesUsed: 1
    },
    {
      id: "th_008",
      subject: "Chemistry",
      topic: "Chemical Bonding",
      questionCount: 8,
      difficulty: "JEE/NEET Level",
      lastUsed: daysAgo(12),
      lastAccuracy: 62,
      timesUsed: 2
    },
    {
      id: "th_009",
      subject: "Mathematics",
      topic: "Differential Equations",
      questionCount: 10,
      difficulty: "JEE/NEET Level",
      lastUsed: daysAgo(13),
      lastAccuracy: 80,
      timesUsed: 3
    },
    {
      id: "th_010",
      subject: "Physics",
      topic: "Electrostatics",
      questionCount: 10,
      difficulty: "Hard",
      lastUsed: daysAgo(15),
      lastAccuracy: 50,
      timesUsed: 1
    },
    {
      id: "th_011",
      subject: "Chemistry",
      topic: "Thermodynamics",
      questionCount: 10,
      difficulty: "JEE/NEET Level",
      lastUsed: daysAgo(16),
      lastAccuracy: 70,
      timesUsed: 2
    },
    {
      id: "th_012",
      subject: "Mathematics",
      topic: "Matrices and Determinants",
      questionCount: 10,
      difficulty: "Mixed",
      lastUsed: daysAgo(18),
      lastAccuracy: 90,
      timesUsed: 2
    }
  ]
};

const recentQuizQuestions_001 = [
  {
    question: "A block of mass 5 kg rests on a rough horizontal surface (µs = 0.4, µk = 0.3). A horizontal force of 25 N is applied. What is the acceleration of the block? (g = 10 m/s²)",
    options: [
      "A) 2 m/s²",
      "B) 3 m/s²",
      "C) 5 m/s²",
      "D) Block does not move"
    ],
    correct: "A",
    userAnswer: "B",
    isCorrect: false,
    timeTakenMs: 94000,
    difficultyRating: "Hard",
    explanation: "Maximum static friction = µs × mg = 0.4 × 5 × 10 = 20 N. Since applied force (25 N) > static friction (20 N), block moves. Kinetic friction = µk × mg = 0.3 × 5 × 10 = 15 N. Net force = 25 - 15 = 10 N. Acceleration = F/m = 10/5 = 2 m/s²."
  },
  {
    question: "Two blocks A (3 kg) and B (2 kg) are connected by a light inextensible string over a frictionless pulley (Atwood's machine). What is the tension in the string? (g = 10 m/s²)",
    options: [
      "A) 20 N",
      "B) 24 N",
      "C) 25 N",
      "D) 30 N"
    ],
    correct: "B",
    userAnswer: "B",
    isCorrect: true,
    timeTakenMs: 71000,
    difficultyRating: "Just Right",
    explanation: "For Atwood's machine: a = (m1-m2)g/(m1+m2) = (3-2)×10/(3+2) = 2 m/s². Tension T = 2m1m2g/(m1+m2) = 2×3×2×10/5 = 24 N. Verify: For block B (2kg): T - 2g = 2a → T = 2(10+2) = 24 N ✓"
  },
  {
    question: "A ball of mass 0.4 kg moving at 15 m/s collides head-on with a stationary ball of mass 0.6 kg. If the collision is perfectly elastic, what is the velocity of the 0.4 kg ball after collision?",
    options: [
      "A) -3 m/s",
      "B) 3 m/s",
      "C) -9 m/s",
      "D) 9 m/s"
    ],
    correct: "A",
    userAnswer: "C",
    isCorrect: false,
    timeTakenMs: 112000,
    difficultyRating: "Very Hard",
    explanation: "For elastic collision: v1 = ((m1-m2)/(m1+m2))u1 = ((0.4-0.6)/(0.4+0.6))×15 = (-0.2/1.0)×15 = -3 m/s. The negative sign means the 0.4 kg ball bounces back. This is a standard elastic collision formula that must be memorized for JEE."
  },
  {
    question: "A car of mass 1200 kg is moving at 20 m/s when brakes are applied. The braking force is 6000 N. How far does the car travel before stopping?",
    options: [
      "A) 20 m",
      "B) 30 m",
      "C) 40 m",
      "D) 60 m"
    ],
    correct: "C",
    userAnswer: "C",
    isCorrect: true,
    timeTakenMs: 45000,
    difficultyRating: "Just Right",
    explanation: "Deceleration a = F/m = 6000/1200 = 5 m/s². Using v² = u² - 2as: 0 = 400 - 2×5×s → s = 400/10 = 40 m. Alternatively, use work-energy theorem: KE = Work done by brakes → ½mv² = Fs → s = mv²/2F = 1200×400/12000 = 40 m."
  },
  {
    question: "A rocket of initial mass 1000 kg (including 800 kg fuel) ejects fuel at 500 m/s relative to itself. What is the thrust force when fuel ejection rate is 10 kg/s?",
    options: [
      "A) 5000 N",
      "B) 8000 N",
      "C) 10000 N",
      "D) 500 N"
    ],
    correct: "A",
    userAnswer: "A",
    isCorrect: true,
    timeTakenMs: 38000,
    difficultyRating: "Just Right",
    explanation: "Thrust = v_exhaust × (dm/dt) = 500 × 10 = 5000 N. This is a direct application of rocket propulsion: thrust force equals the exhaust velocity multiplied by the rate of fuel ejection. The total mass doesn't affect instantaneous thrust."
  },
  {
    question: "On a frictionless incline of angle 30°, a block slides down. At the bottom, it enters a rough horizontal floor (µk = 0.2). If the incline height is 5 m, how far does the block slide on the floor? (g = 10 m/s²)",
    options: [
      "A) 10 m",
      "B) 15 m",
      "C) 25 m",
      "D) 50 m"
    ],
    correct: "C",
    userAnswer: "B",
    isCorrect: false,
    timeTakenMs: 127000,
    difficultyRating: "Very Hard",
    explanation: "Speed at bottom of incline using energy: v² = 2gh = 2×10×5 = 100, v = 10 m/s. On floor, deceleration = µk×g = 0.2×10 = 2 m/s². Using v² = u² - 2as: 0 = 100 - 2×2×s → s = 100/4 = 25 m."
  },
  {
    question: "Newton's first law defines which physical concept?",
    options: [
      "A) Force",
      "B) Inertia",
      "C) Momentum",
      "D) Acceleration"
    ],
    correct: "B",
    userAnswer: "B",
    isCorrect: true,
    timeTakenMs: 12000,
    difficultyRating: "Too Easy",
    explanation: "Newton's First Law (Law of Inertia) states that a body remains at rest or in uniform motion unless acted upon by an external force. It fundamentally defines inertia — the tendency of objects to resist changes in their state of motion."
  },
  {
    question: "A 60 kg person stands on a scale inside an elevator. The scale reads 48 kg. What is the acceleration of the elevator? (g = 10 m/s²)",
    options: [
      "A) 2 m/s² downward",
      "B) 2 m/s² upward",
      "C) 12 m/s² downward",
      "D) 1.2 m/s² upward"
    ],
    correct: "A",
    userAnswer: "A",
    isCorrect: true,
    timeTakenMs: 58000,
    difficultyRating: "Hard",
    explanation: "Apparent weight = m(g-a) when accelerating downward. 48×10 = 60×(10-a) → 480 = 600 - 60a → 60a = 120 → a = 2 m/s² downward. The scale reads less than actual weight, confirming downward acceleration (elevator slowing down while going up, or speeding up while going down)."
  },
  {
    question: "Two forces of 3 N and 4 N act on a body at right angles to each other. What is the magnitude of the resultant force?",
    options: [
      "A) 1 N",
      "B) 5 N",
      "C) 7 N",
      "D) 12 N"
    ],
    correct: "B",
    userAnswer: "B",
    isCorrect: true,
    timeTakenMs: 20000,
    difficultyRating: "Too Easy",
    explanation: "When forces are perpendicular, use Pythagoras: R = √(3² + 4²) = √(9 + 16) = √25 = 5 N. The angle of resultant: θ = arctan(4/3) ≈ 53° from the 3N force. This is a fundamental 3-4-5 right triangle — memorize it."
  },
  {
    question: "A bullet of mass 10 g traveling at 800 m/s embeds itself in a stationary wooden block of mass 2 kg. What is the velocity of the block-bullet system after impact?",
    options: [
      "A) 3.98 m/s",
      "B) 4.00 m/s",
      "C) 0.4 m/s",
      "D) 400 m/s"
    ],
    correct: "A",
    userAnswer: "C",
    isCorrect: false,
    timeTakenMs: 88000,
    difficultyRating: "Hard",
    explanation: "Conservation of momentum (perfectly inelastic collision): m1×v1 = (m1+m2)×v. 0.01×800 = (0.01+2)×v → 8 = 2.01×v → v = 8/2.01 ≈ 3.98 m/s. Common mistake: using 2 kg instead of 2.01 kg for total mass, which gives exactly 4 m/s (option B) — JEE tests this precision."
  }
];

const recentQuizQuestions_002 = [
  {
    question: "Which of the following molecules has a trigonal pyramidal geometry?",
    options: [
      "A) BF3",
      "B) NH3",
      "C) H2O",
      "D) CH4"
    ],
    correct: "B",
    userAnswer: "A",
    isCorrect: false,
    timeTakenMs: 68000,
    difficultyRating: "Hard",
    explanation: "NH3 has 3 bond pairs + 1 lone pair → tetrahedral electron geometry but trigonal pyramidal molecular geometry. BF3 has 3 bond pairs, no lone pairs → trigonal planar. H2O has 2 bond pairs + 2 lone pairs → bent. CH4 has 4 bond pairs → tetrahedral. Lone pairs distort geometry."
  },
  {
    question: "The bond order of O2²⁻ (peroxide ion) according to molecular orbital theory is:",
    options: [
      "A) 1",
      "B) 1.5",
      "C) 2",
      "D) 2.5"
    ],
    correct: "A",
    userAnswer: "B",
    isCorrect: false,
    timeTakenMs: 95000,
    difficultyRating: "Very Hard",
    explanation: "O2²⁻ has 18 electrons. MO configuration: σ1s²σ*1s²σ2s²σ*2s²σ2p²π2p⁴π*2p⁴. Bond order = (bonding - antibonding)/2 = (10-8)/2 = 1. Compare with O2 (BO=2) and O2⁻ (BO=1.5). Adding 2 electrons to O2 fills both π* orbitals completely."
  },
  {
    question: "In which of the following does the central atom use sp3d2 hybridization?",
    options: [
      "A) PCl3",
      "B) SF4",
      "C) SF6",
      "D) BrF3"
    ],
    correct: "C",
    userAnswer: "C",
    isCorrect: true,
    timeTakenMs: 42000,
    difficultyRating: "Just Right",
    explanation: "SF6: S has 6 bond pairs, 0 lone pairs → sp3d2 hybridization → octahedral. PCl3: sp3. SF4: sp3d (1 lone pair, 4 bond pairs → see-saw shape). BrF3: sp3d (2 lone pairs → T-shaped). The key rule: sp3d2 requires exactly 6 electron pairs around central atom."
  },
  {
    question: "Which factor does NOT affect the lattice energy of an ionic compound?",
    options: [
      "A) Ionic charge",
      "B) Ionic radius",
      "C) Crystal structure",
      "D) Isotopic mass of ions"
    ],
    correct: "D",
    userAnswer: "D",
    isCorrect: true,
    timeTakenMs: 31000,
    difficultyRating: "Just Right",
    explanation: "Lattice energy depends on ionic charge (higher charge = higher LE), ionic radius (smaller radius = higher LE), and indirectly on crystal structure (coordination number). Isotopic mass does not affect electrostatic interactions between ions. This is a common elimination-style JEE question."
  },
  {
    question: "A molecule has 2 bond pairs and 2 lone pairs on the central atom. Its shape is:",
    options: [
      "A) Linear",
      "B) Tetrahedral",
      "C) Bent/V-shaped",
      "D) Trigonal planar"
    ],
    correct: "C",
    userAnswer: "C",
    isCorrect: true,
    timeTakenMs: 22000,
    difficultyRating: "Too Easy",
    explanation: "2 bond pairs + 2 lone pairs = 4 electron pairs → sp3 hybridization → tetrahedral electron geometry. But lone pairs are not counted in molecular shape → bent/V-shaped. Example: H2O (bond angle ~104.5° due to lone pair-lone pair repulsion being greater than lone pair-bond pair repulsion)."
  },
  {
    question: "The dipole moment of which molecule is zero despite having polar bonds?",
    options: [
      "A) H2O",
      "B) NH3",
      "C) CO2",
      "D) HCl"
    ],
    correct: "C",
    userAnswer: "A",
    isCorrect: false,
    timeTakenMs: 55000,
    difficultyRating: "Hard",
    explanation: "CO2 is linear (sp hybridization) — the two C=O dipoles point in exactly opposite directions and cancel perfectly → net dipole moment = 0. H2O is bent → dipoles don't cancel → μ ≠ 0. NH3 is pyramidal → net dipole exists. HCl is diatomic polar → μ ≠ 0. Symmetric linear/tetrahedral molecules with identical substituents have zero dipole moment."
  },
  {
    question: "Which of the following correctly orders bond lengths: N≡N, N=N, N-N?",
    options: [
      "A) N≡N < N=N < N-N",
      "B) N-N < N=N < N≡N",
      "C) N=N < N≡N < N-N",
      "D) All are equal"
    ],
    correct: "A",
    userAnswer: "A",
    isCorrect: true,
    timeTakenMs: 18000,
    difficultyRating: "Too Easy",
    explanation: "Bond length decreases as bond order increases (more electron density pulls atoms closer). N≡N (bond order 3) < N=N (bond order 2) < N-N (bond order 1). Approximate values: N≡N ≈ 110 pm, N=N ≈ 125 pm, N-N ≈ 145 pm. Also note: shorter bonds are stronger (higher bond dissociation energy)."
  },
  {
    question: "The hybridization of carbon in CO3²⁻ (carbonate ion) is:",
    options: [
      "A) sp",
      "B) sp2",
      "C) sp3",
      "D) sp3d"
    ],
    correct: "B",
    userAnswer: "B",
    isCorrect: true,
    timeTakenMs: 25000,
    difficultyRating: "Just Right",
    explanation: "Carbonate CO3²⁻: C forms 3 σ bonds with 3 oxygen atoms, with one π bond delocalized over all three C-O bonds (resonance). 3 electron domains → sp2 hybridization → trigonal planar geometry with 120° bond angles. The delocalized π system is why all three C-O bonds have equal length (intermediate between single and double bond)."
  }
];

const quizHistory = [
  {
    id: "quiz_001",
    timestamp: daysAgo(1),
    subject: "Physics",
    topic: "Laws of Motion",
    score: 6, total: 10, accuracy: 60,
    timeTaken: 720,
    difficulty: "JEE/NEET Level",
    questions: recentQuizQuestions_001
  },
  {
    id: "quiz_002",
    timestamp: daysAgo(2),
    subject: "Chemistry",
    topic: "Chemical Bonding",
    score: 5, total: 8, accuracy: 62,
    timeTaken: 540,
    difficulty: "JEE/NEET Level",
    questions: recentQuizQuestions_002
  },
  {
    id: "quiz_003", timestamp: daysAgo(3),
    subject: "Mathematics", topic: "Integration",
    score: 9, total: 10, accuracy: 90,
    timeTaken: 680, difficulty: "JEE/NEET Level", questions: []
  },
  {
    id: "quiz_004", timestamp: daysAgo(5),
    subject: "Physics", topic: "Kinematics",
    score: 8, total: 10, accuracy: 80,
    timeTaken: 600, difficulty: "JEE/NEET Level", questions: []
  },
  {
    id: "quiz_005", timestamp: daysAgo(6),
    subject: "Chemistry", topic: "Organic Chemistry — Hydrocarbons",
    score: 4, total: 10, accuracy: 40,
    timeTaken: 820, difficulty: "JEE/NEET Level", questions: []
  },
  {
    id: "quiz_006", timestamp: daysAgo(8),
    subject: "Mathematics", topic: "Limits and Continuity",
    score: 7, total: 10, accuracy: 70,
    timeTaken: 550, difficulty: "JEE/NEET Level", questions: []
  },
  {
    id: "quiz_007", timestamp: daysAgo(10),
    subject: "Physics", topic: "Work, Energy and Power",
    score: 6, total: 10, accuracy: 60,
    timeTaken: 700, difficulty: "Hard", questions: []
  },
  {
    id: "quiz_008", timestamp: daysAgo(12),
    subject: "Chemistry", topic: "Electrochemistry",
    score: 3, total: 8, accuracy: 37,
    timeTaken: 760, difficulty: "Hard", questions: []
  },
  {
    id: "quiz_009", timestamp: daysAgo(13),
    subject: "Mathematics", topic: "Differential Equations",
    score: 8, total: 10, accuracy: 80,
    timeTaken: 590, difficulty: "JEE/NEET Level", questions: []
  },
  {
    id: "quiz_010", timestamp: daysAgo(15),
    subject: "Physics", topic: "Electrostatics",
    score: 5, total: 10, accuracy: 50,
    timeTaken: 810, difficulty: "Hard", questions: []
  },
  {
    id: "quiz_011", timestamp: daysAgo(16),
    subject: "Chemistry", topic: "Thermodynamics",
    score: 7, total: 10, accuracy: 70,
    timeTaken: 620, difficulty: "JEE/NEET Level", questions: []
  },
  {
    id: "quiz_012", timestamp: daysAgo(18),
    subject: "Mathematics", topic: "Matrices and Determinants",
    score: 9, total: 10, accuracy: 90,
    timeTaken: 480, difficulty: "Mixed", questions: []
  }
];

const srsCards = [
  {
    id: "card_p1", subject: "Physics", topic: "Kinematics",
    front: "What are the three equations of motion for uniform acceleration?",
    back: "1) v = u + at\n2) s = ut + ½at²\n3) v² = u² + 2as\n\nAlso: s_nth = u + a(2n-1)/2 for displacement in nth second.\nAll derived from the definition of uniform acceleration.",
    stability: 4.2, difficulty: 0.3,
    due: daysFromNow(-1), reps: 5, lapses: 0, state: 2
  },
  {
    id: "card_p2", subject: "Physics", topic: "Laws of Motion",
    front: "What is the condition for a body to be in equilibrium? State Lami's theorem.",
    back: "Equilibrium: ΣF = 0 (no net force) AND Στ = 0 (no net torque).\n\nLami's Theorem (3 concurrent coplanar forces in equilibrium):\nF1/sin α = F2/sin β = F3/sin γ\nWhere α, β, γ are angles OPPOSITE to respective forces.",
    stability: 1.2, difficulty: 0.7,
    due: daysFromNow(0), reps: 3, lapses: 2, state: 2
  },
  {
    id: "card_p3", subject: "Physics", topic: "Work Energy Theorem",
    front: "State the Work-Energy Theorem. When is work done by friction negative?",
    back: "W_net = ΔKE = ½mv² - ½mu²\n\nFriction always opposes motion → work by friction is ALWAYS negative (or zero if no sliding). It converts kinetic energy into heat.\n\nNote: Work done by internal forces in a system can be non-zero (unlike in a rigid body).",
    stability: 6.8, difficulty: 0.25,
    due: daysFromNow(5), reps: 7, lapses: 0, state: 2
  },
  {
    id: "card_p4", subject: "Physics", topic: "Rotational Motion",
    front: "Write the moment of inertia for: solid sphere, hollow sphere, solid disc, thin ring (all about central axis).",
    back: "Solid sphere:  I = 2MR²/5\nHollow sphere: I = 2MR²/3\nSolid disc:    I = MR²/2\nThin ring:     I = MR²\n\nMnemonic: 2/5, 2/3, 1/2, 1 — increasing order.\nParallel axis: I = I_cm + Md²",
    stability: 0.8, difficulty: 0.85,
    due: daysFromNow(0), reps: 2, lapses: 3, state: 2
  },
  {
    id: "card_p5", subject: "Physics", topic: "Gravitation",
    front: "Derive the expression for orbital velocity of a satellite at height h.",
    back: "For circular orbit: Gravitational force = Centripetal force\nGMm/(R+h)² = mv²/(R+h)\nv_orbital = √(GM/(R+h))\n\nAt surface (h=0): v = √(gR) ≈ 7.9 km/s\nEscape velocity = √2 × orbital velocity = √(2gR) ≈ 11.2 km/s",
    stability: 3.5, difficulty: 0.4,
    due: daysFromNow(2), reps: 4, lapses: 1, state: 2
  },
  {
    id: "card_p6", subject: "Physics", topic: "Waves",
    front: "Write the Doppler effect formula. When does frequency increase vs decrease?",
    back: "f' = f × (v ± v_observer)/(v ∓ v_source)\n\nTop sign: when moving TOWARD each other (f increases)\nBottom sign: when moving AWAY (f decreases)\n\nMemory trick: Think of an ambulance. Coming towards you = higher pitch. Moving away = lower pitch.",
    stability: 2.1, difficulty: 0.6,
    due: daysFromNow(1), reps: 3, lapses: 1, state: 2
  },
  {
    id: "card_p7", subject: "Physics", topic: "Modern Physics",
    front: "State de Broglie hypothesis. What is the wavelength of an electron accelerated through potential V?",
    back: "λ = h/mv = h/p (de Broglie wavelength)\n\nFor electron accelerated through V volts:\nKE = eV = ½mv² → v = √(2eV/m)\nλ = h/√(2meV)\n\nNumerical shortcut: λ (in Å) = 12.27/√V\nExample: V = 100 V → λ = 1.227 Å",
    stability: 1.5, difficulty: 0.65,
    due: daysFromNow(0), reps: 2, lapses: 1, state: 2
  },
  {
    id: "card_p8", subject: "Physics", topic: "Thermodynamics",
    front: "What is a Carnot cycle? Write the efficiency formula.",
    back: "Carnot cycle (most efficient heat engine):\n1. Isothermal expansion (absorbs Q1 at T1)\n2. Adiabatic expansion\n3. Isothermal compression (rejects Q2 at T2)\n4. Adiabatic compression\n\nEfficiency: η = 1 - T2/T1 = 1 - Q2/Q1\n(T in Kelvin always)\nCannot achieve 100% unless T2 = 0 K (absolute zero).",
    stability: 5.2, difficulty: 0.3,
    due: daysFromNow(4), reps: 6, lapses: 0, state: 2
  },
  {
    id: "card_c1", subject: "Chemistry", topic: "Chemical Bonding",
    front: "Predict the shape and bond angle of SF4 using VSEPR theory.",
    back: "SF4: S has 4 bond pairs + 1 lone pair = 5 electron pairs\n→ sp3d hybridization → trigonal bipyramidal electron geometry\n→ LONE PAIR occupies equatorial position (less repulsion)\n→ Molecular shape: SEE-SAW\n→ Bond angles: ~89° (axial) and ~117° (equatorial)\n(both less than ideal due to lone pair repulsion)",
    stability: 1.0, difficulty: 0.75,
    due: daysFromNow(0), reps: 3, lapses: 2, state: 2
  },
  {
    id: "card_c2", subject: "Chemistry", topic: "Organic Chemistry",
    front: "What is Markovnikov's Rule? Give an example with mechanism.",
    back: "In addition of HX to asymmetric alkene: H adds to carbon with MORE H atoms.\n\nMechanism (electrophilic addition):\nCH3-CH=CH2 + HBr →\nStep 1: H⁺ adds to CH2 (more H) → forms 2° carbocation (more stable)\nStep 2: Br⁻ attacks carbocation\nProduct: CH3-CHBr-CH3 (2-bromopropane)\n\nAnti-Markovnikov: occurs with HBr in presence of peroxides (free radical mechanism).",
    stability: 0.6, difficulty: 0.9,
    due: daysFromNow(-1), reps: 2, lapses: 4, state: 2
  },
  {
    id: "card_c3", subject: "Chemistry", topic: "Electrochemistry",
    front: "Write the Nernst equation. Calculate E for: Zn|Zn²⁺(0.1M)||Cu²⁺(1M)|Cu, given E° = +1.10 V.",
    back: "Nernst: E = E° - (0.0592/n)·log(Q) at 25°C\n\nFor Zn + Cu²⁺ → Zn²⁺ + Cu:\nn = 2, Q = [Zn²⁺]/[Cu²⁺] = 0.1/1 = 0.1\nE = 1.10 - (0.0592/2)·log(0.1)\nE = 1.10 - (0.0296)·(-1)\nE = 1.10 + 0.0296 = 1.1296 V ≈ 1.13 V",
    stability: 0.5, difficulty: 0.95,
    due: daysFromNow(0), reps: 1, lapses: 3, state: 2
  },
  {
    id: "card_c4", subject: "Chemistry", topic: "Thermodynamics",
    front: "When is a reaction spontaneous? Analyze all four ΔH/ΔS combinations.",
    back: "ΔG = ΔH - TΔS. Spontaneous when ΔG < 0.\n\n┌─────────┬──────────┬──────────────────────┐\n│   ΔH    │   ΔS    │   Spontaneity        │\n├─────────┼──────────┼──────────────────────┤\n│   -     │   +     │ Always (all T)        │\n│   +     │   -     │ Never                 │\n│   -     │   -     │ Low T only            │\n│   +     │   +     │ High T only           │\n└─────────┴──────────┴──────────────────────┘",
    stability: 3.8, difficulty: 0.4,
    due: daysFromNow(3), reps: 5, lapses: 0, state: 2
  },
  {
    id: "card_c5", subject: "Chemistry", topic: "Periodic Table",
    front: "Why is IE2 of Na much higher than IE1? Explain the concept of effective nuclear charge.",
    back: "IE1 of Na: removes 1 electron from 3s¹ (outer shell) — relatively easy.\nIE2 of Na: removes from 2p⁶ (noble gas core, much closer to nucleus).\n\nEffective nuclear charge (Z_eff) = Z - σ (shielding constant).\nInner electrons shield outer ones imperfectly.\n→ The 2p electrons experience MUCH higher Z_eff → enormous energy to remove.\n\nIE1(Na) = 496 kJ/mol vs IE2(Na) = 4562 kJ/mol (9× jump!)",
    stability: 4.5, difficulty: 0.35,
    due: daysFromNow(4), reps: 6, lapses: 0, state: 2
  },
  {
    id: "card_c6", subject: "Chemistry", topic: "Organic Chemistry",
    front: "Compare SN1 vs SN2 reactions on 5 parameters.",
    back: "┌───────────────┬──────────┬──────────┐\n│               │  SN1     │  SN2     │\n├───────────────┼──────────┼──────────┤\n│ Steps         │ 2-step   │ 1-step   │\n│ Substrate     │ 3° > 2°  │ 1° > 2°  │\n│ Nucleophile   │ Weak     │ Strong   │\n│ Solvent       │ Polar    │ Polar    │\n│               │ protic   │ aprotic  │\n│ Stereochem    │ Racemic  │ Inversion│\n└───────────────┴──────────┴──────────┘\nRate SN1 = k[RX]; Rate SN2 = k[RX][Nu]",
    stability: 0.7, difficulty: 0.88,
    due: daysFromNow(0), reps: 2, lapses: 3, state: 2
  },
  {
    id: "card_c7", subject: "Chemistry", topic: "Equilibrium",
    front: "For N2 + 3H2 ⇌ 2NH3, predict the effect on equilibrium of: (a) adding N2, (b) increasing temperature, (c) increasing pressure.",
    back: "(a) Adding N2: shifts RIGHT → more NH3 produced ✓\n(b) Increasing temp: reaction is EXOTHERMIC (ΔH = -92 kJ/mol) → shifts LEFT → less NH3\n(c) Increasing pressure: 4 moles gas → 2 moles gas → shifts RIGHT (fewer moles side) → more NH3\n\nHaber Process conditions: 450°C, 200 atm, Fe catalyst — a compromise between yield and rate.",
    stability: 5.0, difficulty: 0.3,
    due: daysFromNow(5), reps: 7, lapses: 0, state: 2
  },
  {
    id: "card_m1", subject: "Mathematics", topic: "Integration",
    front: "State integration by parts. What is the ILATE rule?",
    back: "∫u·dv = u·v - ∫v·du\n\nILATE priority for choosing u (first function):\nI — Inverse trigonometric (sin⁻¹x, tan⁻¹x)\nL — Logarithmic (ln x)\nA — Algebraic (xⁿ)\nT — Trigonometric (sin x, cos x)\nE — Exponential (eˣ)\n\nExample: ∫x·eˣdx → u=x (A), dv=eˣdx\n= xeˣ - ∫eˣdx = xeˣ - eˣ + C = eˣ(x-1) + C",
    stability: 7.2, difficulty: 0.2,
    due: daysFromNow(7), reps: 9, lapses: 0, state: 2
  },
  {
    id: "card_m2", subject: "Mathematics", topic: "Differential Equations",
    front: "Solve: dy/dx + y·tan(x) = sec(x)",
    back: "Linear ODE: dy/dx + P(x)y = Q(x)\nP(x) = tan x, Q(x) = sec x\n\nIntegrating Factor: μ = e^∫tan(x)dx = e^ln|sec x| = sec x\n\nMultiply both sides by sec x:\nd/dx(y·sec x) = sec²x\n\nIntegrate: y·sec x = tan x + C\ny = sin x + C·cos x",
    stability: 6.5, difficulty: 0.25,
    due: daysFromNow(6), reps: 8, lapses: 0, state: 2
  },
  {
    id: "card_m3", subject: "Mathematics", topic: "Limits",
    front: "Evaluate: lim(x→0) [(1 - cos x)/x²] and lim(x→0) [(eˣ - 1)/x]",
    back: "lim(x→0) [(1-cos x)/x²]:\nUsing L'Hôpital or Taylor: cos x ≈ 1 - x²/2\n(1 - cos x)/x² ≈ (x²/2)/x² = 1/2 ✓\n\nlim(x→0) [(eˣ - 1)/x]:\neˣ ≈ 1 + x + x²/2...\n(eˣ - 1)/x ≈ x/x = 1 ✓\n\nStandard limits to memorize:\n• lim sin x/x = 1\n• lim (1-cos x)/x² = 1/2\n• lim (eˣ-1)/x = 1\n• lim (aˣ-1)/x = ln a",
    stability: 8.1, difficulty: 0.2,
    due: daysFromNow(8), reps: 10, lapses: 0, state: 2
  },
  {
    id: "card_m4", subject: "Mathematics", topic: "Matrices",
    front: "For a 3×3 matrix A, write the formula for A⁻¹ using adjugate. When does A⁻¹ not exist?",
    back: "A⁻¹ = adj(A) / det(A)\n\nSteps:\n1. Find cofactors Cij for each element\n2. Form cofactor matrix\n3. Transpose it → adj(A)\n4. Divide each element by det(A)\n\nA⁻¹ does NOT exist (singular matrix) when:\n• det(A) = 0\n• Rows/columns are linearly dependent\n• Rank(A) < n\n\nProperty: A·A⁻¹ = A⁻¹·A = I",
    stability: 5.8, difficulty: 0.3,
    due: daysFromNow(5), reps: 7, lapses: 0, state: 2
  },
  {
    id: "card_m5", subject: "Mathematics", topic: "Complex Numbers",
    front: "State De Moivre's theorem. Use it to find (1+i)^8.",
    back: "De Moivre: (cos θ + i sin θ)ⁿ = cos(nθ) + i sin(nθ)\n\n(1+i)^8:\nFirst: 1+i = √2 · (cos 45° + i sin 45°)\n(1+i)^8 = (√2)^8 · (cos 360° + i sin 360°)\n= 16 · (1 + 0i) = 16\n\nKey insight: Convert to polar form r(cos θ + i sin θ) first,\nthen apply De Moivre.",
    stability: 4.1, difficulty: 0.45,
    due: daysFromNow(3), reps: 5, lapses: 1, state: 2
  },
  {
    id: "card_m6", subject: "Mathematics", topic: "Probability",
    front: "State Bayes' Theorem. A bag has 3 red, 2 blue balls. Ball drawn is red. What's the probability it came from bag A (which had 4R, 1B) vs bag B (3R, 2B), if bags equally likely?",
    back: "P(A|B) = P(B|A)·P(A) / P(B)\n\nExample:\nP(Bag A) = P(Bag B) = 0.5\nP(Red|A) = 4/5, P(Red|B) = 3/5\nP(Red) = 0.5×4/5 + 0.5×3/5 = 7/10\n\nP(A|Red) = (4/5 × 0.5)/(7/10)\n= (2/5)/(7/10) = (2/5)×(10/7) = 4/7 ≈ 0.571",
    stability: 3.2, difficulty: 0.55,
    due: daysFromNow(2), reps: 4, lapses: 1, state: 2
  },
  {
    id: "card_m7", subject: "Mathematics", topic: "Vectors",
    front: "When is the scalar triple product [A B C] = 0? What does this mean geometrically?",
    back: "[A B C] = A · (B × C) = det of 3×3 matrix of components\n\n[A B C] = 0 when:\n1. Any two vectors are parallel\n2. All three vectors are coplanar\n3. Any vector is zero\n\nGeometric meaning: the parallelepiped formed by A, B, C has ZERO volume → vectors are coplanar.\n\nProperty: [A B C] = [B C A] = [C A B] (cyclic permutation preserves value)\n[A B C] = -[A C B] (swap any two → sign changes)",
    stability: 4.8, difficulty: 0.38,
    due: daysFromNow(4), reps: 6, lapses: 0, state: 2
  }
];

const activityLog = {};
const today = new Date();
const missedDays = new Set([3, 11, 17, 22, 28, 35, 41, 56]);
for (let i = 0; i <= 84; i++) {
  const d = new Date(today);
  d.setDate(d.getDate() - i);
  const key = d.toISOString().split('T')[0];
  const dow = d.getDay(); // 0=Sun, 6=Sat
  if (missedDays.has(i)) continue;
  if (dow === 0 || dow === 6) {
    activityLog[key] = Math.floor(Math.random() * 3) + 1;
  } else {
    // Recent days more active than older
    const base = i < 7 ? 8 : i < 21 ? 5 : 3;
    activityLog[key] = Math.floor(Math.random() * 4) + base;
  }
}

const streakData = {
  currentStreak: 9,
  longestStreak: 14,
  lastStudyDate: new Date().toISOString().split('T')[0],
  weekHistory: [true, true, true, true, true, false, true]
};

const studyPlan = {
  weeklySchedule: [
    {
      day: "Monday", sessions: [
        { subject: "Physics",     topic: "Electromagnetic Induction",              duration: 90, type: "Learn",    priority: "High",   rationale: "15% of JEE Advanced Physics" },
        { subject: "Chemistry",   topic: "Organic Chemistry — Aldehydes & Ketones",duration: 75, type: "Learn",    priority: "High",   rationale: "Identified weak area" },
        { subject: "Mathematics", topic: "Complex Numbers",                         duration: 60, type: "Revise",   priority: "Medium", rationale: "SRS scheduled revision" },
        { subject: "SRS Review",  topic: "Daily flashcard review",                  duration: 30, type: "Practice", priority: "High",   rationale: "7 cards due today" }
      ]
    },
    {
      day: "Tuesday", sessions: [
        { subject: "Mathematics", topic: "3D Geometry — Lines and Planes",   duration: 90, type: "Learn",    priority: "High", rationale: "8–10% of JEE Maths" },
        { subject: "Physics",     topic: "Alternating Currents — RLC",       duration: 75, type: "Learn",    priority: "High", rationale: "Follows from Monday EM" },
        { subject: "Chemistry",   topic: "Electrochemistry — Electrolysis",  duration: 60, type: "Practice", priority: "High", rationale: "Lowest accuracy subject" }
      ]
    },
    {
      day: "Wednesday", sessions: [
        { subject: "Physics",     topic: "Mixed chapters — Problem set",  duration: 120, type: "Practice", priority: "High",   rationale: "Mid-week stamina builder" },
        { subject: "Mathematics", topic: "Probability — Bayes' theorem",  duration: 75,  type: "Revise",   priority: "Medium", rationale: "SRS revision due" }
      ]
    },
    {
      day: "Thursday", sessions: [
        { subject: "Chemistry",   topic: "Coordination Compounds",       duration: 90, type: "Learn",    priority: "High", rationale: "Inorganic = 20% of Chemistry" },
        { subject: "Mathematics", topic: "Definite Integration",         duration: 90, type: "Learn",    priority: "High", rationale: "Build on existing strength" },
        { subject: "SRS Review",  topic: "Daily flashcard review",       duration: 30, type: "Practice", priority: "High", rationale: "5 cards due" }
      ]
    },
    {
      day: "Friday", sessions: [
        { subject: "Physics",     topic: "Modern Physics — Photoelectric Effect",             duration: 75, type: "Learn", priority: "High", rationale: "Last 6 of 8 JEE papers included this" },
        { subject: "Chemistry",   topic: "Organic — Named Reactions (Aldol, Cannizzaro)",    duration: 75, type: "Learn", priority: "High", rationale: "Weak area follow-up" },
        { subject: "Mathematics", topic: "Vectors — Triple products",                         duration: 45, type: "Revise", priority: "Low", rationale: "Maintenance revision" }
      ]
    },
    {
      day: "Saturday", sessions: [
        { subject: "Full Mock",   topic: "JEE Advanced Pattern — Paper 1", duration: 180, type: "Practice", priority: "High", rationale: "Weekly full simulation" },
        { subject: "Review",      topic: "Mock test error analysis",        duration: 60,  type: "Revise",   priority: "High", rationale: "Analysis > test itself" }
      ]
    },
    {
      day: "Sunday", sessions: [
        { subject: "Physics",    topic: "Weak area drill — Electrostatics", duration: 60, type: "Practice", priority: "High",   rationale: "50% accuracy needs work" },
        { subject: "SRS Review", topic: "Weekly catch-up cards",             duration: 45, type: "Practice", priority: "Medium", rationale: "Clear overdue cards" },
        { subject: "Planning",   topic: "Review upcoming week",              duration: 20, type: "Practice", priority: "Low",    rationale: "10 min planning = 2 hrs saved" }
      ]
    }
  ],
  subjectWeightage: { "Physics": 38, "Chemistry": 32, "Mathematics": 30 },
  weakAreaFocus: ["Organic Chemistry — Reaction Mechanisms", "Electrochemistry"],
  dailyGoal: "2 new topics + 30 practice questions + 15 SRS cards",
  milestones: [
    { week: 1, goal: "Complete Electromagnetic Induction + Organic Reactions intro" },
    { week: 2, goal: "First full JEE Advanced mock test" },
    { week: 4, goal: "All weak areas addressed — Chemistry accuracy > 65%" },
    { week: 6, goal: "3 full mocks done — rebalance plan based on results" },
    { week: 9, goal: "Final sprint — high-weightage topics only" }
  ],
  completedSessions: { "Monday_0": true, "Monday_3": true }
};

export function seedDemoData() {
  const aiCompanionStorage = {
    state: {
      streakDays: streakData.currentStreak,
      flashcardsLearned: 341,
      quizzesTaken: 12,
      accuracy: 65,
      totalQuestionsAnswered: 116,
      correctQuestionsAnswers: 75,
      studyActivityLog: activityLog,
      quizResults: quizHistory,
      recentActivity: [
        { type: "Quiz", title: "Laws of Motion", score: "6/10", date: "Yesterday" },
        { type: "Flashcards", title: "Chemical Bonding", score: "12 cards", date: "Yesterday" },
        { type: "Video Notes", title: "Integration Basics", score: "Completed", date: "2 days ago" },
        { type: "Quiz", title: "Chemical Bonding", score: "5/8", date: "2 days ago" },
      ],
      decks: [
        { id: "deck_jee", name: "JEE Advanced Concepts", cards: srsCards }
      ],
      studyProfile: studyProfile,
      studyPlan: {
        weeklySchedule: studyPlan.weeklySchedule,
        subjectWeightage: studyPlan.subjectWeightage,
        weakAreaFocus: studyPlan.weakAreaFocus,
        dailyGoal: studyPlan.dailyGoal,
        milestones: studyPlan.milestones,
      },
      completedSessions: Object.keys(studyPlan.completedSessions),
      pomodoro: {
        timeLeft: 25 * 60,
        isRunning: false,
        mode: 'focus',
        focusDuration: 25,
        breakDuration: 5,
        sessionCount: 14,
        isVisible: false,
      }
    },
    version: 0
  };

  localStorage.setItem('ai-companion-storage', JSON.stringify(aiCompanionStorage));
  localStorage.setItem('studycraft_topic_history', JSON.stringify(topicHistory));

  console.log('%c✅ StudyCraft demo data seeded successfully', 
    'color: #3D7A5E; font-weight: bold; font-size: 14px');
  console.table({
    'Quiz history': quizHistory.length + ' entries',
    'SRS cards': srsCards.length + ' cards',
    'Topic history': topicHistory.entries.length + ' topics',
    'Activity log days': Object.keys(activityLog).length + ' days'
  });
}
