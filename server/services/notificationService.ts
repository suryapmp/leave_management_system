import { db, Notification } from '../config/database';

export class NotificationService {
  static createNotification(params: {
    userId: number;
    title: string;
    message: string;
    type?: Notification['type'];
    referenceType?: string;
    referenceId?: number;
  }): Notification {
    const notif: Notification = {
      id: db.getNextId('notifications'),
      user_id: params.userId,
      title: params.title,
      message: params.message,
      type: params.type || 'SYSTEM',
      is_read: false,
      reference_type: params.referenceType,
      reference_id: params.referenceId,
      created_at: new Date().toISOString(),
    };
    db.notifications.unshift(notif);
    return notif;
  }

  static getUserNotifications(userId: number, limit: number = 50): Notification[] {
    return db.notifications
      .filter(n => n.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  }

  static getUnreadCount(userId: number): number {
    return db.notifications.filter(n => n.user_id === userId && !n.is_read).length;
  }

  static markAsRead(notificationId: number, userId: number): boolean {
    const notif = db.notifications.find(n => n.id === notificationId && n.user_id === userId);
    if (notif) {
      notif.is_read = true;
      return true;
    }
    return false;
  }

  static markAllAsRead(userId: number): number {
    let count = 0;
    db.notifications.forEach(n => {
      if (n.user_id === userId && !n.is_read) {
        n.is_read = true;
        count++;
      }
    });
    return count;
  }
}
