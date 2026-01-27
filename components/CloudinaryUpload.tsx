"use client";

import { useRef, ChangeEvent } from "react";

interface CloudinaryUploadProps {
  onUpload: (urls: string[]) => void;
  currentImages?: string[];
}

export default function CloudinaryUpload({ onUpload, currentImages = [] }: CloudinaryUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    // Process all files
    const filePromises = Array.from(files).map((file) => {
      return new Promise<string | null>((resolve) => {
        // Validate file type
        if (!validTypes.includes(file.type)) {
          alert(`${file.name} is not a valid image file`);
          resolve(null);
          return;
        }

        // Validate file size
        if (file.size > maxSize) {
          alert(`${file.name} is larger than 5MB`);
          resolve(null);
          return;
        }

        // Convert to base64
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.onerror = () => {
          alert(`Error reading ${file.name}`);
          resolve(null);
        };
        reader.readAsDataURL(file);
      });
    });

    // Wait for all files to be processed
    const results = await Promise.all(filePromises);
    const validImages = results.filter((img): img is string => img !== null);
    
    if (validImages.length > 0) {
      onUpload([...currentImages, ...validImages]);
    }
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleDelete = (index: number) => {
    const updatedImages = currentImages.filter((_, i) => i !== index);
    onUpload(updatedImages);
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-white mb-1">
        Product Images
      </label>
      
      {/* Images Grid */}
      {currentImages.length > 0 && (
        <div className="grid grid-cols-4 gap-3 mb-3">
          {currentImages.map((image, index) => (
            <div key={index} className="relative group">
              <div className="w-full h-32 rounded-lg overflow-hidden bg-white/10 flex items-center justify-center border-2 border-white/30">
                <img
                  src={image}
                  alt={`Product ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                type="button"
                onClick={() => handleDelete(index)}
                className="absolute top-1 right-1 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                title="Delete image"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              {index === 0 && (
                <div className="absolute bottom-1 left-1">
                  <span className="inline-block px-2 py-0.5 text-xs bg-purple-600 text-white rounded-full">
                    Primary
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      <div className="flex justify-center">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
          onChange={handleFileChange}
          multiple
          className="hidden"
        />
        <button
          type="button"
          onClick={handleClick}
          className="px-6 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors border border-white/30 flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <span>{currentImages.length > 0 ? 'Add More Images' : 'Upload Images'}</span>
        </button>
      </div>
      
      <p className="text-xs text-center text-white/70">
        Supported: JPG, PNG, GIF, WebP • Max 5MB each • First image will be primary
      </p>
    </div>
  );
}
