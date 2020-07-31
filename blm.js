const { program } = require("commander");
const { promisify } = require("util");
const prompt = require("prompt");
const _ = require("lodash");

const { BLM } = require("./lib/blm");

const getPromptAsync = promisify(prompt.get);

function initialise() {
    program.version("0.0.1");
    program
        .option("-j, --json", "Dump changes as json", false)
        .option("-f, --file <file>", "File to transform", null)
        .option("-d, --directory <dir>", "Directory to traverse", "./")
        .option("-w, --wordsFile <file>", "Words File")
        .option("-r, --replaceAll", "Replace all instances", false)
        .option("-v, --verbose", "Verbosity of JSON output", false)
        .option("-s, --summary", "Summary", true)
        .parse(process.argv);

    process.on("SIGINT", function () {
        console.log("Terminating...");
        process.exit();
    });
}

/**
 * Main driver function
 */
async function main() {
    initialise();

    const blm = new BLM();
    await blm.use(program.wordsFile);

    let fPaths = [];
    if (_.isNil(program.file_)) {
        fPaths = await blm.traverse(program.directory);
    } else {
        fPaths = [file_];
    }

    if (program.summary) {
        await blm.printSummary(fPaths);
        return;
    }

    if (program.json) {
        await blm.dumpJSON(fPaths, program.verbose);
        return;
    }

    const property = {
        name: "yesno",
        message: "Do you want replace words in file?",
        validator: /y[es]*|n[o]?/,
        warning: "Must respond yes or no",
        default: "no",
    };

    if (program.replaceAll === false) {
        prompt.start({ noHandleSIGINT: true });

        for (const fPath of fPaths) {
            console.log(`\nProcessing file ${fPath}`);
            try {
                const result = await getPromptAsync(property);
            } catch (err) {
                console.log(`\nTerminating... ${err}`);
                return;
            }

            if (/y[es]*/.test(result.yesno)) {
                await blm.replace(fPath, wordsFile);
            } else {
                console.log("\nIgnoring...");
            }
        }
    } else {
        for (const fPath of fPaths) {
            await blm.replace(fPath, program.replaceAll);
        }
    }
}

main();
