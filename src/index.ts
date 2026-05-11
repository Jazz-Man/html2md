import { defaultIgnoreElements } from "./config";
import { getSorsCode, inputHtml, outputMd, saveFile } from "./utils";

// Replace all images with a rickroll
const rewriter = new HTMLRewriter()
	.on(defaultIgnoreElements.join(","), {
		element(element) {
			element.remove();
		},
	})
	.on("img", {
		element(img) {
			// Famous rickroll video thumbnail
			img.setAttribute(
				"src",
				"https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
			);

			// Wrap the image in a link to the video
			img.before(
				'<a href="https://www.youtube.com/watch?v=dQw4w9WgXcQ" target="_blank">',
				{
					html: true,
				},
			);
			img.after("</a>", { html: true });

			// Add some fun alt text
			img.setAttribute("alt", "Definitely not a rickroll");
		},
	});

rewriter.onDocument({
	doctype(doctype) {
		doctype.remove();
	},
	comments(comment) {
		comment.remove();
	},
});

// An example HTML document
const html = await getSorsCode(inputHtml);

const result = rewriter.transform(html);

await saveFile(outputMd, result);
