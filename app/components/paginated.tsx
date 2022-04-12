import ButtonLink from "~/components/button-link";
import { PaginatedResult } from "~/lib/paginator";

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
    <div className="inline-flex">
      <ButtonLink
        to={prevCursor ? `?cursor=${prevCursor}` : undefined}
        disabled={!prevCursor}
        className="rounded-l bg-gray-300 py-2 px-4 font-bold text-gray-800 hover:bg-gray-400"
      >
        Prev Page
      </ButtonLink>
      <ButtonLink
        to={nextCursor ? `?cursor=${nextCursor}` : undefined}
        disabled={!nextCursor}
        className="rounded-r bg-gray-300 py-2 px-4 font-bold text-gray-800 hover:bg-gray-400"
      >
        Next Page
      </ButtonLink>
    </div>
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
