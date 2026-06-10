# LinkedIn → Resume → Website Sync Pipeline

Reference document for keeping wasimahin.com and the resume in sync with LinkedIn.
Runnable in Claude Code via the `/linkedin-sync` command (`.claude/commands/linkedin-sync.md`),
or follow manually.

**Cadence:** the LinkedIn profile is the source of truth and is kept current by Wasi.
Intended usage is **one click, once a week** — open Claude Code in this project and type
`/linkedin-sync`. No unattended schedule is configured (by choice: LinkedIn reading
requires the signed-in browser, so manual triggering is the reliable path).

**Important when extracting Experience:** LinkedIn collapses long descriptions behind
"…see more" — expand every entry before reading, or bullets get silently truncated.
The profile PDF export (More → Save to PDF) always contains the full text and is the
safer source.

```
LinkedIn profile ──▶ extract + diff ──▶ ATS-100 resume ──▶ DOCX + PDF ──▶ website update ──▶ verify ──▶ commit/push
```

---

## §1 — Audience & goals (read before writing anything)

**Who reads this site/resume:**
- **Recruiters** (~8-second first scan, often after an ATS keyword filter). They need: role fit in the headline, quantified impact, recency, working links.
- **Hiring managers** (the real evaluators). They check GitHub before interviews, want evidence of *messy data → clean decision* workflows, and care that projects are real and documented.
- **ATS software** (Workday, Greenhouse, Lever, iCIMS). Boolean/semantic keyword matching; resumes missing exact keyword strings are invisible regardless of actual skill.

**Target roles:** Data Analyst, Business Analyst, Business/Financial Automation — internships and entry-level. Location anchor: Long Beach / Greater LA, open to remote.

**Positioning (the one-liner everything must support):** *student who already has production software running daily inside a real company's ERP — not just coursework.* The two live Python tools + measured time savings are the differentiators; lead with them everywhere.

**Goals, in priority order:** (1) interviews for analyst roles, (2) recruiter confidence in 8 seconds, (3) hiring-manager depth via GitHub links, (4) ATS pass-through.

## §2 — Step 1–2: Gather from LinkedIn and diff

- Profile: `https://www.linkedin.com/in/wasi-mahin`
- **Anonymous fetching does not work** (LinkedIn returns HTTP 999/405 to bots). Use one of:
  1. **Claude in Chrome** (preferred): user signs into LinkedIn themselves; navigate to the profile, expand all sections ("…see more"), and read each: headline, About, Experience, Education, Skills, Licenses & Certifications, Honors & Awards, Projects.
  2. **Profile PDF export**: user does LinkedIn → own profile → *More* → *Save to PDF*, drops the file in the repo root; parse it with the pdf skill.
  3. **Paste**: user pastes section text into chat.
- **Never** enter LinkedIn credentials on the user's behalf. If signed out, stop and ask.
- Normalize into a structured list (role, org, dates, bullets, metrics). Convert relative dates to absolute (e.g. "Present" stays, "1 yr 3 mos" → explicit months).
- **Diff against current site content** (`index.html` sections listed in §5) and present the diff to the user before changing anything. LinkedIn wins on recency; the site wins on phrasing unless facts changed.

## §3 — Step 3: The ATS-100 resume spec

Structure (single column, in this order):
1. **Header in document body** (never in Word header/footer): Name · Long Beach, CA · email · phone · `linkedin.com/in/wasi-mahin` · `github.com/wasimahin`
2. **Summary** — 2–3 lines, must contain the top role keywords naturally ("Data Analyst", "Python", "SQL", "Power BI", "automation").
3. **Experience** — reverse-chronological, `Month YYYY – Month YYYY` dates, org + role on separate visual lines, 1–4 bullets each.
4. **Projects** — the two production tools (with GitHub repo names) + datathon.
5. **Education** — CSULB, B.S. MIS & Accountancy, GPA 3.87, President's Honor List, expected May 2027.
6. **Skills** — grouped flat lists (no graphics/bars/columns).
7. **Certifications** — name + issuer.

Formatting rules (each one is an ATS failure mode if violated):
- One page. Single column. No tables, text boxes, images, icons, charts, or multi-column layouts.
- Standard headings exactly: "Summary", "Experience", "Projects", "Education", "Skills", "Certifications".
- Standard font (Calibri or Arial, 10.5–12pt body), real bullet characters (`•`), no Unicode decorations.
- File name: `WasiMahin_Resume.pdf` / `.docx`. Default to PDF; DOCX only when a posting demands it.
- PDF must have a clean text layer — verify per §4.

