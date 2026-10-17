# grant-finder

補助金・助成金の候補を事業者プロフィールに合わせて整理し、期限や公募見込みを通知する Next.js アプリです。jGrants の公開API、制度マスタ、予算動向、例年スケジュールを組み合わせて提案を作ります。

> **運用状況（2026年10月）** — GitHub Actions の日次パイプライン（daily-pipeline・research-catalog）は、2026年7月から止めています。新規登録の受付も2026年10月から止めています（環境変数 `REGISTRATION_OPEN=true` で再開）。

## English summary

grant-finder is a Next.js + Supabase app (June 2026) that matches Japanese SME grants and subsidies to a business profile and emails deadline and upcoming-call notices. It combines Japan's public jGrants API with a curated program catalog, budget signals and yearly schedules.

- New sign-ups stay in `pending_review` until an admin approves them. Access control relies on Supabase Row Level Security.
- `pnpm test` runs 145 unit tests (Vitest). CI runs lint, type checks, tests, a format check and a build.
- The scheduled GitHub Actions pipelines have been paused since July 2026, and new sign-ups have been closed since October 2026 (set `REGISTRATION_OPEN=true` to reopen).
- The rest of this README is in Japanese.

## Stack

- Next.js 16 / React 19 / TypeScript strict
- Supabase Auth + Postgres + RLS
- Vitest / ESLint / Prettier
- GitHub Actions cron
- Resend API によるメール送信

## Setup

前提：Node.js 24（CI と同じ）、pnpm 10（`package.json` の `packageManager`）、Supabase のプロジェクト。

1. 依存関係を入れる: `pnpm install`
2. Supabase のプロジェクトを作り、SQL Editor で `supabase/migrations/` の SQL を番号順（0001〜0006）に実行する。
3. Supabase の Authentication 設定で Site URL を `http://localhost:3000` にし、Redirect URLs に `http://localhost:3000/auth/callback` を足す（メールのログインリンクが戻る先）。
4. `cp .env.example .env.local` で設定ファイルを作り、`NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_ANON_KEY` を入れる。この2つが空のままだと、すべてのページが HTTP 500 になる。
5. `pnpm dev` で起動し、http://localhost:3000 を開く。新規登録を試すときは `.env.local` に `REGISTRATION_OPEN="true"` を入れる（未設定なら登録済みのアドレスでしかログインできない）。

日次パイプライン（`scripts/`。取込 → マッチ → 提案 → 通知）を手元で動かすときは、`SUPABASE_SERVICE_ROLE_KEY` も設定する。`ANTHROPIC_API_KEY` と `RESEND_API_KEY` は任意で、未設定なら決定論のマッチングだけで動き、メールは送らずにログへ出す。

`.env.local` は Git 管理外です。実鍵や個人のメールアドレスはコミットしないでください。

## Security Notes

- `NEXT_PUBLIC_SUPABASE_ANON_KEY` はブラウザへ公開される前提の anon key です。アクセス制御は Supabase RLS で行います。
- `SUPABASE_SERVICE_ROLE_KEY`、`ANTHROPIC_API_KEY`、`RESEND_API_KEY` はサーバー/Actions 専用です。
- `ADMIN_EMAILS` に管理画面を使うログインメールアドレスを設定します。未設定なら管理画面は使えません。
- `NOTIFY_FROM_EMAIL` は実送信時のみ設定してください。公開サンプルには実ドメインのメールアドレスを置きません。
- ユーザーの通知先メールアドレスはアプリDBに保存される個人情報です。ログや公開Issueへ貼らない運用にしてください。
- リード確認は Supabase の `private.leads` ビューを使います。通常ユーザーには公開しません。
- 登録直後のリードは `pending_review` です。`approved` にするまで提案生成・通知対象になりません。
- 本番 `APP_BASE_URL` は `https://...` を設定してください。

## Leads

`ADMIN_EMAILS` に設定したメールアドレスでログインし、`/admin/leads` から承認・停止できます。

Supabase SQL Editor で確認する場合は次のSQLを使います。`private` schema は API の exposed schemas に追加しないでください。

```sql
select *
from private.leads
order by signed_up_at desc;
```

承認する場合:

```sql
update public.businesses
set lead_status = 'approved',
    approved_at = now(),
    proposal_status = 'pending'
where id = '<business_id>';
```

## Checks

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm format:check
pnpm audit --prod
pnpm build
```

CI（`.github/workflows/ci.yml`）では lint・typecheck・test・format:check・build を実行する。
