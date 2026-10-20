export type MemberRole = 'admin' | 'member';
export type PaymentMethod = 'UPI' | 'Card' | 'Cash' | 'Net Banking' | 'Digital Wallet' | 'Other';
export type MoneyTransactionType = 'lent' | 'borrowed';
export type TransactionStatus = 'active' | 'partially_paid' | 'fully_paid' | 'overdue' | 'cancelled';
export type ReminderStatus = 'pending' | 'paid' | 'snoozed' | 'cancelled';
export type EventPriority = 'low' | 'medium' | 'high';
export type EventStatus = 'pending' | 'completed' | 'skipped';

export interface UserSummary {
  _id: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  nickname?: string;
  preferredCurrency: string;
  timezone: string;
  themePreference: 'light' | 'dark' | 'system';
  childMode?: boolean;
  securityQuestion?: string;
  createdAt: string;
}

export interface FamilySummary {
  _id: string;
  name: string;
  description?: string;
  avatar: string;
  createdBy: string;
  defaultCurrency: string;
  timezone: string;
  monthlyBudget: number; // in minor units
  createdAt: string;
}

export interface FamilyMembershipSummary {
  _id: string;
  familyId: string;
  userId: string;
  role: MemberRole;
  user?: UserSummary;
  joinedAt: string;
}

export interface ExpenseCategorySummary {
  _id: string;
  familyId?: string;
  ownerId?: string;
  name: string;
  icon: string;
  color: string;
  description?: string;
  isDefault: boolean;
  scope: 'family' | 'private';
  isArchived?: boolean;
}

export interface ExpenseSummary {
  _id: string;
  familyId: string;
  title: string;
  amountMinor: number;
  currency: string;
  categoryId: string;
  category?: ExpenseCategorySummary;
  paidByUserId: string;
  paidByUser?: UserSummary;
  createdByUserId: string;
  expenseDate: string;
  paymentMethod: string;
  merchant?: string;
  description?: string;
  receiptUrl?: string;
  tags?: string[];
  isRecurring?: boolean;
  recurrenceRule?: string;
  createdAt: string;
}

export type TransactionType =
  | 'Expense'
  | 'Income'
  | 'Transfer'
  | 'Investment'
  | 'Loan Disbursement'
  | 'Refund'
  | 'Reimbursement';

export type IncomeCategory =
  | 'Salary'
  | 'Bonus & Incentives'
  | 'Freelance & Business Income'
  | 'Rental Income'
  | 'Interest & Dividends'
  | 'Investment Returns'
  | 'Expense Reimbursement'
  | 'Refunds & Cashback'
  | 'Gifts Received'
  | 'Pension & Benefits'
  | 'Tax Refund'
  | 'Other Income';

export interface IncomeSummary {
  _id: string;
  familyId: string;
  userId: string;
  user?: UserSummary;
  title: string;
  amountMinor: number;
  currency: string;
  source: string; // from where money came (Employer, Client, etc.)
  category: string;
  receivedDate: string;
  paymentMethod: string;
  description?: string;
  isRecurring?: boolean;
  recurrenceRule?: string;
  createdAt: string;
}

export interface CashflowLedgerItem {
  id: string;
  type: 'credit' | 'debit';
  title: string;
  amountMinor: number;
  currency: string;
  date: string;
  sourceOrDestination: string; // e.g. "From: Google" or "At: Amazon"
  category: string;
  paymentMethod: string;
  member?: UserSummary;
}

export interface MonthlyCashflowSummary {
  month: string;
  monthName: string;
  totalCreditsMinor: number;
  totalDebitsMinor: number;
  netSavingsMinor: number;
  savingsRatePercent: number;
  creditsCount: number;
  debitsCount: number;
  ledger: CashflowLedgerItem[];
  topIncomeSources: { source: string; amountMinor: number }[];
  topExpenseDestinations: { destination: string; amountMinor: number }[];
}

export interface BudgetSummary {
  _id: string;
  familyId: string;
  categoryId?: string;
  category?: ExpenseCategorySummary;
  period: string; // 'monthly'
  amountMinor: number;
  currency: string;
  alertThresholds: number[]; // e.g. [50, 75, 90, 100]
}

