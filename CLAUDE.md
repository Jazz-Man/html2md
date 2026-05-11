# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HTML-to-Markdown converter using Bun's built-in `HTMLRewriter` API. The project reads an HTML file, processes it through `HTMLRewriter` to strip unwanted elements, and writes the output as Markdown.

## Commands

```bash
bun install                  # Install dependencies
bun run src/index.ts         # Run the converter
bun run biome check .        # Lint and check formatting
bun run biome check --write . # Lint and auto-fix
bun run biome format --write . # Format code
bun test                     # Run tests (test root is ./tests/)
```

## Build & Publish

- Published to GitHub Packages under the `@jazz-man` scope
- CI triggers on push to `master` via `.github/workflows/npm-publish-github-packages.yml`
- Build, test, and publish steps are currently commented out

## Architecture

- **`src/index.ts`** — Entry point. Constructs an `HTMLRewriter` pipeline that removes ignored elements (via `defaultIgnoreElements`), strips doctypes/comments, and transforms `<img>` elements. Reads from `test.html`, writes to `test.md`.
- **`src/config.ts`** — Three element lists used by the rewriter: `defaultBlockElements` (block-level HTML tags), `defaultIgnoreElements` (elements to strip entirely — script, style, meta, etc.), and `contentlessElements` (self-closing tags).
- **`src/utils.ts`** — File I/O helpers: `getSorsCode` reads a file to string, `saveFile` writes content to disk with path creation. Also exports `inputHtml`/`outputMd` paths (currently hardcoded to `test.html`/`test.md` in CWD).

## Key Details

- Runtime: Bun (>=1.3.13), not Node.js. Uses Bun-native APIs (`Bun.file`, `Bun.write`, `HTMLRewriter`).
- Formatting: tabs for indentation, double quotes, via Biome.
- TypeScript strict mode with `noUncheckedIndexedAccess` and `noImplicitOverride` enabled.
- `verbatimModuleSyntax` is on — use `import type` for type-only imports.
- The `module` entry in package.json points to `src/index.ts` (no build step).
