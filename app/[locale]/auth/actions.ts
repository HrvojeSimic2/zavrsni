"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getFileFromFormData, uploadAvatarFile } from "@/lib/supabase/storage";

type MessageType = "error" | "message";

function isDebugEnabled() {
  return process.env.SUPABASE_DEBUG === "1";
}

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

function getConfiguredSiteUrl() {
  const value =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.SITE_URL ??
    process.env.VERCEL_URL;

  if (!value) return null;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  // Handle VERCEL_URL which is typically host without protocol.
  return `https://${value}`;
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
  const avatarFile = getFileFromFormData(formData, "avatarFile");
  const avatarUrl = avatarFile ? "" : getString(formData, "avatarUrl");
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

  const configuredSiteUrl = getConfiguredSiteUrl();
  const origin = configuredSiteUrl ?? (await getOrigin());
  const callbackUrl = `${origin}/${locale}/auth/callback?next=${encodeURIComponent(
    redirectTo
  )}`;

  if (isDebugEnabled()) {
    console.log("[auth.signUpAction] redirect context", {
      locale,
      redirectTo,
      origin,
      callbackUrl,
    });
  }

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

  if (avatarFile && data.session?.user) {
    try {
      await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });
    } catch (sessionError) {
      console.warn("[auth.signUpAction] session sync failed", sessionError);
    }

    const uploadResult = await uploadAvatarFile(
      supabase,
      data.session.user.id,
      avatarFile
    );

    const uploadError = "error" in uploadResult ? uploadResult.error : null;
    const publicUrl = "publicUrl" in uploadResult ? uploadResult.publicUrl : null;

    if (!uploadError && publicUrl) {
      const cacheBustedUrl = `${publicUrl}?v=${Date.now()}`;
      await Promise.allSettled([
        supabase.auth.updateUser({
          data: { avatar_url: cacheBustedUrl },
        }),
        supabase
          .from("profiles")
          .update({ avatar_url: cacheBustedUrl })
          .eq("id", data.session.user.id),
      ]);
    } else {
      console.warn(
        "[auth.signUpAction] avatar upload failed",
        uploadError?.message ?? uploadError
      );
    }
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
