export const PROFILE_FLASH_QUERY = {
  messageKey: "messageKey",
  errorKey: "errorKey",
} as const;

export const ProfileFlashMessageKey = {
  ProfileUpdated: "profileUpdated",
  PhotoUpdated: "photoUpdated",
} as const;

export type ProfileFlashMessageKey =
  (typeof ProfileFlashMessageKey)[keyof typeof ProfileFlashMessageKey];

export const ProfileFlashErrorKey = {
  ChooseImage: "chooseImage",
  ImageOnly: "imageOnly",
  MaxSize: "maxSize",
  SaveFailed: "saveFailed",
  UploadFailed: "uploadFailed",
} as const;

export type ProfileFlashErrorKey =
  (typeof ProfileFlashErrorKey)[keyof typeof ProfileFlashErrorKey];

export function isProfileFlashMessageKey(
  value: string
): value is ProfileFlashMessageKey {
  return Object.values(ProfileFlashMessageKey).includes(
    value as ProfileFlashMessageKey
  );
}

export function isProfileFlashErrorKey(
  value: string
): value is ProfileFlashErrorKey {
  return Object.values(ProfileFlashErrorKey).includes(
    value as ProfileFlashErrorKey
  );
}

