import { Request, Response } from 'express';
import { ScheduleEvent } from '../models/ScheduleEvent.js';
import { ScheduleCategory } from '../models/ScheduleCategory.js';
import { DEFAULT_SCHEDULE_CATEGORIES } from '../shared/index.js';

export async function getScheduleCategories(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    let categories = await ScheduleCategory.find({
      ownerId: userId
    }).sort({ name: 1 });

    if (categories.length === 0) {
      const defaultCategories = DEFAULT_SCHEDULE_CATEGORIES.map(cat => ({
        ownerId: userId,
        name: cat.name,
        color: cat.color,
        icon: cat.icon,
        description: cat.description,
        isDefault: true
      }));
      await ScheduleCategory.insertMany(defaultCategories);
      categories = await ScheduleCategory.find({
        ownerId: userId
      }).sort({ name: 1 });
    }

    res.status(200).json({ success: true, data: { categories } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to retrieve schedule categories.' });
  }
}

export async function createScheduleCategory(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { name, color, icon, description } = req.body;

    const category = await ScheduleCategory.create({
      ownerId: userId,
      name,
      color: color || '#93C5FD',
      icon: icon || '✨',
      description: description || '',
      isDefault: false
    });

    res.status(201).json({
      success: true,
      message: 'Private schedule category created!',
      data: { category }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to create schedule category.' });
  }
}

export async function getScheduleEvents(req: Request, res: Response): Promise<void> {
  try {
    const ownerId = req.user!.id; // STRICTLY SCOPED TO LOGGED IN USER
    const { date, startDate, endDate, view } = req.query;

    const query: any = { ownerId };

    if (date) {
      const d = new Date(date as string);
      const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const endOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
      query.startAt = { $gte: startOfDay, $lte: endOfDay };
    } else if (startDate || endDate) {
      query.startAt = {};
      if (startDate) query.startAt.$gte = new Date(startDate as string);
      if (endDate) query.startAt.$lte = new Date(endDate as string);
    }

    const events = await ScheduleEvent.find(query)
      .populate('categoryId', 'name color icon')
      .sort({ startAt: 1 });

    // Calculate today's completion stats
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    const todayEvents = await ScheduleEvent.find({
      ownerId,
      startAt: { $gte: startOfToday, $lte: endOfToday }
    });

    const totalToday = todayEvents.length;
    const completedToday = todayEvents.filter(e => e.status === 'completed').length;

    res.status(200).json({
      success: true,
      data: {
        events,
        progress: {
          total: totalToday,
          completed: completedToday,
          message:
            totalToday === 0
              ? 'Your day is a blank canvas. What would you like to do? 🌷'
              : completedToday === totalToday
              ? 'All activities completed today! You are wonderful! 🌟'
              : `${completedToday} of ${totalToday} activities completed. You are doing great! 🌸`
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to retrieve schedule.' });
  }
}

export async function createScheduleEvent(req: Request, res: Response): Promise<void> {
  try {
    const ownerId = req.user!.id; // STRICTLY PRIVATE TO CREATOR
    const {
      title,
      description,
      categoryId,
      startAt,
      endAt,
      isAllDay = false,
      recurrenceRule = 'none',
      reminderMinutesBefore = 0,
      priority = 'medium'
    } = req.body;

    const event = await ScheduleEvent.create({
      ownerId,
      title,
      description: description || '',
      categoryId: categoryId || undefined,
      startAt: new Date(startAt),
      endAt: endAt ? new Date(endAt) : undefined,
      isAllDay,
      recurrenceRule,
      reminderMinutesBefore,
      priority,
      status: 'pending'
    });

    const populated = await ScheduleEvent.findById(event._id).populate('categoryId', 'name color icon');

    res.status(201).json({
      success: true,
      message: 'Activity scheduled! 🗓️',
      data: { event: populated }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to schedule activity.' });
  }
}

export async function updateScheduleEvent(req: Request, res: Response): Promise<void> {
  try {
    const ownerId = req.user!.id;
    const { id } = req.params;
    const { title, description, categoryId, startAt, endAt, isAllDay, recurrenceRule, priority, status } = req.body;

    const event = await ScheduleEvent.findOne({ _id: id, ownerId });
    if (!event) {
      res.status(404).json({ success: false, message: 'Activity not found.' });
      return;
    }

    if (title) event.title = title;
    if (description !== undefined) event.description = description;
    if (categoryId !== undefined) event.categoryId = categoryId;
    if (startAt) event.startAt = new Date(startAt);
    if (endAt !== undefined) event.endAt = endAt ? new Date(endAt) : undefined;
    if (isAllDay !== undefined) event.isAllDay = isAllDay;
    if (recurrenceRule !== undefined) event.recurrenceRule = recurrenceRule;
    if (priority) event.priority = priority;
    if (status) event.status = status;

    await event.save();

    const populated = await ScheduleEvent.findById(event._id).populate('categoryId', 'name color icon');

    res.status(200).json({
      success: true,
      message: 'Schedule updated.',
      data: { event: populated }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to update schedule event.' });
  }
}

export async function deleteScheduleEvent(req: Request, res: Response): Promise<void> {
  try {
    const ownerId = req.user!.id;
    const { id } = req.params;

    const event = await ScheduleEvent.findOneAndDelete({ _id: id, ownerId });
    if (!event) {
      res.status(404).json({ success: false, message: 'Activity not found.' });
      return;
    }

    res.status(200).json({ success: true, message: 'Activity removed.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to delete activity.' });
  }
}

export async function toggleEventStatus(req: Request, res: Response): Promise<void> {
  try {
    const ownerId = req.user!.id;
    const { id } = req.params;

    const event = await ScheduleEvent.findOne({ _id: id, ownerId });
    if (!event) {
      res.status(404).json({ success: false, message: 'Activity not found.' });
      return;
    }

    event.status = event.status === 'completed' ? 'pending' : 'completed';
    await event.save();

    res.status(200).json({
      success: true,
      message: event.status === 'completed' ? 'Completed! Great job 🌷' : 'Marked as pending',
      data: { event }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to toggle status.' });
  }
}
