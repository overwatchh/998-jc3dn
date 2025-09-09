import { Loader } from "lucide-react";

export const LoadingScreen = () => {
  return (
    <div className="flex grow items-center justify-center">
      <Loader className="animate-spin" />
    </div>
  );
};
