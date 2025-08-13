import mysql from "mysql2/promise";

export const db = mysql.createPool({
  host: '35.197.171.70',
  user: 'root',
  password: 'JC3DNstrong@Password',
  database: 'qr_attendance_app',
  socketPath: '/cloudsql/project-capstone-468109:australia-southeast1:jc3dn-998-db'
});
