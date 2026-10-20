export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  minorUnitFactor: number; // e.g. 100 for cents/paise
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyInfo> = {
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', minorUnitFactor: 100 },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', minorUnitFactor: 100 },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', minorUnitFactor: 100 },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', minorUnitFactor: 100 },
  CAD: { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', minorUnitFactor: 100 },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', minorUnitFactor: 100 },
  SGD: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', minorUnitFactor: 100 },
  AED: { code: 'AED', symbol: 'AED', name: 'UAE Dirham', minorUnitFactor: 100 },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', minorUnitFactor: 1 }
};

export const SECURITY_QUESTIONS = [
  "What was the name of your first childhood pet?",
  "In what city or town were you born?",
  "What is your mother's maiden name?",
  "What was the name of your elementary or primary school?",
  "What is your favorite family vacation spot?",
  "What was your childhood nickname?",
  "What was the name of your first stuffed toy or doll?",
  "What is your favorite comforting home-cooked meal?"
];

export const DEFAULT_EXPENSE_CATEGORIES = [
  // 1. Food & Dining
  { name: 'Food & Dining', icon: '🍜', color: '#FFD6BA', description: 'Restaurants, dining out, cafes' },
  { name: 'Restaurants & Food Delivery', icon: '🍔', color: '#FDBA74', description: 'Takeout, delivery, Zomato, Swiggy, dine-out' },

  // 2. Groceries & Essentials
  { name: 'Groceries & Household', icon: '🛒', color: '#B7E4C7', description: 'Supermarket, provisions, vegetables, cleaning staples' },

  // 3. Housing & Utilities
  { name: 'Rent & Housing', icon: '🏠', color: '#A78BFA', description: 'Apartment rent, lease, society maintenance charges' },
  { name: 'Utilities & Bills', icon: '⚡', color: '#FFF1BA', description: 'Electricity, water, gas, internet, mobile recharge' },
  { name: 'Home Maintenance & Appliances', icon: '🛠️', color: '#E2E8F0', description: 'Appliance repair, plumbing, carpentry, new devices' },
  { name: 'Domestic Help & Services', icon: '🧹', color: '#FED7AA', description: 'Maid salary, cook, driver, security guard, domestic staff' },

  // 4. Transportation & Travel
  { name: 'Transportation & Fuel', icon: '🚗', color: '#BAE6FD', description: 'Petrol, diesel, metro, cab rides, tolls, transit' },
  { name: 'Vehicle Maintenance & Servicing', icon: '🔧', color: '#94A3B8', description: 'Car/bike servicing, oil change, tyre replacement, repairs' },
  { name: 'Travel & Holidays', icon: '✈️', color: '#BAE6FD', description: 'Flight tickets, train bookings, hotel stays, vacation tours' },

  // 5. Health, Wellness & Personal Care
  { name: 'Healthcare & Medical', icon: '💊', color: '#FECDD3', description: 'Doctor consultations, medicines, diagnostics, therapies' },
  { name: 'Personal Care', icon: '🧴', color: '#FBCFE8', description: 'Salon, grooming, skincare, haircuts, spa' },
  { name: 'Fitness & Sports', icon: '🏃', color: '#86EFAC', description: 'Gym membership, sports coaching, equipment, yoga classes' },

  // 6. Education, Family & Pets
  { name: 'Education', icon: '📚', color: '#DDD6FE', description: 'School fees, tuition, books, courses, coaching' },
  { name: 'Family & Children', icon: '🧸', color: '#F9A8D4', description: 'Childcare, baby essentials, toys, family outings' },
  { name: 'Pets', icon: '🐾', color: '#FDBA74', description: 'Pet food, veterinary care, grooming, pet supplies' },

  // 7. Shopping & Lifestyle
  { name: 'Shopping & Clothing', icon: '🛍️', color: '#FBCFE8', description: 'Apparel, footwear, fashion accessories, electronics' },
  { name: 'Entertainment & Subscriptions', icon: '🎬', color: '#E9D5FF', description: 'OTT streaming, movies, gaming, club memberships' },
  { name: 'Gifts & Celebrations', icon: '🎁', color: '#FDE047', description: 'Festival gifts, birthdays, anniversaries, wedding shagun' },
  { name: 'Religious & Charity', icon: '🙏', color: '#FDE68A', description: 'Donations, temple offerings, charity, community seva, tithes' },

  // 8. Finance, Loans & Legal
  { name: 'EMI & Loan Repayment', icon: '💳', color: '#FCA5A5', description: 'Home loan, auto loan, personal loan, credit card EMIs' },
  { name: 'Investments & Savings', icon: '💰', color: '#86EFAC', description: 'Mutual funds, SIPs, stocks, recurring deposits, gold' },
  { name: 'Insurance', icon: '🛡️', color: '#99F6E4', description: 'Health, life, term, vehicle, and property insurance policies' },
  { name: 'Banking & Financial Charges', icon: '🏦', color: '#E2E8F0', description: 'Bank maintenance charges, ATM fees, wire charges' },
  { name: 'Taxes & Government Fees', icon: '🏛️', color: '#CBD5E1', description: 'Income tax, property tax, municipal dues, registration fees' },
  { name: 'Fees, Fines & Penalties', icon: '⚠️', color: '#FCA5A5', description: 'Late payment fees, traffic fines, legal penalties, surcharges' },

  // 9. Work, Emergency & Miscellaneous
  { name: 'Work & Business', icon: '💼', color: '#93C5FD', description: 'Professional tools, stationery, coworking, business expenses' },
  { name: 'Emergency & Contingency', icon: '🚨', color: '#FECDD3', description: 'Unplanned urgent expenses, unexpected home contingencies' },
  { name: 'Miscellaneous', icon: '✨', color: '#E0E7FF', description: 'General unclassified or miscellaneous family spending' }
];

