/**
 * BuildEstate Pro Academy — Validation Script
 *
 * Validates the structural integrity and content quality of all documents
 * in docs/academy/. Run with: npx ts-node --project tsconfig.scripts.json scripts/validate-academy.ts
 *
 * Checks performed:
 * 1. File count (exactly 32 .md files)
 * 2. File naming (two-digit prefix + kebab-case)
 * 3. Sequential numbering (00–31, no gaps or duplicates)
 * 4. Content non-empty (at least one H1 or H2 heading)
 * 5. Link integrity (all relative markdown links resolve)
 * 6. Mermaid block presence (≥1 per document)
 * 7. Code example count (≥2 per document, with language identifier and ≥3 lines)
 * 8. Section structure (WHY/WHAT/HOW/WHEN/WHERE/WHO/WHAT NEXT)
 * 9. Common Mistakes section presence
 */

import * as fs from 'fs';
import * as path from 'path';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface ValidationReport {
  totalDocuments: number;
  passedChecks: ValidationCheck[];
  failedChecks: ValidationCheck[];
  warnings: string[];
  brokenLinks: BrokenLink[];
  missingMinimums: ContentGap[];
}

export interface ValidationCheck {
  document: string;
  check: string;
  passed: boolean;
  details?: string;
}

export interface BrokenLink {
  sourceFile: string;
  targetFile: string;
  lineNumber: number;
}

export interface ContentGap {
  document: string;
  requirement: string;
  expected: string;
  actual: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ACADEMY_DIR = path.resolve(__dirname, '..', 'docs', 'academy');
const EXPECTED_FILE_COUNT = 32;
const MIN_CODE_EXAMPLES = 2;
const MIN_CODE_BLOCK_LINES = 3;

/**
 * File naming regex:
 * - Two-digit prefix (00–31)
 * - Hyphen separator
 * - Kebab-case name: 3–50 lowercase alphanumeric + hyphens
 * - .md extension
 */
const FILE_NAME_REGEX = /^(\d{2})-([a-z0-9][a-z0-9-]{1,48}[a-z0-9])\.md$/;

const REQUIRED_SECTIONS = [
  'WHY',
  'WHAT',
  'HOW',
  'WHEN',
  'WHERE',
  'WHO',
  'WHAT NEXT',
];

// ─── Validation Functions ─────────────────────────────────────────────────────

/**
 * Get all .md files in the academy directory (non-recursive).
 */
export function getAcademyFiles(): string[] {
  if (!fs.existsSync(ACADEMY_DIR)) {
    return [];
  }
  return fs
    .readdirSync(ACADEMY_DIR)
    .filter((f) => f.endsWith('.md'))
    .sort();
}

/**
 * Validate that exactly 32 .md files exist.
 */
export function checkFileCount(files: string[]): ValidationCheck {
  const passed = files.length === EXPECTED_FILE_COUNT;
  return {
    document: 'docs/academy/',
    check: 'File count is exactly 32',
    passed,
    details: passed
      ? `Found ${files.length} files`
      : `Expected ${EXPECTED_FILE_COUNT}, found ${files.length}`,
  };
}

/**
 * Validate file naming convention: NN-kebab-case-name.md
 */
export function checkFileNaming(filename: string): ValidationCheck {
  const passed = FILE_NAME_REGEX.test(filename);
  return {
    document: filename,
    check: 'File naming convention (NN-kebab-case.md)',
    passed,
    details: passed
      ? undefined
      : `"${filename}" does not match pattern: two-digit prefix, hyphen, 3–50 char kebab-case name, .md extension`,
  };
}

/**
 * Validate sequential numbering 00–31 with no gaps or duplicates.
 */
export function checkSequentialNumbering(files: string[]): ValidationCheck[] {
  const checks: ValidationCheck[] = [];
  const numbers = new Set<number>();

  for (const file of files) {
    const match = file.match(/^(\d{2})-/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (numbers.has(num)) {
        checks.push({
          document: file,
          check: 'No duplicate numbering',
          passed: false,
          details: `Duplicate number: ${match[1]}`,
        });
      }
      numbers.add(num);
    }
  }

  // Check for gaps in 0–31 range
  for (let i = 0; i < EXPECTED_FILE_COUNT; i++) {
    const prefix = i.toString().padStart(2, '0');
    if (!numbers.has(i)) {
      checks.push({
        document: 'docs/academy/',
        check: `Sequential numbering — prefix ${prefix} present`,
        passed: false,
        details: `Missing document with prefix ${prefix}`,
      });
    }
  }

  if (checks.length === 0) {
    checks.push({
      document: 'docs/academy/',
      check: 'Sequential numbering (00–31, no gaps or duplicates)',
      passed: true,
    });
  }

  return checks;
}

/**
 * Validate that a document has at least one H1 or H2 heading (content non-empty).
 */
export function checkContentNonEmpty(
  filename: string,
  content: string
): ValidationCheck {
  const hasHeading = /^#{1,2}\s+.+/m.test(content);
  return {
    document: filename,
    check: 'Content non-empty (has at least one H1 or H2)',
    passed: hasHeading,
    details: hasHeading ? undefined : 'No H1 or H2 heading found',
  };
}

/**
 * Scan relative markdown links and verify targets exist.
 * Looks for patterns like [text](./target.md)
 */
export function checkLinkIntegrity(
  filename: string,
  content: string,
  existingFiles: Set<string>
): { checks: ValidationCheck[]; brokenLinks: BrokenLink[] } {
  const checks: ValidationCheck[] = [];
  const brokenLinks: BrokenLink[] = [];

  const lines = content.split('\n');
  const linkRegex = /\[([^\]]*)\]\((\.\/([\w-]+\.md))\)/g;
  let hasLinks = false;
  let allResolved = true;

