import styled from "styled-components";

const Content = styled.div`
  blockquote,
  p,
  pre,
  ul,
  ol {
    margin: 30px 0;
  }

  pre {
    white-space: pre-wrap; /* Since CSS 2.1 */
    white-space: -moz-pre-wrap; /* Mozilla, since 1999 */
    white-space: -pre-wrap; /* Opera 4-6 */
    white-space: -o-pre-wrap; /* Opera 7 */
    word-wrap: break-word; /* Internet Explorer 5.5+ */
    background: #eee;
    padding: 20px;
  }

  blockquote {
    padding: 0 20px;
    font-style: italic;
    border-left: 10px solid #eee;
  }

  pre,
  code {
    font-family: monospace;
  }

  img {
    max-width: 100%;
    display: block;
    margin: 30px 0;
  }
`;
export default Content;
