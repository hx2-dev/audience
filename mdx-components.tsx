import type { MDXComponents } from "mdx/types";
import {
  Blockquote,
  Em,
  H1,
  H2,
  H3,
  H4,
  HR,
  LI,
  Link,
  OL,
  P,
  Pre,
  Strong,
  TBody,
  TD,
  TH,
  THead,
  TR,
  Table,
  UL,
} from "./src/components/ui/typography";

const components: MDXComponents = {
  h1: ({ children }) => <H1>{children}</H1>,
  h2: ({ children }) => <H2>{children}</H2>,
  h3: ({ children }) => <H3>{children}</H3>,
  h4: ({ children }) => <H4>{children}</H4>,
  p: ({ children }) => <P>{children}</P>,
  blockquote: ({ children }) => <Blockquote>{children}</Blockquote>,
  ul: ({ children }) => <UL>{children}</UL>,
  ol: ({ children }) => <OL>{children}</OL>,
  li: ({ children }) => <LI>{children}</LI>,
  hr: () => <HR />,
  pre: ({ children, ...props }) => <Pre {...props}>{children}</Pre>,
  strong: ({ children }) => <Strong>{children}</Strong>,
  em: ({ children }) => <Em>{children}</Em>,
  a: ({ href, children }) => <Link href={href}>{children}</Link>,
  table: ({ children }) => <Table>{children}</Table>,
  thead: ({ children }) => <THead>{children}</THead>,
  tbody: ({ children }) => <TBody>{children}</TBody>,
  tr: ({ children }) => <TR>{children}</TR>,
  th: ({ children }) => <TH>{children}</TH>,
  td: ({ children }) => <TD>{children}</TD>,
};

export function useMDXComponents(): MDXComponents {
  return components;
}
