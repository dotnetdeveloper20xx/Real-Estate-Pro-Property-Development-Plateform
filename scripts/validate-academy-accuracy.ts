/**
 * BuildEstate Pro Academy — Codebase Accuracy Validation Script
 *
 * Validates that references in academy documents accurately reflect the actual codebase.
 * Run with: npx ts-node --project tsconfig.scripts.json scripts/validate-academy-accuracy.ts
 *
 * Checks performed:
 * 1. File path references — verifies referenced paths exist in the repository
 * 2. Class/interface name references — verifies PascalCase identifiers exist in src/ or client-app/src/
 * 3. Angular component selectors — verifies app-* selectors exist in client-app/src/app/shared/
 *
 * Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6
 */

import * as fs from 'fs';
import * as path from 'path';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface AccuracyReport {
  totalDocumentsScanned: number;
  totalReferencesFound: number;
  verifiedReferences: number;
  unverifiedReferences: UnverifiedReference[];
  warnings: string[];
}

export interface UnverifiedReference {
  sourceFile: string;
  lineNumber: number;
  referenceType: 'file-path' | 'class-name' | 'component-selector';
  reference: string;
  details?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const REPO_ROOT = path.resolve(__dirname, '..');
const ACADEMY_DIR = path.join(REPO_ROOT, 'docs', 'academy');

/** Backend source directories to search for classes */
const BACKEND_SOURCE_DIRS = [
  path.join(REPO_ROOT, 'src', 'BuildEstate.Domain'),
  path.join(REPO_ROOT, 'src', 'BuildEstate.Application'),
  path.join(REPO_ROOT, 'src', 'BuildEstate.Infrastructure'),
  path.join(REPO_ROOT, 'src', 'BuildEstate.API'),
  path.join(REPO_ROOT, 'src', 'BuildEstate.Shared'),
];

/** Frontend source directories to search for classes */
const FRONTEND_SOURCE_DIRS = [
  path.join(REPO_ROOT, 'client-app', 'src'),
];

/** Directory to search for Angular component selectors */
const SHARED_COMPONENTS_DIR = path.join(
  REPO_ROOT,
  'client-app',
  'src',
  'app',
  'shared'
);

/**
 * Regex for file path references in markdown documents.
 * Matches patterns like:
 *   src/BuildEstate.Domain/Entities/...
 *   client-app/src/app/...
 *   tests/...
 */
const FILE_PATH_REGEX =
  /(?:^|[\s`"'(])((src\/BuildEstate\.\w+|client-app\/src|tests)(\/[\w.\-/]+))/gm;

/**
 * Regex for PascalCase class/interface names that look like C# or TypeScript types.
 * Matches identifiers like: LandOpportunity, CreateOpportunityCommand, ISearchProvider
 * Excludes common markdown/mermaid keywords and standalone short words.
 */
const CLASS_NAME_REGEX =
  /\b(I?[A-Z][a-z]+(?:[A-Z][a-z0-9]+){1,}(?:Command|Query|Handler|Validator|Controller|Service|Component|Module|Entity|Dto|Provider|Guard|Effect|Reducer|Interceptor|Middleware|Exception|Interface)?)\b/g;

/**
 * Regex for Angular component selectors (app-* patterns).
 * Matches both <app-something> in templates and standalone `app-something` references.
 */
const COMPONENT_SELECTOR_REGEX =
  /(?:<|['"`\s])(app-[a-z][a-z0-9-]+)/g;

/**
 * Common PascalCase words that are NOT class references — used to reduce false positives.
 */
const CLASS_NAME_EXCLUSIONS = new Set([
  // Generic English words that happen to be PascalCase
  'JavaScript', 'TypeScript', 'CSharp', 'Angular', 'Microsoft',
  'BuildEstate', 'RealEstate', 'NgRx', 'MediatR', 'FluentValidation',
  'AutoMapper', 'DaisyUI', 'TailwindCSS', 'PrimeNG',
  // Mermaid keywords
  'SequenceDiagram', 'StateDiagram', 'ClassDiagram', 'ErDiagram',
  // Section headers / common doc terms
  'CommonMistakes', 'WhatNext', 'FullStack', 'CodeExample',
  'CleanArchitecture', 'WebApplicationFactory',
  // Generic patterns that are too common
  'HttpClient', 'HttpRequest', 'HttpResponse',
  'FormControl', 'FormGroup', 'FormArray',
  'Observable', 'BehaviorSubject', 'ReplaySubject',
  'OnInit', 'OnDestroy', 'OnChanges', 'AfterViewInit',
  'OnPush', 'ChangeDetection', 'ChangeDetectionStrategy',
  'ViewChild', 'ContentChild', 'EventEmitter',
  'Injectable', 'Component', 'Directive', 'Pipe',
  'NgModule', 'RouterModule',
  'IActionResult', 'CreatedAtAction',
  'CancellationToken', 'IServiceCollection',
  'DbContext', 'DbSet',
  'ILogger', 'LogInformation', 'LogWarning', 'LogError',
  'DateTime', 'TimeSpan', 'Guid',
  'ActionResult', 'OkResult', 'BadRequest', 'NotFound',
  'FromBody', 'FromRoute', 'FromQuery',
  'HttpPost', 'HttpGet', 'HttpPut', 'HttpDelete', 'HttpPatch',
  'Authorize', 'AllowAnonymous',
  'IsDeleted', 'CreatedAt', 'UpdatedAt',
  'AsNoTracking', 'SaveChangesAsync',
  'PagedResult', 'ApiResponse',
]);

// ─── File System Helpers ──────────────────────────────────────────────────────

/**
 * Recursively collect all file paths (relative to repo root) under a directory.
 */
function collectFilePaths(dir: string, relativeTo: string = REPO_ROOT): string[] {
  const results: string[] = [];

  if (!fs.existsSync(dir)) {
    return results;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip node_modules, .git, dist, obj, bin directories
      if (['node_modules', '.git', 'dist', 'obj', 'bin', '.angular', 'out-tsc'].includes(entry.name)) {
        continue;
      }
      results.push(...collectFilePaths(fullPath, relativeTo));
    } else {
      const relativePath = path.relative(relativeTo, fullPath).replace(/\\/g, '/');
      results.push(relativePath);
    }
  }

