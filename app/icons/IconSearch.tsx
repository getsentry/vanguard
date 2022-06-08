import * as React from "react";
import type { SVGProps } from "react";

const IconSearch = (props: SVGProps<SVGSVGElement>) => (
  <svg
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    {...props}
  >
    <path
      d="M9.25 15.25a6 6 0 1 0 0-12 6 6 0 0 0 0 12Zm7.5 1.5-3.263-3.263"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default IconSearch;
