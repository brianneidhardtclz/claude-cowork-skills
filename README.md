# claude-cowork-skills

A collection of custom skills for [Claude Cowork](https://claude.ai), enabling Claude to produce polished documents, analyze logs, automate scheduled tasks, and more — all tailored for day-to-day workflows at CloudZero.

---

## What are Cowork Skills?

Skills are instruction packages that tell Claude how to handle specific tasks with higher precision and better outputs. When you trigger a skill — by describing what you need — Claude loads the relevant instructions and tools before getting to work.

---

## Skills in this repo

### 📄 `docx` — Word Document Creation & Editing
Create, read, edit, and manipulate `.docx` files. Handles professional documents with tables of contents, headings, page numbers, letterheads, tracked changes, and more.

**Trigger phrases:** "create a Word doc", "edit this .docx", "write a report", "make a memo/letter/template"

---

### 📊 `xlsx` — Excel Spreadsheet Creation & Editing
Create new spreadsheets or open, fix, and edit existing `.xlsx`, `.xlsm`, `.csv`, or `.tsv` files. Supports formulas, formatting, charts, data cleaning, and tabular restructuring.

**Trigger phrases:** "create a spreadsheet", "edit this Excel file", "clean up this CSV", "add a column to this xlsx"

---

### 📑 `pdf` — PDF Processing
A comprehensive PDF toolkit: extract text/tables, merge or split PDFs, rotate pages, add watermarks, fill forms, encrypt/decrypt, extract images, and OCR scanned documents.

**Trigger phrases:** "merge these PDFs", "fill out this PDF form", "extract text from this PDF", "create a PDF"

---

### 🎨 `pptx` — PowerPoint Presentation Creation & Editing
Create new slide decks from scratch, edit existing `.pptx` files, extract content from presentations, or work with templates, layouts, and speaker notes.

**Trigger phrases:** "make a presentation", "edit this deck", "add a slide", "extract text from this .pptx"

---

### 📋 `user-facing-cloudzero-howto-docs` — CloudZero How-To Documentation
Produces polished Word (`.docx`) documents formatted to match the CloudZero internal Confluence How-To template — consistent structure, branding, and callout styles for internal guides.

**Trigger phrases:** "create documentation", "write a guide", "make a how-to", "document this process", "write a runbook"

> This skill takes priority over the generic `docx` skill when the output is a how-to or process guide.

---

### 🔍 `appgate-log-analyzer` — Appgate SDP Log Analysis
Diagnose Appgate SDP connection issues by analyzing log files. Handles JSON-structured logs and plain text/syslog formats, covering Appgate SDP v6.x on both Windows and macOS clients.

**Trigger phrases:** "Appgate isn't connecting", "why is Appgate failing", "troubleshoot this Appgate issue", or any time an Appgate log file is uploaded

---

### 🛠️ `skill-creator` — Create & Improve Skills
Build new skills from scratch, edit and optimize existing ones, run evaluations to measure quality, and benchmark performance with variance analysis.

**Trigger phrases:** "create a new skill", "improve this skill", "run evals on this skill", "optimize the skill description"

---

### ⏰ `schedule` — Scheduled Task Automation
Create reusable tasks that run automatically on a schedule or on demand. Converts a completed session into a self-contained, repeatable workflow.

**Trigger phrases:** "schedule this to run daily", "automate this task", "create a recurring job"

---

## Installation

To use these skills in Cowork:

1. Clone or download this repository
2. In Claude Cowork, open **Settings → Skills**
3. Point Cowork to the folder containing the skill you want to install
4. The skill will appear in your available skills list and activate automatically when relevant

---

## Notes

- The `docx`, `pdf`, `pptx`, and `xlsx` skills include supporting Python scripts and Office schema files used internally by Claude during execution.
- Skills are loaded automatically based on context — you don't need to invoke them by name.
- Some skills (like `user-facing-cloudzero-howto-docs`) are intentionally specific to CloudZero workflows and branding.
