/**
 * 新規登録の受付状態。既定は停止で、`REGISTRATION_OPEN=true` のときだけ受け付ける。
 * 通知の定期実行を止めているあいだは、新規登録も止めておく（2026-10〜）。
 */
export function isRegistrationOpen(): boolean {
  return process.env.REGISTRATION_OPEN?.trim().toLowerCase() === "true";
}

/**
 * Supabase Auth が「未登録のため新規作成しない」として返したエラーかどうか。
 * signInWithOtp に shouldCreateUser: false を渡して未登録のアドレスだったとき（otp_disabled）と、
 * Supabase 側で新規登録を無効にしているとき（signup_disabled）に返る。
 */
export function isSignupNotAllowedError(
  error: { code?: string; message?: string } | null | undefined,
): boolean {
  if (!error) return false;
  return (
    error.code === "otp_disabled" ||
    error.code === "signup_disabled" ||
    /signups not allowed/i.test(error.message ?? "")
  );
}
