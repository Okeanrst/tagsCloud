import React from 'react';

type DraggableTagAvatarProps = {
  label?: string;
  color?: string;
  fontSize?: number;
  display?: string;
};

export const DraggableTagAvatar = React.forwardRef<SVGTextElement, DraggableTagAvatarProps>(function DraggableTagAvatar(
  { label = '', color = 'black', fontSize = 8, display = 'none' },
  ref,
) {
  return (
    <text ref={ref} style={{ fill: color, fontSize, display }} textAnchor="middle">
      {label}
    </text>
  );
});