export const DEFAULT_SCHEDULE_CATEGORIES = [
  { name: 'Work', icon: '💻', color: '#93C5FD', description: 'Professional tasks & meetings' },
  { name: 'Study', icon: '📚', color: '#C4B5FD', description: 'Reading, learning, exam prep' },
  { name: 'Exercise', icon: '🏃', color: '#86EFAC', description: 'Gym, running, yoga, walking' },
  { name: 'Reading', icon: '📖', color: '#FDE047', description: 'Books, articles, quiet reading' },
  { name: 'Meditation', icon: '🧘', color: '#F9A8D4', description: 'Breathing, mindfulness, calm' },
  { name: 'Sleep', icon: '🌙', color: '#A5B4FC', description: 'Rest, nap, bedtime routine' },
  { name: 'Meals', icon: '🍽️', color: '#FDBA74', description: 'Breakfast, lunch, family dinners' },
  { name: 'Personal Time', icon: '🌷', color: '#FDA4AF', description: 'Me-time, hobbies, journaling' },
  { name: 'Family Time', icon: '❤️', color: '#F87171', description: 'Family game night, outings' },
  { name: 'Health', icon: '🩺', color: '#6EE7B7', description: 'Doctor, pharmacy, wellness' },
  { name: 'Travel', icon: '🚗', color: '#7DD3FC', description: 'Commute, road trip, transit' },
  { name: 'Hobbies', icon: '🎨', color: '#F472B6', description: 'Music, drawing, crafts' },
  { name: 'Important Tasks', icon: '⭐', color: '#FACC15', description: 'Urgent priorities' },
  { name: 'Appointments', icon: '📅', color: '#A78BFA', description: 'Scheduled bookings' },
  { name: 'Other', icon: '✨', color: '#CBD5E1', description: 'General everyday plans' }
];

export const PAYMENT_METHODS = [
  { id: 'UPI', label: 'UPI / Instant Pay', icon: '⚡' },
  { id: 'Card', label: 'Credit / Debit Card', icon: '💳' },
  { id: 'Cash', label: 'Cash', icon: '💵' },
  { id: 'Net Banking', label: 'Net Banking / Transfer', icon: '🏦' },
  { id: 'Digital Wallet', label: 'Digital Wallet', icon: '👛' },
  { id: 'Other', label: 'Other', icon: '✨' }
];

export const INCOME_CATEGORIES = [
  { id: 'Salary', label: 'Salary', icon: '💼', color: '#10B981' },
  { id: 'Bonus & Incentives', label: 'Bonus & Incentives', icon: '🎁', color: '#F59E0B' },
  { id: 'Freelance & Business Income', label: 'Freelance & Business Income', icon: '💻', color: '#6366F1' },
  { id: 'Rental Income', label: 'Rental Income', icon: '🏠', color: '#EC4899' },
  { id: 'Interest & Dividends', label: 'Interest & Dividends', icon: '📈', color: '#06B6D4' },
  { id: 'Investment Returns', label: 'Investment Returns', icon: '📊', color: '#14B8A6' },
  { id: 'Expense Reimbursement', label: 'Expense Reimbursement', icon: '🧾', color: '#3B82F6' },
  { id: 'Refunds & Cashback', label: 'Refunds & Cashback', icon: '💸', color: '#10B981' },
  { id: 'Gifts Received', label: 'Gifts Received', icon: '🎉', color: '#F43F5E' },
  { id: 'Pension & Benefits', label: 'Pension & Benefits', icon: '🛡️', color: '#8B5CF6' },
  { id: 'Tax Refund', label: 'Tax Refund', icon: '🏛️', color: '#6366F1' },
  { id: 'Other Income', label: 'Other Income', icon: '✨', color: '#64748B' }
];

export const TRANSACTION_TYPES = [
  { id: 'Expense', label: 'Expense', icon: '💸', color: '#EF4444' },
  { id: 'Income', label: 'Income', icon: '💰', color: '#10B981' },
  { id: 'Transfer', label: 'Transfer', icon: '🔄', color: '#3B82F6' },
  { id: 'Investment', label: 'Investment', icon: '📈', color: '#8B5CF6' },
  { id: 'Loan Disbursement', label: 'Loan Disbursement', icon: '💳', color: '#F59E0B' },
  { id: 'Refund', label: 'Refund', icon: '↩️', color: '#06B6D4' },
  { id: 'Reimbursement', label: 'Reimbursement', icon: '🧾', color: '#14B8A6' }
];

export const INCOME_PAYMENT_METHODS = [
  { id: 'Bank Transfer', label: 'Direct Bank Transfer / NEFT / IMPS', icon: '🏦' },
  { id: 'Direct Deposit', label: 'Payroll Direct Deposit', icon: '💼' },
  { id: 'UPI', label: 'UPI / Instant Pay', icon: '⚡' },
  { id: 'Cheque', label: 'Cheque', icon: '📜' },
  { id: 'Cash', label: 'Cash', icon: '💵' },
  { id: 'Other', label: 'Other', icon: '✨' }
];

