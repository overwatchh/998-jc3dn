import mysql from "mysql2/promise";

const isProd = process.env.NODE_ENV === "production";
const useLocalDB = process.env.USE_LOCAL_DB === "true" || !isProd;

export const db = mysql.createPool(
  useLocalDB
    ? {
        host: process.env.DB_HOST!,
        user: process.env.DB_USER!,
        password: process.env.DB_PASS!,
        database: process.env.DB_NAME!,
        connectionLimit: 5,
        maxIdle: 5,
        idleTimeout: 60000,
        queueLimit: 0,
      }
    : {
        socketPath: `/cloudsql/${process.env.GCP_PROJECT_ID}:${process.env.GCP_REGION}:${process.env.DB_INSTANCE}`,
        user: process.env.DB_USER!,
        password: process.env.DB_PASS!,
        database: process.env.DB_NAME!,
        connectionLimit: 5,
        maxIdle: 5,
        idleTimeout: 60000,
        queueLimit: 0,
      }
);
