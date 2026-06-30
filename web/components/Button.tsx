import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "ghost" | "outline" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-gradient-to-r from-neon to-neon-2 text-grid-bg font-semibold shadow-[0_0_22px_-4px_rgba(25,230,193,0.7)] hover:shadow-[0_0_30px_-2px_rgba(25,230,193,0.9)] hover:brightness-110",
  outline:
    "border border-neon/50 text-neon hover:bg-neon/10 hover:border-neon",
  ghost: "text-muted hover:text-grid-fg hover:bg-white/5",
  danger:
    "border border-os/50 text-os hover:bg-os/10 hover:border-os",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-5 text-sm",
  lg: "h-12 px-7 text-base",
};

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-md font-medium tracking-wide uppercase transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer";

function classes(variant: Variant, size: Size, className?: string) {
  return `${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className ?? ""}`;
}

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: CommonProps & ComponentProps<"button">) {
  return (
    <button className={classes(variant, size, className)} {...props}>
      {props.children}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  href,
  children,
  ...props
}: CommonProps & ComponentProps<typeof Link>) {
  return (
    <Link href={href} className={classes(variant, size, className)} {...props}>
      {children}
    </Link>
  );
}