export const AUDIO_CATALOG = [
  // Meditation & Yoga
  {
    id: 'singing-bowls-432',
    title: 'Tibetan Singing Bowls (432Hz)',
    category: 'Meditation & Yoga',
    description: 'Resonating singing bowls with sacred 432Hz harmonics and peaceful decay',
    soundType: 'singing_bowl',
    icon: '🧘',
    gradient: 'from-amber-200 to-yellow-300',
    durationSeconds: 2400
  },
  {
    id: 'solfeggio-528',
    title: '528Hz Solfeggio Miracle Tone',
    category: 'Meditation & Yoga',
    description: 'Pure healing frequency resonance with delicate Tibetan wind chimes',
    soundType: 'solfeggio_528',
    icon: '🔔',
    gradient: 'from-emerald-200 to-teal-300',
    durationSeconds: 2400
  },
  {
    id: 'zen-garden-water',
    title: 'Zen Bamboo Garden',
    category: 'Meditation & Yoga',
    description: 'Tranquil bamboo water fountain, soft stream, and peaceful meditative stillness',
    soundType: 'zen',
    icon: '🎋',
    gradient: 'from-teal-200 to-cyan-300',
    durationSeconds: 2400
  },
  {
    id: 'om-meditation',
    title: 'Sacred Om Resonance',
    category: 'Meditation & Yoga',
    description: 'Deep harmonic drone with overtone series for yoga, breathwork, and inner peace',
    soundType: 'om_drone',
    icon: '🕉️',
    gradient: 'from-violet-200 to-purple-300',
    durationSeconds: 2400
  },

  // Study & Focus
  {
    id: 'alpha-waves-10hz',
    title: 'Binaural Alpha Waves (10Hz)',
    category: 'Study & Focus',
    description: 'Gentle 10Hz brainwave frequency tailored for laser-sharp mental focus & reading',
    soundType: 'binaural_alpha',
    icon: '🧠',
    gradient: 'from-blue-200 to-indigo-300',
    durationSeconds: 3600
  },
  {
    id: 'lofi-study-piano',
    title: 'Lo-Fi Piano & Warm Hearth',
    category: 'Study & Focus',
    description: 'Warm Rhodes electric piano chords with soft, gentle fireside warmth',
    soundType: 'rhodes_chill',
    icon: '☕',
    gradient: 'from-orange-200 to-amber-300',
    durationSeconds: 3600
  },
  {
    id: 'quiet-library',
    title: 'Quiet Library Sanctuary',
    category: 'Study & Focus',
    description: 'Subtle soft room resonance, peaceful acoustic warmth, and unbroken focus',
    soundType: 'library',
    icon: '📚',
    gradient: 'from-cyan-200 to-blue-300',
    durationSeconds: 3600
  },
  {
    id: 'deep-focus-drone',
    title: 'Deep Flow State Drone',
    category: 'Study & Focus',
    description: 'Warm ambient sub-harmonics keeping your mind in an effortless flow state',
    soundType: 'focus_drone',
    icon: '✨',
    gradient: 'from-indigo-200 to-purple-300',
    durationSeconds: 3600
  },

  // Deep Sleep
  {
    id: 'delta-waves-2hz',
    title: 'Binaural Delta Waves (2Hz)',
    category: 'Deep Sleep',
    description: 'Slow 2Hz Delta wave sleep entrainment gently lulling racing thoughts to rest',
    soundType: 'binaural_delta',
    icon: '🌙',
    gradient: 'from-purple-300 to-indigo-400',
    durationSeconds: 3600
  },
  {
    id: 'velvet-brown-noise',
    title: 'Velvet Brown Noise',
    category: 'Deep Sleep',
    description: 'Deep, warm, low-frequency rumble like rain against a distant cozy roof',
    soundType: 'brown_noise',
    icon: '🛌',
    gradient: 'from-amber-300 to-stone-400',
    durationSeconds: 3600
  },
  {
    id: 'gentle-night-rain',
    title: 'Gentle Night Rain on Window',
    category: 'Deep Sleep',
    description: 'Warm low-passed soft raindrops for uninterrupted, deep restorative sleep',
    soundType: 'rain',
    icon: '🌧️',
    gradient: 'from-sky-200 to-blue-300',
    durationSeconds: 3600
  },
  {
    id: 'celestial-music-box',
    title: 'Celestial Music Box Lullaby',
    category: 'Deep Sleep',
    description: 'Sweet, soothing music box notes playing a quiet celestial bedtime melody',
    soundType: 'music_box',
    icon: '🧸',
    gradient: 'from-pink-200 to-purple-200',
    durationSeconds: 2400
  },

  // Calm & Relaxation
  {
    id: 'peaceful-piano',
    title: 'Peaceful Ambient Piano',
    category: 'Calm & Relaxation',
    description: 'Slow, serene acoustic piano chord progressions with warm soothing reverb',
    soundType: 'ambient_piano',
    icon: '🎹',
    gradient: 'from-amber-100 to-rose-200',
    durationSeconds: 2400
  },
  {
    id: 'whispering-wind',
    title: 'Whispering Wind in Pines',
    category: 'Calm & Relaxation',
    description: 'Gentle mountain breeze rustling through tall pine branches',
    soundType: 'wind',
    icon: '🍃',
    gradient: 'from-emerald-100 to-teal-200',
    durationSeconds: 2400
  },
  {
    id: 'ocean-waves',
    title: 'Twilight Ocean Waves',
    category: 'Calm & Relaxation',
    description: 'Slow, rhythmic tidal swells washing smoothly onto warm evening sand',
    soundType: 'waves',
    icon: '🌊',
    gradient: 'from-cyan-100 to-blue-200',
    durationSeconds: 2400
  },
  {
    id: 'peaceful-stream',
    title: 'Flowing Mountain Stream',
    category: 'Calm & Relaxation',
    description: 'Clear fresh spring water bubbling gently over smooth river stones',
    soundType: 'river',
    icon: '💧',
    gradient: 'from-sky-100 to-indigo-200',
    durationSeconds: 2400
  }
];

// ================= BILL CATEGORIES ================= //

export const BILL_CATEGORIES = [
  { id: 'medicine', label: 'Medicine & Pharmacy', icon: '', color: '#10B981', badgeVariant: 'mint' as const },
  { id: 'grocery', label: 'Groceries & Supermarket', icon: '', color: '#F59E0B', badgeVariant: 'peach' as const },
  { id: 'diagnostic', label: 'Lab & Diagnostic Report', icon: '', color: '#6366F1', badgeVariant: 'lavender' as const },
  { id: 'other', label: 'Other Household Receipts', icon: '', color: '#06B6D4', badgeVariant: 'sky' as const }
];

// ================= EXERCISE CATALOG WITH DETAILED FORM & ANIMATIONS ================= //

