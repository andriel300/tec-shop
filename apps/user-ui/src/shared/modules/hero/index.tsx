'use client';

import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import useLayout from '../../../hooks/use-layout';
import Image from 'next/image';
import Link from 'next/link';
import { MoveRight } from 'lucide-react';

interface SlideData {
  id: string;
  title: string;
  subtitle?: string | null;
  imageUrl: string;
  actionUrl?: string | null;
  actionLabel?: string | null;
}

const DEFAULT_SLIDES: SlideData[] = [
  {
    id: 'default-1',
    title: 'Discover Premium Products',
    subtitle: 'Shop the latest from top vendors worldwide',
    imageUrl:
      'https://ik.imagekit.io/andrieltecshop/products/slider-img-1.png',
    actionUrl: '/products',
    actionLabel: 'Shop Now',
  },
];

const Hero = () => {
  const { layout } = useLayout();
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 5000, stopOnInteraction: false, stopOnMouseEnter: true }),
  ]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Use API slides (active only, sorted by order) or fallback
  const activeSlides = layout?.heroSlides
    ?.filter((s: SlideData & { isActive?: boolean }) => s.isActive !== false)
    ?.sort(
      (
        a: SlideData & { order?: number },
        b: SlideData & { order?: number }
      ) => (a.order ?? 0) - (b.order ?? 0)
    );

  const slides: SlideData[] =
    activeSlides && activeSlides.length > 0 ? activeSlides : DEFAULT_SLIDES;

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    onSelect();
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  const scrollTo = useCallback(
    (index: number) => emblaApi?.scrollTo(index),
    [emblaApi]
  );

  return (
    <section className="relative w-full">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {slides.map((slide) => (
            <div
              key={slide.id}
              className="flex-[0_0_100%] min-w-0 relative bg-[#1e1e1e] min-h-[85vh] flex items-center"
            >
              <div className="w-[90%] lg:w-[80%] mx-auto">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12">
                  {/* Text */}
                  <div className="w-full lg:w-1/2 space-y-5 text-center lg:text-left">
                    {slide.subtitle && (
                      <p className="text-brand-secondary font-medium text-base lg:text-lg tracking-wide uppercase">
                        {slide.subtitle}
                      </p>
                    )}
                    <h2 className="text-white text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-extrabold font-heading leading-tight">
                      {slide.title}
                    </h2>
                    {slide.actionUrl && (
                      <Link
                        href={slide.actionUrl}
                        className="inline-flex items-center gap-2 px-7 py-3.5 bg-white text-brand-primary font-semibold rounded-sm border-2 border-white hover:bg-transparent hover:text-white transition-all duration-300 mt-4"
                      >
                        {slide.actionLabel || 'Shop Now'}
                        <MoveRight className="w-5 h-5" />
                      </Link>
                    )}
                  </div>
                  {/* Image */}
                  <div className="w-full lg:w-1/2 flex justify-center lg:justify-end">
                    <div className="relative w-full max-w-[500px] aspect-square">
                      <Image
                        src={slide.imageUrl}
                        width={500}
                        height={500}
                        alt={slide.title}
                        className="object-contain w-auto h-auto"
                        priority
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dot Navigation */}
      {slides.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2.5 z-10">
          {slides.map((_, index) => (
            <button
              key={`dot-${index}`}
              onClick={() => scrollTo(index)}
              className={`rounded-full transition-all duration-300 ${
                index === selectedIndex
                  ? 'w-8 h-3 bg-white'
                  : 'w-3 h-3 bg-white/40 hover:bg-white/60'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default Hero;
