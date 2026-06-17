# Response Protocol — Mandatory Codebase Inspection

## Rule

Before answering ANY question from the user — whether it's about a bug, a feature, how something works, what exists, or what's missing — you MUST:

1. **Read the relevant source code files** in the codebase first
2. **Inspect the actual implementation** — never guess or assume based on memory
3. **Verify your answer against the real code** before responding
4. **Show evidence** of what you found (file paths, code snippets, test results)

## Why

The user has been burned by incorrect assumptions too many times. Every answer must be grounded in what the code ACTUALLY does, not what we think it does.

## Process

1. Identify which files/folders are relevant to the question
2. Read those files using read_file, grep_search, or list_directory
3. If the question involves API endpoints — check both the backend controller AND the frontend component calling it
4. If the question involves data — verify the database schema, seed data, and service layer
5. If the question involves UI — check the component template, its data loading, and the API it calls
6. Only THEN formulate your answer based on what you actually found

## Never Do

- Never say "it should work" without verifying
- Never say "the issue is probably X" without reading the code first
- Never claim a fix works without building and testing
- Never assume an endpoint exists without checking the controller
- Never assume data exists without checking the database/seed

## Always Do

- Read before answering
- Build after changing
- Test after building
- Verify the fix works from the user's perspective
- Commit only confirmed working code
