import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const AdminDashboard = () => {
  return (
    <div className="p-4 space-y-6 bg-background text-foreground">
      <h1 className="text-2xl font-bold">Lecturer Dashboard</h1>
      <Card>
        <CardHeader>
          <CardTitle>Welcome, Admin!</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            This is the admin&apos;s view. You can admin all over them. Tenoi
            tenoi tenoi peak peak tenoi tenoi tenoi tenoi tenoi
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
