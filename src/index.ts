import { Converter } from "./converter";
import { getSorsCode, inputHtml, outputMd, saveFile } from "./utils";

const converter = new Converter();

const html = await getSorsCode(inputHtml);

const result = converter.convert(html);

await saveFile(outputMd, result);
