<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## PREDIQ service account boundaries

This repository is PREDIQ (`meister95/sports-picks`). For Vercel, Supabase, and Resend, prefer the connected account whose nickname/profile label is `Amar`. Before every account-settings, deployment, authentication, email, or DNS change, independently verify that the target resource belongs to PREDIQ. The `Amar` label alone is not enough to authorize a change, and a matching project identifier does not excuse using a different account when the `Amar` account is available.

- **Vercel:** Use the `Amar` account and PREDIQ project `prediq` (project ID `prj_HiGgb8AIsoi1uSqGkq4kB8aiERvs`, team ID `team_4yiKcFhPQw6iCUuJdo4LcTIs`), connected to Git repository `meister95/sports-picks`. The `aezo` project previously visible in another connection is unrelated and must not be used. Verify the repository/project before changing domains, deployments, or settings. If the PREDIQ project is unavailable or cannot be verified, stop and ask the user to connect the `Amar` account that contains it.
- **Supabase:** The only allowed PREDIQ project ref is `fggreivlzksnotonnrse`. Verify that ref before reading or changing project data/settings. If it is unavailable, stop; do not substitute another project.
- **Resend:** Use the connected PREDIQ account (`amar.eto`) and the verified sender domain `mail.prediq.at` (EU region). Use this domain for PREDIQ authentication mail. Do not claim or transfer `auth.prediq.at`; Resend reported that it belongs to another team. If the Amar account or `mail.prediq.at` cannot be verified, stop before using or creating another sender domain.
- Before any mutation, check both the connected account (use the `Amar` profile where exposed) and the PREDIQ resource identifier. If the account nickname is not exposed by a tool, proceed only when the target is uniquely verified as PREDIQ; otherwise stop and ask the user.
- Never put IONOS PATs, Resend API keys, Supabase service-role keys, access tokens, or other secrets in this file, source code, logs, or chat. Read only non-secret project identifiers when checking configuration.
