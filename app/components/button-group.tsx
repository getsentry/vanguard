import styled from "styled-components";

export default styled.div`
  display: flex;
  gap: 5px;
  justify-content: ${(props) =>
    props.align === "center" ? "center" : "flex-end"};
`;