export const EXERCISE_CATALOG = [
  {
    id: 'jumping_jacks',
    name: 'Jumping Jacks',
    category: 'cardio' as const,
    difficulty: 'Beginner' as const,
    targetMuscles: ['Calves', 'Shoulders', 'Core', 'Cardiovascular'],
    caloriesBurnPerMin: 10,
    defaultDurationSeconds: 45,
    defaultReps: 30,
    animationKey: 'jumping_jacks' as const,
    instructions: [
      'Stand upright with feet together and arms resting gently by your side.',
      'Bend knees slightly and jump up, extending feet out shoulder-width or wider.',
      'Simultaneously sweep arms out and overhead until hands nearly clap together.',
      'Jump back smoothly to starting position and repeat in an even rhythm.'
    ],
    formTips: [
      'Land softly on balls of your feet to protect your knees and ankles.',
      'Maintain an upright torso and steady nasal breathing.',
      'Keep core engaged throughout the movement.'
    ]
  },
  {
    id: 'squats',
    name: 'Air Squats',
    category: 'strength' as const,
    difficulty: 'Beginner' as const,
    targetMuscles: ['Quadriceps', 'Glutes', 'Hamstrings', 'Core'],
    caloriesBurnPerMin: 8,
    defaultDurationSeconds: 45,
    defaultReps: 15,
    animationKey: 'squats' as const,
    instructions: [
      'Stand with feet slightly wider than shoulder-width, toes turned slightly outward.',
      'Extend arms forward or clasp hands at chest for balance.',
      'Hinge hips back and bend knees, lowering down as if sitting back into an invisible chair.',
      'Lower until thighs are parallel to the floor, keeping chest tall and proud.',
      'Press firmly through your heels to stand back up, squeezing glutes at top.'
    ],
    formTips: [
      'Never let knees cave inward — track them in line with your middle toes.',
      'Keep weight balanced over your heels and midfoot.',
      'Keep your chest high and gaze forward.'
    ]
  },
  {
    id: 'pushups',
    name: 'Standard Push-Ups',
    category: 'strength' as const,
    difficulty: 'Intermediate' as const,
    targetMuscles: ['Chest', 'Triceps', 'Anterior Deltoids', 'Core'],
    caloriesBurnPerMin: 9,
    defaultDurationSeconds: 40,
    defaultReps: 12,
    animationKey: 'pushups' as const,
    instructions: [
      'Start in a high plank position with hands slightly wider than shoulder-width.',
      'Ensure shoulders are stacked directly over wrists and body forms a straight line from head to heels.',
      'Inhale and bend elbows at a 45-degree angle, lowering chest until it is 2 inches off the floor.',
      'Exhale and push the floor away through palms back to the top plank position.'
    ],
    formTips: [
      'Do not let your lower back sag or your hips pike into the air.',
      'Keep elbows at 45° angle to your ribs, avoiding flared chicken-wing elbows.',
      'Modify on knees if building up upper-body pressing strength.'
    ]
  },
  {
    id: 'plank',
    name: 'Core Forearm Plank',
    category: 'core' as const,
    difficulty: 'Beginner' as const,
    targetMuscles: ['Transverse Abdominis', 'Rectus Abdominis', 'Shoulders', 'Lower Back'],
    caloriesBurnPerMin: 6,
    defaultDurationSeconds: 60,
    defaultReps: 1,
    animationKey: 'plank' as const,
    instructions: [
      'Place forearms on the floor with elbows directly under shoulders, forearms parallel.',
      'Step feet back, balancing on toes, body forming a solid horizontal line.',
      'Squeeze glutes, pull navel toward your spine, and gaze slightly in front of your hands.',
      'Hold position with deep, controlled belly breathing.'
    ],
    formTips: [
      'Actively press forearms into floor to dome upper back slightly.',
      'Keep hips level with shoulders — never sagging or piking.',
      'Keep neck neutral and relaxed.'
    ]
  },
  {
    id: 'lunges',
    name: 'Alternating Walking Lunges',
    category: 'strength' as const,
    difficulty: 'Intermediate' as const,
    targetMuscles: ['Quadriceps', 'Glutes', 'Hamstrings', 'Calves', 'Core Balance'],
    caloriesBurnPerMin: 8,
    defaultDurationSeconds: 45,
    defaultReps: 16,
    animationKey: 'lunges' as const,
    instructions: [
      'Stand tall with hands on hips or at your sides.',
      'Step forward with right leg, lowering hips until both front and back knees form 90° angles.',
      'Front knee should hover above ankle, back knee hovering 1-2 inches above floor.',
      'Push through front heel to return to standing, then repeat on opposite leg.'
    ],
    formTips: [
      'Keep upper body tall and vertical, avoiding leaning forward.',
      'Front knee must track over front toes, not drifting inward.',
      'Take a generous stride to give your hips full clearance.'
    ]
  },
  {
    id: 'high_knees',
    name: 'High Knees Sprint',
    category: 'cardio' as const,
    difficulty: 'Intermediate' as const,
    targetMuscles: ['Hip Flexors', 'Quadriceps', 'Calves', 'Cardiovascular Core'],
    caloriesBurnPerMin: 12,
    defaultDurationSeconds: 30,
    defaultReps: 40,
    animationKey: 'high_knees' as const,
    instructions: [
      'Stand with feet hip-width apart.',
      'Drive right knee up toward your chest while pumping opposite arm forward.',
      'Quickly switch legs, landing lightly on balls of feet, driving left knee up in rhythm.',
      'Maintain an energetic, springy tempo as if sprinting on the spot.'
    ],
    formTips: [
      'Drive knees up to hip height for maximum core engagement.',
      'Pump arms actively in sync with your legs.',
      'Stay light on the balls of your feet.'
    ]
  },
  {
    id: 'cobra',
    name: 'Bhujangasana (Cobra Pose)',
    category: 'yoga' as const,
    difficulty: 'Beginner' as const,
    targetMuscles: ['Erector Spinae', 'Chest Expansion', 'Shoulders', 'Abdominal Wall'],
    caloriesBurnPerMin: 4,
    defaultDurationSeconds: 45,
    defaultReps: 5,
    animationKey: 'cobra' as const,
    instructions: [
      'Lie face down on the mat with legs extended straight and tops of feet flat.',
      'Place hands on floor beneath shoulders, hugging elbows close to your torso.',
      'Inhale deeply and gently peel chest off the floor, engaging spinal erectors.',
      'Keep shoulders rolling down and away from ears with gentle gaze forward.',
      'Hold for 3-5 smooth breaths, then softly release down.'
    ],
    formTips: [
      'Do not push aggressively with hands — use back muscles to lift.',
      'Keep pubic bone and tops of feet anchored into the floor.',
      'Lengthen back of the neck without crunching vertebrae.'
    ]
  },
  {
    id: 'downward_dog',
    name: 'Downward-Facing Dog',
    category: 'yoga' as const,
    difficulty: 'Beginner' as const,
    targetMuscles: ['Hamstrings', 'Calves', 'Shoulders', 'Spine Decompression'],
    caloriesBurnPerMin: 4,
    defaultDurationSeconds: 60,
    defaultReps: 1,
    animationKey: 'downward_dog' as const,
    instructions: [
      'Start on all fours with hands shoulder-width and knees hip-width.',
      'Tuck toes, press through hands, and lift hips up toward the ceiling to form an inverted V shape.',
      'Press chest gently toward thighs, lengthening your spine from wrists to tailbone.',
      'Ease heels toward the mat, pedaling calves gently if hamstrings are tight.'
    ],
    formTips: [
      'Spread fingers wide and press through knuckles to relieve wrist pressure.',
      'Keep slight bend in knees if hamstrings are tight to protect lower back.',
      'Let your head and neck hang loosely between your arms.'
    ]
  },
  {
    id: 'child_pose',
    name: 'Balasana (Restful Child Pose)',
    category: 'yoga' as const,
    difficulty: 'Beginner' as const,
    targetMuscles: ['Lower Back Release', 'Hip Flexors', 'Shoulders', 'Mind Relaxation'],
    caloriesBurnPerMin: 3,
    defaultDurationSeconds: 60,
    defaultReps: 1,
    animationKey: 'child_pose' as const,
    instructions: [
      'Kneel on the mat with big toes touching and knees spread comfortably wide.',
      'Sit hips back onto your heels and fold torso forward between your thighs.',
      'Extend arms forward onto the floor or drape them back along your sides.',
      'Rest forehead gently on the mat and breathe deeply into your lower back.'
    ],
    formTips: [
      'Allow shoulders to soften away from your ears with every exhale.',
      'Place a folded blanket or pillow under forehead if needed for comfort.',
      'Surrender any tension with every deep, nourishing breath.'
    ]
  }
];

// ================= CLINICAL HEALTH ACCURACY RANGES ================= //

