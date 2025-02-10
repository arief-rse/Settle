export interface Position {
  x: number;
  y: number;
}

export interface SelectionBoxStyle {
  left: string;
  top: string;
  width: string;
  height: string;
}

export interface ExtractedContent {
  text: string;
  source: 'text' | 'image' | 'both';
}