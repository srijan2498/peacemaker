import { Request, Response } from 'express';
import { Notification } from '../models/Notification.js';

export async function getNotifications(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const notifications = await Notification.find({ recipientId: userId }).sort({ createdAt: -1 }).limit(50);
    const unreadCount = await Notification.countDocuments({ recipientId: userId, isRead: false });

    res.status(200).json({
      success: true,
      data: {
        notifications,
        unreadCount
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to retrieve notifications.' });
  }
}

export async function markAsRead(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    await Notification.findOneAndUpdate({ _id: id, recipientId: userId }, { isRead: true });

    res.status(200).json({ success: true, message: 'Notification marked as read.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to update notification.' });
  }
}

export async function markAllAsRead(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    await Notification.updateMany({ recipientId: userId, isRead: false }, { isRead: true });

    res.status(200).json({ success: true, message: 'All notifications marked as read.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to update notifications.' });
  }
}

export async function createNotification(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { title, body, type, targetType, targetId } = req.body;

    if (!title || !body) {
      res.status(400).json({ success: false, message: 'Title and body are required' });
      return;
    }

    const notification = await Notification.create({
      recipientId: userId,
      type: type || 'system',
      title,
      body,
      targetType: targetType || '',
      targetId: targetId || '',
      isRead: false
    });

    res.status(201).json({ success: true, data: notification });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to create notification', error: error.message });
  }
}
