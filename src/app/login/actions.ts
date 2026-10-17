"use server";

import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  isRegistrationOpen,
  isSignupNotAllowedError,
} from "@/lib/registration";
import { buildAppUrl } from "@/lib/url";
import { parseLoginForm } from "@/lib/validation";

export interface LoginState {
  error?: string;
  sent?: boolean;
}

/**
 * マジックリンク（パスワード不要）でログイン/新規登録を行う。
 * 入力メール宛にリンクを送り、/auth/callback でセッションを確立する。
 * 新規登録の停止中は、登録済みのアドレスにだけリンクを送る。
 */
export async function sendMagicLink(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = parseLoginForm(formData);
  if (!parsed.success) return { error: "メールアドレスの形式が不正です" };

  const supabase = await createSupabaseServerClient();
  const hdrs = await headers();
  const redirectTo = buildAppUrl("/auth/callback", hdrs.get("origin"));

  const registrationOpen = isRegistrationOpen();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: redirectTo,
      shouldCreateUser: registrationOpen,
    },
  });
  // 停止中に未登録のアドレスが来ても、送信済みと同じ表示にする（登録の有無を外に出さない）。
  if (error && !(!registrationOpen && isSignupNotAllowedError(error))) {
    return { error: error.message };
  }
  return { sent: true };
}
