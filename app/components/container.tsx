import styled from "styled-components";
import breakpoint from 'styled-components-breakpoint';

export default styled.div`
  max-width: 120rem;
  margin: 0 auto;

  ${breakpoint('mobile', 'desktop')`
    padding: 0 2rem;
  `}

  ${breakpoint('desktop')`
    width: 80%;
    padding: 0 5rem;
  `}
`;
