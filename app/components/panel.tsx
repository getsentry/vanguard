import styled from "styled-components";

export const Panel = styled.section`
  margin: 3rem 0;
  border: 1px solid ${(p) => p.theme.borderColor};
  padding: 1.5rem 1.5rem 0;
  border-radius: 4px;

  form,
  ul {
    margin-bottom: 1.5rem;
  }
`;

export const Title = styled.h6`
  border-bottom: 1px solid ${(p) => p.theme.borderColor};
  background: ${(p) => p.theme.bgLayer100};
  padding: 1.5rem;
  margin: -1.5rem -1.5rem 1.5rem;
  border-radius: 3px 3px 0 0;
`;

export default Panel;
