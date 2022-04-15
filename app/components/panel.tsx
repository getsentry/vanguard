import styled from "styled-components";

export const Panel = styled.section`
  margin: 3rem 0;
  border: 1px solid ${p => p.theme.borderColor};
  padding: 1.5rem 1.5rem 0;

  form,
  ul {
    margin-bottom: 1.5rem;
  }
`;

export const Title = styled.h6`
  border-bottom: 1px solid ${p => p.theme.borderColor};
  padding: 1.5rem;
  margin: -1.5rem -1.5rem 1.5rem;
`;

export default Panel;