export const FEVER_SEVERITY = {
  CELSIUS: {
    NORMAL: { min: 36.1, max: 37.2, label: 'Normal Temperature', color: '#10B981', badge: 'mint' },
    LOW_GRADE: { min: 37.3, max: 38.3, label: 'Low-Grade Fever', color: '#F59E0B', badge: 'peach' },
    MODERATE: { min: 38.4, max: 39.4, label: 'Moderate Fever', color: '#F97316', badge: 'yellow' },
    HIGH: { min: 39.5, max: 42.0, label: 'High Fever (Seek Medical Advice)', color: '#EF4444', badge: 'pink' }
  },
  FAHRENHEIT: {
    NORMAL: { min: 97.0, max: 99.0, label: 'Normal Temperature', color: '#10B981', badge: 'mint' },
    LOW_GRADE: { min: 99.1, max: 100.9, label: 'Low-Grade Fever', color: '#F59E0B', badge: 'peach' },
    MODERATE: { min: 101.0, max: 102.9, label: 'Moderate Fever', color: '#F97316', badge: 'yellow' },
    HIGH: { min: 103.0, max: 108.0, label: 'High Fever (Seek Medical Advice)', color: '#EF4444', badge: 'pink' }
  }
};

export const PERIOD_SYMPTOMS_LIST = [
  { id: 'cramps', label: 'Cramps' },
  { id: 'headache', label: 'Headache' },
  { id: 'bloating', label: 'Bloating' },
  { id: 'fatigue', label: 'Fatigue' },
  { id: 'tender_breasts', label: 'Tender Breasts' },
  { id: 'backache', label: 'Back Pain' },
  { id: 'acne', label: 'Acne' },
  { id: 'cravings', label: 'Food Cravings' }
];

export const PERIOD_MOODS_LIST = [
  { id: 'calm', label: 'Calm & Peaceful' },
  { id: 'happy', label: 'Happy & Upbeat' },
  { id: 'sensitive', label: 'Emotional / Sensitive' },
  { id: 'irritable', label: 'Irritable' },
  { id: 'anxious', label: 'Anxious' },
  { id: 'tired', label: 'Low Energy' }
];

export const FEVER_SYMPTOMS_LIST = [
  { id: 'chills', label: 'Chills & Shivering' },
  { id: 'sweating', label: 'Sweating' },
  { id: 'headache', label: 'Headache' },
  { id: 'body_ache', label: 'Body Aches' },
  { id: 'cough', label: 'Cough / Throat Pain' },
  { id: 'fatigue', label: 'Weakness / Fatigue' },
  { id: 'nausea', label: 'Nausea / Loss of Appetite' }
];

// ================= CLINICAL HEALTH REFERENCE RANGES ================= //

export const HEALTH_REFERENCE_RANGES = {
  STEPS: {
    target: '7,500 – 10,000+ steps/day',
    source: 'WHO & CDC Cardiovascular Health Standards',
    description: 'Active lifestyle threshold reducing all-cause mortality and boosting metabolic health.'
  },
  WATER: {
    target: '2,000 – 3,000 ml/day (8–12 glasses)',
    source: 'European Food Safety Authority (EFSA)',
    description: 'Maintains optimal cellular hydration, renal clearance, and cognitive alertness.'
  },
  SLEEP: {
    target: '7.0 – 9.0 hours/night',
    source: 'National Sleep Foundation & American Academy of Sleep Medicine',
    description: 'Enables restorative slow-wave deep sleep and vital REM neuro-plasticity recovery.'
  },
  BLOOD_PRESSURE: {
    target: 'Systolic < 120 mmHg & Diastolic < 80 mmHg',
    source: 'American Heart Association (AHA)',
    description: 'Normal resting arterial pressure protecting blood vessels, heart, and brain.'
  },
  BMI: {
    target: '18.5 – 24.9 kg/m²',
    source: 'World Health Organization (WHO)',
    description: 'Standard healthy weight-to-height ratio for balanced metabolic longevity.'
  },
  BODY_TEMP: {
    target: '36.1°C – 37.2°C (97.0°F – 99.0°F)',
    source: 'Clinical Thermometry Standards',
    description: 'Core homeostatic thermal equilibrium.'
  },
  PERIOD_CYCLE: {
    target: 'Cycle 21 – 35 days (Flow: 3 – 7 days)',
    source: 'American College of Obstetricians and Gynecologists (ACOG)',
    description: 'Regular hormonal ovulatory rhythm indicating optimal reproductive endocrinology.'
  }
};

// ================= GLOBAL FOOD & NUTRITION DATABASE ================= //

