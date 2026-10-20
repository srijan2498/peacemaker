import { Request, Response } from 'express';
import { ExpenseCategory } from '../models/ExpenseCategory.js';
import { DEFAULT_EXPENSE_CATEGORIES } from '../shared/index.js';

export async function getCategories(req: Request, res: Response): Promise<void> {
  try {
    const { familyId } = req.params;

    // Fetch categories assigned specifically to this family
    let categories = await ExpenseCategory.find({
      familyId,
      isArchived: false
    }).sort({ name: 1 });

    // Fallback: If family has no categories yet, auto-seed default categories for this family
    if (categories.length === 0) {
      const categoriesToSeed = DEFAULT_EXPENSE_CATEGORIES.map(cat => ({
        familyId,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        description: cat.description,
        isDefault: true,
        scope: 'family',
        isArchived: false
      }));

      await ExpenseCategory.insertMany(categoriesToSeed);

      categories = await ExpenseCategory.find({
        familyId,
        isArchived: false
      }).sort({ name: 1 });
    }

    res.status(200).json({ success: true, data: { categories } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to retrieve categories.' });
  }
}

export async function createCategory(req: Request, res: Response): Promise<void> {
  try {
    const { familyId } = req.params;
    const userId = req.user!.id;
    const { name, icon, color, description, scope } = req.body;

    // Check duplicate name within the family
    const existing = await ExpenseCategory.findOne({
      familyId,
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      isArchived: false
    });

    if (existing) {
      res.status(400).json({ success: false, message: 'A category with this name already exists in this family.' });
      return;
    }

    const category = await ExpenseCategory.create({
      familyId,
      ownerId: userId,
      name,
      icon: icon || '🏷️',
      color: color || '#A78BFA',
      description: description || '',
      scope: scope || 'family',
      isDefault: false,
      isArchived: false
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully!',
      data: { category }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to create category.' });
  }
}

export async function updateCategory(req: Request, res: Response): Promise<void> {
  try {
    const { familyId, id } = req.params;
    const { name, icon, color, description } = req.body;

    const category = await ExpenseCategory.findOne({ _id: id, familyId });
    if (!category) {
      res.status(404).json({ success: false, message: 'Category not found.' });
      return;
    }

    if (category.isDefault) {
      res.status(400).json({ success: false, message: 'Default categories cannot be modified.' });
      return;
    }

    if (name) category.name = name;
    if (icon) category.icon = icon;
    if (color) category.color = color;
    if (description !== undefined) category.description = description;

    await category.save();

    res.status(200).json({
      success: true,
      message: 'Category updated successfully.',
      data: { category }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to update category.' });
  }
}

export async function deleteCategory(req: Request, res: Response): Promise<void> {
  try {
    const { familyId, id } = req.params;

    const category = await ExpenseCategory.findOne({ _id: id, familyId });
    if (!category) {
      res.status(404).json({ success: false, message: 'Category not found.' });
      return;
    }

    if (category.isDefault) {
      res.status(400).json({ success: false, message: 'Default categories cannot be deleted.' });
      return;
    }

    // Archive category so historical expenses maintain integrity
    category.isArchived = true;
    await category.save();

    res.status(200).json({ success: true, message: 'Category archived successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to delete category.' });
  }
}
