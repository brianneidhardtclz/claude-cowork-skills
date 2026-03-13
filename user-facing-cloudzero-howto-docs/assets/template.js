/**
 * CloudZero How-To Documentation Template
 * =========================================
 * Reusable helper library for building Confluence-style How-To documents
 * using the docx-js library. Import / copy these helpers into your build script.
 *
 * Usage:
 *   const { Document, Packer, ... } = require('docx');
 *   // Copy the helpers below into your build script, then call them to build sections.
 *
 * All colors, fonts, and sizes match the CloudZero internal Confluence How-To template.
 */

// docx modules are injected by the caller via init() — see bottom of file.
// This allows the template to work regardless of where docx is installed.
let Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
    Header, Footer, AlignmentType, LevelFormat, ExternalHyperlink,
    BorderStyle, WidthType, ShadingType, VerticalAlign,
    PageNumber, HeadingLevel;

// ─── CloudZero / Atlassian color palette ─────────────────────────────────────
const BLUE_DARK   = "0052CC";  // Atlassian primary blue — headings, code text, table headers
const BLUE_MID    = "0065FF";  // Info callout border
const BLUE_LIGHT  = "DEEBFF";  // Info callout background
const YELLOW_BG   = "FFFAE6";  // Note / Warning callout background
const YELLOW_BD   = "FF8B00";  // Note / Warning callout border
const GREEN_BG    = "E3FCEF";  // Success callout background
const GREEN_BD    = "006644";  // Success callout border
const GREY_HEADER = "F4F5F7";  // Table header grey / code block background
const GREY_LIGHT  = "FAFBFC";  // Security callout bg / alternating table rows
const TEXT_MAIN   = "172B4D";  // Main body text (Atlassian dark blue-grey)
const TEXT_MID    = "505F79";  // Supporting / secondary text

// ─── Page geometry (A4, metric margins ~2 cm) ────────────────────────────────
const PAGE_W  = 11906;  // DXA
const PAGE_H  = 16838;  // DXA
const MARGIN  = { top: 1134, right: 1440, bottom: 1134, left: 1440 };
const CONTENT_W = PAGE_W - MARGIN.left - MARGIN.right;  // 9026 DXA

// ─── Border helpers ──────────────────────────────────────────────────────────
const mkBorder  = (color = "CCCCCC") => ({ style: BorderStyle.SINGLE, size: 1, color });
const mkBorders = (c) => ({ top: mkBorder(c), bottom: mkBorder(c), left: mkBorder(c), right: mkBorder(c) });
const noBorder  = () => ({ style: BorderStyle.NONE, size: 0, color: "FFFFFF" });
const noBorders = () => ({ top: noBorder(), bottom: noBorder(), left: noBorder(), right: noBorder() });

// ─── Text helpers ─────────────────────────────────────────────────────────────
/** Plain body TextRun */
function run(text, opts = {}) {
  return new TextRun({ text, color: TEXT_MAIN, size: 22, font: "Arial", ...opts });
}

/** Monospaced code TextRun (blue, Courier New) */
function codeRun(text) {
  return new TextRun({ text, font: "Courier New", size: 20, color: BLUE_DARK });
}

// ─── Heading paragraphs ───────────────────────────────────────────────────────
function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text, color: TEXT_MAIN, bold: true, size: 48, font: "Arial" })],
    spacing: { before: 0, after: 240 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: BLUE_DARK, space: 6 } }
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun({ text, color: BLUE_DARK, bold: true, size: 32, font: "Arial" })],
    spacing: { before: 360, after: 120 }
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    children: [new TextRun({ text, color: TEXT_MAIN, bold: true, size: 26, font: "Arial" })],
    spacing: { before: 300, after: 100 }
  });
}

// ─── Body paragraph ───────────────────────────────────────────────────────────
/** Simple body paragraph with plain text */
function body(text, opts = {}) {
  return new Paragraph({
    children: [new TextRun({ text, color: TEXT_MAIN, size: 22, font: "Arial" })],
    spacing: { before: 60, after: 100 },
    ...opts
  });
}

