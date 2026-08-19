import { Response } from 'express';
import { db, Holiday } from '../config/database';
import { AuthenticatedRequest } from '../middleware/auth';
import { AuditService } from '../services/auditService';

export class HolidayController {
  static getAll = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const year = req.query.year ? Number(req.query.year) : new Date().getFullYear();
      const holidays = db.holidays
        .filter(h => h.year === year || !req.query.year)
        .sort((a, b) => new Date(a.holiday_date).getTime() - new Date(b.holiday_date).getTime());

      return res.json({ success: true, data: holidays });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  };

  static create = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { holiday_name, holiday_date, description, holiday_type } = req.body;

      if (!holiday_name || !holiday_date) {
        return res.status(400).json({ success: false, message: 'Holiday name and date are required.' });
      }

      const existing = db.holidays.find(h => h.holiday_date === holiday_date);
      if (existing) {
        return res.status(400).json({ success: false, message: `A holiday is already scheduled on ${holiday_date}.` });
      }

      const year = new Date(holiday_date).getFullYear();
      const now = new Date().toISOString();

      const newHoliday: Holiday = {
        id: db.getNextId('holidays'),
        holiday_name,
        holiday_date,
        description: description || '',
        holiday_type: holiday_type || 'MANDATORY',
        year,
        created_by: req.user?.userId,
        created_at: now,
        updated_at: now,
      };

      db.holidays.push(newHoliday);

      AuditService.log({
        userId: req.user?.userId,
        userEmail: req.user?.email,
        action: 'HOLIDAY_CREATED',
        module: 'Holidays',
        recordId: newHoliday.id,
        details: `Created holiday ${holiday_name} on ${holiday_date}`,
        ipAddress: req.ip,
      });

      return res.status(201).json({ success: true, data: newHoliday, message: 'Holiday added successfully.' });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  };

  static update = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = Number(req.params.id);
      const holiday = db.holidays.find(h => h.id === id);
      if (!holiday) {
        return res.status(404).json({ success: false, message: 'Holiday not found' });
      }

      const { holiday_name, holiday_date, description, holiday_type } = req.body;
      if (holiday_name) holiday.holiday_name = holiday_name;
      if (holiday_date) {
        holiday.holiday_date = holiday_date;
        holiday.year = new Date(holiday_date).getFullYear();
      }
      if (description !== undefined) holiday.description = description;
      if (holiday_type) holiday.holiday_type = holiday_type;
      holiday.updated_at = new Date().toISOString();

      AuditService.log({
        userId: req.user?.userId,
        userEmail: req.user?.email,
        action: 'HOLIDAY_UPDATED',
        module: 'Holidays',
        recordId: holiday.id,
        details: `Updated holiday ${holiday.holiday_name}`,
        ipAddress: req.ip,
      });

      return res.json({ success: true, data: holiday, message: 'Holiday updated successfully.' });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  };

  static delete = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = Number(req.params.id);
      const index = db.holidays.findIndex(h => h.id === id);
      if (index === -1) {
        return res.status(404).json({ success: false, message: 'Holiday not found' });
      }

      const deleted = db.holidays.splice(index, 1)[0];

      AuditService.log({
        userId: req.user?.userId,
        userEmail: req.user?.email,
        action: 'HOLIDAY_DELETED',
        module: 'Holidays',
        recordId: id,
        details: `Deleted holiday ${deleted.holiday_name}`,
        ipAddress: req.ip,
      });

      return res.json({ success: true, message: 'Holiday deleted successfully.' });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  };
}