  for (let i = 0; i < lines.length; i++) {
    let match: RegExpExecArray | null;
    linkRegex.lastIndex = 0;
    while ((match = linkRegex.exec(lines[i])) !== null) {
      hasLinks = true;
      const targetFile = match[3];
      if (!existingFiles.has(targetFile)) {
        allResolved = false;
        brokenLinks.push({
          sourceFile: filename,
          targetFile,
          lineNumber: i + 1,
        });
      }
    }
  }

  if (hasLinks) {
    checks.push({
      document: filename,
      check: 'Link integrity (all relative links resolve)',
      passed: allResolved,
      details: allResolved
        ? undefined
        : `${brokenLinks.length} broken link(s) found`,
    });
  }

  return { checks, brokenLinks };
}

/**
 * Check that at least one Mermaid code block exists.
 */
export function checkMermaidPresence(
  filename: string,
  content: string
): ValidationCheck {
  const mermaidBlockRegex = /```mermaid\s*\n[\s\S]*?```/g;
  const matches = content.match(mermaidBlockRegex);
  const count = matches ? matches.length : 0;
  return {
    document: filename,
    check: 'Mermaid block presence (≥1)',
    passed: count >= 1,
    details:
      count >= 1
        ? `Found ${count} Mermaid block(s)`
        : 'No Mermaid code block found',
  };
}

/**
 * Check that at least 2 code examples exist, each with a language identifier and ≥3 lines.
 */
