export type ScanState =
  | "scanning"
  | "qr-success"
  | "location-verify"
  | "waiting-for-window"
  | "confirmation-active"
  | "confirming-presence"
  | "final-success"
  | "window-expired"
  | "error";

export interface CourseInfo {
  name: string;
  location: string;
  time: string;
  instructor: string;
}

export interface BaseScanScreenProps {
  courseInfo: CourseInfo;
}

export interface ScanningScreenProps extends BaseScanScreenProps {
  _onRetry?: () => void;
}

export interface LocationVerifyScreenProps extends BaseScanScreenProps {
  locationAccuracy: number;
  locationStatus: "checking" | "verified" | "failed";
}

export interface ConfirmationScreenProps extends BaseScanScreenProps {
  timeRemaining: number;
  onConfirm: () => void;
}

export interface ExpiredScreenProps extends BaseScanScreenProps {
  onRetry: () => void;
}

export interface ErrorScreenProps extends BaseScanScreenProps {
  onRetry: () => void;
}

export type ScanScreenProps = BaseScanScreenProps &
  Partial<{
    onRetry: () => void;
    onProceed: () => void;
    locationAccuracy: number;
    locationStatus: "checking" | "verified" | "failed";
    timeRemaining: number;
    onConfirm: () => void;
  }>;
