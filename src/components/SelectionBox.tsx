import { SelectionBoxStyle } from "../types/selection";

interface SelectionBoxProps {
  style: SelectionBoxStyle;
}

const SelectionBox = ({ style }: SelectionBoxProps) => {
  return <div className="selection-box" style={style} />;
};

export default SelectionBox;