export const GLOBAL_FOODS_CATALOG = [
  // 🇮🇳 INDIAN CUISINE
  {
    id: 'paneer-tikka',
    name: 'Paneer Tikka (Grilled)',
    cuisine: 'Indian',
    category: 'Snack & Appetizer' as const,
    servingSize: '1 portion (180g)',
    servingWeightGrams: 180,
    caloriesKcal: 260,
    macronutrients: { proteinG: 18, carbsG: 6, fatG: 18, fiberG: 2, sugarG: 3 },
    minerals: { calciumMg: 420, ironMg: 1.8, potassiumMg: 210, magnesiumMg: 35, sodiumMg: 380, zincMg: 2.1 },
    vitamins: { vitaminC_mg: 12, vitaminA_IU: 450, vitaminB12_mcg: 1.2 },
    glycemicIndex: 'Low' as const,
    healthHighlights: ['High Protein', 'Rich in Bone Calcium', 'Low Carb Keto']
  },
  {
    id: 'dal-tadka',
    name: 'Yellow Dal Tadka (Moong/Arhar)',
    cuisine: 'Indian',
    category: 'Main Dish' as const,
    servingSize: '1 bowl (220g)',
    servingWeightGrams: 220,
    caloriesKcal: 195,
    macronutrients: { proteinG: 12, carbsG: 28, fatG: 4.5, fiberG: 7.5, sugarG: 2 },
    minerals: { calciumMg: 65, ironMg: 3.2, potassiumMg: 480, magnesiumMg: 68, sodiumMg: 340, zincMg: 1.7 },
    vitamins: { vitaminC_mg: 6, vitaminA_IU: 210 },
    glycemicIndex: 'Low' as const,
    healthHighlights: ['Gut-Friendly Fiber', 'Plant Protein', 'Turmeric Anti-inflammatory']
  },
  {
    id: 'masala-dosa',
    name: 'South Indian Masala Dosa with Chutney',
    cuisine: 'Indian',
    category: 'Breakfast' as const,
    servingSize: '1 medium dosa (160g)',
    servingWeightGrams: 160,
    caloriesKcal: 290,
    macronutrients: { proteinG: 6, carbsG: 44, fatG: 9.5, fiberG: 4, sugarG: 2 },
    minerals: { calciumMg: 45, ironMg: 2.1, potassiumMg: 310, magnesiumMg: 38, sodiumMg: 410, zincMg: 1.1 },
    vitamins: { vitaminC_mg: 8, vitaminA_IU: 120 },
    glycemicIndex: 'Medium' as const,
    healthHighlights: ['Fermented Probiotic Batter', 'Energy Sustaining', 'Digestible']
  },
  {
    id: 'roti-wholewheat',
    name: 'Whole Wheat Roti (Phulka with Ghee)',
    cuisine: 'Indian',
    category: 'Main Dish' as const,
    servingSize: '2 rotis (70g)',
    servingWeightGrams: 70,
    caloriesKcal: 180,
    macronutrients: { proteinG: 6, carbsG: 34, fatG: 3.5, fiberG: 5.5, sugarG: 1 },
    minerals: { calciumMg: 28, ironMg: 2.6, potassiumMg: 180, magnesiumMg: 52, sodiumMg: 110, zincMg: 1.5 },
    vitamins: { vitaminA_IU: 80 },
    glycemicIndex: 'Low' as const,
    healthHighlights: ['Complex Carbohydrates', 'High Fiber', 'Sustained Energy']
  },
  {
    id: 'palak-paneer',
    name: 'Palak Paneer (Creamy Spinach Gravy)',
    cuisine: 'Indian',
    category: 'Main Dish' as const,
    servingSize: '1 bowl (240g)',
    servingWeightGrams: 240,
    caloriesKcal: 275,
    macronutrients: { proteinG: 16, carbsG: 9, fatG: 20, fiberG: 5, sugarG: 3 },
    minerals: { calciumMg: 460, ironMg: 4.8, potassiumMg: 520, magnesiumMg: 75, sodiumMg: 420, zincMg: 2.3 },
    vitamins: { vitaminC_mg: 28, vitaminA_IU: 4800, vitaminB12_mcg: 1.1 },
    glycemicIndex: 'Low' as const,
    healthHighlights: ['Super Iron Boost', 'Lutein Vision Health', 'Rich in Folate']
  },

  // 🇮🇹 MEDITERRANEAN & EUROPEAN
  {
    id: 'greek-salad',
    name: 'Authentic Greek Salad with Kalamata & Feta',
    cuisine: 'Mediterranean',
    category: 'Salad & Soup' as const,
    servingSize: '1 bowl (260g)',
    servingWeightGrams: 260,
    caloriesKcal: 220,
    macronutrients: { proteinG: 7, carbsG: 9, fatG: 17, fiberG: 3.5, sugarG: 4 },
    minerals: { calciumMg: 280, ironMg: 1.4, potassiumMg: 410, magnesiumMg: 32, sodiumMg: 590, zincMg: 1.2 },
    vitamins: { vitaminC_mg: 35, vitaminA_IU: 950 },
    glycemicIndex: 'Low' as const,
    healthHighlights: ['Heart Healthy Polyphenols', 'Antioxidant Rich', 'Extra Virgin Olive Oil']
  },
  {
    id: 'hummus-tahini',
    name: 'Hummus with Extra Virgin Olive Oil & Paprika',
    cuisine: 'Mediterranean',
    category: 'Snack & Appetizer' as const,
    servingSize: '4 tbsp (100g)',
    servingWeightGrams: 100,
    caloriesKcal: 215,
    macronutrients: { proteinG: 8, carbsG: 16, fatG: 13, fiberG: 6, sugarG: 1 },
    minerals: { calciumMg: 72, ironMg: 2.8, potassiumMg: 290, magnesiumMg: 58, sodiumMg: 380, zincMg: 1.8 },
    vitamins: { vitaminC_mg: 4, vitaminA_IU: 180 },
    glycemicIndex: 'Low' as const,
    healthHighlights: ['Prebiotic Fiber', 'Healthy Monounsaturated Fats', 'Sesame Lignans']
  },
  {
    id: 'shakshuka-eggs',
    name: 'Poached Eggs Shakshuka in Bell Pepper Sauce',
    cuisine: 'Mediterranean',
    category: 'Breakfast' as const,
    servingSize: '1 skillet portion (250g)',
    servingWeightGrams: 250,
    caloriesKcal: 295,
    macronutrients: { proteinG: 17, carbsG: 14, fatG: 19, fiberG: 4, sugarG: 7 },
    minerals: { calciumMg: 120, ironMg: 3.4, potassiumMg: 510, magnesiumMg: 42, sodiumMg: 480, zincMg: 2.2 },
    vitamins: { vitaminC_mg: 62, vitaminA_IU: 2100, vitaminB12_mcg: 1.6 },
    glycemicIndex: 'Low' as const,
    healthHighlights: ['Brain Choline & Lutein', 'Vitamin C Loaded', 'High Biological Protein']
  },

  // 🇯🇵 EAST ASIAN & JAPANESE
  {
    id: 'salmon-teriyaki-bowl',
    name: 'Grilled Atlantic Salmon Teriyaki with Broccoli',
    cuisine: 'Japanese',
    category: 'Main Dish' as const,
    servingSize: '1 fillet with veg (220g)',
    servingWeightGrams: 220,
    caloriesKcal: 360,
    macronutrients: { proteinG: 34, carbsG: 12, fatG: 18, fiberG: 3, sugarG: 6 },
    minerals: { calciumMg: 55, ironMg: 1.9, potassiumMg: 710, magnesiumMg: 62, sodiumMg: 460, zincMg: 1.4 },
    vitamins: { vitaminD_IU: 680, vitaminB12_mcg: 4.8, vitaminC_mg: 42 },
    glycemicIndex: 'Low' as const,
    healthHighlights: ['Omega-3 DHA & EPA', 'Immunity Vitamin D', 'Lean Muscle Protein']
  },
  {
    id: 'miso-soup-tofu',
    name: 'Fermented Tofu Miso Soup with Wakame Seaweed',
    cuisine: 'Japanese',
    category: 'Salad & Soup' as const,
    servingSize: '1 bowl (200g)',
    servingWeightGrams: 200,
    caloriesKcal: 65,
    macronutrients: { proteinG: 5, carbsG: 6, fatG: 2.5, fiberG: 1.5, sugarG: 1 },
    minerals: { calciumMg: 85, ironMg: 1.6, potassiumMg: 190, magnesiumMg: 44, sodiumMg: 620, zincMg: 0.9 },
    vitamins: { vitaminB12_mcg: 0.4 },
    glycemicIndex: 'Low' as const,
    healthHighlights: ['Microbiome Gut Friendly', 'Iodine for Thyroid', 'Low Calorie Comfort']
  },

  // 🇲🇽 AMERICAS & MEXICAN
  {
    id: 'chicken-quinoa-burrito-bowl',
    name: 'Grilled Chipotle Chicken Quinoa & Black Bean Bowl',
    cuisine: 'Mexican',
    category: 'Main Dish' as const,
    servingSize: '1 large bowl (350g)',
    servingWeightGrams: 350,
    caloriesKcal: 480,
    macronutrients: { proteinG: 42, carbsG: 48, fatG: 14, fiberG: 11, sugarG: 4 },
    minerals: { calciumMg: 95, ironMg: 4.6, potassiumMg: 820, magnesiumMg: 115, sodiumMg: 580, zincMg: 3.4 },
    vitamins: { vitaminC_mg: 24, vitaminA_IU: 750, vitaminB12_mcg: 1.4 },
    glycemicIndex: 'Low' as const,
    healthHighlights: ['Muscle Hypertrophy Protein', 'Full Amino Acid Profile', 'High Magnesium']
  },
  {
    id: 'avocado-sourdough-toast',
    name: 'Crushed Hass Avocado Sourdough with Chia Seeds',
    cuisine: 'American',
    category: 'Breakfast' as const,
    servingSize: '1 thick slice (150g)',
    servingWeightGrams: 150,
    caloriesKcal: 295,
    macronutrients: { proteinG: 7, carbsG: 28, fatG: 18, fiberG: 9, sugarG: 1 },
    minerals: { calciumMg: 42, ironMg: 2.2, potassiumMg: 620, magnesiumMg: 65, sodiumMg: 260, zincMg: 1.3 },
    vitamins: { vitaminC_mg: 14, vitaminA_IU: 220 },
    glycemicIndex: 'Low' as const,
    healthHighlights: ['Monounsaturated Oleic Acid', 'Gut Friendly Sourdough', 'Blood Sugar Balance']
  },
  {
    id: 'berry-oatmeal-chia',
    name: 'Warm Steel-Cut Oats with Blueberries & Almonds',
    cuisine: 'American',
    category: 'Breakfast' as const,
    servingSize: '1 bowl (250g)',
    servingWeightGrams: 250,
    caloriesKcal: 280,
    macronutrients: { proteinG: 10, carbsG: 46, fatG: 7, fiberG: 8.5, sugarG: 9 },
    minerals: { calciumMg: 140, ironMg: 3.1, potassiumMg: 380, magnesiumMg: 88, sodiumMg: 60, zincMg: 2.1 },
    vitamins: { vitaminC_mg: 16, vitaminA_IU: 150 },
    glycemicIndex: 'Low' as const,
    healthHighlights: ['Beta-Glucan Cholesterol Reducer', 'Brain Antioxidants', 'High Satiety']
  }
];

