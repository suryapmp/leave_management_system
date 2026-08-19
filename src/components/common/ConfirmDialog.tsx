import React, { useState } from 'react';
import { Modal } from './Modal';
import { AlertTriangle, CheckCircle2, XCircle, Info } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (comment?: string) => Promise<void> | void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'success' | 'warning' | 'info';
  requireComment?: boolean;
  commentPlaceholder?: string;
  commentLabel?: string;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning',
  requireComment = false,
  commentPlaceholder = 'Enter reason or remarks...',
  commentLabel = 'Comments / Reason',
}) => {
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    if (requireComment && !comment.trim()) {
      setError('Please provide comments/reason to proceed.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await onConfirm(comment);
      setComment('');
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <XCircle className="w-10 h-10 text-rose-500" />;
      case 'success':
        return <CheckCircle2 className="w-10 h-10 text-emerald-500" />;
      case 'info':
        return <Info className="w-10 h-10 text-blue-500" />;
      default:
        return <AlertTriangle className="w-10 h-10 text-amber-500" />;
    }
  };

  const getButtonClass = () => {
    switch (type) {
      case 'danger':
        return 'bg-rose-600 hover:bg-rose-700 text-white';
      case 'success':
        return 'bg-emerald-600 hover:bg-emerald-700 text-white';
      case 'info':
        return 'bg-blue-600 hover:bg-blue-700 text-white';
      default:
        return 'bg-amber-600 hover:bg-amber-700 text-white';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="md">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="p-3 bg-slate-50 rounded-full border border-slate-100">{getIcon()}</div>
        <p className="text-sm text-slate-600 max-w-sm">{message}</p>

        {requireComment && (
          <div className="w-full text-left space-y-1.5 pt-2">
            <label className="text-xs font-semibold text-slate-700">
              {commentLabel} <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="confirm-dialog-comment"
              rows={3}
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder={commentPlaceholder}
              className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
            />
          </div>
        )}

        {error && <div className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg w-full text-left">{error}</div>}

        <div className="flex items-center justify-end space-x-3 w-full pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className={`px-4 py-2 text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center space-x-1.5 ${getButtonClass()}`}
          >
            {isSubmitting ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : null}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
