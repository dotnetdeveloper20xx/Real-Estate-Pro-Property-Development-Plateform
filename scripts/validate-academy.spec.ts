import {
  checkFileNaming,
  checkLinkIntegrity,
  checkMermaidPresence,
  checkCodeExamples,
  checkSectionStructure,
  checkCommonMistakes,
} from './validate-academy';

// ─── File Naming (checkFileNaming) ────────────────────────────────────────────

describe('checkFileNaming', () => {
  it('accepts valid filenames with two-digit prefix and kebab-case name', () => {
    const validNames = [
      '00-learning-path.md',
      '01-business-vision.md',
      '31-future-roadmap.md',
    ];

    for (const name of validNames) {
      const result = checkFileNaming(name);
      expect(result.passed).toBe(true);
    }
  });

  it('rejects single-digit prefix', () => {
    const result = checkFileNaming('1-short.md');
    expect(result.passed).toBe(false);
  });

  it('rejects uppercase characters in name', () => {
    const result = checkFileNaming('00-AB.md');
    expect(result.passed).toBe(false);
  });

  it('rejects empty name after prefix', () => {
    const result = checkFileNaming('00-.md');
    expect(result.passed).toBe(false);
  });

  it('rejects name shorter than 3 characters', () => {
    const result = checkFileNaming('00-a.md');
    expect(result.passed).toBe(false);
  });

  it('rejects name exceeding 50 characters', () => {
    const result = checkFileNaming(
      '00-this-name-is-way-too-long-and-exceeds-the-fifty-character-limit-for-kebab-case-names.md'
    );
    expect(result.passed).toBe(false);
  });
});

// ─── Link Integrity (checkLinkIntegrity) ──────────────────────────────────────

describe('checkLinkIntegrity', () => {
  it('passes when link target exists in file set', () => {
    const content = 'See [Business Vision](./01-business-vision.md) for details.';
    const existingFiles = new Set(['01-business-vision.md', '02-lifecycle.md']);

    const { checks, brokenLinks } = checkLinkIntegrity('00-learning-path.md', content, existingFiles);

    expect(checks).toHaveLength(1);
    expect(checks[0].passed).toBe(true);
    expect(brokenLinks).toHaveLength(0);
  });

  it('fails when link target does not exist in file set', () => {
    const content = 'See [Missing](./99-nonexistent.md) for details.';
    const existingFiles = new Set(['00-learning-path.md']);

    const { checks, brokenLinks } = checkLinkIntegrity('00-learning-path.md', content, existingFiles);

    expect(checks).toHaveLength(1);
    expect(checks[0].passed).toBe(false);
    expect(brokenLinks).toHaveLength(1);
    expect(brokenLinks[0].targetFile).toBe('99-nonexistent.md');
  });

  it('produces no checks when content has no links', () => {
    const content = 'This document has no markdown links at all.';
    const existingFiles = new Set(['00-learning-path.md']);

    const { checks, brokenLinks } = checkLinkIntegrity('00-learning-path.md', content, existingFiles);

    expect(checks).toHaveLength(0);
    expect(brokenLinks).toHaveLength(0);
  });

  it('reports multiple broken links correctly', () => {
    const content = [
      '[Link A](./01-business-vision.md)',
      '[Link B](./99-missing.md)',
      '[Link C](./98-also-missing.md)',
    ].join('\n');
    const existingFiles = new Set(['01-business-vision.md']);

    const { checks, brokenLinks } = checkLinkIntegrity('05-doc.md', content, existingFiles);

    expect(checks).toHaveLength(1);
    expect(checks[0].passed).toBe(false);
    expect(brokenLinks).toHaveLength(2);
  });
});

// ─── Mermaid Presence (checkMermaidPresence) ──────────────────────────────────

describe('checkMermaidPresence', () => {
  it('passes when content has a valid mermaid block', () => {
    const content = [
      '# Architecture',
      '',
      '```mermaid',
      'graph TD',
      '  A --> B',
      '```',
    ].join('\n');

    const result = checkMermaidPresence('05-architecture.md', content);
    expect(result.passed).toBe(true);
  });

  it('fails when content has no mermaid block', () => {
    const content = [
      '# Architecture',
      '',
      '```typescript',
      'const x = 1;',
      '```',
    ].join('\n');

    const result = checkMermaidPresence('05-architecture.md', content);
    expect(result.passed).toBe(false);
  });

  it('passes when content has multiple mermaid blocks', () => {
    const content = [
      '```mermaid',
      'graph TD',
      '  A --> B',
      '```',
      '',
      '```mermaid',
      'sequenceDiagram',
      '  A->>B: Hello',
      '```',
    ].join('\n');

    const result = checkMermaidPresence('05-architecture.md', content);
    expect(result.passed).toBe(true);
    expect(result.details).toContain('2');
  });
});

