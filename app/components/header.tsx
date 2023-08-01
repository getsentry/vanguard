import { Link } from "@remix-run/react";
import styled from "styled-components";
import Logo from "app/icons/Logo";
import IconHamburger from "app/icons/IconHamburger";
import { breakpoint } from "~/lib/breakpoints";

const Header = ({ user, showSidebar, handleSidebar }) => {
  return (
    <HeaderWrapper>
      <div>
        <Link to="/">
          <Logo height={32} className="logo" />
        </Link>
      </div>
      {!!user && (
        <div>
          <Link to="/new-post" className="btn btn-primary">
            + New Post
          </Link>
        </div>
      )}
      <IconHamburger
        height={32}
        onClick={() => handleSidebar()}
        showSidebar={showSidebar}
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
