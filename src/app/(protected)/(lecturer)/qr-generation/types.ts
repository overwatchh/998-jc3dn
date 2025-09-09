export enum QRGenScreens {
  COURSE_SELECTION = "course-selection",
  QR_CODE_GENERATION = "qr-code-generation",
}

export interface SelectedCourse {
  sessionId: number;
  weekNumber: number;
}
