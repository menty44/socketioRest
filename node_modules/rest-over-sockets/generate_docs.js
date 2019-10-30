const fs=require("fs-then-native");
const jsdoc2md=require("jsdoc-to-markdown");

const templatefile=fs.readFileSync("README.hbs", "utf8");

jsdoc2md.render({files: "index.js", template:templatefile})
	.then(output=> fs.writeFile("README.md", output));