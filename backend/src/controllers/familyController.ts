import { Request, Response } from 'express';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { Family } from '../models/Family.js';
import { FamilyMembership } from '../models/FamilyMembership.js';
import { FamilyInvitation } from '../models/FamilyInvitation.js';
import { ExpenseCategory } from '../models/ExpenseCategory.js';
import { DEFAULT_EXPENSE_CATEGORIES, toMinorUnits } from '../shared/index.js';

export async function createFamily(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { name, avatar, description, defaultCurrency, timezone, monthlyBudget } = req.body;

    const budgetMinor = toMinorUnits(monthlyBudget || 0);

    const family = await Family.create({
      name,
      avatar: avatar || '🏡',
      description: description || '',
      createdBy: userId,
      defaultCurrency: defaultCurrency || 'INR',
      timezone: timezone || 'Asia/Kolkata',
      monthlyBudget: budgetMinor
    });

    // Create Admin membership
    await FamilyMembership.create({
      familyId: family._id,
      userId,
      role: 'admin',
      status: 'active'
    });

    // Seed default categories for this family workspace
    const categoriesToSeed = DEFAULT_EXPENSE_CATEGORIES.map(cat => ({
      familyId: family._id,
      name: cat.name,
      icon: cat.icon,
      color: cat.color,
      description: cat.description,
      isDefault: true,
      scope: 'family',
      isArchived: false
    }));

    await ExpenseCategory.insertMany(categoriesToSeed);

    res.status(201).json({
      success: true,
      message: `Family "${family.name}" created successfully! 🏡`,
      data: { family }
    });
  } catch (error: any) {
    console.error('Error creating family:', error);
    res.status(500).json({ success: false, message: 'Failed to create family workspace.' });
  }
}