/** Body paragraph with custom TextRun children (for mixed bold/code/links) */
function bodyRuns(runs, opts = {}) {
  return new Paragraph({
    children: runs,
    spacing: { before: 60, after: 100 },
    ...opts
  });
}

// ─── Spacer ───────────────────────────────────────────────────────────────────
function spacer(sz = 120) {
  return new Paragraph({ children: [new TextRun("")], spacing: { before: 0, after: sz } });
}

// ─── Callout box ─────────────────────────────────────────────────────────────
/**
 * Renders a Confluence-style callout panel.
 *
 * @param {'note'|'info'|'success'|'warning'|'security'} type
 * @param {string[]} lines — each string becomes a paragraph inside the callout.
 *        Pass an array of TextRun[] to get mixed formatting on a single line.
 *
 * Examples:
 *   callout('note', ['This is a plain note.'])
 *   callout('warning', ['Watch out for spaces in paths.', 'Always use double quotes.'])
 *   callout('info', [[run('See '), codeRun('git --version'), run(' to verify.')]])
 */
function callout(type, lines) {
  const configs = {
    note:    { bg: YELLOW_BG,  bd: YELLOW_BD,  label: "📝  Note" },
    info:    { bg: BLUE_LIGHT, bd: BLUE_MID,   label: "ℹ️  Info" },
    success: { bg: GREEN_BG,   bd: GREEN_BD,   label: "✅  Done" },
    warning: { bg: YELLOW_BG,  bd: YELLOW_BD,  label: "⚠️  Tip" },
    security:{ bg: GREY_LIGHT, bd: "505F79",   label: "🔒  Security" },
  };
  const cfg = configs[type] || configs.info;

  const labelCell = new TableCell({
    width: { size: 300, type: WidthType.DXA },
    borders: noBorders(),
    shading: { fill: cfg.bg, type: ShadingType.CLEAR },
    margins: { top: 120, bottom: 120, left: 160, right: 80 },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({
      children: [new TextRun({ text: cfg.label, bold: true, size: 20, color: cfg.bd, font: "Arial" })],
      spacing: { before: 0, after: 0 }
    })]
  });

  const contentChildren = lines.map((line, i) => {
    if (Array.isArray(line)) {
      return new Paragraph({ children: line, spacing: { before: i === 0 ? 0 : 60, after: 0 } });
    }
    return new Paragraph({
      children: [new TextRun({ text: line, size: 20, color: TEXT_MAIN, font: "Arial" })],
      spacing: { before: i === 0 ? 0 : 60, after: 0 }
    });
  });

  const contentCell = new TableCell({
    width: { size: CONTENT_W - 300, type: WidthType.DXA },
    borders: noBorders(),
    shading: { fill: cfg.bg, type: ShadingType.CLEAR },
    margins: { top: 120, bottom: 120, left: 160, right: 160 },
    children: contentChildren
  });

  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: [300, CONTENT_W - 300],
    borders: {
      top:    { style: BorderStyle.SINGLE, size: 3, color: cfg.bd },
      bottom: { style: BorderStyle.SINGLE, size: 3, color: cfg.bd },
      left:   { style: BorderStyle.SINGLE, size: 8, color: cfg.bd },
      right:  { style: BorderStyle.SINGLE, size: 3, color: cfg.bd },
      insideH: noBorder(),
      insideV: noBorder(),
    },
    rows: [new TableRow({ children: [labelCell, contentCell] })]
  });
}

// ─── Code block ───────────────────────────────────────────────────────────────
/**
 * Grey-background code block. Pass an array of strings (one per line).
 *
 * Example:
 *   codeBlock(['git init', 'git add .', 'git commit -m "Initial commit"'])
 */
