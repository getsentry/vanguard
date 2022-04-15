import { createGlobalStyle } from 'styled-components'

const GlobalStyles = createGlobalStyle`
  *,
  ::before,
  ::after {
    box-sizing: border-box;
  }

  html {
    font-size: 62.5%;
    min-height: 100vh;
  }

  body {
    background: ${ p => p.theme.bgColor};
    font-size: 1.6rem;
    font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
    color: ${p => p.theme.textColor};
    min-height: 100vh;
    overflow-x: hidden;
  }

  .logo {
    color: ${p => p.theme.textColor};
  }

  .wrapper {
    min-height: 100vh;
  }

  #primary {
    flex: 1;
    padding-bottom: 6rem;
    margin-right: 40rem;
  }

  .container {
    width: 80%;
    max-width: 120rem;
    padding: 0 5rem;
    margin: 0 auto;
  }

  a {
    color: ${p => p.theme.linkColor};
  }

  /* Typography */

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    line-height: 1.2;
    font-weight: 600;
    margin-bottom: 2.4rem;
  }

  h1 {
    font-size: 3.75rem;
  }

  h2 {
    font-size: 3rem;
  }

  h3 {
    font-size: 2.6rem;
  }

  h4 {
    font-size: 2.25rem;
  }

  h5 {
    font-size: 1.875rem;
  }

  h6 {
    font-size: 1rem;
  }

  p,
  ul,
  ol,
  blockquote,
  form,
  table,
  pre {
    font-size: 1.8rem;
    margin-bottom: 3rem;
    line-height: 1.6;
  }

  ol, ul {
    list-style-position: outside;
    padding-left: 3.2rem;
  }

  li::marker {
    font-family: "IBM Plex Mono", mono;
    color: ${p => p.theme.textMuted};
  }

  ul li::marker {
    font-size: 2rem;
  }

  ol {
    list-style-type: number;
  }

  ul {
    list-style-type:disc;
  }

  pre,
  code {
    font-family: "IBM Plex Mono", monospace;
  }

  pre {
    white-space: pre-wrap; /* Since CSS 2.1 */
    white-space: -moz-pre-wrap; /* Mozilla, since 1999 */
    white-space: -pre-wrap; /* Opera 4-6 */
    white-space: -o-pre-wrap; /* Opera 7 */
    word-wrap: break-word; /* Internet Explorer 5.5+ */
  }

  /* Button */

  .btn {
    padding: 1.2rem 1.6rem;
    border-radius: 0.4rem;
    line-height: 1;
    display: inline-flex;
    align-items: center;
    font-family: "IBM Plex Mono", monospace;
    color: ${p => p.theme.textMuted};
  }

  .btn-primary {
    background: ${p => p.theme.button.primaryBackgroundColor};
    color: ${p => p.theme.button.primaryTextColor};
  }

  /* Forms */

  label {
    display: flex;
    flex-direction: column;
    margin-bottom: 2.4rem;
  
    span {
      margin-bottom: 1.2rem;
      font-weight: 500;
      font-family: "IBM Plex Mono", monospace;
      
  }

  input,
  textarea,
  select {
    background: ${p => p.theme.bgColor};
    border: 1px solid ${p => p.theme.borderColor};
    padding: 0.5rem 1rem;
    border-radius: 4px;
    display: block;
    font-family: "Inter", sans-serif;

    &:focus, &:focus-visible {
      border: 1px solid ${p => p.theme.borderFocusColor};
      outline-color: ${p => p.theme.borderFocusColor};
    }
  }

  

  /* Post */

  .post {
    padding: 2rem 0;
    position: relative;
  }

`

export default GlobalStyles;