  return results;
}

/**
 * Recursively search for files with specific extensions in a directory.
 */
function collectSourceFiles(dir: string, extensions: string[]): string[] {
  const results: string[] = [];

  if (!fs.existsSync(dir)) {
    return results;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', '.git', 'dist', 'obj', 'bin', '.angular', 'out-tsc'].includes(entry.name)) {
        continue;
      }
      results.push(...collectSourceFiles(fullPath, extensions));
    } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
      results.push(fullPath);
    }
  }

  return results;
}

// ─── Verification Functions ───────────────────────────────────────────────────

/**
 * Verify that a referenced file path exists in the repository.
 *
 * @param referencedPath - The path referenced in the document (e.g., "src/BuildEstate.Domain/Entities/LandOpportunity.cs")
 * @param repoFilePaths - Set of all known file paths in the repository (relative, forward-slash)
 * @returns true if the path exists or is a valid directory prefix
 */
export function verifyFilePath(
  referencedPath: string,
  repoFilePaths: Set<string>
): boolean {
  // Normalize path separators
  const normalized = referencedPath.replace(/\\/g, '/').replace(/\/$/, '');

  // Direct match
  if (repoFilePaths.has(normalized)) {
    return true;
  }

  // Check if it's a directory prefix (i.e., files exist under this path)
  for (const filePath of repoFilePaths) {
    if (filePath.startsWith(normalized + '/')) {
      return true;
    }
  }

  return false;
}

/**
 * Verify that a class/interface name exists in the codebase by searching
 * source files in src/ and client-app/src/.
 *
 * @param className - The PascalCase identifier to find
 * @param classNameIndex - Pre-built index of class names found in the codebase
 * @returns true if the class name is found
 */
export function verifyClassName(
  className: string,
  classNameIndex: Set<string>
): boolean {
  return classNameIndex.has(className);
}

/**
 * Verify that an Angular component selector exists in client-app/src/app/shared/.
 *
 * @param selector - The component selector (e.g., "app-data-table")
 * @param selectorIndex - Pre-built index of selectors found in shared components
 * @returns true if the selector is found
 */
