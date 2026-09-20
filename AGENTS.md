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
topic: '에이전트 메모리' # required — what the post is about
date: 2026-09-08 # YYYY-MM-DD
tags: ['프롬프트 설계', 'LLM', '한국어']
draft: false # true hides it in production, shows it in dev
---
```

`topic` and `tags` are the reader's orientation, printed above the title and in
the index. **They are written for a reader, not for a search engine** — a
subject a person would recognise, not a stack keyword. `topic` is the subject
(`에이전트 메모리`), `tags` are qualifiers, two or three at most.

The label above the title is always `topic`.

There is no post type. The index is one list, newest first. An earlier
note/log split described the _form_ of a post rather than what a reader gets
from it, and every post turned out to be both — so it was removed rather than
kept as an empty section. If a distinction is ever needed it should be about
the contract with the reader (does this reach a conclusion or not), and it
should be introduced only when there is content on both sides.

Both languages must exist, or the language toggle leads to a 404.

---

## The component kit

Everything below is registered in `src/mdx-components.tsx` and available in MDX
with no import. **Prefer composing these over writing new components.**

### Explanatory engines — use these first

| Component      | Use it for                                                                   |
| -------------- | ---------------------------------------------------------------------------- |
| `<Structure>`  | System architecture. Hovering a node dims everything it is not connected to. |
| `<Sequence>`   | Ordered interaction between actors. Step through, or auto-play.              |
| `<Breakdown>`  | What a single number is made of. One bar, hoverable segments.                |
| `<Series>`     | A measurement over time. Lines draw themselves once on reveal.               |
| `<Transform>`  | The same input through different pipelines, with the output re-resolving.    |
| `<Threshold>`  | Cluster distributions against a threshold the reader can move.               |
| `<Playground>` | A parameter the reader drags, with consequences recomputed.                  |
| `<Spread>`     | Every measurement on one log axis, against a cut the reader can move.        |
| `<Legibility>` | One shape at two real display sizes, with its feature size measured at each. |

### Reading chrome — automatic, never authored

These attach themselves to every post. Do not add them to MDX, and do not add
per-post configuration for them.

| Component        | Behaviour                                                                                                                                                                                                                                                                                       |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<ReadingRuler>` | Left-gutter tick ruler (major = heading, minor = block), a guide line drawn at the active tick, and an action at the line's right end. Ticks respond to pointer distance. Below 1180px the ruler is hidden, the line moves to a fixed 62% of the viewport, and both keep working.               |
| `<TravelingDot>` | One accent dot that moves to the heading or caption the reader is on. Anchors are discovered from `h1/h2/h3/figcaption`, so nothing needs marking up.                                                                                                                                           |
| `<Views>`        | `1,284회 · 오늘 32` in the meta line. Counted once per person per KST day via `/api/views/[slug]`, stored in the Redis named by `KV_REST_API_URL` / `KV_REST_API_TOKEN` (see `.env.example`). With no store configured the clause is simply absent.                                             |
| `<SiteFooter>`   | Sits on the page _behind_ the sheet (`sticky; bottom: 0`, sheet `z-index: 1`), so it is revealed as the sheet scrolls off it. Site links, RSS, llms.txt. Rendered once in the `[lang]` layout.                                                                                                  |
| `<PostAxis>`     | Index only. One tick per post on a year axis under the hero; pointer proximity grows ticks (the ruler's `--near` rule), the nearest names its post, a click scrolls to the row and sends the dot there. `aria-hidden` — the list is the accessible thing. Below 640px only quarter labels show. |

The index (`<PostList>`) searches title, description, topic and tags — the
frontmatter, never the body — and a tag on a post page links to `/ko?q=<tag>`.
The row that holds the dot shows the post's opening in place of its summary,
one word at a time (`excerpt`, derived in `posts.ts` from the first paragraphs;
clamped to the summary's line count, so the row never changes height). Which
row holds the dot depends on the pointer: on hover devices the mouse (after a
200ms rest, and the rest of the list blurs), without one the scroll — the row
on the reading line at 44% of the viewport, the same line the dot uses on a
post. Esc on a query lets the letters leave one at a time before the field
clears. The hero arrives a word at a time (`.rise` per word, `--stagger: 40ms`
on the hero), and the theme spreads from the toggle as a circle
(`themeSpread` in `globals.css`, origin written by `ThemeToggle`).
There is no tag wall and no topic filter; a topic line is only worth adding
once a second topic exists.

Dot size is emphasis: `--indicator-size` is declared per level in
`post.module.css` (h1 18px, h2 14px, h3 10px, figcaption 7px). Change it there,
never inline. The host opens a `1.35em` slot and slides its text right; the dot
is centred in that slot. **This is identical at every width** — the dot never
hangs outside the column, so resizing never changes what the reader sees.

The line's action reads "next section" and jumps to the following `h2`, turning
into "back to top" once the end is reached. Labels live in `src/lib/site.ts`.

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
4. **The root element must be `<figure>`.** The media bleed in
   `post.module.css` targets `.prose figure`; anything else silently renders at
   prose width while the rest of the kit runs to the frame
5. Register it in `src/mdx-components.tsx`
6. Add a row to the table above

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

| Purpose           | Duration              | Easing         |
| ----------------- | --------------------- | -------------- |
| Hover, press, dim | `--dur-instant` 150ms | `ease-out`     |
| State change      | `--dur-fast` 200ms    | `--ease-state` |
| Entrance          | `--dur-slow` 640ms    | `--ease-out`   |

- **Interactions never exceed 200ms.** Entrances may be slower; responses to a
  click may not.
- Scale in from `0.94`–`0.98`, never from `0`. Press scales to `0.96`.
- The entrance is `fadeInBlur` — opacity and `blur()` resolving together. This
  is the house signature; use `.rise` with `--i` for stagger.
- Nothing loops. An animation that repeats next to prose is noise.
- Charts and bars animate on **reveal** (IntersectionObserver), not on mount.

### Layout and type

- The page is a grey field (`--bg-page`) with a lighter sheet of content laid
  on it, square cornered, 80% of the viewport wide with a ~10% gutter either
  side. Measured from the reference. The gutter collapses to zero below 1181px,
  where the ruler is hidden and the sheet becomes the page.
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

**The author's own voice is specified in the `my-writing-style` skill. Load it
before drafting. Section 3 (기술 회고·개발 일지) is the register these posts use.**
What follows is the blog-specific part; the skill wins on anything it covers.

Korean is primary; English is a real translation, not a summary. Both are plain
declarative. No marketing register, no emoji, no exclamation marks.

Sentence length varies. Mix long sentences with short ones — an earlier version
of this file said "Short." and the result was thirteen posts with an identical
machine rhythm. A paragraph of uniformly clipped sentences does not read as
restraint, it reads as generated.

Lead with the decision, not the technology. "Why it was decided this way" is the
product; the code is not.

#### Write in the order it happened

Not in the order that makes it tidy. Dead ends stay dead ends; do not compress
four attempts into "three options, one discarded". The reader is following
someone who did not yet know the answer.

#### Admit what was not solved — but not in the same place every time

This is required, and it is what separates a post from a release announcement.
It is **not** required to be a closing `## 남은 것` section with bolded paragraph
openers. Twelve of the first thirteen posts ended that way and the shape became
a form to fill in.

What became a form was the shape, not the label. `## 남은 것` repeating across
posts is fine — it is a section label, like `Limitations` in a paper, and a
reader scanning for what is still broken should find it where they expect. Do
not rename it to something evocative; a heading that does not say what is under
it is worse than a repetitive one. Vary instead whether the section exists at
all: on some posts fold the unresolved parts into the body where they come up,
or give them one closing paragraph with no heading.

#### Budgets

These exist because a drafting agent will otherwise repeat a good device until
it is wallpaper.

| Device                                          | Limit per post                                 |
| ----------------------------------------------- | ---------------------------------------------- |
| `**bold**`                                      | 3. Never to open a paragraph.                  |
| "A가 아니라 B다" aphorism                       | 1. Not once per section.                       |
| Raw emotion (유레카 / 처참했다 / 찝찝하다)      | 2–3. Not zero.                                 |
| An admission of not having understood something | at least 1                                     |
| Hedged endings (`~듯하다` `~같다` `~더라`)      | several — do not end everything as a certainty |

#### Say who worked it out, when it mattered

Much of this work is done with an agent, and the first thirteen posts were
written as if it were not — every diagnosis reads as the author's own. Do not
credit the agent as a matter of routine; a footnote on every post is its own
pattern. Name it at the points where **the division of judgement is part of the
story**: the agent supplied an answer and the author took it without checking,
or doubted it and was wrong to, or the author shipped something an agent wrote
and did not verify it.

Written that way it earns its place, because it explains something the post
otherwise has to assert:

> 이것도 내가 알아낸 건 아니다. 찍힌 바이트를 그대로 클로드 코드에 던졌더니 fragmented MP4 의
> 조각 박스라고 알려줬고, `moof` 라는 이름은 그때 처음 들었다. (…) 미디어 컨테이너는 내 분야가
> 아니다.

That last line is why the section's conclusion holds. Everyday help that changed
no judgement stays out of the post.

This also unblocks the "I did not understand this" admission the budgets ask
for. Outside one's own field there is usually a real one available, and
inventing a different kind of admission to avoid naming the agent produces the
false modesty that admits a lapse of process while keeping the credit.

#### English

There is no sample of the author writing technical prose in English, so `en.mdx`
is not an impersonation — it is the same post performing the same moves in
natural English. Translate the rhetoric, not the words.

**The budgets above apply to `en.mdx` independently.** The first thirteen posts
had exactly 207 bolds in Korean and exactly 207 in English, because the English
was a mirror. If one language is cut and the other is not, they drift apart.
Count them separately.

**Hedges must survive translation.** This is where a drafting agent does the most
damage: Korean uncertainty gets flattened into English certainty and the author
ends up sounding like he knew all along.

| Korean                       | English                                          |
| ---------------------------- | ------------------------------------------------ |
| `~인 것 같다` / `~인 듯하다` | "I think", "it seems", "my guess is"             |
| `~더라`                      | "turns out", "as it happens", "I found that"     |
| `~아닐까라는 의심이 들었다`  | "I started to suspect"                           |
| `~믿고 싶다`                 | "I would like to believe"                        |
| `아직 모른다`                | "I still do not know" — not "it remains unclear" |

Keep the emotion and keep the admission of not having understood something. An
English draft that is calmer than its Korean original is a failed translation.

Contractions are allowed and preferred where they fall naturally — "I can't say
it's fixed yet" over "I cannot yet say it is fixed". The formal register is not
restraint here, it is stiffness.

Do not add English idiom the author would not reach for, and do not translate a
Korean title word for word. Translate what the title does.

#### Titles

Do not reuse the grammar of the previous three posts. The first thirteen ran
nine first-person past-tense self-deprecating sentences in a row.

Vary it without going vague. The author's own tech-blog titles name their
subject outright (`중심극한정리(CLT) | ft. python`, `🛠 ETL과 ELT의 차이`), so a
plain descriptive title is always in register; so is a noun phrase built from
the most concrete piece of evidence in the post (`moof 로 시작하는 파일`).
Metaphor is not — a title the reader cannot decode is a worse failure than a
repetitive one.

### Anonymising company projects

Most source material comes from work at a company. Before writing:

**Remove entirely**

- Project codenames, internal service names, internal product names
- Colleague names, customer names, tenant or service IDs
- Ticket numbers, internal wiki links, repository paths
- Internal endpoints, hostnames, infrastructure settings (pool sizes, pod config)

**Generalise**

| Internal                 | Write instead          |
| ------------------------ | ---------------------- |
| the project codename     | "the memory service"   |
| the chat log system      | "the transcript store" |
| the internal LLM gateway | "the model gateway"    |
| the orchestrator         | "the agent"            |

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
