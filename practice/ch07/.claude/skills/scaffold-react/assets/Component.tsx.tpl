import type { ReactNode } from "react";
import styles from "./{{Name}}.module.css";

export interface {{Name}}Props {
  className?: string;
  children?: ReactNode;
}

export function {{Name}}({ className, children }: {{Name}}Props) {
  const rootClass = className ? `${styles.root} ${className}` : styles.root;
  return <div className={rootClass}>{children}</div>;
}