function codeBlock(lines) {
  const children = lines.map((line, i) => new Paragraph({
    children: [new TextRun({ text: line, font: "Courier New", size: 19, color: BLUE_DARK })],
    spacing: { before: i === 0 ? 0 : 60, after: 0 }
  }));
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: [CONTENT_W],
    borders: mkBorders("CCCCCC"),
    rows: [new TableRow({ children: [new TableCell({
      width: { size: CONTENT_W, type: WidthType.DXA },
      shading: { fill: GREY_HEADER, type: ShadingType.CLEAR },
      borders: mkBorders("CCCCCC"),
      margins: { top: 120, bottom: 120, left: 200, right: 200 },
      children
    })] })]
  });
}

// ─── Versions table ───────────────────────────────────────────────────────────
/**
 * Renders the standard Versions table.
 * rows: [{ version, date, author }]
 *
 * Example:
 *   versionsTable([{ version: 'v.1 (Current)', date: 'Mar 12, 2026', author: 'Brian Neidhardt' }])
 */
function versionsTable(rows) {
  const headerRow = new TableRow({
    tableHeader: true,
    children: ['Version', 'Date', 'Comment'].map((label, i) => {
      const widths = [1560, 2000, CONTENT_W - 3560];
      return new TableCell({
        width: { size: widths[i], type: WidthType.DXA },
        shading: { fill: GREY_HEADER, type: ShadingType.CLEAR },
        borders: mkBorders("CCCCCC"),
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({ children: [run(label, { bold: true })] })]
      });
    })
  });

  const dataRows = rows.map(r => new TableRow({
    children: [
      new TableCell({ width: { size: 1560, type: WidthType.DXA }, borders: mkBorders("CCCCCC"), margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [run(r.version, { bold: true })] })] }),
      new TableCell({ width: { size: 2000, type: WidthType.DXA }, borders: mkBorders("CCCCCC"), margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [run(r.date)] })] }),
      new TableCell({ width: { size: CONTENT_W - 3560, type: WidthType.DXA }, borders: mkBorders("CCCCCC"), margins: { top: 80, bottom: 80, left: 120, right: 120 }, children: [new Paragraph({ children: [run(r.author)] })] }),
    ]
  }));

  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: [1560, 2000, CONTENT_W - 3560],
    borders: mkBorders("CCCCCC"),
    rows: [headerRow, ...dataRows]
  });
}

// ─── Quick Reference table ────────────────────────────────────────────────────
/**
 * Renders the Quick Reference problem/fix table.
 * rows: [{ problem, fix }]
 *
 * Example:
 *   quickRefTable([{ problem: 'Path has spaces', fix: 'Wrap path in double quotes' }])
 */
function quickRefTable(rows) {
  const colW = [Math.floor(CONTENT_W * 0.38), Math.ceil(CONTENT_W * 0.62)];
  const headerRow = new TableRow({
    tableHeader: true,
    children: ['Problem', 'Fix'].map((label, i) => new TableCell({
      width: { size: colW[i], type: WidthType.DXA },
      shading: { fill: BLUE_DARK, type: ShadingType.CLEAR },
      borders: mkBorders("CCCCCC"),
      margins: { top: 100, bottom: 100, left: 160, right: 120 },
      children: [new Paragraph({ children: [run(label, { bold: true, color: "FFFFFF" })] })]
    }))
  });

  const dataRows = rows.map((r, i) => new TableRow({
    children: [
      new TableCell({ width: { size: colW[0], type: WidthType.DXA }, shading: { fill: i % 2 === 0 ? "FFFFFF" : GREY_LIGHT, type: ShadingType.CLEAR }, borders: mkBorders("CCCCCC"), margins: { top: 80, bottom: 80, left: 160, right: 120 }, children: [new Paragraph({ children: [codeRun(r.problem)] })] }),
      new TableCell({ width: { size: colW[1], type: WidthType.DXA }, shading: { fill: i % 2 === 0 ? "FFFFFF" : GREY_LIGHT, type: ShadingType.CLEAR }, borders: mkBorders("CCCCCC"), margins: { top: 80, bottom: 80, left: 160, right: 120 }, children: [new Paragraph({ children: [run(r.fix)] })] }),
    ]
  }));

  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: colW,
    borders: mkBorders("CCCCCC"),
    rows: [headerRow, ...dataRows]
  });
}

