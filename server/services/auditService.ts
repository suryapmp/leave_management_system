import { db, AuditLog } from '../config/database';

export class AuditService {
  static log(params: {
    userId?: number;
    userEmail?: string;
    action: string;
    module: string;
    recordId?: string | number;
    details?: string;
    ipAddress?: string;
  }): AuditLog {
    const log: AuditLog = {
      id: db.getNextId('audit_logs'),
      user_id: params.userId,
      user_email: params.userEmail,
      action: params.action,
      module: params.module,
      record_id: params.recordId ? String(params.recordId) : undefined,
      details: params.details,
      ip_address: params.ipAddress || '127.0.0.1',
      created_at: new Date().toISOString(),
    };
    db.audit_logs.unshift(log);
    return log;
  }

  static getLogs(limit: number = 100, offset: number = 0, filterModule?: string, filterUser?: string): { logs: AuditLog[]; total: number } {
    let filtered = db.audit_logs;
    if (filterModule) {
      filtered = filtered.filter(l => l.module.toLowerCase() === filterModule.toLowerCase());
    }
    if (filterUser) {
      filtered = filtered.filter(l => l.user_email?.toLowerCase().includes(filterUser.toLowerCase()));
    }

    const total = filtered.length;
    const paginated = filtered.slice(offset, offset + limit);

    return { logs: paginated, total };
  }
}
