import React from 'react';
import Hero from '../shared/modules/hero';
import SectionTitle from '../components/section/section-title';

const page = () => {
  return (
    <div className="bg-[#f5f5f5]">
      <Hero />
      <div className="md:w-[%80] w-[90%] my-10 m-auto">
        <div className="mb-8">
          <SectionTitle title="Suggested Products" />
        </div>

        {
          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 2xl:gridd-cols-5 gap-5">
            {Array.from({ length: 15 }).map((_, index) => (
              <div
                key={index}
                className="h-[250px] bg-gray-300 animate-pulse rounded-xl"
              />
            ))}
          </div>
        }
      </div>
    </div>
  );
};

export default page;
