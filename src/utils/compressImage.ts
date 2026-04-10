import imageCompression from "browser-image-compression";

/**
 * Compresses an image file for optimized storage and fast loading.
 * Target: ~200-300KB
 */
export const compressImage = async (file: File) => {
  try {
    const options = {
      // If file is very large (> 2MB), be more aggressive (0.3MB target)
      // Otherwise, target 0.5MB
      maxSizeMB: file.size > 2 * 1024 * 1024 ? 0.3 : 0.5,
      maxWidthOrHeight: 1024,
      useWebWorker: true,
    };

    console.log(`Compressing ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)...`);
    const compressedFile = await imageCompression(file, options);
    console.log(`Compressed ${file.name} to ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);
    
    return compressedFile;
  } catch (error) {
    console.error("Compression failed for:", file.name, error);
    // Fallback to original file if compression fails
    return file;
  }
};
