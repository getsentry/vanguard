import styled, { css } from "styled-components";
import breakpoint from "styled-components-breakpoint";

const Sidebar = (props) => (
  <SidebarWrapper showSidebar={props.showSidebar}>
    {props.children}
  </SidebarWrapper>
);

const SidebarWrapper = styled.div`
  position: fixed;
  width: 40rem;
  padding: 6rem 5rem;
  padding-bottom: 6rem;
  top: 0;
  bottom: 0;
  transition: all 0.2s ease-in-out;

  &:after {
    content: "";
    display: block;
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: -10rem;
    background: ${(p) => p.theme.bgLayer100};
    transform: skewx(4deg);
    z-index: -1;
  }

  ${breakpoint("mobile", "desktop")`
    right: -100%;
    &:after {
      box-shadow: 0 5px 40px rgba(0, 0, 0, .08), 0 5px 20px rgba(0, 0, 0, .05);
    }

    ${(p) =>
      p.showSidebar &&
      css`
        right: 0;
      `}
  `}

  ${breakpoint("desktop")`
    // Always show sidebar on desktop
    right: 0;
  `}
`;

const SidebarSection = styled.div`
  margin-bottom: 3.2rem;
`;

export { Sidebar, SidebarSection };
