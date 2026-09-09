/**
 * Convert a File object to a base64 data URI.
 * Used for uploading images to vision models via OpenRouter.
 */
export async function fileToBase64DataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Ensure the data URI has the proper MIME type prefix
      if (result.startsWith('data:')) {
        resolve(result);
      } else {
        // Fallback: prepend the MIME type if not already present
        resolve(`data:${file.type || 'image/jpeg'};base64,${result.split(',')[1]}`);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Validate that a file is a supported image format.
 */
export function isValidImageFile(file: File): boolean {
  const validMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  
  const mimeOk = validMimeTypes.includes(file.type);
  const extOk = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));
  
  return mimeOk && extOk;
}

/**
 * Get a human-readable file size string.
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
