import * as React from "react";
import { SVGProps } from "react";
import styled, { css } from "styled-components";
import breakpoint from "styled-components-breakpoint";

const IconHamburger = (props: SVGProps<SVGSVGElement>) => (
  <StyledSvg fill="none" viewBox="0 0 32 32" {...props}>
    <path
      className="hamburger-top"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      d="M5 9h22"
    />
    <path
      className="hamburger-middle-front"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      d="M5 16h22"
    />
    <path
      className="hamburger-middle-back"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      d="M5 16h22"
    />
    <path
      className="hamburger-bottom"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      d="M5 23h22"
    />
  </StyledSvg>
);

const StyledSvg = styled.svg`
  position: absolute;
  z-index: 1000;

  .hamburger-top,
  .hamburger-bottom {
    opacity: 1;
  }

  path {
    transition: all 0.2s ease-in-out;
    transform-origin: center;
  }

  ${(p) =>
    p.showSidebar &&
    css`
      .hamburger-top,
      .hamburger-bottom {
        opacity: 0;
      }
      .hamburger-top {
        transform: translateY(4px);
      }
      .hamburger-bottom {
        transform: translateY(-4px);
      }
      .hamburger-middle-front {
        transform: rotate(-45deg);
      }
      .hamburger-middle-back {
        transform: rotate(45deg);
      }
    `}

  ${breakpoint("mobile", "desktop")`
    right: 2rem;
  `}

  ${breakpoint("desktop")`
    right: 5rem;
    display: none;
  `}
`;

export default IconHamburger;
