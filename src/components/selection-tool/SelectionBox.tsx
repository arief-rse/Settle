import { FC } from 'react';

interface SelectionBoxProps {
  startX: number;
  startY: number;
  width: number;
  height: number;
}

const SelectionBox: FC<SelectionBoxProps> = ({ startX, startY, width, height }) => {
  return (
    <div
      style={{
        position: 'absolute',
        left: `${startX}px`,
        top: `${startY}px`,
        width: `${width}px`,
        height: `${height}px`,
        border: '2px solid #007bff',
        background: 'rgba(0, 123, 255, 0.1)',
        pointerEvents: 'none',
      }}
    />
  );
};

export default SelectionBox