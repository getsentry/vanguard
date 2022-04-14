import { Link } from "@remix-run/react";
import styled from "styled-components";

import type { Category } from "~/models/category.server";
import IconShip from "~/icons/IconShip";

const CategoryTag = ({ category }: { category: Category }) => {
  return (
    <TagWrapper to={`/c/${category.slug}`}>
      <IconShip height={20} />
    </TagWrapper>
  );
};

const TagWrapper = styled(Link)`
  font-family: "IBM Flex Mono", monospace;
  display: flex;
  gap: 0.8rem;
  justify-content: flex-end;
  align-items: center;
  background: var(--purple);
  color: var(--white);
  padding: 0.8rem 1.6rem;
  border-radius: 3rem;
  margin-bottom: 1.6rem;
  position: absolute;
  right: calc(100% + 4rem);
  top: 2.4rem;
  width: 100rem;
  height: 4rem;
  text-transform: uppercase;
`;

export default CategoryTag;