export interface RepaymentSummary {
  _id: string;
  transactionId: string;
  ownerId: string;
  amountMinor: number;
  currency: string;
  paidAt: string;
  notes?: string;
  createdAt: string;
}

export interface MoneyTransactionSummary {
  _id: string;
  ownerId: string;
  type: MoneyTransactionType;
  personName: string;
  contactReference?: string;
  principalMinor: number;
  remainingMinor: number;
  totalRepaidMinor: number;
  currency: string;
  transactionDate: string;
  dueDate?: string;
  notes?: string;
  status: TransactionStatus;
  repayments?: RepaymentSummary[];
  reminderDate?: string;
  reminderFrequency?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentReminderSummary {
  _id: string;
  ownerId: string;
  familyId?: string;
  visibility: 'private' | 'family';
  title: string;
  description?: string;
  amountMinor: number;
  currency: string;
  dueAt: string;
  timezone: string;
  recurrenceRule?: string; // 'none' | 'monthly' | 'weekly' | 'yearly'
  categoryId?: string;
  category?: ExpenseCategorySummary;
  status: ReminderStatus;
  paidExpenseId?: string;
  createdAt: string;
}

export interface ScheduleCategorySummary {
  _id: string;
  ownerId?: string;
  name: string;
  color: string;
  icon: string;
  isDefault: boolean;
}

export interface ScheduleEventSummary {
  _id: string;
  ownerId: string;
  title: string;
  description?: string;
  categoryId?: string;
  category?: ScheduleCategorySummary;
  startAt: string;
  endAt?: string;
  isAllDay: boolean;
  recurrenceRule?: string;
  reminderMinutesBefore?: number;
  priority: EventPriority;
  status: EventStatus;
  createdAt: string;
}

export interface NoteSummary {
  _id: string;
  ownerId: string;
  title: string;
  content: string;
  tags: string[];
  color: string;
  icon?: string;
  isPinned: boolean;
  isArchived: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AudioTrackSummary {
  id: string;
  title: string;
  category: string;
  description: string;
  soundType: string;
  icon: string;
  gradient: string;
  durationSeconds: number;
  isFavorite?: boolean;
  audioUrl?: string;
  artistName?: string;
  albumImage?: string;
  source?: 'jamendo' | 'generator';
  jamendoId?: string;
  licenseUrl?: string;
}

export interface SavedAudioMix {
  id: string;
  name: string;
  tracks: {
    id: string;
    soundType: string;
    volume: number; // 0 to 100
  }[];
  createdAt: string;
}

export interface NotificationSummary {
  _id: string;
  recipientId: string;
  type: 'reminder' | 'budget_alert' | 'repayment' | 'invitation' | 'system' | 'stock_alert' | 'health_alert';
  title: string;
  body: string;
  targetType?: string;
  targetId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface DashboardSummaryResponse {
  greeting: string;
  totalMonthlyExpenseMinor: number;
  totalMonthlyIncomeMinor?: number;
  netMonthlySavingsMinor?: number;
  netSavingsMinor?: number;
  familyMonthlyBudgetMinor: number;
  budgetRemainingMinor: number;
  budgetUsagePercentage: number;
  pendingPaymentsMinor: number;
  moneyToReceiveMinor: number;
  moneyToPayMinor: number;
  myMonthlyContributionMinor: number;
  myMonthlyContributionPercentage: number;
  upcomingRemindersCount: number;
  activeFamily: FamilySummary | null;
  recentExpenses: ExpenseSummary[];
  upcomingReminders: PaymentReminderSummary[];
  todaySchedule: ScheduleEventSummary[];
  quickNotes: NoteSummary[];
}

export interface AnalyticsSummaryResponse {
  totalExpenseMinor: number;
  budgetMinor: number;
  categoryBreakdown: {
    categoryId: string;
    name: string;
    icon: string;
    color: string;
    amountMinor: number;
    percentage: number;
  }[];
  monthlyTrend: {
    month: string;
    amountMinor: number;
  }[];
  memberContributions: {
    userId: string;
    name: string;
    avatarUrl?: string;
    amountMinor: number;
    percentage: number;
  }[];
  budgetVsActual: {
    categoryName: string;
    budgetMinor: number;
    actualMinor: number;
    percentage: number;
    status: 'under' | 'approaching' | 'exceeded';
  }[];
  insights: string[];
}

/**
 * Money Minor Unit Conversion Helpers:
 * Converts float or decimal amounts to integer minor units safely
 * e.g., 2450.50 INR -> 245050 paise
 */
export function toMinorUnits(amount: number | string, minorUnitFactor: number = 100): number {
  const numeric = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numeric)) return 0;
  return Math.round(numeric * minorUnitFactor);
}

export function fromMinorUnits(minorUnits: number, minorUnitFactor: number = 100): number {
  if (isNaN(minorUnits)) return 0;
  return minorUnits / minorUnitFactor;
}

export function formatCurrencyAmount(
  minorUnits: number,
  currencyCode: string = 'INR',
  locale: string = 'en-IN'
): string {
  const factor = currencyCode === 'JPY' ? 1 : 100;
  const major = fromMinorUnits(minorUnits, factor);
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: currencyCode === 'JPY' ? 0 : 2,
      maximumFractionDigits: currencyCode === 'JPY' ? 0 : 2
    }).format(major);
  } catch {
    return `${currencyCode} ${major.toFixed(2)}`;
  }
}

