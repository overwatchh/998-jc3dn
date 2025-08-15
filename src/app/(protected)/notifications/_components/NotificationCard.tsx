import { Card, CardContent } from "@/components/ui/card"
import { NotificationIcon } from "./NotificationIcon"
import { INotification } from "./mockdata"

interface Props {
  notification: INotification
}

export const NotificationCard = ({ notification }: Props) => {
  return (
    <Card
      key={notification.id}
      className={
        notification.unread
          ? "border-blue-200 bg-blue-50 dark:border-slate-400 dark:bg-card text-gray-600 dark:text-white"
          : ""
      }
    >
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 mt-1">
            <NotificationIcon type={notification.type} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium ">{notification.title}</p>
              {notification.unread && (
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              )}
            </div>
            <p className="text-sm mt-1">{notification.description}</p>
            <p className="text-xs text-gray-500 mt-2">
              {notification.timestamp}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
