import { Request, Response } from 'express';
import { Medication } from '../models/Medication.js';
import { FamilyMembership } from '../models/FamilyMembership.js';

async function verifyFamilyMember(familyId: string, userId: string): Promise<boolean> {
  const membership = await FamilyMembership.findOne({ familyId, userId });
  return !!membership;
}

export const getMedications = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id || (req as any).user?.userId;
    const { familyId, memberId, isActive } = req.query;

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
    if (memberId) query.userId = memberId;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const medications = await Medication.find(query)
      .populate('userId', 'fullName nickname avatarUrl email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: medications });
  } catch (error: any) {
    console.error('Error fetching medications:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch medications', error: error.message });
  }
};

export const createMedication = async (req: Request, res: Response): Promise<void> => {
  try {
    const currentUserId = (req as any).user?.id || (req as any).user?.userId;
    const {
      familyId,
      userId,
      name,
      dosage,
      form,
      purpose,
      frequencyType,
      daysOfWeek,
      dayOfMonth,
      schedules,
      frequencyDescription,
      startDate,
      endDate,
      totalPills,
      pillsRemaining,
      lowStockThreshold,
      refillAlertDays,
      prescribingDoctor,
      pharmacyName,
      instructions
    } = req.body;

    if (!familyId || !name || !dosage) {
      res.status(400).json({ success: false, message: 'familyId, name, and dosage are required' });
      return;
    }

    const targetUserId = userId || currentUserId;
    const isMember = await verifyFamilyMember(familyId, currentUserId);
    if (!isMember) {
      res.status(403).json({ success: false, message: 'Not authorized for this family' });
      return;
    }

    const medication = await Medication.create({
      familyId,
      userId: targetUserId,
      name,
      dosage,
      form: form || 'tablet',
      purpose: purpose || '',
      frequencyType: frequencyType || 'daily',
      daysOfWeek: daysOfWeek || [],
      dayOfMonth: dayOfMonth || undefined,
      schedules: schedules && schedules.length > 0 ? schedules : [{ timeSlot: 'morning', timeLabel: '08:00 AM', dosage: '1', withFood: 'after' }],
      frequencyDescription: frequencyDescription || 'Daily',
      startDate: startDate || new Date().toISOString().split('T')[0],
      endDate,
      totalPills: totalPills || 30,
      pillsRemaining: pillsRemaining !== undefined ? pillsRemaining : totalPills || 30,
      lowStockThreshold: lowStockThreshold !== undefined ? lowStockThreshold : 5,
      refillAlertDays: refillAlertDays || 5,
      prescribingDoctor: prescribingDoctor || '',
      pharmacyName: pharmacyName || '',
      instructions: instructions || '',
      isActive: true,
      takenLogs: []
    });

    await medication.populate('userId', 'fullName nickname avatarUrl email');

    res.status(201).json({ success: true, data: medication });
  } catch (error: any) {
    console.error('Error creating medication:', error);
    res.status(500).json({ success: false, message: 'Failed to create medication', error: error.message });
  }
};

export const toggleMedicationTaken = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id || (req as any).user?.userId;
    const { id } = req.params;
    const { date, timeSlot } = req.body; // YYYY-MM-DD, slot e.g. "morning"

    if (!date || !timeSlot) {
      res.status(400).json({ success: false, message: 'date and timeSlot are required' });
      return;
    }

    const medication = await Medication.findById(id);
    if (!medication) {
      res.status(404).json({ success: false, message: 'Medication not found' });
      return;
    }

    const isMember = await verifyFamilyMember(medication.familyId.toString(), userId);
    if (!isMember) {
      res.status(403).json({ success: false, message: 'Not authorized for this family' });
      return;
    }

    // Check if log exists for this date and slot
    const existingIndex = medication.takenLogs.findIndex(
      log => log.date === date && log.timeSlot === timeSlot
    );

    let wasTaken = false;
    if (existingIndex >= 0) {
      // Toggle
      wasTaken = !medication.takenLogs[existingIndex].taken;
      medication.takenLogs[existingIndex].taken = wasTaken;
      medication.takenLogs[existingIndex].takenAt = wasTaken ? new Date().toISOString() : undefined;
    } else {
      // Add taken log
      wasTaken = true;
      medication.takenLogs.push({
        date,
        timeSlot,
        taken: true,
        takenAt: new Date().toISOString()
      });
    }

    // Adjust pills remaining count: if marked taken, decrement 1; if untaken, increment 1
    if (wasTaken && medication.pillsRemaining > 0) {
      medication.pillsRemaining = Math.max(0, medication.pillsRemaining - 1);
    } else if (!wasTaken) {
      medication.pillsRemaining = medication.pillsRemaining + 1;
    }

    await medication.save();
    await medication.populate('userId', 'fullName nickname avatarUrl email');

    res.status(200).json({ success: true, data: medication });
  } catch (error: any) {
    console.error('Error toggling medication taken:', error);
    res.status(500).json({ success: false, message: 'Failed to update medication adherence', error: error.message });
  }
};

export const updateMedication = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id || (req as any).user?.userId;
    const { id } = req.params;

    const medication = await Medication.findById(id);
    if (!medication) {
      res.status(404).json({ success: false, message: 'Medication not found' });
      return;
    }

    const isMember = await verifyFamilyMember(medication.familyId.toString(), userId);
    if (!isMember) {
      res.status(403).json({ success: false, message: 'Not authorized for this family' });
      return;
    }

    const updated = await Medication.findByIdAndUpdate(id, req.body, { new: true })
      .populate('userId', 'fullName nickname avatarUrl email');

    res.status(200).json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Error updating medication:', error);
    res.status(500).json({ success: false, message: 'Failed to update medication', error: error.message });
  }
};

export const deleteMedication = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id || (req as any).user?.userId;
    const { id } = req.params;

    const medication = await Medication.findById(id);
    if (!medication) {
      res.status(404).json({ success: false, message: 'Medication not found' });
      return;
    }

    const isMember = await verifyFamilyMember(medication.familyId.toString(), userId);
    if (!isMember) {
      res.status(403).json({ success: false, message: 'Not authorized for this family' });
      return;
    }

    await medication.deleteOne();
    res.status(200).json({ success: true, message: 'Medication removed' });
  } catch (error: any) {
    console.error('Error deleting medication:', error);
    res.status(500).json({ success: false, message: 'Failed to delete medication', error: error.message });
  }
};

export const refillMedication = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const addedPills = parseInt(req.body.addedPills, 10) || 30;

    const medication = await Medication.findById(id);
    if (!medication) {
      res.status(404).json({ success: false, message: 'Medication not found' });
      return;
    }

    medication.pillsRemaining = (medication.pillsRemaining || 0) + addedPills;
    medication.totalPills = Math.max(medication.totalPills, medication.pillsRemaining);
    await medication.save();
    await medication.populate('userId', 'fullName nickname avatarUrl email');

    res.status(200).json({
      success: true,
      data: medication,
      message: `Refilled +${addedPills} pills successfully! Stock now at ${medication.pillsRemaining} pills.`
    });
  } catch (error: any) {
    console.error('Error refilling medication:', error);
    res.status(500).json({ success: false, message: 'Failed to refill medication', error: error.message });
  }
};