// ─── Code Examples (checkCodeExamples) ────────────────────────────────────────

describe('checkCodeExamples', () => {
  it('passes with 2+ qualifying code blocks (language id, ≥3 lines)', () => {
    const content = [
      '```csharp',
      'public class Foo',
      '{',
      '  public int Bar { get; set; }',
      '}',
      '```',
      '',
      '```typescript',
      'const a = 1;',
      'const b = 2;',
      'const c = 3;',
      '```',
    ].join('\n');

    const { check } = checkCodeExamples('07-doc.md', content);
    expect(check.passed).toBe(true);
  });

  it('fails with only 1 qualifying code block', () => {
    const content = [
      '```csharp',
      'public class Foo',
      '{',
      '  public int Bar { get; set; }',
      '}',
      '```',
    ].join('\n');

    const { check, gaps } = checkCodeExamples('07-doc.md', content);
    expect(check.passed).toBe(false);
    expect(gaps).toHaveLength(1);
  });

  it('does not count mermaid blocks as code examples', () => {
    const content = [
      '```mermaid',
      'graph TD',
      '  A --> B',
      '  B --> C',
      '```',
      '',
      '```csharp',
      'public class Foo',
      '{',
      '  public int Bar { get; set; }',
      '}',
      '```',
    ].join('\n');

    const { check } = checkCodeExamples('07-doc.md', content);
    expect(check.passed).toBe(false);
  });

  it('does not count code blocks without language identifier', () => {
    const content = [
      '```',
      'some code here',
      'line two',
      'line three',
      '```',
      '',
      '```csharp',
      'public class Foo',
      '{',
      '  public int Bar { get; set; }',
      '}',
      '```',
    ].join('\n');

    const { check } = checkCodeExamples('07-doc.md', content);
    expect(check.passed).toBe(false);
  });

  it('does not count code blocks with fewer than 3 lines', () => {
    const content = [
      '```csharp',
      'var x = 1;',
      '```',
      '',
      '```typescript',
      'const a = 1;',
      'const b = 2;',
      'const c = 3;',
      '```',
    ].join('\n');

    const { check } = checkCodeExamples('07-doc.md', content);
    expect(check.passed).toBe(false);
  });
});

// ─── Section Structure (checkSectionStructure) ────────────────────────────────

describe('checkSectionStructure', () => {
  it('passes when all 7 required sections are present', () => {
    const content = [
      '# Document Title',
      '## WHY',
      'Explanation',
      '## WHAT',
      'Definition',
      '## HOW',
      'Steps',
      '## WHEN',
      'Timing',
      '## WHERE',
      'Locations',
      '## WHO',
      'Roles',
      '## WHAT NEXT',
      'Next steps',
    ].join('\n');

    const { checks } = checkSectionStructure('01-doc.md', content);
    expect(checks).toHaveLength(1);
    expect(checks[0].passed).toBe(true);
  });

  it('fails when "WHAT NEXT" section is missing', () => {
    const content = [
      '# Document Title',
      '## WHY',
      'Explanation',
      '## WHAT',
      'Definition',
      '## HOW',
      'Steps',
      '## WHEN',
      'Timing',
      '## WHERE',
      'Locations',
      '## WHO',
      'Roles',
    ].join('\n');

    const { checks, gaps } = checkSectionStructure('01-doc.md', content);
    expect(checks[0].passed).toBe(false);
    expect(checks[0].details).toContain('WHAT NEXT');
    expect(gaps).toHaveLength(1);
  });

  it('passes when sections are ## or ### headings', () => {
    const content = [
      '# Document Title',
      '### WHY',
      'Explanation',
      '### WHAT',
      'Definition',
      '## HOW',
      'Steps',
      '### WHEN',
      'Timing',
      '## WHERE',
      'Locations',
      '## WHO',
      'Roles',
      '### WHAT NEXT',
      'Next steps',
    ].join('\n');

    const { checks } = checkSectionStructure('01-doc.md', content);
    expect(checks[0].passed).toBe(true);
  });
});

// ─── Common Mistakes (checkCommonMistakes) ────────────────────────────────────

describe('checkCommonMistakes', () => {
  it('passes when "## Common Mistakes" section is present', () => {
    const content = [
      '# Document',
      '## Common Mistakes',
      'Do not do X.',
    ].join('\n');

    const result = checkCommonMistakes('01-doc.md', content);
    expect(result.passed).toBe(true);
  });

  it('fails when Common Mistakes section is missing', () => {
    const content = [
      '# Document',
      '## Introduction',
      'Some content without a common mistakes section.',
    ].join('\n');

    const result = checkCommonMistakes('01-doc.md', content);
    expect(result.passed).toBe(false);
  });
});
