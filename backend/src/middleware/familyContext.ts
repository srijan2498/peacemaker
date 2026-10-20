import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { FamilyMembership, IFamilyMembership } from '../models/FamilyMembership.js';

declare global {
  namespace Express {
    interface Request {
      familyMembership?: IFamilyMembership;
    }
  }
}

export async function requireFamilyMember(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const familyId = req.params.familyId || req.body.familyId || req.query.familyId;
    if (!familyId || !mongoose.Types.ObjectId.isValid(familyId as string)) {
      res.status(400).json({ success: false, message: 'Valid familyId is required.' });
      return;
    }

    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const membership = await FamilyMembership.findOne({
      familyId,
      userId: req.user.id,
      status: 'active'
    });

    if (!membership) {
      res.status(403).json({ success: false, message: 'You are not an active member of this family workspace.' });
      return;
    }

    req.familyMembership = membership;
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to verify family membership permissions.' });
  }
}

export async function requireFamilyAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  await requireFamilyMember(req, res, () => {
    if (req.familyMembership?.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Only family administrators can perform this action.' });
      return;
    }
    next();
  });
}