export function verifyComponentSelector(
  selector: string,
  selectorIndex: Set<string>
): boolean {
  return selectorIndex.has(selector);
}

// ─── Index Builders ───────────────────────────────────────────────────────────

/**
 * Build an index of all class/interface names found in C# and TypeScript source files.
 */
export function buildClassNameIndex(): Set<string> {
  const index = new Set<string>();

  // C# class/interface/enum/record/struct declarations
  const csPattern = /(?:class|interface|enum|record|struct)\s+([A-Z]\w+)/g;
  // TypeScript class/interface/enum/type declarations
  const tsPattern = /(?:class|interface|enum|type)\s+([A-Z]\w+)/g;

  // Scan backend C# files
  for (const dir of BACKEND_SOURCE_DIRS) {
    const files = collectSourceFiles(dir, ['.cs']);
    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf-8');
        let match: RegExpExecArray | null;
        csPattern.lastIndex = 0;
        while ((match = csPattern.exec(content)) !== null) {
          index.add(match[1]);
        }
      } catch {
        // Skip unreadable files
      }
    }
  }

  // Scan frontend TypeScript files
  for (const dir of FRONTEND_SOURCE_DIRS) {
    const files = collectSourceFiles(dir, ['.ts']);
    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf-8');
        let match: RegExpExecArray | null;
        tsPattern.lastIndex = 0;
        while ((match = tsPattern.exec(content)) !== null) {
          index.add(match[1]);
        }
      } catch {
        // Skip unreadable files
      }
    }
  }

  return index;
}

/**
 * Build an index of Angular component selectors from shared component files.
 * Searches for `selector: 'app-...'` patterns in component decorators.
 */
export function buildSelectorIndex(): Set<string> {
  const index = new Set<string>();
  const selectorPattern = /selector:\s*['"`](app-[a-z][a-z0-9-]+)['"`]/g;

  if (!fs.existsSync(SHARED_COMPONENTS_DIR)) {
    return index;
  }

  const files = collectSourceFiles(SHARED_COMPONENTS_DIR, ['.ts']);
  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      let match: RegExpExecArray | null;
      selectorPattern.lastIndex = 0;
      while ((match = selectorPattern.exec(content)) !== null) {
        index.add(match[1]);
      }
    } catch {
      // Skip unreadable files
    }
  }

  // Also search in features and core for additional component selectors
  const additionalDirs = [
    path.join(REPO_ROOT, 'client-app', 'src', 'app', 'features'),
    path.join(REPO_ROOT, 'client-app', 'src', 'app', 'core'),
  ];

  for (const dir of additionalDirs) {
    if (!fs.existsSync(dir)) continue;
    const files = collectSourceFiles(dir, ['.ts']);
    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf-8');
        let match: RegExpExecArray | null;
        selectorPattern.lastIndex = 0;
        while ((match = selectorPattern.exec(content)) !== null) {
          index.add(match[1]);
        }
      } catch {
        // Skip unreadable files
      }
    }
  }

  return index;
}

// ─── Document Scanner ─────────────────────────────────────────────────────────

/**
 * Extract file path references from a document's content.
 */
export function extractFilePathReferences(
  content: string
): { reference: string; lineNumber: number }[] {
  const results: { reference: string; lineNumber: number }[] = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    let match: RegExpExecArray | null;
    FILE_PATH_REGEX.lastIndex = 0;
    while ((match = FILE_PATH_REGEX.exec(lines[i])) !== null) {
      const refPath = match[1];
      // Skip if inside a mermaid block (simple heuristic: not useful for path validation)
      results.push({ reference: refPath, lineNumber: i + 1 });
    }
  }

  return results;
}

/**
 * Extract class/interface name references from a document's content.
 * Filters out common false positives.
 */
