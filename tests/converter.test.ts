import { describe, expect, test } from "bun:test";
import { Converter } from "../src/converter";

describe("headings", () => {
	const converter = new Converter();

	test("h1", () => {
		expect(converter.convert("<h1>Title</h1>")).toBe("# Title");
	});

	test("h2", () => {
		expect(converter.convert("<h2>Subtitle</h2>")).toBe("## Subtitle");
	});

	test("h3 through h6", () => {
		expect(converter.convert("<h3>H3</h3>")).toBe("### H3");
		expect(converter.convert("<h4>H4</h4>")).toBe("#### H4");
		expect(converter.convert("<h5>H5</h5>")).toBe("##### H5");
		expect(converter.convert("<h6>H6</h6>")).toBe("###### H6");
	});

	test("empty heading", () => {
		expect(converter.convert("<h1></h1>")).toBe("#");
	});

	test("heading with inline elements", () => {
		const result = converter.convert("<h2>Hello <strong>World</strong></h2>");
		expect(result).toContain("## Hello **World**");
	});

	test("multiple headings", () => {
		const result = converter.convert("<h1>A</h1><h2>B</h2>");
		expect(result).toContain("# A");
		expect(result).toContain("## B");
	});
});

describe("inline formatting", () => {
	const converter = new Converter();

	test("strong", () => {
		expect(converter.convert("<strong>bold</strong>")).toBe("**bold**");
	});

	test("b", () => {
		expect(converter.convert("<b>bold</b>")).toBe("**bold**");
	});

	test("em", () => {
		expect(converter.convert("<em>italic</em>")).toBe("*italic*");
	});

	test("i", () => {
		expect(converter.convert("<i>italic</i>")).toBe("*italic*");
	});

	test("del", () => {
		expect(converter.convert("<del>deleted</del>")).toBe("~~deleted~~");
	});

	test("s", () => {
		expect(converter.convert("<s>struck</s>")).toBe("~~struck~~");
	});

	test("strike", () => {
		expect(converter.convert("<strike>struck</strike>")).toBe("~~struck~~");
	});

	test("ins", () => {
		expect(converter.convert("<ins>inserted</ins>")).toBe("++inserted++");
	});

	test("mark", () => {
		expect(converter.convert("<mark>highlighted</mark>")).toBe("==highlighted==");
	});

	test("sub", () => {
		expect(converter.convert("<sub>2</sub>")).toBe("~2~");
	});

	test("sup", () => {
		expect(converter.convert("<sup>2</sup>")).toBe("^2^");
	});

	test("code", () => {
		expect(converter.convert("<code>var x</code>")).toBe("`var x`");
	});

	test("q", () => {
		expect(converter.convert('<q>quoted</q>')).toBe('"quoted"');
	});

	test("nested strong + em", () => {
		const result = converter.convert("<strong><em>both</em></strong>");
		expect(result).toBe("***both***");
	});

	test("em inside strong", () => {
		const result = converter.convert("<strong>bold <em>and italic</em></strong>");
		expect(result).toBe("**bold *and italic***");
	});
});

describe("abbr", () => {
	const converter = new Converter();

	test("with title", () => {
		const result = converter.convert(
			'<abbr title="HyperText Markup Language">HTML</abbr>',
		);
		expect(result).toBe("HTML (HyperText Markup Language)");
	});

	test("without title", () => {
		expect(converter.convert("<abbr>HTML</abbr>")).toBe("HTML");
	});
});

describe("links", () => {
	const converter = new Converter();

	test("link with href", () => {
		const result = converter.convert(
			'<a href="https://example.com">example</a>',
		);
		expect(result).toBe("[example](https://example.com)");
	});

	test("link without href", () => {
		expect(converter.convert("<a>plain text</a>")).toBe("plain text");
	});

	test("link with nested elements", () => {
		const result = converter.convert(
			'<a href="/url"><strong>bold link</strong></a>',
		);
		expect(result).toBe("[**bold link**](/url)");
	});
});

describe("images", () => {
	const converter = new Converter();

	test("img with src and alt", () => {
		expect(converter.convert('<img src="photo.jpg" alt="Photo">')).toBe(
			"![Photo](photo.jpg)",
		);
	});

	test("img without alt", () => {
		expect(converter.convert('<img src="photo.jpg">')).toBe("![](photo.jpg)");
	});

	test("img without src", () => {
		expect(converter.convert('<img alt="No image">')).toBe("");
	});

	test("img with empty src", () => {
		const result = converter.convert('<img src="" alt="Empty">');
		expect(result).toBe("![Empty]()");
	});
});

