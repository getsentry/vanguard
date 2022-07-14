import styled from "styled-components";

import useLocalStorage from "~/lib/useLocalStorage";
import ButtonGroup from "./button-group";
import ButtonLink from "./button-link";

const Container = styled.article`
  background: ${(p) => p.theme.borderColor};
  border: 4px solid ${(p) => p.theme.borderColor};
  color: ${(p) => p.theme.textColor};
  margin: 3rem 0;
  padding: 1rem;
  border-radius: 4px;

  p {
    margin-bottom: 1rem;
  }
`;

// TODO: this needs customizable for non-Sentry uses
const WelcomeBanner = () => {
  const [hideBanner, setHideBanner] = useLocalStorage("banner", false, true);
  if (hideBanner) return null;

  return (
    <Container>
      <p>
        Vanguard has been designed to provide a way to create permanence around
        timely internal moments at Sentry.
      </p>
      <ButtonGroup>
        <ButtonLink
          to="/about"
          mode="primary"
          onClick={() => {
            setHideBanner(true);
          }}
        >
          Learn More
        </ButtonLink>
      </ButtonGroup>
    </Container>
  );
};

export default WelcomeBanner;
