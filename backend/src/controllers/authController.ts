import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { FamilyMembership } from '../models/FamilyMembership.js';
import { Family } from '../models/Family.js';
import { ScheduleCategory } from '../models/ScheduleCategory.js';
import { DEFAULT_SCHEDULE_CATEGORIES } from '../shared/index.js';
import { env } from '../config/env.js';

function generateToken(userId: string, email: string): string {
  return jwt.sign({ id: userId, email }, env.JWT_SECRET, { expiresIn: '7d' });
}

function setAuthCookie(res: Response, token: string): void {
  res.cookie('token', token, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
}

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { fullName, email, password, nickname, avatarUrl, preferredCurrency, timezone, securityQuestion, securityAnswer } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ success: false, message: 'An account with this email address already exists.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    let securityAnswerHash = '';
    if (securityAnswer) {
      const answerSalt = await bcrypt.genSalt(10);
      securityAnswerHash = await bcrypt.hash(securityAnswer.trim().toLowerCase(), answerSalt);
    }

    const newUser = await User.create({
      fullName,
      email,
      passwordHash,
      nickname: nickname || '',
      avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(fullName)}`,
      preferredCurrency: preferredCurrency || 'INR',
      timezone: timezone || 'Asia/Kolkata',
      themePreference: 'light',
      childMode: false,
      securityQuestion: securityQuestion || '',
      securityAnswerHash
    });

    // Seed private default schedule categories for this new user
    const defaultCategories = DEFAULT_SCHEDULE_CATEGORIES.map(cat => ({
      ownerId: newUser._id,
      name: cat.name,
      color: cat.color,
      icon: cat.icon,
      description: cat.description,
      isDefault: true
    }));
    await ScheduleCategory.insertMany(defaultCategories).catch(err => {
      console.warn('Failed to seed personal schedule categories:', err);
    });

    const token = generateToken(newUser._id.toString(), newUser.email);
    setAuthCookie(res, token);

    const userPayload = {
      _id: newUser._id,
      fullName: newUser.fullName,
      email: newUser.email,
      avatarUrl: newUser.avatarUrl,
      nickname: newUser.nickname,
      preferredCurrency: newUser.preferredCurrency,
      timezone: newUser.timezone,
      themePreference: newUser.themePreference,
      childMode: newUser.childMode,
      securityQuestion: newUser.securityQuestion,
      createdAt: newUser.createdAt
    };

    res.status(201).json({
      success: true,
      message: 'Account created successfully! Welcome to CozyNest 🌷',
      token,
      user: userPayload,
      data: {
        user: userPayload
      }
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Failed to complete registration.' });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid email or password.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid email or password.' });
      return;
    }

    const token = generateToken(user._id.toString(), user.email);
    setAuthCookie(res, token);

    const userPayload = {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      avatarUrl: user.avatarUrl,
      nickname: user.nickname,
      preferredCurrency: user.preferredCurrency,
      timezone: user.timezone,
      themePreference: user.themePreference,
      childMode: user.childMode,
      securityQuestion: user.securityQuestion,
      createdAt: user.createdAt
    };

    res.status(200).json({
      success: true,
      message: `Welcome back, ${user.nickname || user.fullName.split(' ')[0]}! ☀️`,
      token,
      user: userPayload,
      data: {
        user: userPayload
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Failed to log in.' });
  }
}

export async function logout(req: Request, res: Response): Promise<void> {
  res.clearCookie('token');
  res.status(200).json({ success: true, message: 'Logged out successfully.' });
}

export async function getMe(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const user = await User.findById(req.user.id).select('-passwordHash -securityAnswerHash');
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    // Find families user belongs to
    const memberships = await FamilyMembership.find({ userId: user._id, status: 'active' }).populate('familyId');
    const families = memberships.map(m => ({
      membershipId: m._id,
      role: m.role,
      joinedAt: m.joinedAt,
      family: m.familyId
    }));

    res.status(200).json({
      success: true,
      data: {
        user,
        families
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to retrieve profile.' });
  }
}

export async function updateProfile(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { fullName, nickname, avatarUrl, preferredCurrency, timezone, themePreference, childMode } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        ...(fullName ? { fullName } : {}),
        ...(nickname !== undefined ? { nickname } : {}),
        ...(avatarUrl !== undefined ? { avatarUrl } : {}),
        ...(preferredCurrency ? { preferredCurrency } : {}),
        ...(timezone ? { timezone } : {}),
        ...(themePreference ? { themePreference } : {}),
        ...(childMode !== undefined ? { childMode } : {})
      },
      { new: true }
    ).select('-passwordHash');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully!',
      data: { user: updatedUser }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
}

export async function changePassword(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await User.findByIdAndUpdate(req.user.id, { passwordHash });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully! 🌷'
    });
  } catch (error: any) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Failed to update password.' });
  }
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const { email } = req.body;
  const user = await User.findOne({ email: email?.toLowerCase().trim() });
  if (!user) {
    // Return friendly generic message to avoid email enumeration
    res.status(200).json({
      success: true,
      message: 'If an account exists with this email, password reset instructions have been prepared.'
    });
    return;
  }

  // Generate temporary 6-digit code or reset token
  const resetToken = jwt.sign({ id: user._id }, env.JWT_SECRET, { expiresIn: '1h' });
  res.status(200).json({
    success: true,
    message: user.securityQuestion
      ? 'Please answer your security question to reset your password.'
      : 'Reset instructions generated. You can now set your new password.',
    securityQuestion: user.securityQuestion || null,
    resetToken
  });
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  try {
    const { resetToken, email, securityAnswer, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
      return;
    }

    let userIdToUpdate: string | null = null;

    if (resetToken) {
      try {
        const decoded = jwt.verify(resetToken, env.JWT_SECRET) as { id: string };
        userIdToUpdate = decoded.id;
      } catch {
        res.status(400).json({ success: false, message: 'Invalid or expired reset token.' });
        return;
      }
    } else if (email && securityAnswer) {
      const user = await User.findOne({ email: email.toLowerCase().trim() });
      if (!user || !user.securityAnswerHash) {
        res.status(400).json({ success: false, message: 'Invalid account or no security question configured.' });
        return;
      }

      const isMatch = await bcrypt.compare(securityAnswer.trim().toLowerCase(), user.securityAnswerHash);
      if (!isMatch) {
        res.status(400).json({ success: false, message: 'Incorrect security answer.' });
        return;
      }
      userIdToUpdate = user._id.toString();
    } else {
      res.status(400).json({ success: false, message: 'Either a valid reset token or security answer is required.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await User.findByIdAndUpdate(userIdToUpdate, { passwordHash });

    res.status(200).json({
      success: true,
      message: 'Password reset successfully! Please log in with your new password. 🌷'
    });
  } catch (error: any) {
    console.error('Reset password error:', error);
    res.status(400).json({ success: false, message: 'Failed to reset password.' });
  }
}
