import { z } from "zod";

export const email = z.string().trim().toLowerCase().email("Enter a valid email address.").max(254);
export const newPassword = z
  .string()
  .min(10, "Password must be at least 10 characters.")
  .max(128, "Password is too long.");
export const code = z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code.");
export const purpose = z.enum(["VERIFY_EMAIL", "PASSWORD_RESET"]);
