import { readFileSync } from "node:fs";

export const setDocument = (fileName) => {
	const filePath = `${process.cwd()}/__tests__/partials/_${fileName}.html`;
	const testContent = readFileSync(filePath, {
		encoding: "utf-8",
	});
	document.body.innerHTML = testContent;
};
