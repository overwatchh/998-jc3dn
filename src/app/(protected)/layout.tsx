import { BottomNavigation } from "@/components/bottom-navigation"

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="pb-20">
      {children}
      <BottomNavigation />
    </div>
  )
}
