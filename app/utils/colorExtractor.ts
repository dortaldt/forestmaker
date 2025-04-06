/**
 * Extracts the average color from an image
 * @param imageUrl - URL of the image to extract color from
 * @returns Promise that resolves to the average color in hex format
 */
export const extractAverageColor = (imageUrl: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous'; // Handle CORS issues
    img.src = imageUrl;
    
    img.onload = () => {
      // Create canvas and context
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) {
        resolve('#808080'); // Default gray if canvas not supported
        return;
      }
      
      // Set canvas dimensions (use smaller dimensions for performance)
      const scaleFactor = 0.1;
      canvas.width = img.width * scaleFactor;
      canvas.height = img.height * scaleFactor;
      
      // Draw image on canvas
      context.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Get image data
      try {
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Calculate average color
        let totalR = 0, totalG = 0, totalB = 0;
        const pixelCount = data.length / 4;
        
        for (let i = 0; i < data.length; i += 4) {
          totalR += data[i];
          totalG += data[i + 1];
          totalB += data[i + 2];
        }
        
        // Get average values
        const avgR = Math.floor(totalR / pixelCount);
        const avgG = Math.floor(totalG / pixelCount);
        const avgB = Math.floor(totalB / pixelCount);
        
        // Convert to hex
        const hexColor = `#${avgR.toString(16).padStart(2, '0')}${avgG.toString(16).padStart(2, '0')}${avgB.toString(16).padStart(2, '0')}`;
        resolve(hexColor);
      } catch (error) {
        console.error('Error extracting color:', error);
        resolve('#808080'); // Default gray if error
      }
    };
    
    img.onerror = () => {
      resolve('#808080'); // Default gray if image fails to load
    };
  });
};

/**
 * Gets a darker version of a color
 * @param color - Hex color string
 * @param amount - Amount to darken (0-1)
 * @returns Darker hex color string
 */
export const getDarkerColor = (color: string, amount = 0.2): string => {
  // Remove # if present
  color = color.replace('#', '');
  
  // Parse the color
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);
  
  // Calculate darker values
  const darkerR = Math.max(0, Math.floor(r * (1 - amount)));
  const darkerG = Math.max(0, Math.floor(g * (1 - amount)));
  const darkerB = Math.max(0, Math.floor(b * (1 - amount)));
  
  // Convert back to hex
  return `#${darkerR.toString(16).padStart(2, '0')}${darkerG.toString(16).padStart(2, '0')}${darkerB.toString(16).padStart(2, '0')}`;
};

/**
 * Gets a lighter version of a color
 * @param color - Hex color string
 * @param amount - Amount to lighten (0-1)
 * @returns Lighter hex color string
 */
export const getLighterColor = (color: string, amount = 0.2): string => {
  // Remove # if present
  color = color.replace('#', '');
  
  // Parse the color
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);
  
  // Calculate lighter values (blend with white)
  const lighterR = Math.min(255, Math.floor(r + (255 - r) * amount));
  const lighterG = Math.min(255, Math.floor(g + (255 - g) * amount));
  const lighterB = Math.min(255, Math.floor(b + (255 - b) * amount));
  
  // Convert back to hex
  return `#${lighterR.toString(16).padStart(2, '0')}${lighterG.toString(16).padStart(2, '0')}${lighterB.toString(16).padStart(2, '0')}`;
}; 