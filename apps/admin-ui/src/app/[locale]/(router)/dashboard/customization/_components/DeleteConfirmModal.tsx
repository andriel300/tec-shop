'use client';

const DeleteConfirmModal = (props: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  itemType: string;
  isPending: boolean;
}) => {
  if (!props.isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full">
        <h3 className="text-white text-xl font-semibold mb-4">
          Delete {props.itemType}
        </h3>
        <p className="text-slate-300 mb-6">
          Are you sure you want to delete{' '}
          <span className="font-semibold text-white">{props.itemName}</span>? This
          action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={props.onConfirm}
            disabled={props.isPending}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded p-3 font-medium disabled:opacity-50"
          >
            {props.isPending ? 'Deleting...' : 'Delete'}
          </button>
          <button
            onClick={props.onClose}
            disabled={props.isPending}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white rounded p-3 font-medium disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
