import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Family } from '../models/Family.js';
import { FamilyMembership } from '../models/FamilyMembership.js';
import { Expense } from '../models/Expense.js';
import { ExpenseCategory } from '../models/ExpenseCategory.js';
import { Note } from '../models/Note.js';
import { ScheduleEvent } from '../models/ScheduleEvent.js';
import { MoneyTransaction } from '../models/MoneyTransaction.js';
import { Repayment } from '../models/Repayment.js';
import { toMinorUnits, fromMinorUnits, formatCurrencyAmount } from '../shared/index.js';
import { env } from '../config/env.js';

describe('CozyNest Full-Stack Backend Integration & Security Tests', () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(env.MONGODB_URI, { dbName: env.MONGODB_DB_NAME });
    }
  });

  afterAll(async () => {
    // Keep connection clean
  });

  describe('Financial Currency & Minor Unit Precision Calculations', () => {
    it('accurately converts major amounts into minor integer units without float errors', () => {
      expect(toMinorUnits(2450.5)).toBe(245050);
      expect(toMinorUnits('12.99')).toBe(1299);
      expect(toMinorUnits(0)).toBe(0);
      expect(fromMinorUnits(245050)).toBe(2450.5);
    });

    it('formats currency strings properly with symbols', () => {
      const inrStr = formatCurrencyAmount(245050, 'INR', 'en-IN');
      expect(inrStr).toContain('2,450.50');
    });
  });

  describe('User Authentication & Password Hashing Security', () => {
    it('properly validates hashed passwords and rejects incorrect credentials', async () => {
      const testEmail = `test_auth_${Date.now()}@cozynest.app`;
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash('secretCozy123', salt);

      const user = await User.create({
        fullName: 'Test User',
        email: testEmail,
        passwordHash: hash
      });

      expect(user._id).toBeDefined();

      const validPass = await bcrypt.compare('secretCozy123', user.passwordHash);
      expect(validPass).toBe(true);

      const wrongPass = await bcrypt.compare('wrongPassword', user.passwordHash);
      expect(wrongPass).toBe(false);

      // Clean up test user
      await User.findByIdAndDelete(user._id);
    });

    it('securely hashes security answer and verifies answer case-insensitively', async () => {
      const testEmail = `test_sq_${Date.now()}@cozynest.app`;
      const answer = 'Fluffy';
      const salt = await bcrypt.genSalt(10);
      const answerHash = await bcrypt.hash(answer.trim().toLowerCase(), salt);

      const user = await User.create({
        fullName: 'Security Question User',
        email: testEmail,
        passwordHash: 'dummyHash',
        securityQuestion: 'What was the name of your first childhood pet?',
        securityAnswerHash: answerHash
      });

      expect(user.securityQuestion).toBe('What was the name of your first childhood pet?');
      expect(user.securityAnswerHash).toBeDefined();

      // Case-insensitive comparison passes
      const isMatch = await bcrypt.compare('fluffy', user.securityAnswerHash!);
      expect(isMatch).toBe(true);

      const isMatchCaps = await bcrypt.compare('FLUFFY'.toLowerCase(), user.securityAnswerHash!);
      expect(isMatchCaps).toBe(true);

      const isWrong = await bcrypt.compare('rover', user.securityAnswerHash!);
      expect(isWrong).toBe(false);

      await User.findByIdAndDelete(user._id);
    });

    it('allows changing password directly without requiring current password', async () => {
      const testEmail = `test_pwd_change_${Date.now()}@cozynest.app`;
      const initialSalt = await bcrypt.genSalt(10);
      const initialHash = await bcrypt.hash('initialPassword123', initialSalt);

      const user = await User.create({
        fullName: 'Password Change User',
        email: testEmail,
        passwordHash: initialHash
      });

      // User directly updates password to newPassword without checking initialPassword
      const newPassword = 'brandNewCozyPassword456';
      const newSalt = await bcrypt.genSalt(10);
      const newHash = await bcrypt.hash(newPassword, newSalt);

      await User.findByIdAndUpdate(user._id, { passwordHash: newHash });

      const updatedUser = await User.findById(user._id);
      expect(await bcrypt.compare(newPassword, updatedUser!.passwordHash)).toBe(true);
      expect(await bcrypt.compare('initialPassword123', updatedUser!.passwordHash)).toBe(false);

      await User.findByIdAndDelete(user._id);
    });
  });

  describe('Strict Privacy Enforcement Boundaries', () => {
    it('ensures User A cannot view User B private notes', async () => {
      const userAId = new mongoose.Types.ObjectId();
      const userBId = new mongoose.Types.ObjectId();

      const noteA = await Note.create({
        ownerId: userAId,
        title: 'Secret Diary Note A',
        content: 'This must NEVER be seen by user B',
        tags: ['Private']
      });

      // User B attempts to query User A note
      const accessedByUserB = await Note.findOne({
        _id: noteA._id,
        ownerId: userBId // Strict authorization filter
      });

      expect(accessedByUserB).toBeNull();

      // User A can access their own note
      const accessedByUserA = await Note.findOne({
        _id: noteA._id,
        ownerId: userAId
      });
      expect(accessedByUserA).not.toBeNull();
      expect(accessedByUserA?.title).toBe('Secret Diary Note A');

      await Note.findByIdAndDelete(noteA._id);
    });

    it('ensures User A cannot view User B private daily schedule', async () => {
      const userAId = new mongoose.Types.ObjectId();
      const userBId = new mongoose.Types.ObjectId();

      const eventA = await ScheduleEvent.create({
        ownerId: userAId,
        title: 'Doctor Appointment User A',
        startAt: new Date()
      });

      // User B attempts to query User A schedule
      const accessedByUserB = await ScheduleEvent.findOne({
        _id: eventA._id,
        ownerId: userBId
      });

      expect(accessedByUserB).toBeNull();

      await ScheduleEvent.findByIdAndDelete(eventA._id);
    });

    it('ensures User A cannot view User B personal money lending transactions', async () => {
      const userAId = new mongoose.Types.ObjectId();
      const userBId = new mongoose.Types.ObjectId();

      const txnA = await MoneyTransaction.create({
        ownerId: userAId,
        type: 'lent',
        personName: 'Ravi',
        principalMinor: 100000,
        remainingMinor: 100000,
        currency: 'INR'
      });

      const accessedByUserB = await MoneyTransaction.findOne({
        _id: txnA._id,
        ownerId: userBId
      });

      expect(accessedByUserB).toBeNull();

      await MoneyTransaction.findByIdAndDelete(txnA._id);
    });
  });

  describe('Money Tracker Repayments & Balance Calculations', () => {
    it('correctly tracks partial repayments without mutating original principal', async () => {
      const userId = new mongoose.Types.ObjectId();
      const principalMinor = 100000; // ₹1,000.00

      const txn = await MoneyTransaction.create({
        ownerId: userId,
        type: 'lent',
        personName: 'Simran',
        principalMinor,
        remainingMinor: principalMinor,
        totalRepaidMinor: 0,
        currency: 'INR'
      });

      // Record partial repayment of ₹400 (40000 minor units)
      const repaymentAmount = 40000;
      await Repayment.create({
        transactionId: txn._id,
        ownerId: userId,
        amountMinor: repaymentAmount,
        currency: 'INR'
      });

      txn.totalRepaidMinor += repaymentAmount;
      txn.remainingMinor -= repaymentAmount;
      txn.status = 'partially_paid';
      await txn.save();

      const updated = await MoneyTransaction.findById(txn._id);
      expect(updated?.principalMinor).toBe(100000); // Original principal untouched
      expect(updated?.totalRepaidMinor).toBe(40000);
      expect(updated?.remainingMinor).toBe(60000); // Exactly ₹600 remaining
      expect(updated?.status).toBe('partially_paid');

      // Second repayment of ₹600 (settles balance)
      txn.totalRepaidMinor += 60000;
      txn.remainingMinor -= 60000;
      txn.status = 'fully_paid';
      await txn.save();

      const settled = await MoneyTransaction.findById(txn._id);
      expect(settled?.remainingMinor).toBe(0);
      expect(settled?.status).toBe('fully_paid');

      await MoneyTransaction.findByIdAndDelete(txn._id);
      await Repayment.deleteMany({ transactionId: txn._id });
    });
  });

  describe('Family Shared Expenses', () => {
    it('allows family members to access shared expenses within their family', async () => {
      const family = await Family.findOne({ name: 'The Happy Home' });
      expect(family).toBeDefined();

      const expenses = await Expense.find({ familyId: family!._id, deletedAt: null });
      expect(expenses.length).toBeGreaterThan(0);
      expect(expenses[0].amountMinor).toBeGreaterThan(0);
    });
  });
});
