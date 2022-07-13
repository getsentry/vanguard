import styled from "styled-components";

import useLocalStorage from "~/lib/useLocalStorage";
import Button from "~/components/button";
import ButtonGroup from "./button-group";
import ButtonLink from "./button-link";

const Container = styled.article`
  background: ${(p) => p.theme.bgLayer100};
  border: 1px solid ${(p) => p.theme.borderColor};
  color: ${(p) => p.theme.textColorSecondary};
  margin: 3rem 0;
  padding: 2rem;
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
          mode="primary"
          to="/about"
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
