import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

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
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-red-500/30 rounded-xl shadow-[0_0_50px_rgba(239,68,68,0.3)] w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <AlertTriangle className="text-red-400" size={24} />
            </div>
            <h3 className="text-xl font-semibold text-white">
              Delete Product
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="p-1 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <p className="text-gray-300">
            Are you sure you want to delete{' '}
            <span className="font-semibold text-white">{productName}</span>?
          </p>

          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertTriangle className="text-yellow-400 flex-shrink-0 mt-0.5" size={20} />
              <div className="text-sm text-gray-300 space-y-2">
                <p className="font-medium text-yellow-400">
                  This product will be moved to a deleted state.
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-400">
                  <li>Product will be hidden from your active listings</li>
                  <li>Permanently removed after 24 hours</li>
                  <li>You can recover it before then from trash</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 bg-gray-800/50 border-t border-gray-700">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete Product'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
