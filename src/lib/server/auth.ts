import { betterAuth } from "better-auth";
import { db } from "./db";

export const auth = betterAuth({
  database: db,
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      prompt: "select_account",
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      mapProfileToUser: profile => {
        return {
          firstName: profile.given_name,
          lastName: profile.family_name,
        };
      },
    },
    // TODO: replace google with microsoft
    // TODO: update login page design
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID as string,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET as string,
      // Optional
      tenantId: "aab4897d-5f99-4439-b442-c204c65875b5", // UOW tenantId
      prompt: "select_account", // Forces account selection
    },
  },
  // custom field for user table
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "student",
        input: false, // don't allow user to set role
      },
    },
  },
});
