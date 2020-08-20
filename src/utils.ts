import { resolve } from "node:path";

const rootDir = process.cwd();

export const inputHtml = resolve(rootDir, "test-new.html");

export const outputMd = resolve(rootDir, "test.md");

export const getSorsCode = async (input: string) =>
	await Bun.file(input).text();

export const saveFile = async (path: Bun.PathLike, content: string) => {
	await Bun.write(path, content, {
		createPath: true,
	});
};
