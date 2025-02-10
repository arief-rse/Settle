import { createWorker } from "tesseract.js";
import { Position } from "../types/selection";

interface ExtractedContent {
  text: string;
  source: 'text' | 'image' | 'both';
  imageData?: string;
  coordinates: { left: number; top: number; right: number; bottom: number };
}

async function captureAndCropScreenshot(rect: { x: number; y: number; width: number; height: number }) {
  return new Promise<string>((resolve, reject) => {
    chrome.runtime.sendMessage({ 
      type: 'CAPTURE_VISIBLE_TAB'
    }, async (response) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else if (response?.error) {
        reject(new Error(response.error));
      } else if (response?.dataUrl) {
        try {
          // Create a new image from the screenshot
          const img = new Image();
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = response.dataUrl;
          });

          // Create canvas for cropping
          const canvas = document.createElement('canvas');
          canvas.width = rect.width;
          canvas.height = rect.height;
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            throw new Error("Failed to create canvas context");
          }

          // Draw only the selected portion
          ctx.drawImage(
            img,
            rect.x,
            rect.y,
            rect.width,
            rect.height,
            0,
            0,
            rect.width,
            rect.height
          );

          resolve(canvas.toDataURL());
        } catch (error) {
          reject(error);
        }
      } else {
        reject(new Error('Failed to capture screenshot'));
      }
    });
  });
}

export const extractTextFromSelection = async (
  startPos: Position,
  endPos: Position,
  viewportCoords: { left: number; top: number; right: number; bottom: number }
): Promise<ExtractedContent> => {
  try {
    const x = Math.min(startPos.x, endPos.x);
    const y = Math.min(startPos.y, endPos.y);
    const width = Math.abs(endPos.x - startPos.x);
    const height = Math.abs(endPos.y - startPos.y);

    // Minimum dimensions to avoid errors
    const MIN_DIMENSION = 20;
    if (width < MIN_DIMENSION || height < MIN_DIMENSION) {
      throw new Error("Selection area too small. Please make a larger selection.");
    }

    // Get elements in the selection area
    const elements = document.elementsFromPoint(x + width/2, y + height/2);
    
    let textContent = '';
    let hasImages = false;
    let hasText = false;
    let imageData: string | undefined;

    // Extract text from text nodes
    const textNodes: Text[] = [];
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          const rect = node.parentElement?.getBoundingClientRect();
          if (rect && 
              rect.left <= x + width &&
              rect.right >= x &&
              rect.top <= y + height &&
              rect.bottom >= y) {
            return NodeFilter.FILTER_ACCEPT;
          }
          return NodeFilter.FILTER_REJECT;
        }
      }
    );

    let node: Text | null;
    while ((node = walker.nextNode() as Text)) {
      textNodes.push(node);
    }

    if (textNodes.length > 0) {
      hasText = true;
      textContent = textNodes
        .map(node => node.textContent)
        .filter(Boolean)
        .join(' ')
        .trim();
    }

    // Find images in selection area
    const images = elements.filter(el => 
      el instanceof HTMLImageElement || 
      (el instanceof HTMLElement && window.getComputedStyle(el).backgroundImage !== 'none')
    );

    if (images.length > 0) {
      hasImages = true;
      
      // Capture and crop the screenshot
      imageData = await captureAndCropScreenshot({
        x: x + window.scrollX,
        y: y + window.scrollY,
        width,
        height
      });

      // Create canvas for OCR
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error("Failed to create canvas context");
      }

      // Load the cropped image
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageData!;
      });

      // Draw the cropped image
      ctx.drawImage(img, 0, 0);

      // Initialize Tesseract worker
      const worker = await createWorker();
      await worker.loadLanguage('eng');
      await worker.initialize('eng');

      // Recognize text from the canvas
      const { data: { text: ocrText } } = await worker.recognize(canvas);
      await worker.terminate();

      if (ocrText.trim()) {
        textContent = textContent ? `${textContent}\n${ocrText.trim()}` : ocrText.trim();
      }
    }

    if (!textContent && !imageData) {
      throw new Error("No content found in selection");
    }

    return {
      text: textContent || '',
      source: hasText && hasImages ? 'both' : hasImages ? 'image' : 'text',
      imageData: hasImages ? imageData : undefined,
      coordinates: viewportCoords
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to extract content from selection');
  }
};