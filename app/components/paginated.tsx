import type { PaginatedResult } from "~/lib/paginator";
import ButtonGroup from "./button-group";
import Button from "./button";
import { Link } from "@remix-run/react";

interface PaginatedProps<T> {
  data: PaginatedResult<T>;
  render: (result: PaginatedResult<T>["result"]) => React.ReactNode;
  renderHeader?: boolean;
  renderFooter?: boolean;
}

const Paginated: React.FC<PaginatedProps<any>> = function Paginated({
  data: { result, nextCursor, prevCursor },
  render,
  renderHeader = false,
  renderFooter = true,
}) {
  const pagination = (
    <ButtonGroup align="center">
      <Button
        as={prevCursor ? Link : "button"}
        to={prevCursor ? `?cursor=${prevCursor}` : undefined}
        disabled={!prevCursor}
      >
        Prev Page
      </Button>
      <Button
        as={nextCursor ? Link : "button"}
        to={nextCursor ? `?cursor=${nextCursor}` : undefined}
        disabled={!nextCursor}
      >
        Next Page
      </Button>
    </ButtonGroup>
  );

  return (
    <div>
      {renderHeader && pagination}
      {render(result)}
      {renderFooter && pagination}
    </div>
  );
};

export default Paginated;
