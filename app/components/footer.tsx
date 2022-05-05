import { Fragment } from "react";
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
        {admin && (
          <Fragment>
            <Middot />
            <Link to="/admin">Admin</Link>
          </Fragment>
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
  flex-direction: column;
  width: 100vw;
  padding: 6rem 0;
  justify-content: space-between;
  align-items: center;
  font-size: 1rem;
  color: ${(p) => p.theme.textColorSecondary};
`;

export default Footer;
