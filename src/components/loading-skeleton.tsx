import { Loader } from "lucide-react";

export const LoadingScreen = () => {
  return (
    <div className="flex grow justify-center items-center">
      <Loader className="animate-spin" />
    </div>
  );
};
