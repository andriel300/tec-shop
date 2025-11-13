'use client';

import StatCard from 'apps/user-ui/src/components/cards/stat.card';
import { useAuth } from 'apps/user-ui/src/hooks/use-auth';
import { CheckCircle, Clock, Loader2, Truck } from 'lucide-react';
import React from 'react';

const Page = () => {
  const { user, isLoading } = useAuth();

  return (
    <div className="bg-gray-50 p-6 pb-14">
      <div className="mx-w-7xl mx-auto">
        {/* Greeting */}

        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-800">
            Welcome back,{' '}
            <span className="text-blue-600">
              {isLoading ? (
                <Loader2 className="inline animate-spin w-5 h-5" size={20} />
              ) : (
                user?.name || 'User'
              )}
            </span>{' '}
            👋
          </h1>
        </div>

        {/* Profile Overview Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <StatCard title="Total Orders" count={10} Icon={Clock} />
          <StatCard title="Processing Orders" count={4} Icon={Truck} />
          <StatCard title="Completed Orders" count={5} Icon={CheckCircle} />
        </div>
      </div>
    </div>
  );
};
export default Page;