// ─── Document factory ─────────────────────────────────────────────────────────
/**
 * Creates a new Document with CloudZero branding, header/footer, and numbering config.
 * Pass `sections[0].children` as the array of content elements.
 *
 * @param {string} title   — used in the header (e.g. "How-To: Upload to GitHub")
 * @param {Array}  children — all the Paragraph/Table elements for the body
 *
 * Example:
 *   const doc = makeDocument('How-To: Restart the Service', [...elements]);
 *   Packer.toBuffer(doc).then(buf => fs.writeFileSync('output.docx', buf));
 */
function makeDocument(title, children) {
  return new Document({
    styles: {
      default: {
        document: { run: { font: "Arial", size: 22, color: TEXT_MAIN } }
      },
      paragraphStyles: [
        { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 48, bold: true, font: "Arial", color: TEXT_MAIN },
          paragraph: { spacing: { before: 0, after: 240 }, outlineLevel: 0 } },
        { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 32, bold: true, font: "Arial", color: BLUE_DARK },
          paragraph: { spacing: { before: 360, after: 120 }, outlineLevel: 1 } },
        { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 26, bold: true, font: "Arial", color: TEXT_MAIN },
          paragraph: { spacing: { before: 300, after: 100 }, outlineLevel: 2 } },
      ]
    },
    numbering: {
      config: [
        { reference: "bullets",
          levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } }, run: { font: "Arial", color: TEXT_MAIN, size: 22 } } }] },
        { reference: "numbers",
          levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } }, run: { font: "Arial", color: TEXT_MAIN, size: 22 } } }] },
        { reference: "numbers2",
          levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } }, run: { font: "Arial", color: TEXT_MAIN, size: 22 } } }] },
      ]
    },
    sections: [{
      properties: {
        page: { size: { width: PAGE_W, height: PAGE_H }, margin: MARGIN }
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            children: [new TextRun({ text: `CloudZero  |  ${title}`, color: TEXT_MID, size: 18, font: "Arial" })],
            border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: BLUE_DARK, space: 4 } },
            spacing: { after: 0 }
          })]
        })
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            children: [
              new TextRun({ text: "Internal Use  ", color: TEXT_MID, size: 16, font: "Arial" }),
              new TextRun({ children: [PageNumber.CURRENT], color: TEXT_MID, size: 16, font: "Arial" }),
              new TextRun({ text: " of ", color: TEXT_MID, size: 16, font: "Arial" }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], color: TEXT_MID, size: 16, font: "Arial" }),
            ],
            alignment: AlignmentType.RIGHT,
            border: { top: { style: BorderStyle.SINGLE, size: 4, color: BLUE_DARK, space: 4 } },
            spacing: { before: 0 }
          })]
        })
      },
      children
    }]
  });
}

// ─── Init (call this from your build script before using any helpers) ────────
/**
 * Initialize the template library with the docx module.
 * Call this once at the top of your build script:
 *
 *   const docx = require('docx');
 *   const T = require('./template.js');
 *   T.init(docx);
 *
 * After init(), all helpers (h1, h2, callout, etc.) are ready to use.
 */
function init(docx) {
  ({ Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
     Header, Footer, AlignmentType, LevelFormat, ExternalHyperlink,
     BorderStyle, WidthType, ShadingType, VerticalAlign,
     PageNumber, HeadingLevel } = docx);
}

// ─── Exports (for use in build scripts) ──────────────────────────────────────
module.exports = {
  init,
  // Colors
  BLUE_DARK, BLUE_MID, BLUE_LIGHT,
  YELLOW_BG, YELLOW_BD, GREEN_BG, GREEN_BD,
  GREY_HEADER, GREY_LIGHT, TEXT_MAIN, TEXT_MID,
  // Geometry
  PAGE_W, PAGE_H, MARGIN, CONTENT_W,
  // Helpers
  mkBorder, mkBorders, noBorder, noBorders,
  run, codeRun,
  h1, h2, h3,
  body, bodyRuns,
  spacer,
  callout,
  codeBlock,
  versionsTable,
  quickRefTable,
  makeDocument,
};
