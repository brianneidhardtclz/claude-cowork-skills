---
name: user-facing-cloudzero-howto-docs
description: >
  Use this skill EVERY TIME Brian (or anyone at CloudZero) asks to create documentation,
  a guide, a how-to, a runbook, a reference doc, or any written instructional material.
  This skill produces a polished Word (.docx) document formatted to match the CloudZero
  internal Confluence How-To template — the exact same structure and branding used for
  internal guides. Trigger on phrases like: "create documentation", "write a guide",
  "make a how-to", "document this process", "write up the steps", "create a runbook",
  "turn this into a doc", "I need a doc for...", or any similar request where the output
  is an instructional Word document. Always use this skill in preference to the generic
  docx skill when the output is a how-to or process guide.
---

# CloudZero How-To Documentation Skill

This skill produces internal documentation formatted to match the CloudZero Confluence
How-To page template — with consistent branding, structure, and callout styles.

## What you produce

A `.docx` file following this exact template structure (in order):

1. **H1 Title** — "How-To: [Topic]", with a subtitle line and time estimate
2. **Note callout** — brief overview of what the guide covers (yellow panel)
3. **H3 📖 Versions** — table with Version / Date / Author columns, starting at v.1
4. **H3 📝 Prerequisites** — bulleted list of what the reader needs before starting
5. **H3 🎥 Video Instructions (optional)** — leave as "No video available" if none supplied
6. **H2 📘 Instructions** — numbered steps (each step is bold H-style text + body + code blocks as needed)
7. **Inline callouts** inside steps — ⚠️ Tip, ℹ️ Info, 🔒 Security, ✅ Done — placed where relevant
8. **H2 🔧 Troubleshooting** — if the user provides any (use H3 subheadings per error)
9. **H2 📋 Quick Reference** — summary table (Problem | Fix) if applicable
10. **Closing info callout** — the standard Confluence "Highlight important information" panel

## Branding & visual style

Always use the CloudZero/Atlassian color palette defined in the template asset. Do not
deviate from these colors. The template uses:

- **Primary blue** `#0052CC` — headings, code text, table headers
- **Dark text** `#172B4D` — all body copy
- **Mid text** `#505F79` — supporting / secondary text
- **Note callout** — yellow bg `#FFFAE6`, border `#FF8B00`
- **Info callout** — soft blue bg `#DEEBFF`, border `#0065FF`
- **Success callout** — green bg `#E3FCEF`, border `#006644`
- **Security callout** — light grey bg `#FAFBFC`, border `#505F79`
- **Code block bg** — `#F4F5F7`, text `#0052CC`, font Courier New
- **Table header bg** — `#F4F5F7` (standard) or `#0052CC` with white text (Quick Reference)

Page size: **A4** (11906 × 16838 DXA). Margins: 1134 top/bottom, 1440 left/right.
Font: **Arial** throughout.

## How to build the document

Use the bundled template at `assets/template.js` as your starting point. It contains:
- All helper functions (`callout()`, `codeBlock()`, `h1/h2/h3()`, `body()`, etc.)
- The full color palette as named constants
- The numbering config for bullets and numbered lists
- Header/footer setup (CloudZero branding + page numbers)

### Steps

1. Read `assets/template.js` — understand all available helpers before writing your build script.
2. Create a working directory (e.g. `/sessions/.../work/howto-[topic]/`) and run `npm install docx`.
3. Copy `assets/template.js` into that directory (or reference it by absolute path).
4. Write `build.js`. **Always start with:**
   ```js
   const docx = require('docx');
   const T = require('./template.js');  // or absolute path if not copied
   T.init(docx);                        // REQUIRED — injects docx before any helper is called
   const { run, h1, h2, callout, ... } = T;
   ```
5. Build content using the helpers, call `makeDocument(title, children)`, write with `Packer.toBuffer`.
6. Run `node build.js`.
7. Validate: `python /sessions/.../mnt/.skills/skills/docx/scripts/office/validate.py output.docx`
8. Copy to the workspace folder: `/sessions/.../mnt/Project Tracker/`

### Filling in the template sections from user input

- **Title**: derive from the subject matter. Format: "How-To: [Action/Topic]"
- **Subtitle**: one sentence summary + "Estimated time: X min"
- **Note callout**: 1–2 sentences describing scope and audience
- **Versions table**: always start at v.1 Current, today's date, author = "Brian Neidhardt" (unless user specifies otherwise)
- **Prerequisites**: extract from user input; if none given, infer reasonable ones
- **Video Instructions**: leave the placeholder text ("No video available...") unless user provides a video
- **Instructions**: convert the user's steps into the numbered step format. Each step gets a bold label + body text + code blocks or callouts as needed
- **Troubleshooting**: include if the user mentions common errors or edge cases
- **Quick Reference**: include if there are 3+ discrete problem/fix pairs
- **Closing callout**: always include the standard closing info panel

## Important details

- Never use unicode bullets or `\n` newlines inside docx-js — use `LevelFormat.BULLET` and separate `Paragraph` elements
- Always use `WidthType.DXA` for table widths, never `PERCENTAGE`
- Tables need dual widths: `columnWidths` array AND `width` on each cell
- Use `ShadingType.CLEAR` (never SOLID) for shading
- `PageBreak` must be inside a `Paragraph`
- `ImageRun` requires a `type` field
- The `docx` npm package should be installed locally in the working directory (not globally)

## Output

Save the final file to the Project Tracker folder as a `.docx`. Name it descriptively:
e.g. `how-to-[topic].docx`. Present it to the user with `present_files`.
