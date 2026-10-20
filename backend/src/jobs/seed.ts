import bcrypt from 'bcryptjs';
import { connectDatabase, disconnectDatabase } from '../config/db.js';
import { User } from '../models/User.js';
import { Family } from '../models/Family.js';
import { FamilyMembership } from '../models/FamilyMembership.js';
import { ExpenseCategory } from '../models/ExpenseCategory.js';
import { Expense } from '../models/Expense.js';
import { ScheduleCategory } from '../models/ScheduleCategory.js';
import { ScheduleEvent } from '../models/ScheduleEvent.js';
import { Note } from '../models/Note.js';
import { PaymentReminder } from '../models/PaymentReminder.js';
import { MoneyTransaction } from '../models/MoneyTransaction.js';
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_SCHEDULE_CATEGORIES } from '../shared/index.js';

export async function seedDatabase(): Promise<void> {
  console.log('🌱 Starting CozyNest idempotent database seed...');
  await connectDatabase();

  // 1. Seed Global Default Expense Categories
  for (const cat of DEFAULT_EXPENSE_CATEGORIES) {
    const exists = await ExpenseCategory.findOne({ name: cat.name, isDefault: true });
    if (!exists) {
      await ExpenseCategory.create({
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        description: cat.description,
        isDefault: true,
        scope: 'family',
        isArchived: false
      });
    }
  }
  console.log('✅ Global default expense categories verified.');

  // 2. Seed Demo User & Demo Family for testing
  const demoEmail = 'demo@cozynest.app';
  let demoUser = await User.findOne({ email: demoEmail });
  if (!demoUser) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('cozy123456', salt);
    demoUser = await User.create({
      fullName: 'Shrey Sharma',
      email: demoEmail,
      passwordHash,
      nickname: 'Shrey',
      avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=Shrey',
      preferredCurrency: 'INR',
      timezone: 'Asia/Kolkata',
      themePreference: 'light'
    });
    console.log('✅ Demo user created: demo@cozynest.app / cozy123456');

    // Seed private schedule categories for demo user
    for (const cat of DEFAULT_SCHEDULE_CATEGORIES) {
      await ScheduleCategory.create({
        ownerId: demoUser._id,
        name: cat.name,
        color: cat.color,
        icon: cat.icon,
        description: cat.description,
        isDefault: true
      });
    }
  }

  // 3. Demo Family
  let demoFamily = await Family.findOne({ name: 'The Happy Home' });
  if (!demoFamily) {
    demoFamily = await Family.create({
      name: 'The Happy Home',
      avatar: '🏡',
      description: 'Our little nest of joy, laughter, and warm tea.',
      createdBy: demoUser._id,
      defaultCurrency: 'INR',
      timezone: 'Asia/Kolkata',
      monthlyBudget: 5000000 // ₹50,000.00
    });

    await FamilyMembership.create({
      familyId: demoFamily._id,
      userId: demoUser._id,
      role: 'admin',
      status: 'active'
    });

    // Seed family categories
    for (const cat of DEFAULT_EXPENSE_CATEGORIES) {
      await ExpenseCategory.create({
        familyId: demoFamily._id,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        description: cat.description,
        isDefault: true,
        scope: 'family',
        isArchived: false
      });
    }

    // Add some realistic sample expenses
    const groceriesCat = await ExpenseCategory.findOne({ familyId: demoFamily._id, name: 'Groceries & Household' });
    const diningCat = await ExpenseCategory.findOne({ familyId: demoFamily._id, name: 'Food & Dining' });
    const rentCat = await ExpenseCategory.findOne({ familyId: demoFamily._id, name: 'Rent & Housing' });
    const elecCat = await ExpenseCategory.findOne({ familyId: demoFamily._id, name: 'Utilities & Bills' });

    const now = new Date();

    if (groceriesCat) {
      await Expense.create({
        familyId: demoFamily._id,
        title: 'Weekly Organic Groceries & Fruits',
        amountMinor: 245000, // ₹2,450.00
        currency: 'INR',
        categoryId: groceriesCat._id,
        paidByUserId: demoUser._id,
        createdByUserId: demoUser._id,
        expenseDate: now,
        paymentMethod: 'UPI',
        merchant: 'Nature Basket'
      });
    }

    if (diningCat) {
      await Expense.create({
        familyId: demoFamily._id,
        title: 'Sunday Family Brunch & Coffee',
        amountMinor: 185000, // ₹1,850.00
        currency: 'INR',
        categoryId: diningCat._id,
        paidByUserId: demoUser._id,
        createdByUserId: demoUser._id,
        expenseDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        paymentMethod: 'Card',
        merchant: 'Blue Tokai Cafe'
      });
    }

    if (rentCat) {
      await Expense.create({
        familyId: demoFamily._id,
        title: 'October Apartment Rent',
        amountMinor: 2200000, // ₹22,000.00
        currency: 'INR',
        categoryId: rentCat._id,
        paidByUserId: demoUser._id,
        createdByUserId: demoUser._id,
        expenseDate: new Date(now.getFullYear(), now.getMonth(), 3),
        paymentMethod: 'Net Banking',
        merchant: 'Landlord Transfer'
      });
    }

    if (elecCat) {
      await Expense.create({
        familyId: demoFamily._id,
        title: 'Electricity & Power Utility Bill',
        amountMinor: 142000, // ₹1,420.00
        currency: 'INR',
        categoryId: elecCat._id,
        paidByUserId: demoUser._id,
        createdByUserId: demoUser._id,
        expenseDate: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
        paymentMethod: 'UPI',
        merchant: 'Tata Power'
      });
    }

    // Add sample notes for demo user
    await Note.create({
      ownerId: demoUser._id,
      title: 'Our Cozy Weekend Family Ideas 🌿',
      content:
        '1. Saturday morning bicycle ride around the lake\n2. Try making homemade sourdough cinnamon rolls\n3. Movie night: Spirited Away with hot cocoa\n4. Plant new marigold saplings on the balcony',
      tags: ['Family', 'Weekend', 'Joy'],
      color: '#FEF3C7',
      icon: '🌻',
      isPinned: true
    });

    await Note.create({
      ownerId: demoUser._id,
      title: 'Quiet Evening Reflections 🌙',
      content:
        'Grateful for warm tea, quiet moments before sleep, and seeing the kids laugh together today.',
      tags: ['Gratitude', 'Journal'],
      color: '#F0EAFF',
      icon: '🌷',
      isPinned: false
    });

    // Add sample schedule events for today
    const studyCat = await ScheduleCategory.findOne({ ownerId: demoUser._id, name: 'Study' });
    const exerciseCat = await ScheduleCategory.findOne({ ownerId: demoUser._id, name: 'Exercise' });
    const medCat = await ScheduleCategory.findOne({ ownerId: demoUser._id, name: 'Meditation' });

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    await ScheduleEvent.create({
      ownerId: demoUser._id,
      title: 'Morning Mindfulness & Breathwork',
      description: '15 minutes of deep breathing and calm gratitude',
      categoryId: medCat?._id,
      startAt: new Date(startOfToday.getTime() + 7 * 60 * 60 * 1000),
      endAt: new Date(startOfToday.getTime() + 7.5 * 60 * 60 * 1000),
      isAllDay: false,
      priority: 'medium',
      status: 'completed'
    });

    await ScheduleEvent.create({
      ownerId: demoUser._id,
      title: 'Evening Sunset Walk with Dad',
      description: 'Brisk walk in the neighborhood park',
      categoryId: exerciseCat?._id,
      startAt: new Date(startOfToday.getTime() + 18 * 60 * 60 * 1000),
      endAt: new Date(startOfToday.getTime() + 19 * 60 * 60 * 1000),
      isAllDay: false,
      priority: 'high',
      status: 'pending'
    });

    // Sample payment reminders
    await PaymentReminder.create({
      ownerId: demoUser._id,
      familyId: demoFamily._id,
      visibility: 'family',
      title: 'Fiber Internet Broadband Bill',
      description: 'Airtel Xstream 200 Mbps connection',
      amountMinor: 99900, // ₹999.00
      currency: 'INR',
      dueAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      recurrenceRule: 'monthly',
      status: 'pending'
    });

    // Sample money tracker record
    await MoneyTransaction.create({
      ownerId: demoUser._id,
      type: 'lent',
      personName: 'Rahul Verma',
      contactReference: '+91 98765 43210',
      principalMinor: 500000, // ₹5,000.00
      remainingMinor: 500000,
      totalRepaidMinor: 0,
      currency: 'INR',
      transactionDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      dueDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
      notes: 'Lent for urgent medical clinic prescription.',
      status: 'active'
    });

    console.log('✅ Demo family and sample lifestyle data seeded.');
  }

  console.log('✨ Seed complete!');
}

// Run if called directly
if (process.argv[1] && process.argv[1].endsWith('seed.ts')) {
  seedDatabase()
    .then(() => disconnectDatabase())
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Seed error:', err);
      process.exit(1);
    });
}
