/**
 * Keys for the flash banners and thrown errors of the guide dashboard flows.
 *
 * Same contract as `auth-flash.ts`: actions hand over a key, the page resolves
 * it against `GuideDashboard.status` / `GuideDashboard.errors` with
 * `resolveFlash`. Keys that take a number are redirected together with an `n`
 * query param carrying it.
 */
export const GuideFlashStatus = {
  Saved: "saved",
  SlotsOpened: "slotsOpened",
  SlotRemoved: "slotRemoved",
} as const;

export type GuideFlashStatus =
  (typeof GuideFlashStatus)[keyof typeof GuideFlashStatus];

export const GuideFlashError = {
  // Profile
  CheckForm: "checkForm",
  RateInvalid: "rateInvalid",
  GroupSizeInvalid: "groupSizeInvalid",
  NameTooShort: "nameTooShort",
  NoGuideProfile: "noGuideProfile",
  ClaimBeforeEditing: "claimBeforeEditing",
  YearsRange: "yearsRange",
  PhotoMustBeImage: "photoMustBeImage",
  PhotoTooLarge: "photoTooLarge",
  PhotoUploadFailed: "photoUploadFailed",
  ProfileSaveFailed: "profileSaveFailed",
  // Slots
  ClaimBeforeSlots: "claimBeforeSlots",
  SlotNotYours: "slotNotYours",
  CheckSlotTimes: "checkSlotTimes",
  EndBeforeStart: "endBeforeStart",
  EndTimeBeforeStartTime: "endTimeBeforeStartTime",
  DatesInPast: "datesInPast",
  NoDatesMatched: "noDatesMatched",
  RangeTooLong: "rangeTooLong",
  SlotPolicyMissing: "slotPolicyMissing",
  SaveSlotsFailed: "saveSlotsFailed",
  SlotHasBooking: "slotHasBooking",
  RemoveSlotFailed: "removeSlotFailed",
  InvalidRequest: "invalidRequest",
  // Claiming a profile
  InvalidClaim: "invalidClaim",
  ClaimLoadFailed: "claimLoadFailed",
  ClaimNotYours: "claimNotYours",
  AlreadyClaimed: "alreadyClaimed",
  ClaimFailed: "claimFailed",
  // Reservations
  InvalidReservationUpdate: "invalidReservationUpdate",
  ClaimBeforeReservations: "claimBeforeReservations",
  ReservationNotFound: "reservationNotFound",
  ReservationUpdateFailed: "reservationUpdateFailed",
  Unknown: "unknown",
} as const;

export type GuideFlashError =
  (typeof GuideFlashError)[keyof typeof GuideFlashError];
