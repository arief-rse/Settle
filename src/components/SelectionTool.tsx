import { useEffect } from "react";
import { toast } from "sonner";
import { Position } from "../types/selection";
import { extractTextFromSelection } from "../services/textExtractor";
import SelectionOverlay from "./SelectionOverlay";

interface SelectionToolProps {
  onComplete: (text: string) => void;
  onCancel: () => void;
}

const SelectionTool = ({ onComplete, onCancel }: SelectionToolProps) => {
  useEffect(() => {
    const injectOverlay = async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab.id) {
          await chrome.scripting.insertCSS({
            target: { tabId: tab.id },
            css: `
              .selection-overlay {
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.2);
                cursor: crosshair;
                z-index: 2147483647;
              }
              .selection-box {
                position: absolute;
                border: 2px solid #6366f1;
                background: rgba(99, 102, 241, 0.1);
              }
            `
          });
        }
      } catch (error) {
        console.error('Failed to inject overlay:', error);
        toast.error("Failed to initialize selection tool");
      }
    };

    injectOverlay();
  }, []);

  const handleSelectionComplete = async (startPos: Position, endPos: Position) => {
    const toastId = toast.loading("Processing selection...");

    try {
      const text = await extractTextFromSelection(startPos, endPos);
      toast.success("Text extracted successfully", { id: toastId });
      onComplete(text);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Failed to process selection", { id: toastId });
    }
  };

  return (
    <SelectionOverlay
      onSelectionComplete={handleSelectionComplete}
      onCancel={onCancel}
    />
  );
};

export default SelectionTool;