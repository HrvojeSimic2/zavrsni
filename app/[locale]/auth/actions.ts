"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type MessageType = "error" | "message";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function getOrigin() {
  const headersList = await headers();
  const origin = headersList.get("origin");
  if (origin) {
    return origin;
  }

  const host =
    headersList.get("x-forwarded-host") ?? headersList.get("host") ?? "";
  const protocol = headersList.get("x-forwarded-proto") ?? "http";

  return host ? `${protocol}://${host}` : "http://localhost:3000";
}

function safePath(path: string, fallback: string) {
  if (path.startsWith("/")) {
    return path;
  }
  return fallback;
}

function redirectWithMessage(path: string, type: MessageType, message: string) {
  const params = new URLSearchParams();
  params.set(type, message);
  redirect(`${path}?${params.toString()}`);
}

export async function signInAction(formData: FormData) {
  const email = getString(formData, "email");
  const password = getString(formData, "password");
  const locale = getString(formData, "locale") || "en";
  const redirectTo = safePath(
    getString(formData, "redirectTo") || `/${locale}`,
    `/${locale}`
  );

  if (!email || !password) {
    return redirectWithMessage(
      `/${locale}/auth/sign-in`,
      "error",
      "Email and password are required."
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return redirectWithMessage(
      `/${locale}/auth/sign-in`,
      "error",
      error.message
    );
  }

  redirect(redirectTo);
}

export async function signUpAction(formData: FormData) {
  const fullName = getString(formData, "fullName");
  const avatarUrl = getString(formData, "avatarUrl");
  const email = getString(formData, "email");
  const password = getString(formData, "password");
  const confirmPassword = getString(formData, "confirmPassword");
  const locale = getString(formData, "locale") || "en";
  const redirectTo = safePath(
    getString(formData, "redirectTo") || `/${locale}`,
    `/${locale}`
  );

  if (!email || !password) {
    return redirectWithMessage(
      `/${locale}/auth/sign-up`,
      "error",
      "Email and password are required."
    );
  }

  if (!fullName) {
    return redirectWithMessage(
      `/${locale}/auth/sign-up`,
      "error",
      "Full name is required."
    );
  }

  if (password !== confirmPassword) {
    return redirectWithMessage(
      `/${locale}/auth/sign-up`,
      "error",
      "Passwords do not match."
    );
  }

  const origin = await getOrigin();
  const callbackUrl = `${origin}/${locale}/auth/callback?next=${encodeURIComponent(
    redirectTo
  )}`;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        avatar_url: avatarUrl || null,
        locale,
      },
      emailRedirectTo: callbackUrl,
    },
  });

  if (error) {
    return redirectWithMessage(
      `/${locale}/auth/sign-up`,
      "error",
      error.message
    );
  }

  if (data.session) {
    redirect(redirectTo);
  }

  redirectWithMessage(
    `/${locale}/auth/sign-in`,
    "message",
    "Check your email to confirm your account."
  );
}

export async function forgotPasswordAction(formData: FormData) {
  const email = getString(formData, "email");
  const locale = getString(formData, "locale") || "en";

  if (!email) {
    return redirectWithMessage(
      `/${locale}/auth/forgot-password`,
      "error",
      "Email is required."
    );
  }

  const origin = await getOrigin();
  const nextPath = `/${locale}/auth/update-password`;
  const callbackUrl = `${origin}/${locale}/auth/callback?next=${encodeURIComponent(
    nextPath
  )}`;

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: callbackUrl,
  });

  if (error) {
    return redirectWithMessage(
      `/${locale}/auth/forgot-password`,
      "error",
      error.message
    );
  }

  redirectWithMessage(
    `/${locale}/auth/forgot-password`,
    "message",
    "If an account exists, we will send a reset link."
  );
}

export async function updatePasswordAction(formData: FormData) {
  const password = getString(formData, "password");
  const confirmPassword = getString(formData, "confirmPassword");
  const locale = getString(formData, "locale") || "en";

  if (!password) {
    return redirectWithMessage(
      `/${locale}/auth/update-password`,
      "error",
      "Password is required."
    );
  }

  if (password !== confirmPassword) {
    return redirectWithMessage(
      `/${locale}/auth/update-password`,
      "error",
      "Passwords do not match."
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return redirectWithMessage(
      `/${locale}/auth/update-password`,
      "error",
      error.message
    );
  }

  redirectWithMessage(
    `/${locale}/auth/sign-in`,
    "message",
    "Password updated. Please sign in."
  );
}
