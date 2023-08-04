import type { ComponentPropsWithoutRef } from "react";
import * as styles from "./sidebar.css";

export const Sidebar = (
  props: ComponentPropsWithoutRef<"div"> & {
    showSidebar: boolean;
  },
) => <div className={styles.wrapper} {...props} />;

export const SidebarSection = (props: ComponentPropsWithoutRef<"div">) => (
  <div className={styles.section} {...props} />
);
