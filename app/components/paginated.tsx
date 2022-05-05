import ButtonLink from "~/components/button-link";
import { PaginatedResult } from "~/lib/paginator";
import ButtonGroup from "./button-group";

interface PaginatedProps<T> {
  data: PaginatedResult<T>;
  render: (result: PaginatedResult<T>["result"]) => React.ElementType;
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
      <ButtonLink
        to={prevCursor ? `?cursor=${prevCursor}` : undefined}
        disabled={!prevCursor}
      >
        Prev Page
      </ButtonLink>
      <ButtonLink
        to={nextCursor ? `?cursor=${nextCursor}` : undefined}
        disabled={!nextCursor}
      >
        Next Page
      </ButtonLink>
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
