import React from "react";
import styled from "styled-components";

import Container from "./container";

const FormActionsContainer = styled.div`
  position: fixed;
  background: #eee;
  padding: 1.5rem 0;
  bottom: 0;
  left: 0;
  right: 0;
`;

const FormActionsWrapper = styled.div`
  margin-right: 40rem;
  text-align: right;
`;

const FormActions: React.FC<{}> = ({ children }) => {
  return (
    <FormActionsContainer>
      <FormActionsWrapper>
        <Container>{children}</Container>
      </FormActionsWrapper>
    </FormActionsContainer>
  );
};

export default FormActions;