// ================= SMART SCALABLE RECIPES CATALOG ================= //

export const RECIPES_CATALOG = [
  {
    id: 'palak-paneer-delight',
    title: 'Immunity-Boosting Garlic Palak Paneer',
    cuisine: 'Indian',
    dietaryType: 'Vegetarian' as const,
    prepTimeMinutes: 15,
    cookTimeMinutes: 20,
    baseServings: 2,
    difficulty: 'Easy' as const,
    ingredients: [
      { name: 'Fresh Spinach Leaves (Palak)', baseQuantity: 250, unit: 'g', notes: 'Blanched & puréed' },
      { name: 'Cottage Cheese (Paneer)', baseQuantity: 200, unit: 'g', notes: 'Cut into 1-inch cubes' },
      { name: 'Tomatoes', baseQuantity: 2, unit: 'medium', notes: 'Finely chopped' },
      { name: 'Onion', baseQuantity: 1, unit: 'medium', notes: 'Finely minced' },
      { name: 'Garlic Cloves', baseQuantity: 6, unit: 'cloves', notes: 'Crushed' },
      { name: 'Cumin Seeds (Jeera)', baseQuantity: 1, unit: 'tsp' },
      { name: 'Turmeric Powder', baseQuantity: 0.5, unit: 'tsp' },
      { name: 'Garam Masala', baseQuantity: 0.5, unit: 'tsp' },
      { name: 'Cold-Pressed Mustard Oil / Ghee', baseQuantity: 1.5, unit: 'tbsp' },
      { name: 'Pink Himalayan Salt', baseQuantity: 1, unit: 'tsp' }
    ],
    nutritionPerServing: {
      caloriesKcal: 290,
      carbsG: 10,
      proteinG: 17,
      fatG: 21,
      fiberG: 5.2,
      ironMg: 5.4,
      calciumMg: 470,
      potassiumMg: 580,
      magnesiumMg: 82,
      sodiumMg: 420
    },
    instructions: [
      'Blanch spinach in boiling water for 90 seconds, then immediately immerse in cold ice water to retain vibrant emerald color.',
      'Blend blanched spinach with green chili and 2 tablespoons of water into a silky smooth purée.',
      'Heat ghee/oil in a pan, add cumin seeds until they crackle, then sauté minced garlic and onions until fragrant golden brown.',
      'Add chopped tomatoes, turmeric, and salt. Cook until tomatoes soften and oil separates from the masala.',
      'Pour in the velvety spinach purée and simmer on gentle heat for 4 minutes.',
      'Gently fold in fresh paneer cubes and garam masala. Simmer covered for 2 minutes and serve warm with rotis.'
    ],
    chefTips: [
      'Never overboil spinach — ice bath shock preserves lutein and iron pigments.',
      'Soak paneer cubes in warm water for 10 minutes beforehand for melt-in-mouth softness.'
    ],
    healthHighlights: ['Rich in Bioavailable Iron', 'High Calcium for Strong Bones', 'Natural Lutein for Eye Health']
  },
  {
    id: 'mediterranean-quinoa-bowl',
    title: 'Zesty Lemon-Herb Quinoa Power Bowl',
    cuisine: 'Mediterranean',
    dietaryType: 'Vegan' as const,
    prepTimeMinutes: 10,
    cookTimeMinutes: 15,
    baseServings: 2,
    difficulty: 'Easy' as const,
    ingredients: [
      { name: 'Organic Royal Quinoa', baseQuantity: 120, unit: 'g', notes: 'Rinsed' },
      { name: 'Cooked Chickpeas (Kabuli Chana)', baseQuantity: 150, unit: 'g' },
      { name: 'English Cucumber', baseQuantity: 1, unit: 'medium', notes: 'Diced' },
      { name: 'Cherry Tomatoes', baseQuantity: 10, unit: 'pieces', notes: 'Halved' },
      { name: 'Kalamata Olives', baseQuantity: 8, unit: 'pieces', notes: 'Pitted' },
      { name: 'Fresh Mint & Parsley', baseQuantity: 0.5, unit: 'cup', notes: 'Finely chopped' },
      { name: 'Extra Virgin Olive Oil', baseQuantity: 2, unit: 'tbsp' },
      { name: 'Fresh Lemon Juice', baseQuantity: 1.5, unit: 'tbsp' },
      { name: 'Sea Salt & Cracked Pepper', baseQuantity: 0.5, unit: 'tsp' }
    ],
    nutritionPerServing: {
      caloriesKcal: 380,
      carbsG: 46,
      proteinG: 14,
      fatG: 16,
      fiberG: 9.8,
      ironMg: 4.2,
      calciumMg: 85,
      potassiumMg: 640,
      magnesiumMg: 110,
      sodiumMg: 360
    },
    instructions: [
      'Cook quinoa in 240ml of lightly salted water until water is absorbed and grains are fluffy (15 minutes).',
      'Fluff quinoa with a fork and let cool to room temperature in a wide wooden bowl.',
      'In a small jar, whisk extra virgin olive oil, freshly squeezed lemon juice, minced herbs, salt, and black pepper.',
      'Toss cooled quinoa with chickpeas, cucumber, cherry tomatoes, and olives.',
      'Drizzle the vibrant herb vinaigrette and toss gently. Garnish with mint sprigs.'
    ],
    chefTips: [
      'Quinoa provides all 9 essential amino acids, making this a complete plant protein.',
      'Tasting delicious chilled or warm, this is an ideal family meal-prep salad.'
    ],
    healthHighlights: ['Complete Plant Amino Acids', 'Heart-Healthy Polyphenols', 'Zero Cholesterol']
  },
  {
    id: 'salmon-asparagus-roast',
    title: 'Omega-3 Herb Butter Salmon with Tender Asparagus',
    cuisine: 'American',
    dietaryType: 'High-Protein' as const,
    prepTimeMinutes: 8,
    cookTimeMinutes: 14,
    baseServings: 2,
    difficulty: 'Easy' as const,
    ingredients: [
      { name: 'Fresh Wild Atlantic Salmon Fillets', baseQuantity: 300, unit: 'g', notes: 'Skin-on, patted dry' },
      { name: 'Fresh Green Asparagus Spears', baseQuantity: 200, unit: 'g', notes: 'Woody ends snapped off' },
      { name: 'Garlic Cloves', baseQuantity: 4, unit: 'cloves', notes: 'Minced' },
      { name: 'Grass-fed Butter or Olive Oil', baseQuantity: 1.5, unit: 'tbsp' },
      { name: 'Lemon', baseQuantity: 1, unit: 'whole', notes: 'Sliced into thin wheels' },
      { name: 'Dried Thyme & Rosemary', baseQuantity: 1, unit: 'tsp' },
      { name: 'Flaky Sea Salt & Pepper', baseQuantity: 0.5, unit: 'tsp' }
    ],
    nutritionPerServing: {
      caloriesKcal: 375,
      carbsG: 5,
      proteinG: 36,
      fatG: 23,
      fiberG: 2.8,
      ironMg: 2.1,
      calciumMg: 52,
      potassiumMg: 780,
      magnesiumMg: 68,
      sodiumMg: 340
    },
    instructions: [
      'Preheat oven to 200°C (400°F) or prepare a cast iron skillet over medium-high heat.',
      'Arrange asparagus spears and salmon fillets on a parchment-lined baking sheet.',
      'Mix softened butter/oil with minced garlic, herbs, salt, and cracked pepper.',
      'Brush garlic herb glaze generously over salmon fillets and asparagus spears.',
      'Top with lemon slices and roast for 12-14 minutes until salmon flakes tenderly with a fork.'
    ],
    chefTips: [
      'Leaving the skin on keeps the fillet incredibly juicy and shields the delicate omega-3 oils.',
      'Asparagus provides natural prebiotic inulin for superior gut health.'
    ],
    healthHighlights: ['Over 2,200mg Omega-3 DHA/EPA', '36g Pure Muscle Protein', 'Potassium Rich for Blood Pressure']
  },
  {
    id: 'moong-khichdi-healing',
    title: 'Ayurvedic Golden Moong Khichdi with Cumin Ghee',
    cuisine: 'Indian',
    dietaryType: 'Vegetarian' as const,
    prepTimeMinutes: 10,
    cookTimeMinutes: 18,
    baseServings: 2,
    difficulty: 'Easy' as const,
    ingredients: [
      { name: 'Yellow Moong Dal (Split Lentils)', baseQuantity: 80, unit: 'g', notes: 'Washed' },
      { name: 'Basmati or Sona Masoori Rice', baseQuantity: 80, unit: 'g', notes: 'Washed' },
      { name: 'Fresh Ginger', baseQuantity: 1, unit: 'inch', notes: 'Finely grated' },
      { name: 'Pure Cow Ghee', baseQuantity: 1.5, unit: 'tbsp' },
      { name: 'Cumin Seeds (Jeera)', baseQuantity: 1, unit: 'tsp' },
      { name: 'Asafoetida (Hing)', baseQuantity: 1, unit: 'pinch' },
      { name: 'Turmeric Powder (Haldi)', baseQuantity: 0.75, unit: 'tsp' },
      { name: 'Rock Salt (Sendha Namak)', baseQuantity: 1, unit: 'tsp' },
      { name: 'Water', baseQuantity: 650, unit: 'ml' }
    ],
    nutritionPerServing: {
      caloriesKcal: 295,
      carbsG: 48,
      proteinG: 12,
      fatG: 6.5,
      fiberG: 5.5,
      ironMg: 3.8,
      calciumMg: 45,
      potassiumMg: 430,
      magnesiumMg: 56,
      sodiumMg: 290
    },
    instructions: [
      'Combine washed moong dal and rice in a cooker with 650ml water, grated ginger, turmeric, and salt.',
      'Pressure cook for 3-4 whistles (or simmer in pot covered for 22 minutes) until soft and porridge-like.',
      'In a small tempering tadka pan, melt golden ghee, add cumin seeds, and a pinch of asafoetida until aromatic.',
      'Pour sizzling aromatic ghee tadka over the hot khichdi and stir gently.',
      'Serve hot with a squeeze of fresh lemon and natural probiotic curd.'
    ],
    chefTips: [
      'The classic 1:1 ratio of moong dal and rice creates an alkaline, effortless digestive meal recommended in sickness and recovery.',
      'Turmeric and ginger synergistic compounds soothe the stomach lining.'
    ],
    healthHighlights: ['Ultra Gentle on Stomach', 'Ayurvedic Detoxifier', 'Gut Microbiome Reset']
  }
];


