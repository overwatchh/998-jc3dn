import mysql from "mysql2/promise";

const isProd = process.env.NODE_ENV === "production";
export const db = mysql.createPool(
  isProd
    ? {
        socketPath: `/cloudsql/${process.env.GCP_PROJECT_ID}:${process.env.GCP_REGION}:${process.env.DB_INSTANCE}`,
        user: process.env.DB_USER!,
        password: process.env.DB_PASS!,
        database: process.env.DB_NAME!,
      }
    : {
        host: process.env.DB_HOST!,
        user: process.env.DB_USER!,
        password: process.env.DB_PASS!,
        database: process.env.DB_NAME!,
      }
);