Keyword rules (from 2026 ATS research):
- **15–25 keywords total**, woven naturally — stuffing triggers rejection in modern ATS.
- Core set for analyst roles: SQL, Python, Excel (name the functions: Pivot Tables, Power Query, VLOOKUP), Power BI, DAX, Tableau, ETL, data cleaning, data validation, data modeling, dashboards, reporting, statistical analysis, Microsoft Fabric, financial analysis, stakeholder communication, process automation.
- Highest-weight placement: the Summary and the **first bullet under each role**.
- Bullet formula: **Action + System/Scope + Keyword + Result** ("Engineered two production Python tools automating invoice entry in Microsoft Dynamics 365 Business Central, cutting processing time ~96%").
- Don't write "proficient in SQL" — name constructs used (joins, CTEs, window functions) inside a bullet with scale.
- Every bullet quantified (%, $, count, time).
- When targeting a specific posting: mirror that posting's exact keyword strings (e.g. "Power BI" vs "PowerBI") — exact-string matching still matters.

## §4 — Step 4: Generate DOCX + PDF and validate

1. Build `WasiMahin_Resume.docx` with the **docx skill** following §3.
2. Export `WasiMahin_Resume.pdf` (docx→pdf conversion, or the pdf skill).
3. Validate the PDF:
   - `pdftotext WasiMahin_Resume.pdf - | head -50` (or pdf skill extraction) — text must come out complete, in reading order, no garbled glyphs.
   - Confirm one page, contact info present, all §3 keywords present: spot-grep for `SQL`, `Python`, `Power BI`, `Tableau`, `Excel`.
4. Keep both files in the repo root (the site links the PDF; the DOCX is for postings that require it).

## §5 — Step 5: Update the website

Resume references (all point at the same filename, so replacing the file updates everything — verify anyway):
- Nav: `<a class="nav-resume" href="WasiMahin_Resume.pdf" download>`
- Hero: `<a class="btn btn-ghost" href="WasiMahin_Resume.pdf" download>`
- Contact row: `<a class="crow" href="WasiMahin_Resume.pdf" download>` — **update its label** `PDF · Updated <Mon YYYY>`

Content locations in `index.html`:
- Hero copy + roles line: `.hero-intro`
- Stats strip (the four numbers): `.stats-grid` — counters use `data-count` attributes
- Manifesto paragraph: `#manifesto-p`
- Experience: `#experience` → `.exp-item` blocks (date, role, org, bullets, tag chips, green "Current" chip)
- Education + certifications: `#education`
- Skills pills: `#skills` (`.pill hot` = highlighted skills)
- Projects: `#work` → `.card` blocks (metrics use `data-count`; GitHub links are `.card-link`)
- Contact/footer: `#contact`
- Structured data: JSON-LD `<script type="application/ld+json">` in `<head>` — keep `knowsAbout`, job title, and links in sync

Voice rules: short sentences, measured claims, every claim quantified, no buzzword adjectives ("passionate", "results-driven"), facts must match the resume exactly — recruiters cross-check.

## §6 — Step 6: Verify, commit, push

**Tooling notes for this machine** (details in Claude's project memory):
- `preview_start` sandbox can bind but not serve — run `python3 -m http.server 3333` via Bash from the repo root instead.
- No Chrome/headless browser installed. Visual checks: compile the Swift WKWebView snapshot tool (pattern in memory: `/tmp/websnap/snap.swift`) and capture `http://localhost:3333/?static=1` at 1440×900, 1366×768, 820×1180, 390×844. `?static=1` renders the no-animation final state.

**Link audit** (run from repo root):
```bash
python3 - <<'EOF'
import re, os, urllib.request
html = open('index.html').read()
hrefs = sorted(set(re.findall(r'href="([^"]+)"', html)))
ids = set(re.findall(r'id="([^"]+)"', html))
for h in hrefs:
    if h.startswith('#'):
        print(('OK  ' if h[1:] in ids else 'FAIL') + ' ' + h)
    elif not h.startswith(('http', 'mailto')):
        print(('OK  ' if os.path.exists(h) else 'MISS') + ' ' + h)
    elif h.startswith('http') and 'fonts.g' not in h:
        try:
            req = urllib.request.Request(h, headers={'User-Agent': 'Mozilla/5.0'}, method='HEAD')
            print(urllib.request.urlopen(req, timeout=10).status, h)
        except Exception as e:
            print(getattr(e, 'code', e), h)
EOF
```
LinkedIn returning 405/999 to this script is its bot-block, **not** a broken link. GitHub links must return 200.

**Checklist before commit:**
- [ ] Resume PDF replaced + text-extractable; DOCX regenerated
- [ ] Contact-row freshness label updated
- [ ] Site sections match resume facts exactly
- [ ] Link audit passes; no 404s in server log
- [ ] Visual captures at 4 sizes look right
- [ ] JSON-LD still valid (paste into a JSON parser)

**Ship:** `git add -A && git commit` (descriptive message). Push needs the user's GitHub credentials — give them `git push origin main` to run themselves; never enter or store tokens for them.
