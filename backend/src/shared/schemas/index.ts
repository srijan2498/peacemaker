import { z } from 'zod';

export const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address').toLowerCase().trim(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  nickname: z.string().optional(),
  avatarUrl: z.string().optional(),
  preferredCurrency: z.string().default('INR'),
  timezone: z.string().default('Asia/Kolkata'),
  securityQuestion: z.string().min(3, 'Please select or enter a security question'),
  securityAnswer: z.string().min(2, 'Security answer must be at least 2 characters')
});

export const changePasswordSchema = z.object({
  newPassword: z.string().min(6, 'New password must be at least 6 characters')
});

export const resetPasswordWithSecuritySchema = z.object({
  email: z.string().email('Please enter a valid email address').toLowerCase().trim(),
  securityAnswer: z.string().min(1, 'Security answer is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters')
});

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required')
});

export const updateProfileSchema = z.object({
  fullName: z.string().min(2).optional(),
  nickname: z.string().optional(),
  avatarUrl: z.string().optional(),
  preferredCurrency: z.string().optional(),
  timezone: z.string().optional(),
  themePreference: z.enum(['light', 'dark', 'system']).optional(),
  childMode: z.boolean().optional()
});

export const createFamilySchema = z.object({
  name: z.string().min(2, 'Family name must be at least 2 characters'),
  avatar: z.string().default('🏡'),
  description: z.string().optional(),
  defaultCurrency: z.string().default('INR'),
  timezone: z.string().default('Asia/Kolkata'),
  monthlyBudget: z.number().nonnegative().default(0) // in major units or minor units
});

export const updateFamilySchema = z.object({
  name: z.string().min(2).optional(),
  avatar: z.string().optional(),
  description: z.string().optional(),
  defaultCurrency: z.string().optional(),
  timezone: z.string().optional(),
  monthlyBudget: z.number().nonnegative().optional()
});

export const joinFamilySchema = z.object({
  inviteCode: z.string().min(4, 'Please enter a valid invitation code').trim()
});

export const inviteFamilySchema = z.object({
  maximumUses: z.number().int().positive().default(10),
  expiresInDays: z.number().int().positive().default(7)
});

export const createExpenseSchema = z.object({
  title: z.string().min(1, 'Expense title is required'),
  amount: z.number().positive('Amount must be greater than zero'), // in major units (e.g. 2450.50)
  currency: z.string().default('INR'),
  categoryId: z.string().min(1, 'Category is required'),
  paidByUserId: z.string().optional(), // defaults to current user
  expenseDate: z.string().default(() => new Date().toISOString()),
  paymentMethod: z.string().default('UPI'),
  merchant: z.string().optional(),
  description: z.string().optional(),
  receiptUrl: z.string().optional(),
  tags: z.array(z.string()).default([]),
  isRecurring: z.boolean().default(false),
  recurrenceRule: z.string().optional()
});

export const updateExpenseSchema = createExpenseSchema.partial();

export const createIncomeSchema = z.object({
  title: z.string().min(1, 'Title is required (e.g. October Salary)'),
  amount: z.number().positive('Amount must be greater than zero'),
  currency: z.string().default('INR'),
  source: z.string().min(1, 'Source / Employer is required (e.g. Company name, Client, Tenant)'),
  category: z.string().default('Salary'),
  receivedDate: z.string().default(() => new Date().toISOString()),
  paymentMethod: z.string().default('Bank Transfer'),
  description: z.string().optional(),
  isRecurring: z.boolean().default(false),
  recurrenceRule: z.string().optional()
});

export const updateIncomeSchema = createIncomeSchema.partial();

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  icon: z.string().min(1, 'Icon emoji is required').default('🏷️'),
  color: z.string().default('#A78BFA'),
  description: z.string().optional(),
  scope: z.enum(['family', 'private']).default('family')
});

export const createBudgetSchema = z.object({
  categoryId: z.string().optional(),
  period: z.string().default('monthly'),
  amount: z.number().positive('Budget amount must be positive'),
  currency: z.string().default('INR'),
  alertThresholds: z.array(z.number()).default([50, 75, 90, 100])
});

export const createMoneyTransactionSchema = z.object({
  type: z.enum(['lent', 'borrowed']),
  personName: z.string().min(1, 'Person name is required'),
  contactReference: z.string().optional(),
  principalAmount: z.number().positive('Amount must be positive'),
  currency: z.string().default('INR'),
  transactionDate: z.string().default(() => new Date().toISOString()),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
  reminderDate: z.string().optional(),
  reminderFrequency: z.string().default('once')
});

export const createRepaymentSchema = z.object({
  amount: z.number().positive('Repayment amount must be positive'),
  paidAt: z.string().default(() => new Date().toISOString()),
  notes: z.string().optional()
});

export const createReminderSchema = z.object({
  title: z.string().min(1, 'Reminder title is required'),
  description: z.string().optional(),
  amount: z.number().nonnegative().default(0),
  currency: z.string().default('INR'),
  dueAt: z.string().min(1, 'Due date is required'),
  timezone: z.string().default('Asia/Kolkata'),
  recurrenceRule: z.string().default('none'),
  categoryId: z.string().optional(),
  visibility: z.enum(['private', 'family']).default('private')
});

export const updateReminderSchema = createReminderSchema.partial();

export const createScheduleSchema = z.object({
  title: z.string().min(1, 'Activity title is required'),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  startAt: z.string().min(1, 'Start time is required'),
  endAt: z.string().optional(),
  isAllDay: z.boolean().default(false),
  recurrenceRule: z.string().default('none'),
  reminderMinutesBefore: z.number().int().nonnegative().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium')
});

export const updateScheduleSchema = createScheduleSchema.partial();

export const createNoteSchema = z.object({
  title: z.string().default('Untitled Note'),
  content: z.string().default(''),
  tags: z.array(z.string()).default([]),
  color: z.string().default('#FFFFFF'),
  icon: z.string().default('📝'),
  isPinned: z.boolean().default(false)
});

export const updateNoteSchema = createNoteSchema.partial();

export const saveMixSchema = z.object({
  name: z.string().min(1, 'Mix name is required'),
  tracks: z.array(
    z.object({
      id: z.string(),
      soundType: z.string(),
      volume: z.number().min(0).max(100)
    })
  )
});
