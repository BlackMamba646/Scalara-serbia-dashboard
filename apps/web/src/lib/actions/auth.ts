"use server";

import { redirect } from "next/navigation";
import { checkPassword, setSessionCookie, clearSessionCookie } from "@/lib/auth";

export async function login(_prev: { error?: string } | null, formData: FormData) {
  const password = formData.get("password") as string;

  if (!process.env.AUTH_PASSWORD) {
    return { error: "AUTH_PASSWORD not configured on server" };
  }

  if (!checkPassword(password)) {
    return { error: "Invalid password" };
  }

  await setSessionCookie();
  redirect("/");
}

export async function logout() {
  await clearSessionCookie();
  redirect("/login");
}
