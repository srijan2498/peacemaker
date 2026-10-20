import { Request, Response } from 'express';
import { Note } from '../models/Note.js';

export async function getNotes(req: Request, res: Response): Promise<void> {
  try {
    const ownerId = req.user!.id; // STRICTLY SCOPED TO OWNER
    const { search, tag, archived, trash } = req.query;

    const query: any = { ownerId };

    if (trash === 'true') {
      query.isDeleted = true;
    } else {
      query.isDeleted = false;
      if (archived === 'true') {
        query.isArchived = true;
      } else {
        query.isArchived = false;
      }
    }

    if (tag) {
      query.tags = tag;
    }

    if (search) {
      const regex = new RegExp(search as string, 'i');
      query.$or = [{ title: regex }, { content: regex }, { tags: regex }];
    }

    const notes = await Note.find(query).sort({ isPinned: -1, updatedAt: -1 });

    // Distinct tags for easy filtering
    const allTags = await Note.distinct('tags', { ownerId, isDeleted: false });

    res.status(200).json({
      success: true,
      data: {
        notes,
        tags: allTags
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to retrieve notes.' });
  }
}

export async function createNote(req: Request, res: Response): Promise<void> {
  try {
    const ownerId = req.user!.id;
    const { title = 'Untitled Note', content = '', tags = [], color = '#FFFFFF', icon = '📝', isPinned = false } = req.body;

    const note = await Note.create({
      ownerId,
      title,
      content,
      tags,
      color,
      icon,
      isPinned,
      isArchived: false,
      isDeleted: false
    });

    res.status(201).json({
      success: true,
      message: 'Note created! 📝',
      data: { note }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to create note.' });
  }
}

export async function getNoteById(req: Request, res: Response): Promise<void> {
  try {
    const ownerId = req.user!.id;
    const { id } = req.params;

    const note = await Note.findOne({ _id: id, ownerId });
    if (!note) {
      res.status(404).json({ success: false, message: 'Note not found or unauthorized.' });
      return;
    }

    res.status(200).json({ success: true, data: { note } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to retrieve note.' });
  }
}

export async function updateNote(req: Request, res: Response): Promise<void> {
  try {
    const ownerId = req.user!.id;
    const { id } = req.params;
    const { title, content, tags, color, icon, isPinned, isArchived } = req.body;

    const note = await Note.findOne({ _id: id, ownerId });
    if (!note) {
      res.status(404).json({ success: false, message: 'Note not found.' });
      return;
    }

    if (title !== undefined) note.title = title;
    if (content !== undefined) note.content = content;
    if (tags !== undefined) note.tags = tags;
    if (color !== undefined) note.color = color;
    if (icon !== undefined) note.icon = icon;
    if (isPinned !== undefined) note.isPinned = isPinned;
    if (isArchived !== undefined) note.isArchived = isArchived;

    await note.save();

    res.status(200).json({
      success: true,
      message: 'Note saved.',
      data: { note }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to update note.' });
  }
}

export async function deleteNote(req: Request, res: Response): Promise<void> {
  try {
    const ownerId = req.user!.id;
    const { id } = req.params;
    const { permanent } = req.query;

    if (permanent === 'true') {
      await Note.findOneAndDelete({ _id: id, ownerId });
      res.status(200).json({ success: true, message: 'Note permanently deleted.' });
      return;
    }

    const note = await Note.findOne({ _id: id, ownerId });
    if (!note) {
      res.status(404).json({ success: false, message: 'Note not found.' });
      return;
    }

    note.isDeleted = true;
    await note.save();

    res.status(200).json({ success: true, message: 'Note moved to trash.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to delete note.' });
  }
}

export async function restoreNote(req: Request, res: Response): Promise<void> {
  try {
    const ownerId = req.user!.id;
    const { id } = req.params;

    const note = await Note.findOne({ _id: id, ownerId });
    if (!note) {
      res.status(404).json({ success: false, message: 'Note not found.' });
      return;
    }

    note.isDeleted = false;
    await note.save();

    res.status(200).json({ success: true, message: 'Note restored! 🌷', data: { note } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to restore note.' });
  }
}

export async function togglePinNote(req: Request, res: Response): Promise<void> {
  try {
    const ownerId = req.user!.id;
    const { id } = req.params;

    const note = await Note.findOne({ _id: id, ownerId });
    if (!note) {
      res.status(404).json({ success: false, message: 'Note not found.' });
      return;
    }

    note.isPinned = !note.isPinned;
    await note.save();

    res.status(200).json({
      success: true,
      message: note.isPinned ? 'Note pinned to top! 📌' : 'Note unpinned',
      data: { note }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to toggle pin.' });
  }
}
