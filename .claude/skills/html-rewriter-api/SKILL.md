---
name: html-rewriter-api
description: Bun HTMLRewriter API reference for HTML-to-Markdown conversion. Use when working with HTMLRewriter, element handlers, text chunks, or any HTML parsing/transformation in this project.
---

# HTMLRewriter API Reference

Bun's built-in `HTMLRewriter` API for streaming HTML transformation. Powered by [lol-html](https://github.com/cloudflare/lol-html).

## When to Use This Skill

- Adding or modifying HTML element handlers (`element()`, `text()`, `comments()`)
- Working with `Element`, `Text`, `Comment`, `EndTag`, or `Doctype` interfaces
- Registering selectors via `on()` or document handlers via `onDocument()`
- Understanding `ContentOptions` (`{ html: true }`) for content insertion

## Quick Start

```ts
const rewriter = new HTMLRewriter()
  .on("p", {
    element(el) { el.replace("text", { html: false }); },
    text(text) { /* handle text chunks */ },
  })
  .onDocument({
    doctype(dt) { dt.remove(); },
    comments(c) { c.remove(); },
  });

const result = rewriter.transform("<p>Hello</p>"); // returns string
```

## Full API Reference

See [references/api-reference.md](references/api-reference.md) for the complete API surface — all classes, interfaces, methods, and behavioral notes.
