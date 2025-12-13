export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="mx-auto max-w-prose p-4">{children}</div>;
}
