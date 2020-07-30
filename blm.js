const { program } = require("commander");
const { promisify } = require("util");
const prompt = require("prompt");
const _ = require("lodash");

const { BLM } = require("./lib/blm");

const getPromptAsync = promisify(prompt.get);

async function main() {
    program.version("0.0.1");
    program
        .option("-d, --directory <dir>", "Directory to traverse")
        .option("-w, --wordsFile <file>", "Words File")
        .option("-r, --replaceAll", "Replace all instances")
        .parse(process.argv);

    const directory = _.get(program, "directory", "./");
    const wordsFile = _.get(program, "wordsFile");
    const replaceAll = _.get(program, "replaceAll", false);

    const blm = new BLM();
    await blm.use(wordsFile);

    const fPaths = await blm.traverse(directory);

    const property = {
        name: "yesno",
        message: "Do you want replace words in file?",
        validator: /y[es]*|n[o]?/,
        warning: "Must respond yes or no",
        default: "no",
    };

    if (replaceAll === false) {
        prompt.start();

        for (const fPath of fPaths) {
            console.log(`\nProcessing file ${fPath}`);
            const result = await getPromptAsync(property);

            if (/y[es]*/.test(result.yesno)) {
                await blm.replace(fPath, wordsFile);
            } else {
                console.log("\nIgnoring...");
            }
        }
    } else {
        for (const fPath of fPaths) {
            await blm.replace(fPath, replaceAll);
        }
    }
}

main();
