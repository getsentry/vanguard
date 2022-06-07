import { Link } from "@remix-run/react";
import styled, { css } from "styled-components";

import type { Category } from "~/models/category.server";
import IconShip from "~/icons/IconShip";
import IconEye from "~/icons/IconEye";

export const CategoryTag = ({ category }: { category: Category }) => {
  return (
    <CategoryTagWrapper to={`/c/${category.slug}`} colorHex={category.colorHex}>
      {category.slug === "shipped" && (
        <>
          <IconShip height={20} /> <span>{category.slug}</span>
        </>
      )}
      {category.slug === "strategy" && (
        <>
          <IconEye height={20} /> <span>{category.slug}</span>
        </>
      )}
    </CategoryTagWrapper>
  );
};

function hexToRgb(colorHex: string) {
  // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  colorHex = colorHex.replace(shorthandRegex, function (m, r, g, b) {
    return r + r + g + g + b + b;
  });

  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(colorHex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

function contrastColor(colorHex: string) {
  const rgb = hexToRgb(colorHex);
  if (!rgb) return "black";

  const brightness = Math.round(
    (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000
  );
  return brightness > 125 ? "black" : "#eeeeee";
}

export const categoryTagStyles = ({ colorHex }: { colorHex?: string }) => {
  return css`
    background: ${colorHex || "#eee"};
    color: ${contrastColor(colorHex || "#eeeeee")};
    border-color: ${colorHex || "#eee"}; ;
  `;
};

export const CategoryTagWrapper = styled(Link)`
  font-family: "IBM Flex Mono", monospace;
  display: inline-flex;
  gap: 0.8rem;
  justify-content: flex-end;
  align-items: center;
  padding: 0.8rem 1.6rem;
  border-radius: 3rem;
  margin-bottom: 1.6rem;
  height: 4rem;
  text-transform: uppercase;

  ${(props) => categoryTagStyles({ colorHex: props.colorHex })};
`;

export const CategoryTags = styled.div`
  display: flex;
  gap: 0.8rem;
  flex-wrap: wrap;
  margin-bottom: 2.4rem;
`;
