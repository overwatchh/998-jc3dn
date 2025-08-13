/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from "./db";

export async function rawQuery<T>(sql: string, values?: any[]): Promise<T[]> {
  try {
    const [rows] = await db.query(sql, values);
    return rows as T[];
  } catch (error: any) {
    if (error.code === "ER_DUP_ENTRY") {
      throw new Error("DUPLICATE_ENTRY");
    }
    throw error;
  }
}
