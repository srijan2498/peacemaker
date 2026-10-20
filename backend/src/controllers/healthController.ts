import { Request, Response } from 'express';
import { HealthRecord } from '../models/HealthRecord.js';
import { FamilyMembership } from '../models/FamilyMembership.js';

// Verify user is part of family
async function verifyFamilyMember(familyId: string, userId: string): Promise<boolean> {
  const membership = await FamilyMembership.findOne({ familyId, userId });
  return !!membership;
}

export const getHealthRecords = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id || (req as any).user?.userId;
    const { familyId, type, startDate, endDate, memberId } = req.query;

    if (!familyId) {
      res.status(400).json({ success: false, message: 'familyId is required' });
      return;
    }

    const isMember = await verifyFamilyMember(familyId as string, userId);
    if (!isMember) {
      res.status(403).json({ success: false, message: 'Not authorized for this family' });
      return;
    }

    const query: any = { familyId };
    if (type) query.type = type;
    if (memberId) query.userId = memberId;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = startDate;
      if (endDate) query.date.$lte = endDate;
    }

    const records = await HealthRecord.find(query)
      .populate('userId', 'fullName nickname avatarUrl email')
      .sort({ date: -1, createdAt: -1 })
      .limit(100);

    res.status(200).json({ success: true, data: records });
  } catch (error: any) {
    console.error('Error fetching health records:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch health records', error: error.message });
  }
};

export const createOrUpdateHealthRecord = async (req: Request, res: Response): Promise<void> => {
  try {
    const currentUserId = (req as any).user?.id || (req as any).user?.userId;
    const { familyId, userId, type, date, data, notes } = req.body;

    if (!familyId || !type || !date) {
      res.status(400).json({ success: false, message: 'familyId, type, and date are required' });
      return;
    }

    const targetUserId = userId || currentUserId;
    const isMember = await verifyFamilyMember(familyId, currentUserId);
    if (!isMember) {
      res.status(403).json({ success: false, message: 'Not authorized for this family' });
      return;
    }

    // For daily single-entry trackers (sleep, steps, water, weight, period start), upsert by date
    // For fever or blood pressure, allow multiple readings or upsert by date/time
    let record;
    if (['sleep', 'steps', 'water', 'weight'].includes(type)) {
      record = await HealthRecord.findOneAndUpdate(
        { familyId, userId: targetUserId, type, date },
        { data, notes: notes || '' },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      ).populate('userId', 'fullName nickname avatarUrl email');
    } else {
      record = await HealthRecord.create({
        familyId,
        userId: targetUserId,
        type,
        date,
        data,
        notes: notes || ''
      });
      await record.populate('userId', 'fullName nickname avatarUrl email');
    }

    res.status(200).json({ success: true, data: record });
  } catch (error: any) {
    console.error('Error creating health record:', error);
    res.status(500).json({ success: false, message: 'Failed to save health record', error: error.message });
  }
};

export const deleteHealthRecord = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id || (req as any).user?.userId;
    const { id } = req.params;

    const record = await HealthRecord.findById(id);
    if (!record) {
      res.status(404).json({ success: false, message: 'Record not found' });
      return;
    }

    const isMember = await verifyFamilyMember(record.familyId.toString(), userId);
    if (!isMember) {
      res.status(403).json({ success: false, message: 'Not authorized to delete this record' });
      return;
    }

    await record.deleteOne();
    res.status(200).json({ success: true, message: 'Health record deleted' });
  } catch (error: any) {
    console.error('Error deleting health record:', error);
    res.status(500).json({ success: false, message: 'Failed to delete health record', error: error.message });
  }
};

export const getHealthSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id || (req as any).user?.userId;
    const { familyId, memberId } = req.query;

    if (!familyId) {
      res.status(400).json({ success: false, message: 'familyId is required' });
      return;
    }

    const targetUser = (memberId as string) || userId;
    const today = new Date().toISOString().split('T')[0];

    // Fetch latest records for each metric
    const [latestSleep, latestPeriod, latestFever, todaySteps, todayWater, latestBp, latestWeight] =
      await Promise.all([
        HealthRecord.findOne({ familyId, userId: targetUser, type: 'sleep' }).sort({ date: -1 }),
        HealthRecord.findOne({ familyId, userId: targetUser, type: 'period' }).sort({ date: -1 }),
        HealthRecord.findOne({ familyId, userId: targetUser, type: 'fever' }).sort({ date: -1, createdAt: -1 }),
        HealthRecord.findOne({ familyId, userId: targetUser, type: 'steps', date: today }),
        HealthRecord.findOne({ familyId, userId: targetUser, type: 'water', date: today }),
        HealthRecord.findOne({ familyId, userId: targetUser, type: 'blood_pressure' }).sort({ date: -1, createdAt: -1 }),
        HealthRecord.findOne({ familyId, userId: targetUser, type: 'weight' }).sort({ date: -1 })
      ]);

    res.status(200).json({
      success: true,
      data: {
        latestSleep,
        latestPeriod,
        latestFever,
        todaySteps,
        todayWater,
        latestBp,
        latestWeight
      }
    });
  } catch (error: any) {
    console.error('Error fetching health summary:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch health summary', error: error.message });
  }
};
