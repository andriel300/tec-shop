'use client';

import { useState } from 'react';
import type { Category } from '../../../../../../../hooks/useCategories';

const CategoryTreeItem = (props: {
  category: Category;
  level: number;
  onEdit: (cat: Category) => void;
  onDelete: (cat: Category) => void;
}) => {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = props.category.children && props.category.children.length > 0;

  return (
    <div>
      <div
        className={`flex items-center gap-2 py-2 px-3 rounded hover:bg-slate-700/50 transition group ${
          props.level > 0 ? 'ml-6' : ''
        }`}
      >
        <button
          onClick={() => hasChildren && setExpanded(!expanded)}
          className={`w-5 h-5 flex items-center justify-center text-slate-400 ${
            hasChildren ? 'cursor-pointer hover:text-white' : 'invisible'
          }`}
        >
          <svg
            className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        <div
          className={`w-2 h-2 rounded-full flex-shrink-0 ${
            props.category.isActive ? 'bg-green-500' : 'bg-slate-500'
          }`}
        />

        <div className="flex-1 min-w-0">
          <span className="text-white text-sm font-medium">{props.category.name}</span>
          <span className="text-slate-500 text-xs ml-2">/{props.category.slug}</span>
        </div>

        <span
          className={`px-2 py-0.5 rounded text-xs font-medium ${
            props.category.isActive
              ? 'bg-green-600/20 text-green-400'
              : 'bg-slate-600/20 text-slate-400'
          }`}
        >
          {props.category.isActive ? 'Active' : 'Inactive'}
        </span>

        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => props.onEdit(props.category)}
            className="text-blue-400 hover:text-blue-300 p-1"
            title="Edit"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
          <button
            onClick={() => props.onDelete(props.category)}
            className="text-red-400 hover:text-red-300 p-1"
            title="Delete"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>

      {hasChildren && expanded && (
        <div className="border-l border-slate-700 ml-5">
          {props.category.children!.map((child) => (
            <CategoryTreeItem
              key={child.id}
              category={child}
              level={props.level + 1}
              onEdit={props.onEdit}
              onDelete={props.onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryTreeItem;
