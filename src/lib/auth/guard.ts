import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "./session";

/** For admin pages. Non-admins get a 404 so the page's existence is not revealed. */
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") notFound();
  return user;
}
