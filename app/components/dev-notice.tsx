import { styled } from "styled-components";

const Message = styled.div`
  color: white;
  background: red;
  text-align: center;
  font-weight: bold;
  width: 100%;
  z-index: 100;
  position: absolute;
  padding: 0.75rem;
`;

export default function DevNotice() {
  return (
    <div>
      <Message>Vanguard is running in development mode.</Message>
      <div style={{ visibility: "hidden", padding: "0.75rem" }}>Text</div>
    </div>
  );
}
