# Bun HTMLRewriter — Full API Reference

Source: `bun-types/html-rewriter.d.ts` + `bun-types/docs/runtime/html-rewriter.mdx`

---

## HTMLRewriter (class)

Main entry point. Chainable — `on()` and `onDocument()` return `this`.

```ts
new HTMLRewriter()
```

### Methods

| Method | Signature | Returns |
|--------|-----------|---------|
| `on` | `on(selector: string, handlers: HTMLRewriterElementContentHandlers)` | `this` |
| `onDocument` | `onDocument(handlers: HTMLRewriterDocumentContentHandlers)` | `this` |
| `transform` | `transform(input: Response \| Blob \| Bun.BufferSource)` | `Response` |
| `transform` | `transform(input: string)` | `string` |
| `transform` | `transform(input: ArrayBuffer)` | `ArrayBuffer` |

`transform()` has 3 overloads — return type matches input type.

---

## Element (interface)

Represents an HTML element matched by a CSS selector. Passed to `element()` handler.

### Properties

| Property | Type | Access |
|----------|------|--------|
| `tagName` | `string` | read-write (assign to rename tag) |
| `attributes` | `IterableIterator<[string, string]>` | read-only |
| `removed` | `boolean` | read-only |
| `selfClosing` | `boolean` | read-only (explicitly self-closing, e.g. `<foo />`) |
| `canHaveContent` | `boolean` | read-only (`false` for void elements like `<br>`, `<img>`, `<input>`) |
| `namespaceURI` | `string` | read-only |

### Attribute Methods (all return `Element`)

```ts
getAttribute(name: string): string | null
hasAttribute(name: string): boolean
setAttribute(name: string, value: string): Element
removeAttribute(name: string): Element
```

### Content Mutation Methods (all return `Element`, all accept `ContentOptions?`)

| Method | Inserts content... |
|--------|--------------------|
| `before(content, options?)` | before the opening tag |
| `after(content, options?)` | after the closing tag |
| `prepend(content, options?)` | right after the opening tag (first child) |
| `append(content, options?)` | right before the closing tag (last child) |
| `replace(content, options?)` | replaces the entire element |
| `setInnerContent(content, options?)` | replaces inner content only |

### Removal Methods (all return `Element`)

| Method | Behavior |
|--------|----------|
| `remove()` | Remove element and all its content |
| `removeAndKeepContent()` | Strip opening/closing tags, keep inner content |

### End Tag Handler

```ts
onEndTag(handler: (tag: EndTag) => void | Promise<void>): void
```

---

## EndTag (interface)

Available inside `element.onEndTag()` handler.

### Properties

| Property | Type | Access |
|----------|------|--------|
| `name` | `string` | read-only (lowercase tag name) |

### Methods (all return `EndTag`, all accept `ContentOptions?`)

| Method | Behavior |
|--------|----------|
| `before(content, options?)` | Insert before the end tag |
| `after(content, options?)` | Insert after the end tag |
| `remove()` | Remove the end tag entirely |

---

## Text (interface)

Represents a chunk of text content. A single text node may produce multiple `Text` chunks.

### Properties

| Property | Type | Access |
|----------|------|--------|
| `text` | `string` | read-only — content of this chunk |
| `lastInTextNode` | `boolean` | read-only — `true` if this is the last chunk for the text node |
| `removed` | `boolean` | read-only |

### Methods (all return `Text`, all accept `ContentOptions?`)

| Method | Behavior |
|--------|----------|
| `before(content, options?)` | Insert before this text chunk |
| `after(content, options?)` | Insert after this text chunk |
| `replace(content, options?)` | Replace this text chunk |
| `remove()` | Remove this text chunk |

---

## Comment (interface)

Represents an HTML comment `<!-- ... -->`.

### Properties

| Property | Type | Access |
|----------|------|--------|
| `text` | `string` | read-write (assign to change comment text) |
| `removed` | `boolean` | read-only |

### Methods (all return `Comment`, all accept `ContentOptions?`)

| Method | Behavior |
|--------|----------|
| `before(content, options?)` | Insert before this comment |
| `after(content, options?)` | Insert after this comment |
| `replace(content, options?)` | Replace this comment |
| `remove()` | Remove this comment |

---

## Doctype (interface)

Represents `<!DOCTYPE ...>`.

### Properties

| Property | Type | Access |
|----------|------|--------|
| `name` | `string \| null` | read-only (e.g. `"html"`) |
| `publicId` | `string \| null` | read-only |
| `systemId` | `string \| null` | read-only |
| `removed` | `boolean` | read-only |

### Methods

- `remove(): Doctype` — remove the doctype declaration

---

## DocumentEnd (interface)

Available in the `end` handler of `onDocument()`.

