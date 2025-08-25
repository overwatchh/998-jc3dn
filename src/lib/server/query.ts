/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from "./db";
import { RowDataPacket, ResultSetHeader, QueryError } from "mysql2";
import type {DatabaseTables} from "@/types/db-schema";

// Overload for SELECT queries
export async function rawQuery<T>(
  sql: string,
  values?: unknown[]
): Promise<T[]>;

// Overload for INSERT/UPDATE/DELETE queries
export async function rawQuery(
  sql: string,
  values?: unknown[]
): Promise<ResultSetHeader>;

// Implementation
export async function rawQuery(
  sql: string,
  values?: unknown[]
): Promise<RowDataPacket[] | ResultSetHeader> {
  try {
    const [result] = await db.query(sql, values);

    if (Array.isArray(result)) {
      return result as RowDataPacket[];
    }

    return result as ResultSetHeader;
  } catch (error: unknown) {
    if ((error as QueryError).code === "ER_DUP_ENTRY") {
      throw new Error("DUPLICATE_ENTRY");
    }
    throw error;
  }
}
