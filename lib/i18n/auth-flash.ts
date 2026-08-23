/**
 * Keys for the flash banners rendered by the auth pages.
 *
 * Server actions and route handlers put one of these keys into the `error` or
 * `message` query param instead of a finished sentence, so the receiving page
 * can render it in the active locale. Resolve them with `resolveFlash` from
 * `@/lib/i18n/flash`; anything that is not a known key (a raw Supabase error,
 * for example) falls through untranslated.
 */
export const AuthFlashError = {
  EmailPasswordRequired: "emailPasswordRequired",
  FullNameRequired: "fullNameRequired",
  PasswordsMismatch: "passwordsMismatch",
  EmailRequired: "emailRequired",
  PasswordRequired: "passwordRequired",
  GoogleStartFailed: "googleStartFailed",
  AuthFailed: "authFailed",
} as const;

export type AuthFlashError =
  (typeof AuthFlashError)[keyof typeof AuthFlashError];

export const AuthFlashMessage = {
  CheckEmail: "checkEmail",
  ResetLinkSent: "resetLinkSent",
  PasswordUpdated: "passwordUpdated",
  SignInToContinue: "signInToContinue",
  SignInForTrips: "signInForTrips",
  SignInForProfile: "signInForProfile",
  SignInForGuideDashboard: "signInForGuideDashboard",
  ApplyToBecomeGuide: "applyToBecomeGuide",
  ClaimGuideProfile: "claimGuideProfile",
  SignInToConnect: "signInToConnect",
  SignInToBook: "signInToBook",
  NoAccess: "noAccess",
} as const;

export type AuthFlashMessage =
  (typeof AuthFlashMessage)[keyof typeof AuthFlashMessage];
