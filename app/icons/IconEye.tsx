import * as React from "react";
import type { SVGProps } from "react";

const IconEye = (props: SVGProps<SVGSVGElement>) => (
  <svg
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    {...props}
  >
    <path
      d="M10 4C4.387 4 1.631 8.763 1.097 9.802a.426.426 0 0 0 0 .396C1.631 11.237 4.387 16 10 16s8.368-4.763 8.903-5.802a.426.426 0 0 0 0-.396C18.369 8.763 15.613 4 10 4Z"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle
      cx={10}
      cy={10}
      r={3}
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default IconEye;
