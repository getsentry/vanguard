import styled from "styled-components";

import useLocalStorage from "~/lib/useLocalStorage";
import Button from "~/components/button";
import ButtonGroup from "./button-group";

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
        timely internal moments at Sentry. While the core of it is a simple
        blog, it's intending to continuously enable the culture of sharing what
        we're building at Sentry. Additionally we have recognized the need to
        create more long lasting moments out of things that are top of mind,
        which we're dubbing as 'Strategy' in this context. You'll see several
        historical posts by myself of this nature.
      </p>
      <ButtonGroup>
        <Button
          mode="primary"
          onClick={() => {
            setHideBanner(true);
          }}
        >
          Got it!
        </Button>
      </ButtonGroup>
    </Container>
  );
};

export default WelcomeBanner;
