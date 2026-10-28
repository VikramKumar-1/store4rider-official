"use client";

import { useState } from "react";
import Image from "next/image";

interface ProductGalleryProps {
  images: any[]; // Assuming images match the product schema
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
        {images?.[selectedImage] ? (
          <Image 
            src={images[selectedImage].url} 
            alt={images[selectedImage].altText || `${productName} - Image ${selectedImage + 1}`} 
            fill 
            className="object-cover" 
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full text-zinc-400">No Image</div>
        )}
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {images?.map((img, idx) => (
          <button 
            key={idx} 
            onClick={() => setSelectedImage(idx)}
            className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${selectedImage === idx ? 'border-brand' : 'border-transparent'}`}
          >
            <Image 
              src={img.url} 
              alt={img.altText || `${productName} thumbnail ${idx + 1}`} 
              fill 
              className="object-cover" 
            />
          </button>
        ))}
      </div>
    </div>
  );
}
