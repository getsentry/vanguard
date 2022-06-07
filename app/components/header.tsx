import { Link } from "@remix-run/react";
import styled from "styled-components";
import Logo from "app/icons/Logo";
import IconHamburger from "app/icons/IconHamburger";
import breakpoint from "styled-components-breakpoint";

const Header = (props) => {
  return (
    <HeaderWrapper>
      <div>
        <Link to="/">
          <Logo height={32} className="logo" />
        </Link>
      </div>
      <div>
        <Link to="/new-post" className="btn btn-primary">
          + New Post
        </Link>
      </div>
      <IconHamburger
        height={32}
        onClick={() => props.handleSidebar()}
        showSidebar={props.showSidebar}
      />
    </HeaderWrapper>
  );
};

const HeaderWrapper = styled.div`
  display: flex;
  padding: 6rem 0;
  justify-content: space-between;
  align-items: center;

  ${breakpoint("mobile", "desktop")`
    padding-right: 5rem;
  `}
`;

export default Header;