export function checkCodeExamples(
  filename: string,
  content: string
): { check: ValidationCheck; gaps: ContentGap[] } {
  const gaps: ContentGap[] = [];

  // Match code blocks with language identifier (not mermaid)
  const codeBlockRegex = /```(\w+)\s*\n([\s\S]*?)```/g;
  let match: RegExpExecArray | null;
  let qualifyingBlocks = 0;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    const language = match[1];
    const blockContent = match[2];

    // Skip mermaid blocks — they are diagrams, not code examples
    if (language.toLowerCase() === 'mermaid') continue;

    const lines = blockContent.split('\n').filter((line) => line.trim() !== '');
    if (lines.length >= MIN_CODE_BLOCK_LINES) {
      qualifyingBlocks++;
    }
  }

  const passed = qualifyingBlocks >= MIN_CODE_EXAMPLES;

  if (!passed) {
    gaps.push({
      document: filename,
      requirement: 'Req 12.4 — Code examples',
      expected: `≥${MIN_CODE_EXAMPLES} code blocks with language identifier and ≥${MIN_CODE_BLOCK_LINES} lines`,
      actual: `${qualifyingBlocks} qualifying code block(s)`,
    });
  }

  return {
    check: {
      document: filename,
      check: `Code examples (≥${MIN_CODE_EXAMPLES} with lang identifier and ≥${MIN_CODE_BLOCK_LINES} lines)`,
      passed,
      details: passed
        ? `Found ${qualifyingBlocks} qualifying code block(s)`
        : `Only ${qualifyingBlocks} qualifying code block(s) found`,
    },
    gaps,
  };
}

/**
 * Check that all required sections are present: WHY/WHAT/HOW/WHEN/WHERE/WHO/WHAT NEXT
 */
export function checkSectionStructure(
  filename: string,
  content: string
): { checks: ValidationCheck[]; gaps: ContentGap[] } {
  const checks: ValidationCheck[] = [];
  const gaps: ContentGap[] = [];

  const missingSections: string[] = [];

  for (const section of REQUIRED_SECTIONS) {
    // Match ## WHY or ## WHAT NEXT (case-insensitive heading)
    const regex = new RegExp(`^#{1,3}\\s+${escapeRegex(section)}\\b`, 'im');
    if (!regex.test(content)) {
      missingSections.push(section);
    }
  }

  const passed = missingSections.length === 0;
  checks.push({
    document: filename,
    check: 'Section structure (WHY/WHAT/HOW/WHEN/WHERE/WHO/WHAT NEXT)',
    passed,
    details: passed
      ? 'All 7 required sections present'
      : `Missing sections: ${missingSections.join(', ')}`,
  });

  if (!passed) {
    gaps.push({
      document: filename,
      requirement: 'Req 12.1 — Section structure',
      expected: `All sections: ${REQUIRED_SECTIONS.join(', ')}`,
      actual: `Missing: ${missingSections.join(', ')}`,
    });
  }

  return { checks, gaps };
}

/**
 * Check that a Common Mistakes section exists.
 */
