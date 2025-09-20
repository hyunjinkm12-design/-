import React from 'react';

export const PaletteIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4.098 19.902a3.75 3.75 0 0 0 5.304 0l6.401-6.402a3.75 3.75 0 0 0-5.304-5.304L4.098 14.6a3.75 3.75 0 0 0 0 5.304Zm-1.06-1.061a5.25 5.25 0 0 1 0-7.424L7.62 6.02a5.25 5.25 0 0 1 7.424 0l6.402 6.402a5.25 5.25 0 0 1 0 7.424l-6.402 6.402a5.25 5.25 0 0 1-7.424 0L3.038 18.84Z"
    />
  </svg>
);