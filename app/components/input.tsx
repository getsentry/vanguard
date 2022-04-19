import styled from 'styled-components';
import IconSearch from '~/icons/IconSearch';

const Input = (props) => (
  <InputWrapper variant={props.variant}>
    {props.variant === "search" && <InputIcon><IconSearch height={18} /></InputIcon>}
    <StyledInput placeholder={props.placeholder} />
  </InputWrapper>
);

const InputWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: ${(p) => p.theme.bgColor};
  border: 1px solid ${(p) => p.theme.borderColor};
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-family: "Inter", sans-serif;

  &:focus-within {
    border: 1px solid ${(p) => p.theme.borderFocusColor};
    outline - color: ${(p) => p.theme.borderFocusColor};
  }
  
  ${p => p.variant === "search" &&
    `border-radius: 20rem;`
  }
`;

const StyledInput = styled.input`
    width: 100%;
    background: transparent;
    &::placeholder {
      color: ${(p) => p.theme.textMuted};
    }
    &:focus, &:focus-visible, &:active {
      border: 0;
      outline: 0;
    }
`;

const InputIcon = styled.div`
  color: ${(p) => p.theme.textMuted};
`;

export default Input;
