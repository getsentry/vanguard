import { Link } from "@remix-run/react";
import styled from "styled-components";
import Logo from "app/icons/Logo";

const Header = () => {
  return (
    <HeaderWrapper>
      <Link to="/">
        <Logo height={32} className="logo" />
      </Link>
    </HeaderWrapper>
  )
};

const HeaderWrapper = styled.div`
  display: flex;  
  padding: 6rem 0;
  justify-content: space-between;
  align-items: center;
`;

const ThemeToggle = styled.input``;

export default Header;
