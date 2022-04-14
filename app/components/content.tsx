import styled from "styled-components";

const Content = styled.div`
  pre {
    background: var(--gray100);
    padding: 20px;
    border-radius: 4px;
  }

  blockquote {
    padding: 0 3rem;
    border-left: 8px solid var(--gray200);
    color: var(--gray500);
    p {
      font-size: 3rem;
      font-family: "IBM Plex Mono", monospace;
    }
  }

  img {
    max-width: 100%;
    display: block;
    margin-bottom: 3rem;
  }
`;
export default Content;
