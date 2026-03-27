'use client';

import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import useLayout from '../../../hooks/use-layout';
import Image from 'next/image';
import { MoveRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from '../../../i18n/navigation';
import { cn } from '../../../lib/utils';

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
  const [animationKey, setAnimationKey] = useState(0);

  const slides: SlideData[] = (layout?.heroSlides ?? [])
    .filter((s: SlideData & { isActive?: boolean }) => s.isActive !== false)
    .sort(
      (a: SlideData & { order?: number }, b: SlideData & { order?: number }) =>
        (a.order ?? 0) - (b.order ?? 0)
    );

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    const newIndex = emblaApi.selectedScrollSnap();
    if (newIndex !== selectedIndex) {
      setAnimationKey((prev) => prev + 1);
    }
    setSelectedIndex(newIndex);
  }, [emblaApi, selectedIndex]);

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

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  return (
    <section className="relative w-full group">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className="flex-[0_0_100%] min-w-0 relative h-[580px] lg:h-[800px]"
            >
              {/* Full-bleed background image with Ken Burns zoom-out effect */}
              <div className="absolute inset-0 overflow-hidden">
                <div
                  key={index === selectedIndex ? `active-${animationKey}` : `inactive-${index}`}
                  className={cn(
                    "absolute inset-0 w-full h-full",
                    index === selectedIndex && "motion-safe:animate-hero-zoom-out"
                  )}
                >
                  <Image
                    src={slide.imageUrl}
                    alt={slide.title}
                    fill
                    className="object-cover object-center"
                    priority
                    sizes="100vw"
                  />
                </div>
              </div>

              {/* Gradient overlay: dark on the left for text, fades right */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/65 to-black/20" />

              {/* Bottom vignette for depth */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

              {/* Content with staggered entrance animations */}
              <div className="relative z-10 h-full w-[90%] lg:w-[80%] mx-auto flex items-center">
                <div className="max-w-lg space-y-5 py-16" key={`content-${selectedIndex}-${animationKey}`}>
                  {/* Subtitle with accent bar - animated entrance */}
                  {slide.subtitle && (
                    <div
                      className={cn(
                        "flex items-center gap-3",
                        index === selectedIndex && "motion-safe:animate-slide-up motion-safe:[animation-delay:100ms] motion-safe:opacity-0 motion-safe:[animation-fill-mode:forwards]"
                      )}
                    >
                      <span className="w-8 h-[2px] bg-orange-400 flex-shrink-0" />
                      <p className="text-orange-400 font-semibold text-sm tracking-widest uppercase">
                        {slide.subtitle}
                      </p>
                    </div>
                  )}

                  {/* Title - animated entrance */}
                  <h2
                    className={cn(
                      "text-white text-4xl md:text-5xl lg:text-6xl font-Oregano leading-tight",
                      index === selectedIndex && "motion-safe:animate-slide-up motion-safe:[animation-delay:200ms] motion-safe:opacity-0 motion-safe:[animation-fill-mode:forwards]"
                    )}
                  >
                    {slide.title}
                  </h2>

                  {/* CTA - animated entrance */}
                  {slide.actionUrl && (
                    <div
                      className={cn(
                        "pt-2",
                        index === selectedIndex && "motion-safe:animate-slide-up motion-safe:[animation-delay:300ms] motion-safe:opacity-0 motion-safe:[animation-fill-mode:forwards]"
                      )}
                    >
                      <Link
                        href={slide.actionUrl}
                        className="group/btn inline-flex items-center gap-2.5 px-8 py-4 bg-blue-600 text-white font-semibold rounded hover:bg-blue-500 active:scale-95 transition-all duration-200 text-base shadow-lg shadow-blue-900/40"
                      >
                        {slide.actionLabel || 'Shop Now'}
                        <MoveRight className="w-5 h-5 transition-transform duration-200 group-hover/btn:translate-x-1" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Arrow Navigation - always visible on mobile, full opacity on hover */}
      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={scrollPrev}
            className="absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-all duration-300 opacity-70 hover:opacity-100 hover:scale-110"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            type="button"
            onClick={scrollNext}
            className="absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-all duration-300 opacity-70 hover:opacity-100 hover:scale-110"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Dot navigation - expanded hit area (44px) with inner visual dot */}
      {slides.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center z-10 px-2 py-1 rounded-full bg-black/20 backdrop-blur-sm">
          {slides.map((_, index) => (
            <button
              type="button"
              key={`dot-${index}`}
              onClick={() => scrollTo(index)}
              className="flex items-center justify-center p-3"
              aria-label={`Go to slide ${index + 1}`}
            >
              <span
                className={cn(
                  "block rounded-full transition-all duration-300",
                  index === selectedIndex
                    ? "w-8 h-3 bg-white shadow-lg shadow-white/30"
                    : "w-3 h-3 bg-white/40 hover:bg-white/70"
                )}
              />
            </button>
          ))}
        </div>
      )}

      {/* Progress bar at bottom */}
      {slides.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 z-10 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-500"
            style={{
              width: `${((selectedIndex + 1) / slides.length) * 100}%`,
            }}
          />
        </div>
      )}
    </section>
  );
};

export default Hero;
