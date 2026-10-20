import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { HouseholdItem } from '../models/HouseholdItem.js';
import { FamilyMembership } from '../models/FamilyMembership.js';
import { Notification } from '../models/Notification.js';

async function verifyFamilyMember(familyId: string, userId: string): Promise<boolean> {
  const membership = await FamilyMembership.findOne({ familyId, userId });
  return !!membership;
}

export const getHouseholdItems = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id || (req as any).user?.userId;
    const familyId = String(req.query.familyId || req.params.familyId || '');

    if (!familyId) {
      res.status(400).json({ success: false, message: 'familyId is required' });
      return;
    }

    const isMember = await verifyFamilyMember(familyId, userId);
    if (!isMember) {
      res.status(403).json({ success: false, message: 'Not authorized for this family' });
      return;
    }

    const items = await HouseholdItem.find({ familyId }).sort({ category: 1, name: 1 });

    const formatted = items.map(item => ({
      ...item.toObject(),
      isLowStock: item.quantity <= item.minThreshold
    }));

    res.status(200).json({ success: true, data: formatted });
  } catch (error: any) {
    console.error('Error fetching household items:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch household items', error: error.message });
  }
};

export const createHouseholdItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id || (req as any).user?.userId;
    const { familyId, name, category, quantity, unit, minThreshold, location, expiryDate, notes } = req.body;

    if (!familyId || !name) {
      res.status(400).json({ success: false, message: 'familyId and name are required' });
      return;
    }

    const isMember = await verifyFamilyMember(familyId, userId);
    if (!isMember) {
      res.status(403).json({ success: false, message: 'Not authorized for this family' });
      return;
    }

    const item = await HouseholdItem.create({
      familyId: new mongoose.Types.ObjectId(familyId),
      name: name.trim(),
      category: category || 'pantry',
      quantity: Number(quantity) >= 0 ? Number(quantity) : 1,
      unit: unit || 'units',
      minThreshold: Number(minThreshold) >= 0 ? Number(minThreshold) : 2,
      location: location || 'Main Pantry',
      expiryDate,
      notes: notes || '',
      lastRestockedAt: new Date()
    });

    if (item.quantity <= item.minThreshold) {
      try {
        const existing = await Notification.findOne({
          recipientId: userId,
          targetId: item._id.toString(),
          isRead: false
        });
        if (!existing) {
          await Notification.create({
            recipientId: userId,
            type: 'stock_alert',
            title: `Low Stock: ${item.name}`,
            body: `Only ${item.quantity} ${item.unit} remaining (minimum threshold: ${item.minThreshold}). Time to restock!`,
            targetType: 'household_stock',
            targetId: item._id.toString(),
            isRead: false
          });
        }
      } catch (e) {
        console.error('Failed to create stock notification', e);
      }
    }

    res.status(201).json({
      success: true,
      data: {
        ...item.toObject(),
        isLowStock: item.quantity <= item.minThreshold
      }
    });
  } catch (error: any) {
    console.error('Error creating household item:', error);
    res.status(500).json({ success: false, message: 'Failed to create item', error: error.message });
  }
};

export const adjustItemStock = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id || (req as any).user?.userId;
    const { id } = req.params;
    const delta = Number(req.body.delta) || 0;

    const item = await HouseholdItem.findById(id);
    if (!item) {
      res.status(404).json({ success: false, message: 'Item not found' });
      return;
    }

    item.quantity = Math.max(0, item.quantity + delta);
    if (delta > 0) {
      item.lastRestockedAt = new Date();
    }
    await item.save();

    if (item.quantity <= item.minThreshold && userId) {
      try {
        const existing = await Notification.findOne({
          recipientId: userId,
          targetId: item._id.toString(),
          isRead: false
        });
        if (!existing) {
          await Notification.create({
            recipientId: userId,
            type: 'stock_alert',
            title: `Low Stock Alert: ${item.name}`,
            body: `Only ${item.quantity} ${item.unit} remaining in stock (threshold: ${item.minThreshold}).`,
            targetType: 'household_stock',
            targetId: item._id.toString(),
            isRead: false
          });
        }
      } catch (e) {
        console.error('Failed to create stock alert notification', e);
      }
    }

    res.status(200).json({
      success: true,
      data: {
        ...item.toObject(),
        isLowStock: item.quantity <= item.minThreshold
      }
    });
  } catch (error: any) {
    console.error('Error adjusting stock:', error);
    res.status(500).json({ success: false, message: 'Failed to adjust stock', error: error.message });
  }
};

export const updateHouseholdItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const item = await HouseholdItem.findByIdAndUpdate(id, req.body, { new: true });
    if (!item) {
      res.status(404).json({ success: false, message: 'Item not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        ...item.toObject(),
        isLowStock: item.quantity <= item.minThreshold
      }
    });
  } catch (error: any) {
    console.error('Error updating household item:', error);
    res.status(500).json({ success: false, message: 'Failed to update item', error: error.message });
  }
};

export const deleteHouseholdItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const item = await HouseholdItem.findByIdAndDelete(id);
    if (!item) {
      res.status(404).json({ success: false, message: 'Item not found' });
      return;
    }

    res.status(200).json({ success: true, message: 'Item removed from stock' });
  } catch (error: any) {
    console.error('Error deleting household item:', error);
    res.status(500).json({ success: false, message: 'Failed to delete item', error: error.message });
  }
};