describe("block elements", () => {
	const converter = new Converter();

	test("paragraph", () => {
		const result = converter.convert("<p>Hello</p>");
		expect(result).toBe("Hello");
	});

	test("multiple paragraphs", () => {
		const result = converter.convert("<p>A</p><p>B</p>");
		expect(result).toContain("A");
		expect(result).toContain("B");
		expect(result).toMatch(/A\n\nB/);
	});

	test("blockquote", () => {
		const result = converter.convert("<blockquote>Quote text</blockquote>");
		expect(result).toContain("> Quote text");
	});

	test("pre", () => {
		const result = converter.convert("<pre>code here</pre>");
		expect(result).toContain("```\ncode here\n```");
	});

	test("pre with code inside", () => {
		const result = converter.convert("<pre><code>let x = 1;</code></pre>");
		expect(result).toContain("```\nlet x = 1;\n```");
		expect(result).not.toContain("`let");
	});

	test("hr", () => {
		const result = converter.convert("<hr>");
		expect(result).toBe("---");
	});

	test("br", () => {
		const result = converter.convert("Line 1<br>Line 2");
		expect(result).toContain("Line 1\nLine 2");
	});
});

describe("unordered lists", () => {
	const converter = new Converter();

	test("simple list", () => {
		const result = converter.convert("<ul><li>A</li><li>B</li></ul>");
		expect(result).toContain("- A");
		expect(result).toContain("- B");
	});

	test("nested list", () => {
		const result = converter.convert(
			"<ul><li>Item 1<ul><li>Nested</li></ul></li><li>Item 2</li></ul>",
		);
		expect(result).toContain("- Item 1");
		expect(result).toContain("  - Nested");
		expect(result).toContain("- Item 2");
	});

	test("deeply nested list", () => {
		const result = converter.convert(
			"<ul><li>L1<ul><li>L2<ul><li>L3</li></ul></li></ul></li></ul>",
		);
		expect(result).toContain("- L1");
		expect(result).toContain("  - L2");
		expect(result).toContain("    - L3");
	});

	test("empty li", () => {
		const result = converter.convert("<ul><li></li></ul>");
		expect(result).toContain("- ");
	});

	test("li with inline elements", () => {
		const result = converter.convert(
			"<ul><li><strong>Bold</strong> item</li></ul>",
		);
		expect(result).toContain("- **Bold** item");
	});
});

describe("ordered lists", () => {
	const converter = new Converter();

	test("simple list", () => {
		const result = converter.convert("<ol><li>A</li><li>B</li><li>C</li></ol>");
		expect(result).toContain("1. A");
		expect(result).toContain("2. B");
		expect(result).toContain("3. C");
	});

	test("nested ol", () => {
		const result = converter.convert(
			"<ol><li>Item 1<ol><li>Sub 1</li><li>Sub 2</li></ol></li></ol>",
		);
		expect(result).toContain("1. Item 1");
		expect(result).toContain("  1. Sub 1");
		expect(result).toContain("  2. Sub 2");
	});

	test("counter resets per ol", () => {
		const result = converter.convert(
			"<ol><li>A</li></ol><ol><li>B</li></ol>",
		);
		const lines = result.split("\n");
		expect(lines[0]).toBe("1. A");
		expect(lines[1]).toBe("1. B");
	});

	test("mixed ul and ol", () => {
		const result = converter.convert(
			"<ul><li>A</li></ul><ol><li>B</li></ol>",
		);
		expect(result).toContain("- A");
		expect(result).toContain("1. B");
	});
});

describe("definition lists", () => {
	const converter = new Converter();

	test("dt and dd", () => {
		const result = converter.convert(
			"<dl><dt>Term</dt><dd>Definition</dd></dl>",
		);
		expect(result).toContain("**Term**");
		expect(result).toContain(": Definition");
	});

	test("multiple dt/dd pairs", () => {
		const result = converter.convert(
			"<dl><dt>A</dt><dd>Def A</dd><dt>B</dt><dd>Def B</dd></dl>",
		);
		expect(result).toContain("**A**");
		expect(result).toContain("**B**");
		expect(result).toContain(": Def A");
		expect(result).toContain(": Def B");
	});
});