export function checkCommonMistakes(
  filename: string,
  content: string
): ValidationCheck {
  const regex = /^#{1,3}\s+Common\s+Mistakes/im;
  const passed = regex.test(content);
  return {
    document: filename,
    check: 'Common Mistakes section present',
    passed,
    details: passed ? undefined : 'No "Common Mistakes" section found',
  };
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ─── Main Validation Runner ───────────────────────────────────────────────────

export function runValidation(): ValidationReport {
  const report: ValidationReport = {
    totalDocuments: 0,
    passedChecks: [],
    failedChecks: [],
    warnings: [],
    brokenLinks: [],
    missingMinimums: [],
  };

  // Get files
  const files = getAcademyFiles();
  report.totalDocuments = files.length;

  if (files.length === 0) {
    report.warnings.push(
      'No .md files found in docs/academy/. Generate documents first.'
    );
    report.failedChecks.push(checkFileCount(files));
    return report;
  }

  // 1. File count
  addCheck(report, checkFileCount(files));

  // 2. File naming
  for (const file of files) {
    addCheck(report, checkFileNaming(file));
  }

  // 3. Sequential numbering
  const seqChecks = checkSequentialNumbering(files);
  for (const check of seqChecks) {
    addCheck(report, check);
  }

  // Per-document checks
  const existingFileSet = new Set(files);

  for (const file of files) {
    const filePath = path.join(ACADEMY_DIR, file);
    let content: string;

    try {
      content = fs.readFileSync(filePath, 'utf-8');
    } catch {
      report.failedChecks.push({
        document: file,
        check: 'File readable',
        passed: false,
        details: `Could not read file: ${filePath}`,
      });
      continue;
    }

    // 4. Content non-empty
    addCheck(report, checkContentNonEmpty(file, content));

    // 5. Link integrity
    const linkResult = checkLinkIntegrity(file, content, existingFileSet);
    for (const check of linkResult.checks) {
      addCheck(report, check);
    }
    report.brokenLinks.push(...linkResult.brokenLinks);

    // 6. Mermaid presence
    addCheck(report, checkMermaidPresence(file, content));

    // 7. Code examples
    const codeResult = checkCodeExamples(file, content);
    addCheck(report, codeResult.check);
    report.missingMinimums.push(...codeResult.gaps);

    // 8. Section structure
    const sectionResult = checkSectionStructure(file, content);
    for (const check of sectionResult.checks) {
      addCheck(report, check);
    }
    report.missingMinimums.push(...sectionResult.gaps);

    // 9. Common Mistakes
    addCheck(report, checkCommonMistakes(file, content));
  }

  return report;
}

function addCheck(report: ValidationReport, check: ValidationCheck): void {
  if (check.passed) {
    report.passedChecks.push(check);
  } else {
    report.failedChecks.push(check);
  }
}

// ─── Report Formatter ─────────────────────────────────────────────────────────

function formatReport(report: ValidationReport): string {
  const lines: string[] = [];

  lines.push('');
  lines.push('═══════════════════════════════════════════════════════════');
  lines.push('  BuildEstate Pro Academy — Validation Report');
  lines.push('═══════════════════════════════════════════════════════════');
  lines.push('');
  lines.push(`  Total documents found: ${report.totalDocuments}`);
  lines.push(`  Passed checks: ${report.passedChecks.length}`);
  lines.push(`  Failed checks: ${report.failedChecks.length}`);
  lines.push(`  Warnings: ${report.warnings.length}`);
  lines.push(`  Broken links: ${report.brokenLinks.length}`);
  lines.push(`  Content gaps: ${report.missingMinimums.length}`);
  lines.push('');

  if (report.warnings.length > 0) {
    lines.push('─── Warnings ───────────────────────────────────────────────');
    for (const warning of report.warnings) {
      lines.push(`  ⚠️  ${warning}`);
    }
    lines.push('');
  }

  if (report.failedChecks.length > 0) {
    lines.push('─── Failed Checks ──────────────────────────────────────────');
    for (const check of report.failedChecks) {
      lines.push(`  ❌ [${check.document}] ${check.check}`);
      if (check.details) {
        lines.push(`     → ${check.details}`);
      }
    }
    lines.push('');
  }

  if (report.brokenLinks.length > 0) {
    lines.push('─── Broken Links ───────────────────────────────────────────');
    for (const link of report.brokenLinks) {
      lines.push(
        `  🔗 ${link.sourceFile}:${link.lineNumber} → ${link.targetFile}`
      );
    }
    lines.push('');
  }

  if (report.missingMinimums.length > 0) {
    lines.push('─── Content Gaps ───────────────────────────────────────────');
    for (const gap of report.missingMinimums) {
      lines.push(`  📋 [${gap.document}] ${gap.requirement}`);
      lines.push(`     Expected: ${gap.expected}`);
      lines.push(`     Actual:   ${gap.actual}`);
    }
    lines.push('');
  }

  if (report.failedChecks.length === 0 && report.brokenLinks.length === 0) {
    lines.push('─── Result ─────────────────────────────────────────────────');
    lines.push('  ✅ All checks passed!');
    lines.push('');
  } else {
    lines.push('─── Result ─────────────────────────────────────────────────');
    lines.push('  ❌ Validation failed. Fix the issues above.');
    lines.push('');
  }

  lines.push('═══════════════════════════════════════════════════════════');
  return lines.join('\n');
}

// ─── Entry Point ──────────────────────────────────────────────────────────────

if (require.main === module) {
  const report = runValidation();
  console.log(formatReport(report));
  process.exit(report.failedChecks.length > 0 ? 1 : 0);
}