// ================= HEALTH & VITALS TYPES ================= //

export type HealthRecordType =
  | 'sleep'
  | 'period'
  | 'fever'
  | 'steps'
  | 'water'
  | 'blood_pressure'
  | 'weight'
  | 'calories';

export interface CaloriesRecordData {
  targetKcal: number;
  consumedKcal: number;
  burnedKcal: number;
  macros: {
    proteinG: number;
    carbsG: number;
    fatG: number;
    fiberG: number;
  };
  loggedItems: {
    id: string;
    foodName: string;
    portion: string;
    caloriesKcal: number;
    carbsG: number;
    proteinG: number;
    fatG: number;
    time: string;
  }[];
}

export interface SleepStageSegment {
  stage: 'deep' | 'light' | 'rem' | 'awake';
  startTime: string; // e.g. "23:00"
  endTime: string; // e.g. "23:45"
  durationMinutes: number;
  label?: string;
}

export interface SleepRecordData {
  durationMinutes: number; // e.g. 465 (7h 45m)
  bedtime: string; // "23:00"
  wakeTime: string; // "06:45"
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  deepSleepMinutes?: number;
  remSleepMinutes?: number;
  lightSleepMinutes?: number;
  awakeMinutes?: number;
  sleepEfficiency?: number; // % (e.g. 93)
  cyclesCount?: number; // e.g. 5
  awakeningsCount?: number; // e.g. 2
  stagesTimeline?: SleepStageSegment[];
  sleepScore?: number; // 0-100
  notes?: string;
}

export interface PeriodRecordData {
  cycleStartDate: string;
  cycleLengthDays: number; // default 28
  periodDurationDays: number; // default 5
  flowIntensity: 'light' | 'medium' | 'heavy' | 'spotting';
  symptoms: string[]; // ['cramps', 'headache', 'bloating', 'fatigue', 'mood_swings']
  mood: 'calm' | 'sensitive' | 'irritable' | 'energetic' | 'tired';
  notes?: string;
}

export interface FeverRecordData {
  temperature: number; // e.g. 38.2
  unit: 'C' | 'F';
  severity: 'normal' | 'low_grade' | 'moderate' | 'high';
  symptoms: string[]; // ['chills', 'headache', 'sweating', 'body_ache', 'cough']
  medicationGiven?: string; // e.g. "Paracetamol 500mg"
  measuredSite?: 'oral' | 'axillary' | 'ear' | 'forehead';
  notes?: string;
}

export interface StepsRecordData {
  stepsCount: number;
  goalSteps: number; // default 10000
  distanceMeters: number; // e.g. 7200
  caloriesBurned: number; // e.g. 380
  activeMinutes: number;
}

