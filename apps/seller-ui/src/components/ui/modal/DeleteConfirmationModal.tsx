import React from 'react';
import { AlertTriangle, X, Trash2 } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  productName: string;
  isDeleting?: boolean;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  productName,
  isDeleting = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-white/50 backdrop-blur-sm animate-fade-in"
        onClick={!isDeleting ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative bg-surface-container-lowest border border-outline-variant rounded-lg shadow-elev-lg w-full max-w-md mx-4 overflow-hidden animate-slide-up">
        {/* Danger accent bar */}
        <div className="h-1 bg-feedback-error w-full" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-surface-container-highest">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-feedback-error/10 rounded-md">
              <Trash2 className="text-feedback-error" size={18} />
            </div>
            <h3 className="text-base font-semibold text-on-surface font-heading">
              Delete Product
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            aria-label="Close dialog"
            className="p-1.5 rounded-md text-gray-400 hover:text-on-surface hover:bg-surface-container transition-colors disabled:opacity-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-outline-variant"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            Are you sure you want to delete{' '}
            <span className="font-semibold text-on-surface">{productName}</span>?
            This action cannot be undone immediately.
          </p>

          <div className="bg-feedback-warning/10 border border-feedback-warning/30 rounded-md p-4">
            <div className="flex gap-3">
              <AlertTriangle className="text-feedback-warning flex-shrink-0 mt-0.5" size={16} />
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-feedback-warning">
                  Product will enter a deleted state
                </p>
                <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1 list-disc list-inside">
                  <li>Hidden from your active listings immediately</li>
                  <li>Permanently removed after 24 hours</li>
                  <li>Recoverable from trash before then</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 bg-surface-container-low border-t border-surface-container-highest">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 px-4 py-2.5 bg-surface-container text-on-surface rounded-lg text-sm font-medium hover:bg-surface-container-highest transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus:outline-none focus:ring-2 focus:ring-outline-variant"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 px-4 py-2.5 bg-feedback-error text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-feedback-error/50"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 size={14} />
                <span>Delete Product</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