export function extractClassNameReferences(
  content: string
): { reference: string; lineNumber: number }[] {
  const results: { reference: string; lineNumber: number }[] = [];
  const seen = new Set<string>();
  const lines = content.split('\n');

  // Track whether we're inside a mermaid block (skip those)
  let inMermaid = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim().startsWith('```mermaid')) {
      inMermaid = true;
      continue;
    }
    if (inMermaid && line.trim().startsWith('```')) {
      inMermaid = false;
      continue;
    }
    if (inMermaid) continue;

    let match: RegExpExecArray | null;
    CLASS_NAME_REGEX.lastIndex = 0;
    while ((match = CLASS_NAME_REGEX.exec(line)) !== null) {
      const className = match[1];

      // Skip excluded names
      if (CLASS_NAME_EXCLUSIONS.has(className)) continue;
      // Skip if it's too short (less than 5 chars) — likely not a real class
      if (className.length < 5) continue;
      // Skip if already seen in this document (report each unique reference once)
      if (seen.has(className)) continue;

      seen.add(className);
      results.push({ reference: className, lineNumber: i + 1 });
    }
  }

  return results;
}

/**
 * Extract Angular component selector references from a document's content.
 */
export function extractSelectorReferences(
  content: string
): { reference: string; lineNumber: number }[] {
  const results: { reference: string; lineNumber: number }[] = [];
  const seen = new Set<string>();
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    let match: RegExpExecArray | null;
    COMPONENT_SELECTOR_REGEX.lastIndex = 0;
    while ((match = COMPONENT_SELECTOR_REGEX.exec(lines[i])) !== null) {
      const selector = match[1];
      if (seen.has(selector)) continue;
      seen.add(selector);
      results.push({ reference: selector, lineNumber: i + 1 });
    }
  }

  return results;
}

// ─── Main Validation Runner ───────────────────────────────────────────────────

export function runAccuracyValidation(): AccuracyReport {
  const report: AccuracyReport = {
    totalDocumentsScanned: 0,
    totalReferencesFound: 0,
    verifiedReferences: 0,
    unverifiedReferences: [],
    warnings: [],
  };

  // Check academy directory exists
  if (!fs.existsSync(ACADEMY_DIR)) {
    report.warnings.push(
      'docs/academy/ directory not found. Generate documents first.'
    );
    return report;
  }

  // Get academy markdown files
  const academyFiles = fs
    .readdirSync(ACADEMY_DIR)
    .filter((f) => f.endsWith('.md'))
    .sort();

  if (academyFiles.length === 0) {
    report.warnings.push(
      'No .md files found in docs/academy/. Generate documents first.'
    );
    return report;
  }

  report.totalDocumentsScanned = academyFiles.length;

  // Build indexes
  console.log('  Building file path index...');
  const allRepoPaths = new Set(collectFilePaths(REPO_ROOT));

  console.log('  Building class name index...');
  const classNameIndex = buildClassNameIndex();

  console.log('  Building component selector index...');
  const selectorIndex = buildSelectorIndex();

  console.log(
    `  Indexes built: ${allRepoPaths.size} file paths, ${classNameIndex.size} class names, ${selectorIndex.size} selectors`
  );
  console.log('');

  // Scan each document
  for (const filename of academyFiles) {
    const filePath = path.join(ACADEMY_DIR, filename);
    let content: string;

    try {
      content = fs.readFileSync(filePath, 'utf-8');
    } catch {
      report.warnings.push(`Could not read file: ${filename}`);
      continue;
    }

    // 1. Check file path references
    const pathRefs = extractFilePathReferences(content);
    for (const ref of pathRefs) {
      report.totalReferencesFound++;
      if (verifyFilePath(ref.reference, allRepoPaths)) {
        report.verifiedReferences++;
      } else {
        report.unverifiedReferences.push({
          sourceFile: filename,
          lineNumber: ref.lineNumber,
          referenceType: 'file-path',
          reference: ref.reference,
          details: 'Path does not exist in repository',
        });
      }
    }

    // 2. Check class name references
    const classRefs = extractClassNameReferences(content);
    for (const ref of classRefs) {
      report.totalReferencesFound++;
      if (verifyClassName(ref.reference, classNameIndex)) {
        report.verifiedReferences++;
      } else {
        report.unverifiedReferences.push({
          sourceFile: filename,
          lineNumber: ref.lineNumber,
          referenceType: 'class-name',
          reference: ref.reference,
          details: 'Class/interface not found in src/ or client-app/src/',
        });
      }
    }

    // 3. Check component selector references
    const selectorRefs = extractSelectorReferences(content);
    for (const ref of selectorRefs) {
      report.totalReferencesFound++;
      if (verifyComponentSelector(ref.reference, selectorIndex)) {
        report.verifiedReferences++;
      } else {
        report.unverifiedReferences.push({
          sourceFile: filename,
          lineNumber: ref.lineNumber,
          referenceType: 'component-selector',
          reference: ref.reference,
          details: 'Selector not found in client-app/src/app/',
        });
      }
    }
  }

  return report;
}

