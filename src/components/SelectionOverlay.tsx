import { useEffect, useRef, useState, MouseEvent } from "react";
import { Position } from "../types/selection";
import SelectionBox from "./selection-tool/SelectionBox";

interface SelectionOverlayProps {
  onSelectionComplete: (startPos: Position, endPos: Position) => void;
  onCancel: () => void;
}

const SelectionOverlay = ({ onSelectionComplete, onCancel }: SelectionOverlayProps) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<Position>({ x: 0, y: 0 });
  const [endPos, setEndPos] = useState<Position>({ x: 0, y: 0 });
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [onCancel]);

  const handleMouseDown = (e: MouseEvent) => {
    setIsDrawing(true);
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setStartPos({ x, y });
    setEndPos({ x, y });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDrawing) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setEndPos({ x, y });
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    onSelectionComplete(startPos, endPos);
  };

  return (
    <div
      ref={overlayRef}
      className="selection-overlay"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {isDrawing && (
        <SelectionBox
          startX={Math.min(startPos.x, endPos.x)}
          startY={Math.min(startPos.y, endPos.y)}
          width={Math.abs(endPos.x - startPos.x)}
          height={Math.abs(endPos.y - startPos.y)}
        />
      )}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-white px-4 py-2 rounded-full shadow-lg text-sm text-gray-600">
        Draw a rectangle around the text you want to analyze
      </div>
    </div>
  );
};

export default SelectionOverlay;