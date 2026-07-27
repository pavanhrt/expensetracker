"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface AuthFormState {
  status: "idle" | "sent" | "error";
  message?: string;
}

/**
 * Single action backing both the sign-in and create-account forms on the
 * login page — which one runs is picked by the hidden "mode" field.
 */
export async function authenticate(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const mode = String(formData.get("mode") || "login");
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const name = String(formData.get("name") || "").trim();

  if (!email || !password) {
    return { status: "error", message: "Enter both email and password." };
  }

  const supabase = await createClient();

  if (mode === "signup") {
    if (password.length < 6) {
      return { status: "error", message: "Password must be at least 6 characters." };
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) return { status: "error", message: error.message };

    if (!data.session) {
      // Only happens if "Confirm email" is still on in Supabase — turn it off
      // in Authentication settings to skip email entirely for signup.
      return {
        status: "sent",
        message: `Account created. Check ${email} to confirm before signing in.`,
      };
    }
    redirect("/dashboard");
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { status: "error", message: error.message };
  redirect("/dashboard");
}