// ─── Report Formatter ─────────────────────────────────────────────────────────

function formatAccuracyReport(report: AccuracyReport): string {
  const lines: string[] = [];

  lines.push('');
  lines.push('═══════════════════════════════════════════════════════════');
  lines.push('  BuildEstate Pro Academy — Codebase Accuracy Report');
  lines.push('═══════════════════════════════════════════════════════════');
  lines.push('');
  lines.push(`  Documents scanned:      ${report.totalDocumentsScanned}`);
  lines.push(`  Total references found: ${report.totalReferencesFound}`);
  lines.push(`  Verified references:    ${report.verifiedReferences}`);
  lines.push(`  Unverified references:  ${report.unverifiedReferences.length}`);
  lines.push(`  Warnings:               ${report.warnings.length}`);
  lines.push('');

  if (report.warnings.length > 0) {
    lines.push('─── Warnings ───────────────────────────────────────────────');
    for (const warning of report.warnings) {
      lines.push(`  ⚠️  ${warning}`);
    }
    lines.push('');
  }

  if (report.unverifiedReferences.length > 0) {
    // Group by type
    const byType = {
      'file-path': report.unverifiedReferences.filter(
        (r) => r.referenceType === 'file-path'
      ),
      'class-name': report.unverifiedReferences.filter(
        (r) => r.referenceType === 'class-name'
      ),
      'component-selector': report.unverifiedReferences.filter(
        (r) => r.referenceType === 'component-selector'
      ),
    };

    if (byType['file-path'].length > 0) {
      lines.push('─── Unverified File Paths ──────────────────────────────────');
      for (const ref of byType['file-path']) {
        lines.push(
          `  📁 ${ref.sourceFile}:${ref.lineNumber} → ${ref.reference}`
        );
      }
      lines.push('');
    }

    if (byType['class-name'].length > 0) {
      lines.push('─── Unverified Class Names ─────────────────────────────────');
      for (const ref of byType['class-name']) {
        lines.push(
          `  🏷️  ${ref.sourceFile}:${ref.lineNumber} → ${ref.reference}`
        );
      }
      lines.push('');
    }

    if (byType['component-selector'].length > 0) {
      lines.push('─── Unverified Component Selectors ─────────────────────────');
      for (const ref of byType['component-selector']) {
        lines.push(
          `  🧩 ${ref.sourceFile}:${ref.lineNumber} → ${ref.reference}`
        );
      }
      lines.push('');
    }
  }

  if (report.unverifiedReferences.length === 0 && report.warnings.length === 0) {
    lines.push('─── Result ─────────────────────────────────────────────────');
    lines.push('  ✅ All codebase references verified!');
    lines.push('');
  } else if (report.unverifiedReferences.length > 0) {
    lines.push('─── Result ─────────────────────────────────────────────────');
    lines.push(
      `  ⚠️  ${report.unverifiedReferences.length} unverified reference(s) require manual check.`
    );
    lines.push(
      '  Flag these with: ⚠️ Unverified — requires manual check'
    );
    lines.push('');
  }

  lines.push('═══════════════════════════════════════════════════════════');
  return lines.join('\n');
}

// ─── Entry Point ──────────────────────────────────────────────────────────────

if (require.main === module) {
  console.log('');
  console.log('  Starting codebase accuracy validation...');
  console.log('');

  const report = runAccuracyValidation();
  console.log(formatAccuracyReport(report));

  // Exit with code 0 — unverified references are warnings, not hard failures
  process.exit(0);
}
