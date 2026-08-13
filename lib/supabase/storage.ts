import type { SupabaseClient } from "@supabase/supabase-js";

const DEFAULT_AVATAR_BUCKET = "avatar";
const DEFAULT_AVATAR_FOLDER = "profiles";
const DEFAULT_TOUR_IMAGE_BUCKET = "tour-images";
const DEFAULT_TOUR_IMAGE_FOLDER = "tours";

export const AVATAR_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_AVATAR_BUCKET ?? DEFAULT_AVATAR_BUCKET;

export const AVATAR_FOLDER =
  process.env.NEXT_PUBLIC_SUPABASE_AVATAR_FOLDER ?? DEFAULT_AVATAR_FOLDER;

export const TOUR_IMAGE_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_TOUR_IMAGE_BUCKET ??
  DEFAULT_TOUR_IMAGE_BUCKET;

export const TOUR_IMAGE_FOLDER =
  process.env.NEXT_PUBLIC_SUPABASE_TOUR_IMAGE_FOLDER ??
  DEFAULT_TOUR_IMAGE_FOLDER;

export function getFileFromFormData(
  formData: FormData,
  key: string
): File | null {
  const value = formData.get(key);
  if (value instanceof File && value.size > 0) {
    return value;
  }
  return null;
}

function getFileExtension(fileName: string) {
  const lastDot = fileName.lastIndexOf(".");
  if (lastDot === -1) return "bin";
  const extension = fileName.slice(lastDot + 1).trim();
  if (!extension) return "bin";
  return extension.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function normalizeStoragePrefix(prefix: string) {
  const trimmed = prefix.trim();
  if (!trimmed) return "";
  return trimmed.replace(/^\/+/, "").replace(/\/+$/, "");
}

export function buildAvatarObjectPath(userId: string, fileName: string) {
  const folder = normalizeStoragePrefix(AVATAR_FOLDER);
  void fileName;
  // Keep a stable object key so each user has a single avatar object.
  // This avoids accumulating duplicate uploads under the user folder.
  const objectName = "avatar";
  return `${folder ? `${folder}/` : ""}${userId}/${objectName}`;
}

export function buildTourImageObjectPath(userId: string, fileName: string) {
  const folder = normalizeStoragePrefix(TOUR_IMAGE_FOLDER);
  const extension = getFileExtension(fileName);
  const objectId =
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const objectName = `${objectId}.${extension}`;
  return `${folder ? `${folder}/` : ""}${userId}/${objectName}`;
}

export async function uploadAvatarFile(
  supabase: SupabaseClient,
  userId: string,
  file: File
) {
  const objectPath = buildAvatarObjectPath(userId, file.name);
  const { error } = await supabase.storage.from(AVATAR_BUCKET).upload(
    objectPath,
    file,
    {
      upsert: true,
      contentType: file.type || undefined,
    }
  );

  if (error) {
    return { error };
  }

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(objectPath);
  return { publicUrl: data.publicUrl, objectPath };
}

export async function uploadTourImageFile(
  supabase: SupabaseClient,
  userId: string,
  file: File
) {
  const objectPath = buildTourImageObjectPath(userId, file.name);
  const { error } = await supabase.storage.from(TOUR_IMAGE_BUCKET).upload(
    objectPath,
    file,
    {
      upsert: false,
      contentType: file.type || undefined,
    }
  );

  if (error) {
    return { error };
  }

  const { data } = supabase.storage
    .from(TOUR_IMAGE_BUCKET)
    .getPublicUrl(objectPath);
  return { publicUrl: data.publicUrl, objectPath };
}
