import { PaymentReminder } from '../models/PaymentReminder.js';
import { MoneyTransaction } from '../models/MoneyTransaction.js';
import { Notification } from '../models/Notification.js';

let intervalTimer: NodeJS.Timeout | null = null;

export async function checkAndDispatchReminders(): Promise<void> {
  try {
    const now = new Date();

    // 1. Check Due Payment Reminders
    const dueReminders = await PaymentReminder.find({
      status: 'pending',
      dueAt: { $lte: now }
    });

    for (const reminder of dueReminders) {
      // Check if notification already dispatched recently
      const existingNotif = await Notification.findOne({
        recipientId: reminder.ownerId,
        targetId: reminder.id,
        createdAt: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) }
      });

      if (!existingNotif) {
        await Notification.create({
          recipientId: reminder.ownerId,
          type: 'reminder',
          title: `Payment Reminder: ${reminder.title}`,
          body: `Reminder: Payment of ${(reminder.amountMinor / 100).toFixed(2)} ${reminder.currency} is due today.`,
          targetType: 'reminder',
          targetId: reminder.id
        });
      }
    }

    // 2. Check Due Money Tracker Reminders
    const dueTxns = await MoneyTransaction.find({
      status: { $in: ['active', 'partially_paid'] },
      reminderDate: { $lte: now },
      remainingMinor: { $gt: 0 }
    });

    for (const txn of dueTxns) {
      const existingNotif = await Notification.findOne({
        recipientId: txn.ownerId,
        targetId: txn.id,
        createdAt: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) }
      });

      if (!existingNotif) {
        const isLent = txn.type === 'lent';
        await Notification.create({
          recipientId: txn.ownerId,
          type: 'repayment',
          title: isLent ? `Collect from ${txn.personName}` : `Pay to ${txn.personName}`,
          body: isLent
            ? `Friendly reminder to collect ${(txn.remainingMinor / 100).toFixed(2)} ${txn.currency} from ${txn.personName}.`
            : `Friendly reminder to return ${(txn.remainingMinor / 100).toFixed(2)} ${txn.currency} to ${txn.personName}.`,
          targetType: 'money_transaction',
          targetId: txn.id
        });
      }
    }
  } catch (error) {
    console.error('Error during reminder background job execution:', error);
  }
}

export function startReminderScheduler(intervalMs: number = 60000): void {
  if (intervalTimer) return;
  console.log('⏰ CozyNest persistent reminder background worker started.');
  // Run once immediately
  checkAndDispatchReminders();
  intervalTimer = setInterval(checkAndDispatchReminders, intervalMs);
}

export function stopReminderScheduler(): void {
  if (intervalTimer) {
    clearInterval(intervalTimer);
    intervalTimer = null;
    console.log('Reminder worker stopped.');
  }
}
