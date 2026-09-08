# AGENTS.md

Instructions for any agent (Claude Code, Aside, Cursor, …) working in this repo.
**Read this fully before writing a post or touching a component.**

---

## What this site is

`blog.po24lio.com` — the engineering notes companion to `po24lio.com`.

The author does **not** write posts in a web editor. An agent is given a topic,
reads the source material, and adds an MDX file. That is the entire publishing
workflow.

The reason the site is hand-built rather than a hosted blog is **the diagrams**.
Posts are expected to explain architecture, sequences, data flows and measured
results through interactive visuals. Prose that could have lived on Medium is
not the point.

## Non-negotiables

1. **One dev port: `4111`.** Never start a server on another port.
   ```bash
   npm run dev:kill && npm run dev      # frees 4111, then starts on 4111
   ```
2. **`main` is production.** Every push to `main` deploys to Vercel. Do not push
   half-finished posts; use `draft: true` instead.
3. **Never invent a number.** Every figure in a post must be traceable to source
   material the author supplied. If a number is an estimate, say so in the text.
4. **Anonymise company work.** See "Writing about company projects" below.
5. Run `npm run typecheck && npm run build` before committing.

---

## Adding a post

Create one directory per post. Nothing else needs to change — the index, RSS,
sitemap and reading time are all derived from these files.

```
content/posts/<slug>/
├── ko.mdx        # Korean (primary)
└── en.mdx        # English (same slug, same frontmatter shape)
```

`<slug>` is lowercase, hyphenated, English, and permanent. Do not put dates in
it; the frontmatter carries the date.

### Frontmatter

```yaml
---
title: '예시가 지시문을 이긴다'
description: '한 줄 요약. 목록과 검색 결과에 그대로 노출된다.'
date: 2026-09-08          # YYYY-MM-DD
type: note                # note | log
tags: [llm, prompt]
draft: false              # true hides it in production, shows it in dev
---
```

`type` decides which section of the index the post lands in:

- **`note`** — a worked explanation. Long, diagram-heavy, one idea followed all
  the way down. This is the default and the reason the site exists.
- **`log`** — a short record. What was done, what broke, what was decided. No
  obligation to be complete.

Both languages must exist, or the language toggle leads to a 404.

---

## The component kit

Everything below is registered in `src/mdx-components.tsx` and available in MDX
with no import. **Prefer composing these over writing new components.**

### Explanatory engines — use these first

| Component | Use it for |
|---|---|
| `<Structure>` | System architecture. Hovering a node dims everything it is not connected to. |
| `<Sequence>` | Ordered interaction between actors. Step through, or auto-play. |
| `<Breakdown>` | What a single number is made of. One bar, hoverable segments. |
| `<Series>` | A measurement over time. Lines draw themselves once on reveal. |
| `<Transform>` | The same input through different pipelines, with the output re-resolving. |
| `<Threshold>` | Cluster distributions against a threshold the reader can move. |
| `<Playground>` | A parameter the reader drags, with consequences recomputed. |

### Prose furniture

`<Compare>` before/after bars · `<Metrics>` + `<Metric>` headline numbers ·
`<Callout>` aside · `<Term>` inline jargon tooltip · `<Figure>` image + caption

### Critical constraint: no functions across the RSC boundary

MDX renders on the server; these components are client components. **A function
prop will throw at render time.** Pass precomputed data instead.

```mdx
{/* WRONG — throws "Functions cannot be passed directly to Client Components" */}
<Playground compute={(n) => ({ ... })} />

{/* RIGHT — the expression evaluates on the server into plain data */}
<Playground
  param={{ label: '한 번에 묶는 턴 수', initial: 5, unit: '턴' }}
  rows={Array.from({ length: 20 }, (_, i) => {
    const n = i + 1;
    return { value: n, results: [{ label: '호출', value: String(n) }] };
  })}
/>
```

Objects, arrays and strings cross fine. Functions, class instances and `Date`
objects do not.

### Adding a new component

Only when nothing in the kit fits. Then:

1. `src/components/diagram/<Name>.tsx` + `<Name>.module.css`
2. `'use client'` at the top if it has state
3. Props must be plain serialisable data — a spec, not a render callback
4. Register it in `src/mdx-components.tsx`
5. Add a row to the table above

---

## Design rules

