import { Link } from "@remix-run/react";

import type { Category } from "~/models/category.server";
import IconMegaphone from "~/icons/IconMegaphone";
import IconShip from "~/icons/IconShip";
import IconEye from "~/icons/IconEye";
import type { ComponentPropsWithoutRef } from "react";

const CategoryIcon = ({ category, ...props }: { category: Category }) => {
  // TODO: move into category config
  switch (category.slug) {
    case "shipped":
      return <IconShip {...props} />;
    case "sentry":
      return <IconEye {...props} />;
    case "conference":
      return <IconMegaphone {...props} />;
    default:
      return null;
  }
};

export default function CategoryTag({
  category,
  ...props
}: Omit<ComponentPropsWithoutRef<typeof Link>, "to"> & { category: Category }) {
  return (
    <Link
      className="category-tag print:hidden"
      {...props}
      to={`/c/${category.slug}`}
      style={categoryTagStyles(category.colorHex)}
    >
      <CategoryIcon category={category} height={20} />
      <span>{category.slug}</span>
    </Link>
  );
}

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
    (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000,
  );
  return brightness > 125 ? "black" : "#eeeeee";
}

export const categoryTagStyles = (colorHex?: string | null) => {
  if (!colorHex) colorHex = "#eeeeee";
  return {
    background: colorHex,
    color: contrastColor(colorHex),
    borderColor: colorHex,
  };
};

export function CategoryTags(props: ComponentPropsWithoutRef<"div">) {
  return <div className="flex gap-3 flex-wrap mb-12" {...props} />;
}