export interface WaterRecordData {
  amountMl: number;
  goalMl: number; // default 2500
}

export interface BloodPressureRecordData {
  systolic: number; // mmHg e.g. 120
  diastolic: number; // mmHg e.g. 80
  pulseBpm: number; // bpm e.g. 72
  category: 'normal' | 'elevated' | 'stage1' | 'stage2' | 'crisis';
  notes?: string;
}

export interface WeightRecordData {
  weightKg: number;
  heightCm?: number;
  bmi?: number;
  bmiCategory?: 'underweight' | 'normal' | 'overweight' | 'obese';
  notes?: string;
}

export interface HealthRecordSummary {
  _id: string;
  familyId: string;
  userId: string;
  user?: UserSummary;
  type: HealthRecordType;
  date: string;
  data:
    | SleepRecordData
    | PeriodRecordData
    | FeverRecordData
    | StepsRecordData
    | WaterRecordData
    | BloodPressureRecordData
    | WeightRecordData
    | any;
  notes?: string;
  createdAt: string;
}

// ================= MEDICATION TYPES ================= //

export type MedicationTimeSlot = 'morning' | 'afternoon' | 'evening' | 'night';

export interface MedicationScheduleItem {
  timeSlot: MedicationTimeSlot;
  timeLabel: string; // e.g. "08:00 AM"
  dosage: string; // e.g. "1 Tablet", "5ml"
  withFood: 'before' | 'with' | 'after' | 'any';
}

export interface MedicationTakenLog {
  date: string; // YYYY-MM-DD
  timeSlot: MedicationTimeSlot;
  taken: boolean;
  takenAt?: string;
}

export type MedicationFrequencyType = 'daily' | 'weekly' | 'monthly' | 'as_needed';

export interface MedicationSummary {
  _id: string;
  familyId: string;
  userId: string;
  user?: UserSummary;
  name: string; // e.g. "Amoxicillin", "Vitamin D3", "Metformin"
  dosage: string; // e.g. "500 mg"
  form: 'tablet' | 'capsule' | 'syrup' | 'injection' | 'drops' | 'cream' | 'inhaler';
  purpose?: string; // e.g. "Infection", "Daily Supplement", "Blood Sugar"
  frequencyType?: MedicationFrequencyType; // 'daily' | 'weekly' | 'monthly' | 'as_needed'
  daysOfWeek?: number[]; // [0 = Sun, 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri, 6 = Sat]
  dayOfMonth?: number; // 1 to 31
  schedules: MedicationScheduleItem[];
  frequencyDescription: string; // e.g. "Weekly on Sundays", "Monthly on 1st", "Twice daily"
  startDate: string;
  endDate?: string;
  totalPills: number;
  pillsRemaining: number;
  lowStockThreshold?: number; // Alert when pillsRemaining <= lowStockThreshold (default 5)
  refillAlertDays: number;
  prescribingDoctor?: string;
  pharmacyName?: string;
  instructions?: string;
  isActive: boolean;
  takenLogs: MedicationTakenLog[];
  createdAt: string;
}

// ================= HOUSEHOLD & PANTRY STOCK MANAGEMENT ================= //

export type HouseholdItemCategory = 'pantry' | 'kitchen' | 'toiletries' | 'cleaning' | 'baby' | 'medical' | 'other';

