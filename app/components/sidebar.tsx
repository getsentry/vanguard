import styled from "styled-components";

const Sidebar = (props) => (
  <SidebarWrapper>
    {props.children}
  </SidebarWrapper>
);

const SidebarWrapper = styled.div`
  position: fixed;
  width: 40rem;
  padding: 5.5rem 5rem;
  padding-bottom: 6rem;
  right: 0;
  top: 0;
  bottom: 0;

  &:after {
    content: "";
    display: block;
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: -10rem;
    background: ${p => p.theme.bgLayer100};
    transform: skewx(4deg);
    z-index: -1;
  }
`;

export default Sidebar;
