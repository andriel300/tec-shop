'use client';

import { Breadcrumb } from '../../../../components/navigation/Breadcrumb';
import { Button } from '../../../../components/ui/core/Button';
import { Plus } from 'lucide-react';
import React, { useState } from 'react';

const Page = () => {
  const [showModal, setShowModal] = useState(false);
  return (
    <div className="w-full min-h-screen p-8">
      <div className="flex justify-between items-center mb-1">
        <h2 className="text-2xl text-white font-semibold">Discount Codes</h2>
        <Button
          className="px-4 py-2 gap-2 items-center"
          onClick={() => setShowModal(true)}
        >
          <Plus size={18} /> Create Discount
        </Button>
      </div>
      <div className="flex items-center text-white">
        <Breadcrumb
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Discount Codes' },
          ]}
        />
      </div>

      <div className="mt-8 bg-gray-900 p-6 rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold text-white mb-4">
          Your Discount Codes
        </h3>
      </div>
    </div>
  );
};

export default Page;
