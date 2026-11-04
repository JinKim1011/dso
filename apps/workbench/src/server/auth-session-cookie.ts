import { securityEnvironment } from "./config";

export const SESSION_COOKIE = {
  name: securityEnvironment.sessionCookieName,
  httpOnly: true,
  secure: securityEnvironment.nodeEnv === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 8 * 60 * 60,
};
