import { AlertTriangle, Info, Bell } from "lucide-react"

interface Props {
  type: string
}

export const NotificationIcon = ({ type }: Props) => {
  switch (type) {
    case "warning":
      return <AlertTriangle className="h-5 w-5 text-amber-600" />
    case "info":
      return <Info className="h-5 w-5 text-blue-600" />
    case "system":
      return <Bell className="h-5 w-5 text-green-600" />
    default:
      return <Bell className="h-5 w-5 text-gray-600" />
  }
}
