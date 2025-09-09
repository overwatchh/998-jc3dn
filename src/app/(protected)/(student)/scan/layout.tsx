export default function ScanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-background text-foreground min-h-screen">
      <div className="container mx-auto max-w-md space-y-6 p-4">{children}</div>
    </div>
  );
}
