"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function loginDocs(formData: FormData) {
  const password = formData.get("password");
  const validPass = process.env.DOCS_PASS;

  if (!validPass) {
    return { error: "DOCS_PASS is not configured on the server. Access Denied." };
  }

  if (password === validPass) {
    // Set a secure HTTP-only cookie that lasts for 7 days
    const cookieStore = await cookies();
    cookieStore.set("docs_auth_session", "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });
    
    // Redirect back to the docs dashboard
    redirect("/docs");
  }

  return { error: "Incorrect Password! Access Denied." };
}
