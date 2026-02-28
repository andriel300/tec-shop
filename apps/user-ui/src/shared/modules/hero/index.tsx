'use client';

import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import useLayout from '../../../hooks/use-layout';
import Image from 'next/image';
import { MoveRight } from 'lucide-react';
import { Link } from 'apps/user-ui/src/i18n/navigation';

interface SlideData {
  id: string;
  title: string;
  subtitle?: string | null;
  imageUrl: string;
  actionUrl?: string | null;
  actionLabel?: string | null;
}

const Hero = () => {
  const { layout } = useLayout();
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 5000, stopOnInteraction: false, stopOnMouseEnter: true }),
  ]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const slides: SlideData[] = (layout?.heroSlides ?? [])
    .filter((s: SlideData & { isActive?: boolean }) => s.isActive !== false)
    .sort(
      (a: SlideData & { order?: number }, b: SlideData & { order?: number }) =>
        (a.order ?? 0) - (b.order ?? 0)
    );

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
              className="flex-[0_0_100%] min-w-0 relative h-[580px] lg:h-[660px]"
            >
              {/* Full-bleed background image */}
              <Image
                src={slide.imageUrl}
                alt={slide.title}
                fill
                className="object-cover object-center"
                priority
              />

              {/* Gradient overlay: dark on the left for text, fades right */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/65 to-black/20" />

              {/* Bottom vignette for depth */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

              {/* Content */}
              <div className="relative z-10 h-full w-[90%] lg:w-[80%] mx-auto flex items-center">
                <div className="max-w-lg space-y-5 py-16">
                  {/* Subtitle with accent bar */}
                  {slide.subtitle && (
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-[2px] bg-orange-400 flex-shrink-0" />
                      <p className="text-orange-400 font-semibold text-sm tracking-widest uppercase">
                        {slide.subtitle}
                      </p>
                    </div>
                  )}

                  {/* Title */}
                  <h2 className="text-white text-4xl md:text-5xl lg:text-6xl font-Oregano leading-tight">
                    {slide.title}
                  </h2>

                  {/* CTA */}
                  {slide.actionUrl && (
                    <div className="pt-2">
                      <Link
                        href={slide.actionUrl}
                        className="inline-flex items-center gap-2.5 px-8 py-4 bg-blue-600 text-white font-semibold rounded hover:bg-blue-500 active:scale-95 transition-all duration-200 text-base shadow-lg shadow-blue-900/40"
                      >
                        {slide.actionLabel || 'Shop Now'}
                        <MoveRight className="w-5 h-5" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dot navigation */}
      {slides.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
          {slides.map((_, index) => (
            <button
              key={`dot-${index}`}
              onClick={() => scrollTo(index)}
              className={`rounded-full transition-all duration-300 ${
                index === selectedIndex
                  ? 'w-7 h-2.5 bg-white'
                  : 'w-2.5 h-2.5 bg-white/35 hover:bg-white/60'
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