export async function getMyFamilies(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const memberships = await FamilyMembership.find({ userId, status: 'active' }).populate('familyId');

    const families = memberships
      .filter(m => m.familyId != null)
      .map(m => {
        const fam = m.familyId as any;
        return {
          _id: fam._id,
          name: fam.name,
          avatar: fam.avatar,
          description: fam.description,
          defaultCurrency: fam.defaultCurrency,
          timezone: fam.timezone,
          monthlyBudget: fam.monthlyBudget,
          role: m.role,
          joinedAt: m.joinedAt,
          isCreator: fam.createdBy?.toString() === userId
        };
      });

    res.status(200).json({ success: true, data: { families } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch family workspaces.' });
  }
}

export async function getFamilyDetails(req: Request, res: Response): Promise<void> {
  try {
    const { familyId } = req.params;
    const family = await Family.findById(familyId);
    if (!family) {
      res.status(404).json({ success: false, message: 'Family not found.' });
      return;
    }

    const memberCount = await FamilyMembership.countDocuments({ familyId, status: 'active' });

    res.status(200).json({
      success: true,
      data: {
        family,
        memberCount,
        myRole: req.familyMembership?.role
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to retrieve family details.' });
  }
}

export async function updateFamily(req: Request, res: Response): Promise<void> {
  try {
    const { familyId } = req.params;
    const { name, avatar, description, defaultCurrency, timezone, monthlyBudget } = req.body;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (avatar) updateData.avatar = avatar;
    if (description !== undefined) updateData.description = description;
    if (defaultCurrency) updateData.defaultCurrency = defaultCurrency;
    if (timezone) updateData.timezone = timezone;
    if (monthlyBudget !== undefined) updateData.monthlyBudget = toMinorUnits(monthlyBudget);

    const updated = await Family.findByIdAndUpdate(familyId, updateData, { new: true });

    res.status(200).json({
      success: true,
      message: 'Family settings updated successfully.',
      data: { family: updated }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to update family workspace.' });
  }
}

export async function createInvitation(req: Request, res: Response): Promise<void> {
  try {
    const { familyId } = req.params;
    const userId = req.user!.id;
    const { maximumUses = 10, expiresInDays = 7 } = req.body;

    // Generate neat code: NEST-XXXXX
    const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    const code = `NEST-${randomSuffix}`;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const invitation = await FamilyInvitation.create({
      familyId,
      code,
      createdBy: userId,
      expiresAt,
      maximumUses,
      usedCount: 0,
      isRevoked: false
    });

    res.status(201).json({
      success: true,
      message: 'Invitation code generated! Share this code with your family members.',
      data: {
        code: invitation.code,
        expiresAt: invitation.expiresAt,
        maximumUses: invitation.maximumUses
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to generate invitation.' });
  }
}

export async function joinFamily(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { inviteCode } = req.body;

    const normalizedCode = inviteCode.trim().toUpperCase();
    const invitation = await FamilyInvitation.findOne({
      code: normalizedCode,
      isRevoked: false
    });

    if (!invitation) {
      res.status(404).json({ success: false, message: 'Invalid invitation code.' });
      return;
    }

    if (new Date() > invitation.expiresAt) {
      res.status(400).json({ success: false, message: 'This invitation code has expired.' });
      return;
    }

    if (invitation.usedCount >= invitation.maximumUses) {
      res.status(400).json({ success: false, message: 'This invitation code has reached its maximum uses.' });
      return;
    }

    // Check if already member
    const existingMembership = await FamilyMembership.findOne({
      familyId: invitation.familyId,
      userId
    });

    if (existingMembership && existingMembership.status === 'active') {
      res.status(400).json({ success: false, message: 'You are already a member of this family.' });
      return;
    }

    if (existingMembership) {
      existingMembership.status = 'active';
      await existingMembership.save();
    } else {
      await FamilyMembership.create({
        familyId: invitation.familyId,
        userId,
        role: 'member',
        status: 'active'
      });
    }

    invitation.usedCount += 1;
    await invitation.save();

    const family = await Family.findById(invitation.familyId);

    res.status(200).json({
      success: true,
      message: `You have successfully joined "${family?.name}"! 🏡`,
      data: { family }
    });
  } catch (error: any) {
    console.error('Error joining family:', error);
    res.status(500).json({ success: false, message: 'Failed to join family workspace.' });
  }
}

export async function getMembers(req: Request, res: Response): Promise<void> {
  try {
    const { familyId } = req.params;
    const memberships = await FamilyMembership.find({ familyId, status: 'active' })
      .populate('userId', 'fullName email avatarUrl nickname preferredCurrency')
      .sort({ role: 1, joinedAt: 1 });

    const members = memberships.map(m => {
      const u = m.userId as any;
      return {
        _id: m._id,
        userId: u?._id,
        fullName: u?.fullName || 'Family Member',
        nickname: u?.nickname || '',
        email: u?.email || '',
        avatarUrl: u?.avatarUrl || '',
        role: m.role,
        joinedAt: m.joinedAt
      };
    });

    res.status(200).json({ success: true, data: { members } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch family members.' });
  }
}

export async function removeMember(req: Request, res: Response): Promise<void> {
  try {
    const { familyId, memberUserId } = req.params;
    const currentUserId = req.user!.id;

    // Check family
    const family = await Family.findById(familyId);
    if (!family) {
      res.status(404).json({ success: false, message: 'Family not found.' });
      return;
    }

    // Creator cannot be removed
    if (family.createdBy.toString() === memberUserId) {
      res.status(400).json({ success: false, message: 'The family creator cannot be removed.' });
      return;
    }

    // Allow user to leave themselves, or admin to remove others
    const isAdmin = req.familyMembership?.role === 'admin';
    const isSelf = currentUserId === memberUserId;

    if (!isAdmin && !isSelf) {
      res.status(403).json({ success: false, message: 'Permission denied.' });
      return;
    }

    await FamilyMembership.findOneAndDelete({ familyId, userId: memberUserId });

    res.status(200).json({
      success: true,
      message: isSelf ? 'You have left the family.' : 'Member removed from the family.'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to remove member.' });
  }
}
