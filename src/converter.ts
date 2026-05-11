export interface ConverterOptions {
	tableFormat?: "markdown" | "html";
	ignoreTags?: string[];
	keepTags?: string[];
}

const IGNORED_TAGS = [
	"script",
	"style",
	"head",
	"link",
	"meta",
	"noscript",
	"svg",
	"button",
	"form",
	"textarea",
	"select",
	"iframe",
	"canvas",
	"template",
	"area",
	"base",
	"col",
	"colgroup",
	"embed",
	"keygen",
	"param",
	"source",
	"track",
	"wbr",
	"map",
	"object",
];

const STRUCTURAL_TAGS = [
	"div",
	"section",
	"article",
	"main",
	"header",
	"footer",
	"aside",
	"nav",
	"span",
	"body",
	"html",
	"figure",
	"figcaption",
	"address",
	"fieldset",
	"hgroup",
	"dl",
	"caption",
	"menu",
	"dir",
	"center",
	"noframes",
];

export class Converter {
	private options: Required<ConverterOptions>;
	private keptTags: Set<string>;
	private listStack: Array<{ type: "ul" | "ol"; counter: number }> = [];
	private tableState = { active: false, colCount: 0, firstRow: true };
	private inPre = false;

	constructor(options?: ConverterOptions) {
		this.options = {
			tableFormat: options?.tableFormat ?? "markdown",
			ignoreTags: options?.ignoreTags ?? [],
			keepTags: options?.keepTags ?? [],
		};
		this.keptTags = new Set(
			this.options.keepTags.map((t) => t.toLowerCase()),
		);
	}

	convert(html: string): string {
		this.listStack = [];
		this.tableState = { active: false, colCount: 0, firstRow: true };
		this.inPre = false;

		const result = this.buildRewriter().transform(html);
		return result.replace(/\n{3,}/g, "\n\n").trim();
	}