### Methods

- `append(content: Content, options?: ContentOptions): DocumentEnd` — append content at the very end of the document

---

## ContentOptions

Passed as optional second argument to all content insertion/replacement methods.

```ts
interface ContentOptions {
  html?: boolean; // default false
  // false = content treated as plain text (< > & are escaped)
  // true  = content parsed as HTML (insert elements, tags, entities)
}
```

---

## Handler Interfaces

### HTMLRewriterElementContentHandlers

Used with `rewriter.on(selector, handlers)`. All fields optional.

```ts
interface HTMLRewriterElementContentHandlers {
  element?(element: Element): void | Promise<void>;
  comments?(comment: Comment): void | Promise<void>;
  text?(text: Text): void | Promise<void>;
}
```

- `element` — called once per matching element
- `comments` — called for each HTML comment inside matching elements
- `text` — called for each text chunk inside matching elements

### HTMLRewriterDocumentContentHandlers

Used with `rewriter.onDocument(handlers)`. All fields optional.

```ts
interface HTMLRewriterDocumentContentHandlers {
  doctype?(doctype: Doctype): void | Promise<void>;
  comments?(comment: Comment): void | Promise<void>;
  text?(text: Text): void | Promise<void>;
  end?(end: DocumentEnd): void | Promise<void>;
}
```

- `doctype` — called for the DOCTYPE declaration
- `comments` — called for each top-level comment
- `text` — called for each top-level text chunk
- `end` — called when end of document is reached

All handlers can be sync (`void`) or async (`Promise<void>`).

---

## Key Behavioral Notes

### Streaming vs Buffered

- `Response` input → streaming transformation, returns `Response`
- `string` / `ArrayBuffer` input → fully buffered, returned synchronously
- When transforming a `Response`: status code, headers preserved; content-encoding handled automatically

### Async Handlers

Async handlers **block the transformation** until they resolve. The parser waits for each handler. Useful for fetching external data mid-parse, but can impact throughput.

### CSS Selector Support

`on()` supports: tag (`"p"`), class (`".red"`, `"p.red"`), id (`"#header"`), attribute selectors (all standard operators with `i`/`s` flags), combinators (descendant, direct child), pseudo-classes (`:nth-child()`, `:first-child`, `:nth-of-type()`, `:first-of-type`, `:not()`), universal (`"*"`).

### Text Chunking

A single text node **always** arrives as at least 2 `Text` chunks — even `<p>Hello World</p>` produces 2 calls (first with `lastInTextNode=false`, second with `lastInTextNode=true`). Long text may split into more. Always accumulate chunks until `lastInTextNode === true` before transforming.

`text.text` contains **raw HTML entities** — `&amp;`, `&lt;`, `&gt;` are NOT decoded. You get the literal entity strings, not `& < >`.

Empty elements like `<p></p>` trigger **zero** text handler invocations. `<p> </p>` (whitespace) triggers at least one invocation.

### Bun vs Cloudflare

Bun extends the Cloudflare Workers API by accepting `string`, `ArrayBuffer`, `Blob`, and `Bun.BufferSource` as `transform()` inputs (Cloudflare only supports `Response`). Otherwise the API is compatible.

---

## Common Pitfalls (discovered via testing)

### `comment.replace()` does NOT remove the original comment

`replace()` on a `Comment` **prepends** content before the comment — it does not substitute. `<!-- old -->` with `.replace("new")` produces `new<!-- old -->`. To truly replace, call both `.replace("new")` and `.remove()`.

### `removeAndKeepContent()` interaction with `onEndTag()` and `after()`

In Bun 1.3.13, both `onEndTag()` and `element.after()` still fire and produce correct output after `removeAndKeepContent()`. However, the safest cross-version pattern is `element.before()` + `removeAndKeepContent()` or `element.prepend()`/`element.append()` + `removeAndKeepContent()` — content inserted via `prepend`/`append` becomes part of the inner content and survives tag removal.

### `namespaceURI` values

Regular HTML elements inside `<html>` report `namespaceURI` as `"http://www.w3.org/1999/xhtml"` — not an empty string. SVG elements get `"http://www.w3.org/2000/svg"`, MathML gets `"http://www.w3.org/1998/Math/MathML"`. Don't compare against `""` or `null`.

### `ContentOptions` escaping in `DocumentEnd.append()` and other insertion methods

All content insertion methods default to `{ html: false }`, which escapes `<`, `>`, `&`. This means `DocumentEnd.append("<!-- footer -->")` produces `&lt;!-- footer --&gt;` in output. Pass `{ html: true }` if inserting actual HTML markup.

With `{ html: true }`, HTML entities in the inserted content round-trip: `&amp;` is parsed to `&` then re-serialized as `&amp;`.
