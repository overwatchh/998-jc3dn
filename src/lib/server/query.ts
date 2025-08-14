import { db } from "./db";
import { RowDataPacket } from "mysql2";

interface QueryError {
  code: string;
}

export async function rawQuery<T extends RowDataPacket>(
  sql: string,
  values?: unknown[],
): Promise<T[]> {
  try {
    const [rows] = await db.query(sql, values);
    if (Array.isArray(rows)) {
      return rows as T[];
    }
    return [];
  } catch (error: unknown) {
    if ((error as QueryError).code === "ER_DUP_ENTRY") {
      throw new Error("DUPLICATE_ENTRY");
    }
    throw error;
  }
}