export interface HouseholdItemSummary {
  _id: string;
  familyId: string;
  name: string; // e.g. "Basmati Rice", "Olive Oil", "Dish Soap", "Bandages"
  category: HouseholdItemCategory;
  quantity: number;
  unit: string; // e.g. "kg", "g", "litres", "packs", "bottles", "boxes", "pieces", "rolls"
  minThreshold: number; // Low stock alert triggered when quantity <= minThreshold
  location?: string; // e.g. "Main Kitchen Pantry", "Bathroom Cabinet", "Store Room"
  expiryDate?: string; // YYYY-MM-DD
  notes?: string;
  isLowStock?: boolean;
  lastRestockedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ================= BILL & RECEIPT DOCUMENT TYPES ================= //

export type BillCategory = 'medicine' | 'grocery' | 'diagnostic' | 'other';
export type BillFileFormat = 'pdf' | 'image' | 'word' | 'excel';

export interface BillDocumentSummary {
  _id: string;
  familyId: string;
  userId: string;
  user?: UserSummary;
  billCategory: BillCategory;
  storeName: string; // e.g. "Apollo Pharmacy" or "Nature's Basket"
  billDate: string;
  amountMinor: number;
  currency: string;
  invoiceNumber?: string;
  paymentMethod: string;
  fileName: string;
  fileFormat: BillFileFormat;
  mimeType: string;
  fileUrl?: string; // Data URL or storage path
  fileSizeBytes: number;
  notes?: string;
  expenseId?: string; // Associated expense in CozyNest
  expenseLinked?: boolean;
  parsedItems?: { name: string; quantity?: number; priceMinor?: number }[];
  createdAt: string;
}

// ================= EXERCISE CATALOG TYPES ================= //

export interface ExerciseItem {
  id: string;
  name: string;
  category: 'cardio' | 'strength' | 'core' | 'yoga' | 'warmup';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  targetMuscles: string[];
  caloriesBurnPerMin: number;
  instructions: string[];
  formTips: string[];
  defaultDurationSeconds: number;
  defaultReps: number;
  animationKey:
    | 'jumping_jacks'
    | 'squats'
    | 'pushups'
    | 'plank'
    | 'lunges'
    | 'high_knees'
    | 'cobra'
    | 'downward_dog'
    | 'child_pose';
}

// ================= GLOBAL FOOD & NUTRITION DATABASE TYPES ================= //

export interface FoodItemSummary {
  id: string;
  name: string;
  cuisine: string; // e.g. "Indian", "Italian", "Japanese", "Mediterranean", "Mexican", "American", "Middle Eastern"
  category: 'Breakfast' | 'Main Dish' | 'Snack & Appetizer' | 'Salad & Soup' | 'Beverage' | 'Superfood';
  servingSize: string; // e.g. "1 bowl (250g)" or "1 piece"
  servingWeightGrams: number;
  caloriesKcal: number;
  macronutrients: {
    proteinG: number;
    carbsG: number;
    fatG: number;
    fiberG: number;
    sugarG: number;
  };
  minerals: {
    calciumMg: number;
    ironMg: number;
    potassiumMg: number;
    magnesiumMg: number;
    sodiumMg: number;
    zincMg: number;
  };
  vitamins: {
    vitaminC_mg?: number;
    vitaminA_IU?: number;
    vitaminD_IU?: number;
    vitaminB12_mcg?: number;
  };
  glycemicIndex: 'Low' | 'Medium' | 'High';
  healthHighlights: string[];
}

// ================= RECIPE SCALER TYPES ================= //

export interface RecipeIngredient {
  name: string;
  baseQuantity: number;
  unit: string;
  notes?: string;
}

export interface RecipeItemSummary {
  id: string;
  title: string;
  cuisine: string;
  dietaryType: 'Vegetarian' | 'Vegan' | 'High-Protein' | 'Keto-Friendly' | 'Gluten-Free' | 'Heart-Healthy';
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  baseServings: number; // default 2
  difficulty: 'Easy' | 'Medium' | 'Master';
  ingredients: RecipeIngredient[];
  nutritionPerServing: {
    caloriesKcal: number;
    carbsG: number;
    proteinG: number;
    fatG: number;
    fiberG: number;
    ironMg: number;
    calciumMg: number;
    potassiumMg: number;
    magnesiumMg: number;
    sodiumMg: number;
  };
  instructions: string[];
  chefTips: string[];
  healthHighlights: string[];
}

// ================= WATER ALERT FUNCTIONALITY ================= //

export interface WaterAlertSettings {
  enabled: boolean;
  intervalMinutes: number; // e.g. 45 or 60
  soundEnabled: boolean;
  startHour: number; // default 8 (8 AM)
  endHour: number; // default 22 (10 PM)
}

// ================= THEMEALDB RECIPES ================= //

export interface TheMealDbIngredient {
  name: string;
  measure: string;
  amount: number;
  unit: string;
}

export interface TheMealDbRecipe {
  id: string;
  mealId: string;
  name: string;
  category: string;
  cuisine: string; // e.g. "Italian", "Mexican", "Indian"
  instructions: string[];
  thumbnailUrl: string;
  tags: string[];
  youtubeUrl?: string;
  sourceUrl?: string;
  baseServings: number;
  ingredients: TheMealDbIngredient[];
  nutritionPerServing: {
    caloriesKcal: number;
    carbsG: number;
    proteinG: number;
    fatG: number;
    fiberG: number;
    ironMg: number;
    calciumMg: number;
    potassiumMg: number;
    magnesiumMg: number;
    sodiumMg: number;
  };
}

// ================= OPEN FOOD FACTS & USDA PACKAGED NUTRITION ================= //

export interface OpenFoodFactsProduct {
  code: string; // Barcode
  name: string;
  brands: string;
  categories: string;
  imageUrl?: string;
  nutriscoreGrade?: 'a' | 'b' | 'c' | 'd' | 'e';
  novaGroup?: 1 | 2 | 3 | 4;
  ecoscoreGrade?: string;
  servingSize: string;
  servingWeightGrams: number;
  caloriesKcal: number;
  macronutrients: {
    proteinG: number;
    carbsG: number;
    sugarsG: number;
    fatG: number;
    saturatedFatG: number;
    fiberG: number;
    saltG: number;
  };
  minerals: {
    sodiumMg: number;
    calciumMg: number;
    ironMg: number;
    potassiumMg: number;
    magnesiumMg?: number;
  };
  source: 'open_food_facts' | 'usda_foundation' | 'custom_db';
}

// ================= WGER WORKOUT PLANS & EXERCISES ================= //

export interface WgerExerciseRoutineItem {
  exerciseId: string;
  name: string;
  sets: number;
  repsOrSeconds: string;
  restSeconds: number;
  equipment: string;
  targetMuscles: string[];
  notes?: string;
}

export interface WgerWorkoutDay {
  dayNumber: number;
  dayName: string;
  focus: string;
  targetMuscles: string[];
  exercises: WgerExerciseRoutineItem[];
}

export interface WgerWorkoutPlan {
  id: string;
  title: string;
  goal: 'Hypertrophy & Strength' | 'Fat Loss & HIIT' | 'Core & Posture' | 'Endurance & Mobility' | 'Beginner Full Body';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  durationWeeks: number;
  daysPerWeek: number;
  description: string;
  days: WgerWorkoutDay[];
}

// ================= GUIDED MEDITATION & BREATHWORK ================= //

export interface GuidedMeditationItem {
  id: string;
  title: string;
  category: 'breathwork' | 'body_scan' | 'sleep_nidra' | 'morning_energy' | 'stress_relief';
  durationMinutes: number;
  technique: string;
  description: string;
  guidanceScript: string[];
  breathingPattern?: {
    inhaleSec: number;
    holdSec: number;
    exhaleSec: number;
    holdAfterExhaleSec: number;
  };
  ambientTrackTitle?: string;
}

// ================= PROJECT GUTENBERG BEDTIME STORIES ================= //

export interface GutenbergStoryChapter {
  chapterNumber: number;
  title: string;
  paragraphs: string[];
}

export interface GutenbergBookItem {
  id: string;
  title: string;
  author: string;
  year: number;
  coverEmoji: string;
  coverGradient: string;
  coverImageUrl?: string;
  gutenbergId?: number;
  source?: string;
  description: string;
  genre: string;
  readingTimeMinutes: number;
  gutenbergUrl: string;
  chapters: GutenbergStoryChapter[];
}

export interface ReadingProgressItem {
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  coverImageUrl?: string;
  coverGradient?: string;
  coverEmoji?: string;
  chapterIndex: number;
  chapterTitle: string;
  pageNumber: number;
  totalChapterPages: number;
  totalBookChapters: number;
  percentCompleted: number;
  lastReadAt: string;
}



