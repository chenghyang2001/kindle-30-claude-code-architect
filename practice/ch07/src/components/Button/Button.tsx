import type { ReactNode } from "react";
import styles from "./Button.module.css";

export interface ButtonProps {
  className?: string;
  children?: ReactNode;
}

export function Button({ className, children }: ButtonProps) {
  const rootClass = className ? `${styles.root} ${className}` : styles.root;
  return <div className={rootClass}>{children}</div>;
}
