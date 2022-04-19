import { Link } from "@remix-run/react";
import styled from "styled-components";

import type { Category } from "~/models/category.server";
import IconShip from "~/icons/IconShip";
import IconEye from "~/icons/IconEye";

const CategoryTag = ({ category }: { category: Category }) => {
  return (
    <TagWrapper to={`/c/${category.slug}`} category={category.slug}>
      {category.slug === "shipped" && <><IconShip height={20} /> <span>{category.slug}</span></>}
      {category.slug === "strategy" && <><IconEye height={20} /> <span>{category.slug}</span></>}
    </TagWrapper>
  );
};

const handleTagColor = (props) => {
  console.log(props);
  switch (props.category) {
    case "shipped":
      return `color: ${props.theme.categories.shipped.textColor}; background: ${props.theme.categories.shipped.bgColor}`;
    case "strategy":
      return `color: ${props.theme.categories.strategy.textColor}; background: ${props.theme.categories.strategy.bgColor}`;
    default:
      return "color: #000; background: #eee;";
  }
};

const TagWrapper = styled(Link)`
  font-family: "IBM Flex Mono", monospace;
  display: flex;
  gap: 0.8rem;
  justify-content: flex-end;
  align-items: center;
  padding: 0.8rem 1.6rem;
  border-radius: 3rem;
  margin-bottom: 1.6rem;
  height: 4rem;
  text-transform: uppercase;

  ${props => handleTagColor(props)};
`;

const CategoryTags = styled.div`
  display: flex;
  gap: 0.8rem;
  flex-wrap: wrap;
  margin-bottom: 2.4rem;
`;

export { TagWrapper, CategoryTag, CategoryTags };