The visual language is inherited from `po24lio.com`, which follows
Rauno Freiberg's work (`devouringdetails.com`, `rauno.me`). Values below are
measured from those sites, not invented. **Do not introduce new colours,
easings or durations.**

### Tokens

Defined in `src/app/globals.css`. Always use the variable, never a literal.

```
--bg #fcfcfc      --ink #0f0f0f       --line #e8e8e8
--accent  orange, display-p3          one accent, no second colour
--prose 680px     --frame 960px
```

Dark mode is a `[data-theme='dark']` override on the same variable names. If you
add a colour, add it to both blocks.

### Motion

| Purpose | Duration | Easing |
|---|---|---|
| Hover, press, dim | `--dur-instant` 150ms | `ease-out` |
| State change | `--dur-fast` 200ms | `--ease-state` |
| Entrance | `--dur-slow` 640ms | `--ease-out` |

- **Interactions never exceed 200ms.** Entrances may be slower; responses to a
  click may not.
- Scale in from `0.94`–`0.98`, never from `0`. Press scales to `0.96`.
- The entrance is `fadeInBlur` — opacity and `blur()` resolving together. This
  is the house signature; use `.rise` with `--i` for stagger.
- Nothing loops. An animation that repeats next to prose is noise.
- Charts and bars animate on **reveal** (IntersectionObserver), not on mount.

### Layout and type

- Prose stays at `--prose` (680px). **Figures bleed to `--frame` (960px)** — this
  is automatic for any `<figure>` inside the article.
- Type has three levels: 16px body, 21px h2, 30px title. Do not add a fourth.
- Mono is for metadata only — dates, labels, axis ticks, counts. Never body text.
- `font-variant-numeric: tabular-nums` on anything numeric that can change.

### Interaction details

Taken from `interfaces.rauno.me`:

- Feedback appears on the trigger, not as a toast. Copy shows an inline check.
- Hover states go inside `@media (hover: hover)`.
- Padding creates hit areas; never leave dead gaps between list rows.
- Font weight must not change on hover — it shifts layout.
- Theme switching must not fire interaction transitions (`[data-theme-switching]`).
- Everything respects `prefers-reduced-motion`.

---

## Writing

### Voice

Korean is primary; English is a real translation, not a summary. Both are
written in **plain declarative sentences**. Short. No marketing register, no
emoji, no exclamation marks.

Structure a `note` as a problem the reader can feel, then the reasoning, then the
measurement, then what is still broken. **Admitting what was not solved is
required** — it is what separates this from a release announcement.

Lead with the decision, not the technology. "Why it was decided this way" is the
product; the code is not.

### Anonymising company projects

Most source material comes from work at a company. Before writing:

**Remove entirely**
- Project codenames, internal service names, internal product names
- Colleague names, customer names, tenant or service IDs
- Ticket numbers, internal wiki links, repository paths
- Internal endpoints, hostnames, infrastructure settings (pool sizes, pod config)

**Generalise**
| Internal | Write instead |
|---|---|
| the project codename | "the memory service" |
| the chat log system | "the transcript store" |
| the internal LLM gateway | "the model gateway" |
| the orchestrator | "the agent" |

**Safe to publish**
- Measured numbers and benchmark results, stated as measurements
- Design decisions and the trade-offs behind them
- Public open-source library names and versions
- Failure modes and their diagnosis

When unsure, drop it. A post is not worth a disclosure.

---

## Project layout

```
content/posts/<slug>/{ko,en}.mdx   posts — the only thing that changes often
src/lib/posts.ts                   frontmatter parsing, ordering, reading time
src/lib/site.ts                    site metadata, languages, UI strings
src/app/[lang]/page.tsx            index, grouped by type
src/app/[lang]/[slug]/page.tsx     article shell + minimap
src/components/diagram/            the explanatory engines
src/components/mdx/                prose furniture
src/mdx-components.tsx             the MDX component map
src/app/globals.css                design tokens — start here
```

`rss.xml`, `sitemap.xml` and `robots.txt` are generated from `content/`. They
never need editing.

## Commands

```bash
npm run dev:kill && npm run dev   # always port 4111
npm run typecheck
npm run build                     # must pass before committing
npm run prettier
```

## Deploy

`main` → Vercel → `blog.po24lio.com`. DNS is a CNAME at Gabia pointing to
`cname.vercel-dns.com`. Nothing else to configure.
