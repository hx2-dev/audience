import { cn } from "~/lib/utils";
import type { HTMLAttributes, ReactNode } from "react";

interface TypographyProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
}

export function H1({ children, className, ...props }: TypographyProps) {
  return (
    <h1
      className={cn(
        "scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl",
        className,
      )}
      {...props}
    >
      {children}
    </h1>
  );
}

export function H2({ children, className, ...props }: TypographyProps) {
  return (
    <h2
      className={cn(
        "scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0",
        className,
      )}
      {...props}
    >
      {children}
    </h2>
  );
}

export function H3({ children, className, ...props }: TypographyProps) {
  return (
    <h3
      className={cn(
        "scroll-m-20 text-2xl font-semibold tracking-tight",
        className,
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

export function H4({ children, className, ...props }: TypographyProps) {
  return (
    <h4
      className={cn(
        "scroll-m-20 text-xl font-semibold tracking-tight",
        className,
      )}
      {...props}
    >
      {children}
    </h4>
  );
}

export function P({ children, className, ...props }: TypographyProps) {
  return (
    <p
      className={cn("leading-7 [&:not(:first-child)]:mt-6", className)}
      {...props}
    >
      {children}
    </p>
  );
}

export function Blockquote({ children, className, ...props }: TypographyProps) {
  return (
    <blockquote
      className={cn("mt-6 border-l-2 pl-6 italic", className)}
      {...props}
    >
      {children}
    </blockquote>
  );
}

export function InlineCode({ children, className, ...props }: TypographyProps) {
  return (
    <code
      className={cn(
        "relative rounded-md bg-slate-200 px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold text-slate-900 dark:bg-slate-800 dark:text-slate-100",
        className,
      )}
      {...props}
    >
      {children}
    </code>
  );
}

export function Lead({ children, className, ...props }: TypographyProps) {
  return (
    <p className={cn("text-muted-foreground text-xl", className)} {...props}>
      {children}
    </p>
  );
}

export function Large({ children, className, ...props }: TypographyProps) {
  return (
    <div className={cn("text-lg font-semibold", className)} {...props}>
      {children}
    </div>
  );
}

export function Small({ children, className, ...props }: TypographyProps) {
  return (
    <small
      className={cn("text-sm leading-none font-medium", className)}
      {...props}
    >
      {children}
    </small>
  );
}

export function Muted({ children, className, ...props }: TypographyProps) {
  return (
    <p className={cn("text-muted-foreground text-sm", className)} {...props}>
      {children}
    </p>
  );
}

export function UL({ children, className, ...props }: TypographyProps) {
  return (
    <ul className={cn("my-6 ml-6 list-disc [&>li]:mt-2", className)} {...props}>
      {children}
    </ul>
  );
}

export function OL({ children, className, ...props }: TypographyProps) {
  return (
    <ol
      className={cn("my-6 ml-6 list-decimal [&>li]:mt-2", className)}
      {...props}
    >
      {children}
    </ol>
  );
}

export function LI({ children, className, ...props }: TypographyProps) {
  return (
    <li className={cn("", className)} {...props}>
      {children}
    </li>
  );
}

export function HR({ className, ...props }: Omit<TypographyProps, "children">) {
  return <hr className={cn("my-4 md:my-8", className)} {...props} />;
}

export function Pre({ children, className, ...props }: TypographyProps) {
  return (
    <pre
      className={cn(
        "mt-6 mb-4 overflow-x-auto rounded-lg bg-slate-900 p-4",
        className,
      )}
      {...props}
    >
      {children}
    </pre>
  );
}

export function Code({ children, className, ...props }: TypographyProps) {
  return (
    <code
      className={cn(
        "rounded-md bg-slate-950 px-[0.3rem] py-[0.2rem] font-mono text-sm text-white",
        className,
      )}
      {...props}
    >
      {children}
    </code>
  );
}

export function Strong({ children, className, ...props }: TypographyProps) {
  return (
    <strong className={cn("font-semibold", className)} {...props}>
      {children}
    </strong>
  );
}

export function Em({ children, className, ...props }: TypographyProps) {
  return (
    <em className={cn("italic", className)} {...props}>
      {children}
    </em>
  );
}

export function Link({
  children,
  className,
  href = "#",
  ...props
}: TypographyProps & { href?: string }) {
  return (
    <a
      href={href}
      className={cn(
        "text-primary font-medium underline underline-offset-4",
        className,
      )}
      {...props}
    >
      {children}
    </a>
  );
}

export function Table({ children, className, ...props }: TypographyProps) {
  return (
    <div className="my-6 w-full overflow-y-auto">
      <table className={cn("w-full", className)} {...props}>
        {children}
      </table>
    </div>
  );
}

export function THead({ children, className, ...props }: TypographyProps) {
  return (
    <thead className={cn("border-b", className)} {...props}>
      {children}
    </thead>
  );
}

export function TBody({ children, className, ...props }: TypographyProps) {
  return (
    <tbody className={cn("", className)} {...props}>
      {children}
    </tbody>
  );
}

export function TR({ children, className, ...props }: TypographyProps) {
  return (
    <tr className={cn("even:bg-muted m-0 border-t p-0", className)} {...props}>
      {children}
    </tr>
  );
}

export function TH({ children, className, ...props }: TypographyProps) {
  return (
    <th
      className={cn(
        "border px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right",
        className,
      )}
      {...props}
    >
      {children}
    </th>
  );
}

export function TD({ children, className, ...props }: TypographyProps) {
  return (
    <td
      className={cn(
        "border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right",
        className,
      )}
      {...props}
    >
      {children}
    </td>
  );
}
