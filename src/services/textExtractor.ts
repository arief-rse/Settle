import { createWorker } from "tesseract.js";
import { Position } from "../types/selection";

export const extractTextFromSelection = async (
  startPos: Position,
  endPos: Position
): Promise<string> => {
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

    // Get the current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab.id) {
      throw new Error("No active tab found");
    }

    // Capture the visible tab
    const dataUrl = await chrome.tabs.captureVisibleTab();
    const img = new Image();
    img.src = dataUrl;
    
    // Wait for image to load
    await new Promise((resolve) => {
      img.onload = resolve;
    });

    // Create canvas and get context
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error("Failed to create canvas context");
    }

    // Draw the selected portion of the screenshot
    ctx.drawImage(
      img,
      x + window.scrollX,
      y + window.scrollY,
      width,
      height,
      0,
      0,
      width,
      height
    );

    // Initialize Tesseract worker
    const worker = await createWorker();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');

    // Recognize text from the canvas
    const { data: { text } } = await worker.recognize(canvas);
    await worker.terminate();

    const trimmedText = text.trim();
    if (!trimmedText) {
      throw new Error("No text found in selection");
    }

    return trimmedText;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to extract text from selection');
  }
};