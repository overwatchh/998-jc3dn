import {
  AlertTriangle,
  CheckCircle,
  Clock,
  KeyRound,
  Navigation,
  XCircle,
} from "lucide-react"

interface Props {
  status: string
  verified: boolean
  locationAccuracy: number
}
export const CourseStatusIcon = ({
  locationAccuracy,
  status,
  verified,
}: Props) => {
  if (status === "present" && verified && locationAccuracy >= 95) {
    return (
      <div className="flex items-center">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <Navigation className="h-3 w-3 text-green-600 ml-1" />
        <KeyRound className="h-3 w-3 text-green-600 ml-1" />
      </div>
    )
  }
  if (status === "present" && verified) {
    return (
      <div className="flex items-center">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <KeyRound className="h-3 w-3 text-green-600 ml-1" />
      </div>
    )
  }
  switch (status) {
    case "present":
      return <CheckCircle className="h-4 w-4 text-green-600" />
    case "absent":
      return <XCircle className="h-4 w-4 text-red-600" />
    case "late":
      return <Clock className="h-4 w-4 text-blue-600" />
    case "partial":
      return <AlertTriangle className="h-4 w-4 text-amber-600" />
    default:
      return null
  }
}
