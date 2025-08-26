import { RowDataPacket } from "mysql2";

export interface StudySessionIdRow extends RowDataPacket {
  study_session_id: number;
}