describe("tables", () => {
	test("markdown format — simple table", () => {
		const converter = new Converter({ tableFormat: "markdown" });
		const result = converter.convert(
			"<table><tr><td>A</td><td>B</td></tr><tr><td>C</td><td>D</td></tr></table>",
		);
		expect(result).toContain("| A | B |");
		expect(result).toContain("| --- | --- |");
		expect(result).toContain("| C | D |");
	});

	test("markdown format — table with thead", () => {
		const converter = new Converter({ tableFormat: "markdown" });
		const result = converter.convert(
			"<table><thead><tr><th>H1</th><th>H2</th></tr></thead><tbody><tr><td>C1</td><td>C2</td></tr></tbody></table>",
		);
		expect(result).toContain("| H1 | H2 |");
		expect(result).toContain("| --- | --- |");
		expect(result).toContain("| C1 | C2 |");
	});

	test("html format — preserves table", () => {
		const converter = new Converter({ tableFormat: "html" });
		const html = "<table><tr><td>A</td></tr></table>";
		const result = converter.convert(html);
		expect(result).toContain("<table>");
		expect(result).toContain("<td>A</td>");
		expect(result).not.toContain("| --- |");
	});

	test("headerless table (no thead)", () => {
		const converter = new Converter();
		const result = converter.convert(
			"<table><tbody><tr><td>X</td><td>Y</td></tr><tr><td>Z</td><td>W</td></tr></tbody></table>",
		);
		expect(result).toContain("| X | Y |");
		expect(result).toContain("| --- | --- |");
		expect(result).toContain("| Z | W |");
	});

	test("three column table", () => {
		const converter = new Converter();
		const result = converter.convert(
			"<table><tr><td>A</td><td>B</td><td>C</td></tr></table>",
		);
		expect(result).toContain("| A | B | C |");
		expect(result).toContain("| --- | --- | --- |");
	});
});

describe("structural strip", () => {
	const converter = new Converter();

	test("div stripped", () => {
		const result = converter.convert("<div>content</div>");
		expect(result).toBe("content");
	});

	test("span stripped", () => {
		const result = converter.convert("<span>text</span>");
		expect(result).toBe("text");
	});

	test("nested divs stripped", () => {
		const result = converter.convert("<div><div>inner</div></div>");
		expect(result).toBe("inner");
	});

	test("section stripped", () => {
		const result = converter.convert("<section>content</section>");
		expect(result).toBe("content");
	});

	test("body and html stripped", () => {
		const result = converter.convert("<html><body>text</body></html>");
		expect(result).toBe("text");
	});
});

describe("ignored elements", () => {
	const converter = new Converter();

	test("script removed", () => {
		const result = converter.convert(
			"<p>Text</p><script>alert(1)</script>",
		);
		expect(result).not.toContain("alert");
		expect(result).toContain("Text");
	});

	test("style removed", () => {
		const result = converter.convert(
			"<p>Text</p><style>.x{color:red}</style>",
		);
		expect(result).not.toContain("color");
		expect(result).toContain("Text");
	});

	test("head removed", () => {
		const result = converter.convert(
			"<html><head><title>T</title></head><body>Content</body></html>",
		);
		expect(result).not.toContain("title");
		expect(result).toContain("Content");
	});

	test("meta removed", () => {
		const result = converter.convert(
			'<p>Text</p><meta charset="utf-8">',
		);
		expect(result).toBe("Text");
	});

	test("svg removed", () => {
		const result = converter.convert(
			"<p>Text</p><svg><circle></circle></svg>",
		);
		expect(result).not.toContain("circle");
		expect(result).toContain("Text");
	});

	test("form elements removed", () => {
		const result = converter.convert(
			"<p>Text</p><form><input><button>Go</button></form>",
		);
		expect(result).not.toContain("button");
		expect(result).toContain("Text");
	});
});

describe("document-level", () => {
	const converter = new Converter();

	test("doctype removed", () => {
		const result = converter.convert("<!DOCTYPE html><p>Text</p>");
		expect(result).not.toContain("DOCTYPE");
		expect(result).toContain("Text");
	});

	test("comments removed", () => {
		const result = converter.convert("<p>Text</p><!-- comment -->");
		expect(result).not.toContain("comment");
		expect(result).toContain("Text");
	});
});

