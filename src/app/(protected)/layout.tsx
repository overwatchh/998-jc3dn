import { BottomNavigation } from "@/components/bottom-navigation";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col grow pb-20">
      {children}
      <BottomNavigation />
    </div>
  );
}
