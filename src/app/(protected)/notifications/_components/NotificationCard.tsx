import { Card, CardContent } from "@/components/ui/card";
import { NotificationIcon } from "./NotificationIcon";
import { INotification } from "./mockdata";

interface Props {
  notification: INotification;
}

export const NotificationCard = ({ notification }: Props) => {
  return (
    <Card
      key={notification.id}
      className={
        notification.unread
          ? "dark:bg-card border-blue-200 bg-blue-50 text-gray-600 dark:border-slate-400 dark:text-white"
          : ""
      }
    >
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className="mt-1 flex-shrink-0">
            <NotificationIcon type={notification.type} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{notification.title}</p>
              {notification.unread && (
                <div className="h-2 w-2 rounded-full bg-blue-600"></div>
              )}
            </div>
            <p className="mt-1 text-sm">{notification.description}</p>
            <p className="mt-2 text-xs text-gray-500">
              {notification.timestamp}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
