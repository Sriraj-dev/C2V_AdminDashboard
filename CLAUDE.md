# C2V Admin Dashboard

Next.js (App Router) + TypeScript + shadcn/ui admin dashboard for the C2V WhatsApp commerce product.

Before adding or moving any file, follow the `c2v-project-structure` skill
(`.claude/skills/c2v-project-structure/SKILL.md`). Core rules:

- `src/app` holds routes only; business UI and logic live in `src/features/<domain>`.
- Features never import from each other; shared code goes to `src/components/shared` or `src/lib`.
- Server Components by default; mutations are zod-validated Server Actions that check the session and tenant.
- Money is integer paise; dates display in Asia/Kolkata.
- Clean, consistent admin UI built from shadcn/ui; no animated or decorative effects.