	private buildRewriter(): HTMLRewriter {
		const self = this;
		const kept = this.keptTags;
		const rw = new HTMLRewriter();

		rw.onDocument({
			doctype(dt) {
				dt.remove();
			},
			comments(c) {
				c.remove();
			},
		});

		const ignoredSet = new Set([...IGNORED_TAGS, ...this.options.ignoreTags]);
		const ignoreSelector = [...ignoredSet]
			.filter((t) => !kept.has(t))
			.join(",");
		if (ignoreSelector) {
			rw.on(ignoreSelector, {
				element(el) {
					el.remove();
				},
			});
		}

		rw.on("input", {
			element(el) {
				if (kept.has("input")) return;
				if (el.getAttribute("type") === "checkbox") {
					el.replace(el.hasAttribute("checked") ? "[x] " : "[ ] ");
				} else {
					el.remove();
				}
			},
		});

		rw.on("h1,h2,h3,h4,h5,h6", {
			element(el) {
				if (kept.has(el.tagName)) return;
				const level = Number.parseInt(el.tagName[1]!);
				el.before("\n\n" + "#".repeat(level) + " ");
				el.removeAndKeepContent();
				el.after("\n\n");
			},
		});

		const inlineFormats: Array<[string, string]> = [
			["strong,b", "**"],
			["em,i", "*"],
			["del,s,strike", "~~"],
			["ins", "++"],
			["mark", "=="],
			["sub", "~"],
			["sup", "^"],
			["q", '"'],
		];

		for (const [selector, marker] of inlineFormats) {
			rw.on(selector, {
				element(el) {
					if (kept.has(el.tagName)) return;
					el.prepend(marker);
					el.append(marker);
					el.removeAndKeepContent();
				},
			});
		}

		rw.on("code", {
			element(el) {
				if (kept.has(el.tagName)) return;
				if (self.inPre) {
					el.removeAndKeepContent();
					return;
				}
				el.prepend("`");
				el.append("`");
				el.removeAndKeepContent();
			},
		});

		rw.on("pre", {
			element(el) {
				if (kept.has(el.tagName)) return;
				self.inPre = true;
				el.before("\n\n```\n");
				el.removeAndKeepContent();
				el.onEndTag(() => {
					self.inPre = false;
				});
				el.after("\n```\n\n");
			},
		});

		rw.on("a", {
			element(el) {
				if (kept.has(el.tagName)) return;
				const href = el.getAttribute("href");
				if (href) {
					el.prepend("[");
					el.append("](" + href + ")");
				}
				el.removeAndKeepContent();
			},
		});

		rw.on("img", {
			element(el) {
				if (kept.has(el.tagName)) return;
				const src = el.getAttribute("src");
				if (!src) {
					el.remove();
					return;
				}
				const alt = el.getAttribute("alt") ?? "";
				el.replace("![" + alt + "](" + src + ")");
			},
		});

		rw.on("br", {
			element(el) {
				if (kept.has(el.tagName)) return;
				el.replace("\n");
			},
		});

		rw.on("hr", {
			element(el) {
				if (kept.has(el.tagName)) return;
				el.replace("\n\n---\n\n");
			},
		});

		rw.on("p", {
			element(el) {
				if (kept.has(el.tagName)) return;
				el.before("\n\n");
				el.removeAndKeepContent();
				el.after("\n\n");
			},
		});

		rw.on("blockquote", {
			element(el) {
				if (kept.has(el.tagName)) return;
				el.before("\n\n> ");
				el.removeAndKeepContent();
				el.after("\n\n");
			},
		});

		rw.on("ul", {
			element(el) {
				if (kept.has(el.tagName)) return;
				self.listStack.push({ type: "ul", counter: 0 });
				el.before("\n");
				el.removeAndKeepContent();
				el.onEndTag(() => {
					self.listStack.pop();
				});
			},
		});

		rw.on("ol", {
			element(el) {
				if (kept.has(el.tagName)) return;
				self.listStack.push({ type: "ol", counter: 1 });
				el.before("\n");
				el.removeAndKeepContent();
				el.onEndTag(() => {
					self.listStack.pop();
				});
			},
		});

		rw.on("li", {
			element(el) {
				if (kept.has(el.tagName)) return;
				const depth = Math.max(0, self.listStack.length - 1);
				const indent = "  ".repeat(depth);
				const list = self.listStack[self.listStack.length - 1];
				let prefix: string;
				if (list?.type === "ol") {
					prefix = indent + list.counter + ". ";
					list.counter++;
				} else {
					prefix = indent + "- ";
				}
				el.before("\n" + prefix);
				el.removeAndKeepContent();
			},
		});

		rw.on("dt", {
			element(el) {
				if (kept.has(el.tagName)) return;
				el.before("\n**");
				el.removeAndKeepContent();
				el.after("**\n");
			},
		});

		rw.on("dd", {
			element(el) {
				if (kept.has(el.tagName)) return;
				el.before("\n: ");
				el.removeAndKeepContent();
				el.after("\n");
			},
		});

		if (this.options.tableFormat === "markdown") {
			rw.on("table", {
				element(el) {
					if (kept.has(el.tagName)) return;
					self.tableState = { active: true, colCount: 0, firstRow: true };
					el.before("\n\n");
					el.removeAndKeepContent();
					el.onEndTag(() => {
						self.tableState.active = false;
					});
				},
			});

			rw.on("thead,tbody,tfoot", {
				element(el) {
					el.removeAndKeepContent();
				},
			});

			rw.on("tr", {
				element(el) {
					el.before("\n|");
					el.removeAndKeepContent();
					el.onEndTag((tag) => {
						if (self.tableState.firstRow && self.tableState.colCount > 0) {
							const cols = Array(self.tableState.colCount)
								.fill("---")
								.join(" | ");
							tag.after("\n| " + cols + " |");
							self.tableState.firstRow = false;
						}
					});
				},
			});

			rw.on("td,th", {
				element(el) {
					el.before(" ");
					el.after(" |");
					el.removeAndKeepContent();
					if (self.tableState.firstRow) {
						self.tableState.colCount++;
					}
				},
			});
		}

		const structuralSelector = STRUCTURAL_TAGS.filter((t) => !kept.has(t)).join(
			",",
		);
		if (structuralSelector) {
			rw.on(structuralSelector, {
				element(el) {
					el.removeAndKeepContent();
				},
			});
		}

		return rw;
	}
}
