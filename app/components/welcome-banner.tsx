import styled from "styled-components";

import useLocalStorage from "~/lib/useLocalStorage";
import ButtonGroup from "./button-group";
import ButtonLink from "./button-link";

const Container = styled.article`
  border: 1px solid ${(p) => p.theme.borderColor};
  background: ${(p) => p.theme.bgLayer100};
  color: ${(p) => p.theme.textColor};
  margin: 0 0 4rem;
  padding: 2rem;
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
          size="sm"
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
