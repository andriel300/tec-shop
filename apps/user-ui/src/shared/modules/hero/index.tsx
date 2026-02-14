'use client';

import useLayout from '../../../hooks/use-layout';
import { MoveRight } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React from 'react';

const Hero = () => {
  const { layout } = useLayout();
  const router = useRouter();

  return (
    <div className="bg-[#1e1e1e] min-h-[85vh] flex items-center w-full py-12 lg:py-0">
      <div className="w-[90%] lg:w-[80%] mx-auto">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12">
          {/* Text Content */}
          <div className="w-full lg:w-1/2 space-y-6 text-center lg:text-left">
            <p className="font-Roboto font-normal text-white text-lg lg:text-xl">
              Starting from 40$
            </p>
            <h1 className="text-white text-4xl md:text-5xl lg:text-6xl font-extrabold font-Roboto leading-tight">
              The best watch <br />
              Collection 2025
            </h1>
            <p className="font-Oregano text-2xl lg:text-3xl text-white">
              Exclusive Offer <span className="text-yellow-400">10%</span> this
              week
            </p>
            <button
              onClick={() => router.push('/products')}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-brand-primary font-semibold rounded-sm border-2 border-white hover:bg-transparent hover:text-white transition-all duration-300 ease-in-out mt-4"
            >
              Shop Now
              <MoveRight className="w-5 h-5" />
            </button>
          </div>

          {/* Image Content */}
          <div className="w-full lg:w-1/2 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[450px] aspect-square">
              <Image
                src={
                  layout?.banner ||
                  'https://ik.imagekit.io/andrieltecshop/products/slider-img-1.png'
                }
                width={450}
                height={450}
                alt="Smart Watch Collection 2025"
                className="object-contain w-auto h-auto"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
