import { Link } from "@remix-run/react";
import styled from "styled-components";

export type Props = {
  version?: string;
};

const Footer = (props: Props) => {
  return (
    <FooterWrapper>
      <div>
        Vanguard {props.version || ""} &mdash;{" "}
        <a href="https://github.com/getsentry/vanguard">GitHub</a>
      </div>
    </FooterWrapper>
  );
};

const FooterWrapper = styled.div`
  display: flex;
  flex-direction: column;
  padding: 6rem 0;
  justify-content: space-between;
  align-items: center;
  font-size: 1rem;
  color: ${(p) => p.theme.textColorSecondary};
`;

export default Footer;
