import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { NotificationService } from '../services/notificationService';
import { db } from '../config/database';
import { AuditService } from '../services/auditService';

export class NotificationController {
  static getAll = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const notifications = NotificationService.getUserNotifications(userId);
      const unreadCount = NotificationService.getUnreadCount(userId);

      return res.json({
        success: true,
        data: notifications,
        unread_count: unreadCount,
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  };

  static markAsRead = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = Number(req.params.id);
      const userId = req.user!.userId;
      const updated = NotificationService.markAsRead(id, userId);

      return res.json({ success: updated, message: updated ? 'Marked as read' : 'Notification not found' });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  };

  static markAllAsRead = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const count = NotificationService.markAllAsRead(userId);

      return res.json({ success: true, count, message: `${count} notifications marked as read` });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  };
}

export class SettingsController {
  static getAll = async (req: AuthenticatedRequest, res: Response) => {
    try {
      return res.json({ success: true, data: db.system_settings });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  };

  static update = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { settings } = req.body; // array of { setting_key, setting_value } or key-value object

      if (!settings) {
        return res.status(400).json({ success: false, message: 'Settings payload is required.' });
      }

      const now = new Date().toISOString();

      if (Array.isArray(settings)) {
        settings.forEach((item: { setting_key: string; setting_value: any }) => {
          const s = db.system_settings.find(st => st.setting_key === item.setting_key);
          if (s) {
            s.setting_value = String(item.setting_value);
            s.updated_at = now;
          }
        });
      } else {
        Object.entries(settings).forEach(([key, val]) => {
          const s = db.system_settings.find(st => st.setting_key === key);
          if (s) {
            s.setting_value = String(val);
            s.updated_at = now;
          }
        });
      }

      AuditService.log({
        userId: req.user?.userId,
        userEmail: req.user?.email,
        action: 'SETTINGS_UPDATED',
        module: 'Settings',
        recordId: 'all',
        details: 'System settings updated by admin',
        ipAddress: req.ip,
      });

      return res.json({ success: true, data: db.system_settings, message: 'Settings saved successfully.' });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  };
}
