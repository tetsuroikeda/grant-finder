import { afterEach, describe, expect, it } from "vitest";
import { isRegistrationOpen, isSignupNotAllowedError } from "./registration";

const originalRegistrationOpen = process.env.REGISTRATION_OPEN;

afterEach(() => {
  if (originalRegistrationOpen === undefined) {
    delete process.env.REGISTRATION_OPEN;
  } else {
    process.env.REGISTRATION_OPEN = originalRegistrationOpen;
  }
});

describe("isRegistrationOpen", () => {
  it("未設定なら停止として扱う", () => {
    delete process.env.REGISTRATION_OPEN;

    expect(isRegistrationOpen()).toBe(false);
  });

  it("true のときだけ受け付ける（大文字小文字と前後の空白は無視する）", () => {
    process.env.REGISTRATION_OPEN = " TRUE ";
    expect(isRegistrationOpen()).toBe(true);

    for (const value of ["", "false", "1", "yes"]) {
      process.env.REGISTRATION_OPEN = value;
      expect(isRegistrationOpen()).toBe(false);
    }
  });
});

describe("isSignupNotAllowedError", () => {
  it("未登録で新規作成を断られたエラーを見分ける", () => {
    expect(isSignupNotAllowedError({ code: "otp_disabled" })).toBe(true);
    expect(isSignupNotAllowedError({ code: "signup_disabled" })).toBe(true);
    expect(
      isSignupNotAllowedError({ message: "Signups not allowed for otp" }),
    ).toBe(true);
  });

  it("ほかのエラーやエラーなしは対象外にする", () => {
    expect(isSignupNotAllowedError(null)).toBe(false);
    expect(
      isSignupNotAllowedError({
        code: "over_email_send_rate_limit",
        message: "email rate limit exceeded",
      }),
    ).toBe(false);
  });
});