describe("task lists", () => {
	const converter = new Converter();

	test("checked checkbox", () => {
		const result = converter.convert(
			'<ul><li><input type="checkbox" checked>Done</li></ul>',
		);
		expect(result).toContain("[x]");
		expect(result).toContain("Done");
	});

	test("unchecked checkbox", () => {
		const result = converter.convert(
			'<ul><li><input type="checkbox">Todo</li></ul>',
		);
		expect(result).toContain("[ ]");
		expect(result).toContain("Todo");
	});
});

describe("edge cases", () => {
	const converter = new Converter();

	test("empty HTML", () => {
		expect(converter.convert("")).toBe("");
	});

	test("whitespace only", () => {
		expect(converter.convert("   ")).toBe("");
	});

	test("plain text", () => {
		expect(converter.convert("Hello World")).toBe("Hello World");
	});

	test("HTML entities pass through", () => {
		const result = converter.convert("<p>&amp; &lt; &gt;</p>");
		expect(result).toContain("&amp;");
		expect(result).toContain("&lt;");
		expect(result).toContain("&gt;");
	});

	test("unicode and emoji", () => {
		const result = converter.convert("<p>Hello 🌍 Привіт</p>");
		expect(result).toContain("Hello 🌍 Привіт");
	});

	test("malformed HTML — unclosed tags", () => {
		const result = converter.convert("<p>Text");
		expect(result).toContain("Text");
	});

	test("self-closing tags", () => {
		const result = converter.convert("<br/>");
		expect(result).toContain("\n");
	});

	test("very long text", () => {
		const long = "A".repeat(5000);
		const result = converter.convert(`<p>${long}</p>`);
		expect(result).toContain(long);
	});

	test("nested formatting produces correct output", () => {
		const result = converter.convert(
			"<p><strong><em>bold italic</em></strong></p>",
		);
		expect(result).toContain("***bold italic***");
	});

	test("output is trimmed", () => {
		const result = converter.convert("<p>Hello</p>");
		expect(result.startsWith("\n")).toBe(false);
		expect(result.endsWith("\n")).toBe(false);
	});

	test("multiple blank lines collapsed", () => {
		const result = converter.convert(
			"<p>A</p><p></p><p></p><p>B</p>",
		);
		expect(result).not.toMatch(/\n{3,}/);
	});
});

describe("options", () => {
	test("ignoreTags — custom tag ignored", () => {
		const converter = new Converter({ ignoreTags: ["custom"] });
		const result = converter.convert("<p>Text</p><custom>hidden</custom>");
		expect(result).not.toContain("hidden");
		expect(result).toContain("Text");
	});

	test("keepTags — tag preserved as HTML", () => {
		const converter = new Converter({ keepTags: ["strong"] });
		const result = converter.convert("<strong>bold</strong>");
		expect(result).toContain("<strong>");
		expect(result).not.toContain("**");
	});

	test("keepTags — heading preserved", () => {
		const converter = new Converter({ keepTags: ["h1"] });
		const result = converter.convert("<h1>Title</h1>");
		expect(result).toContain("<h1>");
		expect(result).not.toContain("# ");
	});

	test("default tableFormat is markdown", () => {
		const converter = new Converter();
		const result = converter.convert(
			"<table><tr><td>X</td></tr></table>",
		);
		expect(result).toContain("| --- |");
	});
});

describe("integration — test.html", () => {
	const converter = new Converter();

	test("converts test.html to non-empty markdown", async () => {
		const html = await Bun.file("test.html").text();
		const result = converter.convert(html);
		expect(result.length).toBeGreaterThan(0);
	});

	test("removes script and style content", async () => {
		const html = await Bun.file("test.html").text();
		const result = converter.convert(html);
		expect(result).not.toContain("<script");
		expect(result).not.toContain("<style");
	});

	test("removes DOCTYPE", async () => {
		const html = await Bun.file("test.html").text();
		const result = converter.convert(html);
		expect(result).not.toContain("DOCTYPE");
	});

	test("converts headings", async () => {
		const html = await Bun.file("test.html").text();
		const result = converter.convert(html);
		expect(result).toMatch(/#{1,6} /);
	});

	test("converts links to markdown format", async () => {
		const html = await Bun.file("test.html").text();
		const result = converter.convert(html);
		expect(result).toMatch(/\[.+\]\(.+\)/);
	});

	test("converts lists", async () => {
		const html = await Bun.file("test.html").text();
		const result = converter.convert(html);
		expect(result).toMatch(/- .+/);
	});
});
