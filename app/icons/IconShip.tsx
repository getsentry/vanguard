import * as React from "react";
import { SVGProps } from "react";

const IconShip = (props: SVGProps<SVGSVGElement>) => (
  <svg
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    {...props}
  >
    <path
      d="m17 14 2-4-4-.889M10 8v5m0-5L5 9.111M10 8l5 1.111M3 14l-2-4 4-.889m0 0L4 4h4m7 5.111L16 4h-4m0 0V1H8v3m4 0H8M1 18l1.245-.498a2.57 2.57 0 0 1 2.38.248v0a2.57 2.57 0 0 0 3.36-.446l.035-.04a2.631 2.631 0 0 1 3.96 0l.036.04a2.57 2.57 0 0 0 3.36.446v0a2.57 2.57 0 0 1 2.38-.248L19 18"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default IconShip;
