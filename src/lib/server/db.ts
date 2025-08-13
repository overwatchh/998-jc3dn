import mysql from "mysql2/promise";

export const db = mysql.createPool({    
  socketPath: `/cloudsql/${process.env.INSTANCE_CONNECTION_NAME}`,
  user: process.env.DB_USER!,
  password: process.env.DB_PASS!,
  database: process.env.DB_NAME!,
});
