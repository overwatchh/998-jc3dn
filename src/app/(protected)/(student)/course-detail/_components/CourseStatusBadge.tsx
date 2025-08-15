import { Badge } from "@/components/ui/badge"
import { QrCode, KeyRound } from "lucide-react"

interface Props {
  status: string
  verified: boolean
  locationAccuracy: number
}

export const CourseStatusBadge = ({
  locationAccuracy,
  status,
  verified,
}: Props) => {
  const baseClasses = "flex items-center gap-1"

  switch (status) {
    case "present":
      return (
        <Badge
          className={`border-transparent bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800 ${baseClasses}`}
        >
          Present
          {verified && <QrCode className="h-3 w-3" />}
          {locationAccuracy >= 95 && <KeyRound className="h-3 w-3" />}
          2/2
        </Badge>
      )
    case "absent":
      return <Badge variant="destructive">Absent 0/2</Badge>
    case "late":
      return (
        <Badge
          className={`border-transparent bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800 ${baseClasses}`}
        >
          Late {verified && <KeyRound className="h-3 w-3" />} 1/2
        </Badge>
      )
    case "partial":
      return (
        <Badge className="border-transparent bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900 dark:text-amber-200 dark:hover:bg-amber-800">
          Partial
        </Badge>
      )
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}
