import styled from "styled-components";

const Content = styled.div`
  pre {
    // this needs paired up w/ sentry-prism theme
    background: #000;
    color: #fff;
    padding: 20px;
    border-radius: 4px;
  }

  blockquote {
    padding: 0 3rem;
    border-left: 8px solid ${(p) => p.theme.borderColor};
    color: ${(p) => p.theme.textColorSecondary};
    p {
      font-size: 3rem;
      font-family: "IBM Plex Mono", monospace;
    }
  }

  img {
    max-width: 100%;
    display: block;
    margin-bottom: 3rem;
    border-radius: 4px;
    box-shadow: 0px 25px 25px 0px rgba(0, 0, 0, 0.06);
  }

  figure {
    display: flex;
    align-items: center;
    flex-direction: column;
    margin-bottom: 3rem;

    > img {
      margin-bottom: 0;
    }

    > figcaption {
      font-size: 0.9em;
      margin-top: 0;
      text-align: center;
      color: ${(p) => p.theme.textColorSecondary};
    }
  }
`;
export default Content;
