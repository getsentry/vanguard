import { Link } from "@remix-run/react";
import Logo from "app/icons/Logo";
import IconHamburger from "app/icons/IconHamburger";
import Button from "./button";

export default function Header({
  user,
  showSidebar = false,
  handleSidebar,
}: {
  user?: any;
  showSidebar?: boolean;
  handleSidebar?: () => void;
}) {
  return (
    <div className="flex relative py-12 xl:py-18 justify-between items-center pr-20 xl:pr-0">
      <div>
        <Link to="/">
          <Logo
            height={32}
            className="text-primary-light dark:text-primary-dark"
          />
        </Link>
      </div>
      {!!user && (
        <div>
          <Button as={Link} to="/new-post" mode="primary" size="sm">
            + New Post
          </Button>
        </div>
      )}
      {!!handleSidebar && (
        <IconHamburger
          height={32}
          onClick={() => handleSidebar()}
          showSidebar={showSidebar}
        />
      )}
    </div>
  );
}
