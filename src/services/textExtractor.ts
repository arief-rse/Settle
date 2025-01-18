import { createWorker } from "tesseract.js";
import { toast } from "sonner";
import { Position } from "../types/selection";

export const extractTextFromSelection = async (
  startPos: Position,
  endPos: Position
): Promise<string> => {
  const x = Math.min(startPos.x, endPos.x);
  const y = Math.min(startPos.y, endPos.y);
  const width = Math.abs(endPos.x - startPos.x);
  const height = Math.abs(endPos.y - startPos.y);

  if (width < 20 || height < 20) {
    throw new Error("Selection area too small");
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab.id) {
    throw new Error("No active tab found");
  }

  const dataUrl = await chrome.tabs.captureVisibleTab();
  const img = new Image();
  img.src = dataUrl;
  
  await new Promise((resolve) => {
    img.onload = resolve;
  });

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error("Failed to create canvas context");
  }

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

  const worker = await createWorker();
  const { data: { text } } = await worker.recognize(canvas);
  await worker.terminate();

  if (!text.trim()) {
    throw new Error("No text found in selection");
  }

  return text.trim();
};