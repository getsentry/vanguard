import useLocalStorage from "~/lib/useLocalStorage";
import ButtonGroup from "./button-group";
import Button from "./button";
import { Link } from "@remix-run/react";

// TODO: this needs customizable for non-Sentry uses
export default function WelcomeBanner() {
  const [hideBanner, setHideBanner] = useLocalStorage("banner", false, true);
  if (hideBanner) return null;

  return (
    <article className="mb-16 p-8 rounded-md border border-border-light dark:border-border-dark bg-layer100-light dark:bg-layer100-dark text-black dark:text-gray-100">
      <p className="mb-4">
        Vanguard has been designed to provide a way to create permanence around
        timely internal moments at Sentry.
      </p>
      <ButtonGroup>
        <Button
          as={Link}
          to="/about"
          mode="primary"
          size="sm"
          onClick={() => {
            setHideBanner(true);
          }}
        >
          Learn More
        </Button>
      </ButtonGroup>
    </article>
  );
}
