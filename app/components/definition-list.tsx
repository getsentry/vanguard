import styled from "styled-components";

export const DefinitionList = styled.dl`
  display: flex;
  flex-flow: row wrap;

  dt,
  dd {
    margin: 5px 0;
  }

  dt {
    flex-basis: 20%;
    padding-right: 5px;
    font-weight: bold;
  }

  dd {
    flex-basis: 70%;
    flex-grow: 1;
  }
`;

export default DefinitionList;
