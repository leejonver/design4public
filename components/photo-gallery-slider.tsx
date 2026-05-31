"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addCacheBuster } from "@/lib/utils";
import type { Tables } from "@/lib/database.types";

type ItemWithBrand = Tables<"items"> & { brands: Tables<"brands"> | null };

type PhotoWithItems = {
    id: string;
    image_url: string;
    alt_text: string | null;
    title: string | null;
    order: number;
    items: ItemWithBrand[];
};

type Props = {
    photos: PhotoWithItems[];
    projectTitle: string;
    projectSlug: string;
};

export function PhotoGallerySlider({ photos, projectTitle, projectSlug }: Props) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);

    const currentPhoto = photos[currentIndex];
    const hasMultiplePhotos = photos.length > 1;

    const goToNext = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % photos.length);
    }, [photos.length]);

    const goToPrev = useCallback(() => {
        setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
    }, [photos.length]);

    const goToIndex = useCallback((index: number) => {
        setCurrentIndex(index);
    }, []);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowLeft") goToPrev();
            if (e.key === "ArrowRight") goToNext();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [goToNext, goToPrev]);

    // Touch handling for swipe
    const minSwipeDistance = 50;

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;
        if (isLeftSwipe) goToNext();
        if (isRightSwipe) goToPrev();
    };

    if (photos.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 bg-muted rounded-lg">
                <p className="text-muted-foreground">이미지가 없습니다.</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Main Gallery Section */}
            <div className="flex flex-col lg:flex-row gap-3">
                {/* Image Viewer */}
                <div className="flex-1 relative">
                    <div
                        className="relative w-full aspect-[16/10] overflow-hidden rounded-lg bg-muted"
                        onTouchStart={onTouchStart}
                        onTouchMove={onTouchMove}
                        onTouchEnd={onTouchEnd}
                    >
                        <Image
                            src={addCacheBuster(currentPhoto?.image_url)}
                            alt={currentPhoto?.alt_text || projectTitle}
                            fill
                            priority={currentIndex === 0}
                            className="object-cover transition-opacity duration-300"
                            sizes="(max-width: 1024px) 100vw, calc(100vw - 18rem)"
                        />

                        {/* Navigation Arrows */}
                        {hasMultiplePhotos && (
                            <>
                                <button
                                    onClick={goToPrev}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
                                    aria-label="이전 이미지"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={goToNext}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
                                    aria-label="다음 이미지"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </>
                        )}

                        {/* Counter Badge */}
                        {hasMultiplePhotos && (
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-black/50 text-white text-xs">
                                {currentIndex + 1} / {photos.length}
                            </div>
                        )}
                    </div>
                </div>

                {/* Item Sidebar - IN THE PHOTO */}
                <div className="lg:w-32 shrink-0 self-stretch">
                    <div className="bg-gray-50 rounded-lg p-2 h-full flex flex-col max-h-full">
                        <h3 className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-2 shrink-0">
                            IN THE PHOTO
                        </h3>

                        <div className="flex-1 overflow-y-auto min-h-0">
                            {currentPhoto?.items && currentPhoto.items.length > 0 ? (
                                <div className="space-y-2">
                                    {currentPhoto.items.slice(0, 4).map((item: ItemWithBrand) => (
                                        <Link
                                            key={item.id}
                                            href={`/items/${item.slug}`}
                                            className="block group"
                                        >
                                            <div className="flex flex-col items-center p-2 rounded hover:bg-white transition-colors">
                                                {item.image_url && (
                                                    <div className="relative w-full aspect-square overflow-hidden rounded bg-white mb-2">
                                                        <Image
                                                            src={addCacheBuster(item.image_url)}
                                                            alt={item.name}
                                                            fill
                                                            className="object-contain group-hover:scale-105 transition-transform"
                                                            sizes="128px"
                                                        />
                                                    </div>
                                                )}
                                                <p className="text-xs font-medium text-gray-900 text-center leading-tight group-hover:text-sage-600 line-clamp-2">
                                                    {item.name}
                                                </p>
                                                {item.brands && (
                                                    <p className="text-[11px] text-gray-500 text-center">
                                                        {item.brands.name_ko}
                                                    </p>
                                                )}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-gray-400">
                                    연결된 아이템 없음
                                </p>
                            )}
                        </div>

                        {currentPhoto?.items && currentPhoto.items.length > 4 && (
                            <p className="text-[10px] text-gray-400 text-center pt-1 shrink-0">
                                +{currentPhoto.items.length - 4} more
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Thumbnail Navigation */}
            {hasMultiplePhotos && (
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                    {photos.map((photo, index) => (
                        <button
                            key={photo.id}
                            onClick={() => goToIndex(index)}
                            className={`relative shrink-0 w-16 h-10 rounded overflow-hidden border-2 transition-all ${index === currentIndex
                                ? "border-sage-600 opacity-100"
                                : "border-transparent opacity-60 hover:opacity-100"
                                }`}
                            aria-label={`이미지 ${index + 1}로 이동`}
                        >
                            <Image
                                src={addCacheBuster(photo.image_url)}
                                alt={`썸네일 ${index + 1}`}
                                fill
                                className="object-cover"
                                sizes="64px"
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
