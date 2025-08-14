import { createSwaggerSpec } from "next-swagger-doc";
const isProd = process.env.NODE_ENV === "production";
const productionURL = "https://jc3dn-qr-attendance-kosgs4isma-ts.a.run.app";
export const getApiDocs = async () => {
  const spec = createSwaggerSpec({
    apiFolder: "src/app/api",
    definition: {
      openapi: "3.0.0",
      info: {
        title: "Attendance checking APIs",
        version: "1.0.0",
      },
      servers: [
        {
          url: isProd ? productionURL : process.env.BASE_URL!,
          description: "Server URL",
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
          oauth2: {
            type: "oauth2",
            flows: {
              authorizationCode: {
                authorizationUrl: "https://example.com/oauth/authorize",
                tokenUrl: "https://example.com/oauth/token",
                scopes: {
                  "read:user": "Read user information",
                  "write:user": "Modify user information",
                },
              },
            },
          },
        },
      },
      security: [
        {
          bearerAuth: [],
        },
        {
          oauth2: ["read:user"],
        },
      ],
      tags: [
        {
          name: "Auth",
          description:
            "Authentication-related endpoints including login, signup, and session management.",
        },
        {
          name: "Student",
          description:
            "Endpoints accessible to students, including viewing courses, scanning QR codes, and checking attendance status.",
        },
        {
          name: "Lecturer",
          description:
            "Endpoints for lecturers to manage sessions, generate QR codes, and view student attendance.",
        },
        {
          name: "Admin",
          description:
            "Administrative endpoints for managing users, roles, courses, and system settings.",
        },
        {
          name: "Statistics",
          description:
            "Endpoints that provide analytical data and attendance statistics for both lecturers and admins.",
        },
      ],
    },
  });
  return spec;
};
