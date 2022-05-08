import { Link } from "@remix-run/react";
import styled from "styled-components";
import Middot from "./middot";

export type Props = {
  version?: string;
  admin?: boolean;
};

const Footer = ({ version, admin }: Props) => {
  return (
    <FooterWrapper>
      <div>
        <span>Vanguard {version ? version.substring(0, 7) : ""}</span>
      </div>
      <div>
        {admin && (
          <Link to="/admin">Admin</Link>
        )}
        <Middot />
        <span>
          <a href="https://github.com/getsentry/vanguard">GitHub</a>
        </span>
      </div>
    </FooterWrapper>
  );
};

const FooterWrapper = styled.div`
  display: flex;
  margin: 6rem 0;
  font-size: 1.2rem;
  justify-content: space-between;
  color: ${(p) => p.theme.textColorSecondary};
`;

export default Footer;
