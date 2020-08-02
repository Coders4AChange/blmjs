const fs = require("fs").promises;
const fsSync = require("fs");
const path = require("path");
const readline = require("readline");
const prompt = require("prompt");
const _ = require("lodash");
const { promisify } = require("util");

const getPromptAsync = promisify(prompt.get);

/**
 * This class enables to replace words which have an inherrent bias.
 */
class BLM {
    constructor() {
        this.filePaths = [];
        this.wordsFilePath = "./lib/words.json";
        this.path_ = null;
        this.didReplace = false;
        this.wordsObj = {};
    }

    /**
     * Recursively traverse a directory and return file paths.
     *
     * @param {*} dir Directory to traverse
     */
    async _traverse(dir) {
        const files = await fs.readdir(dir);
        let filePaths = [];

        for (const file of files) {
            const fPath = path.resolve(dir, file);
            const fsStat = await fs.stat(fPath);

            if (fsStat.isDirectory()) {
                const paths = await this._traverse(fPath);
                filePaths = filePaths.concat(paths);
            } else {
                filePaths.push(fPath);
            }
        }

        return filePaths;
    }

    /**
     * Read file line by line and return all lines
     *
     * @param {*} fPath File path
     */
    async _getLinesFromFile(fPath, filter = false) {
        const fileStream = fsSync.createReadStream(fPath);
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity,
        });

        const lines = [];
        for await (const line of rl) {
            if (!filter) {
                lines.push(line);
            } else {
                if (this.replaceWords.some((w) => line.includes(w))) {
                    lines.push(line);
                }
            }
        }

        return lines;
    }

    _replaceWordInLine(line, oldWord, newWord) {
        this.didReplace = true;
        const reg = new RegExp("(" + oldWord + ")", "ig");

        return line.replace(reg, match => {
            if (match[0].match(/[A-Z]/)) {
                newWord = _.toUpper(newWord);
            }
            return newWord
        });
    }

    async _replaceWordsWithPrompt(line, wordsInLine) {
        for (const w of wordsInLine) {
            console.log(`\nWord [${w}] is present in line: [${line}]`);
            console.log(
                `Following replacement options are available: [${_.join(
                    this.wordsObj[w]
                )}]`
            );
            const property = {
                name: "option",
                type: "integer",
                message: `Which word do you want to replace with? [0-${
                    this.wordsObj[w].length - 1
                }]`,
                validator: /[0-9]*/,
                warning: "Respond with a number",
                default: -1,
            };

            const result = await getPromptAsync(property);

            if (result.option >= 0 && result.option < this.wordsObj[w].length) {
                line = this._replaceWordInLine(
                    line,
                    w,
                    this.wordsObj[w][result.option]
                );
            } else {
                console.log("Invalid option, ignoring replacement...");
            }
        }
        return line;
    }

    _replaceWordsWithoutPrompt(line, wordsInLine) {
        _.forEach(wordsInLine, (w) => {
            line = this._replaceWordInLine(line, w, this.wordsObj[w][0]);
        });

        return line;
    }

    /**
     * Replace words in a line based on words file
     *
     * @param {*} line The line in the file
     * @param {*} ignorePrompt Whether to take user input for every replacement.
     */
    async _replaceWords(line, ignorePrompt = true) {
        const wordsInLine = _.filter(this.replaceWords, (w) =>
            line.includes(w)
        );

        if (!this.replaceWords.some((w) => line.includes(w))) {
            return line;
        }

        if (ignorePrompt === true) {
            return this._replaceWordsWithoutPrompt(line, wordsInLine);
        }

        return this._replaceWordsWithPrompt(line, wordsInLine);
    }

    async _setupWordsFile() {
        const wordsFile = await fs.readFile(this.wordsFilePath, "utf-8");
        this.wordsObj = JSON.parse(wordsFile);
        this.replaceWords = _.keys(this.wordsObj);
    }

    async _setupFilePaths() {
        const stat = fsSync.statSync(this.path_);
        this.filePaths = [];
        if (stat.isDirectory()) {
            this.filePaths = this.filePaths.concat(
                await this._traverse(this.path_)
            );
        } else {
            this.filePaths = [this.path_];
        }
    }

    async _replaceWordsInFPath(fPath, ignorePrompt = true) {
        let lines = await this._getLinesFromFile(fPath);
        lines = lines.map((line) => this._replaceWords(line, ignorePrompt));
        lines = await Promise.all(lines);

        const newFileContent = _.join(lines, "\n");
        if (this.didReplace === true) {
            await fs.writeFile(fPath, _.join(lines, "\n"));
        } else {
            console.log(`Words not found in file. ${fPath}`);
        }

        return newFileContent;
    }

    /**
     * Use a specific words file.
     *
     * @param {*} wordsFile The file to use which contains the replacement words.
     */
    use(wordsFile) {
        this.wordsFilePath = wordsFile;
        return this;
    }

    with(path = null) {
        if (path === null) {
            throw new Error("Path cannot be null");
        }

        this.path_ = path;

        return this;
    }

    /**
     * Replace words in a specific file path
     *
     * - Load file and get lines from file path
     * - Replace words in file
     * - If any replacement is made, write new file in same location
     *
     * @param {*} fPath Path of the file
     * @param {*} ignorePrompt Whether prompt should be shown while replacement is done
     */
    async replace() {
        await this._setupWordsFile();
        await this._setupFilePaths();

        const newFileContents = [];
        for (const fPath of this.filePaths) {
            newFileContents.push(await this._replaceWordsInFPath(fPath, true));
        }

        return newFileContents;
    }

    async replaceInteractive() {
        await this._setupWordsFile();
        await this._setupFilePaths();

        const property = {
            name: "yesno",
            message: "Do you want replace words in file?",
            validator: /y[es]*|n[o]?/,
            warning: "Must respond yes or no",
            default: "no",
        };

        prompt.start({ noHandleSIGINT: true });

        console.log(this.filePaths);
        for (const fPath of this.filePaths) {
            console.log(`\nProcessing file ${fPath}`);
            let result = "no";

            try {
                result = await getPromptAsync(property);
            } catch (err) {
                console.log(`\nTerminating... ${err}`);
                return;
            }

            if (/y[es]*/.test(result.yesno)) {
                await this._replaceWordsInFPath(fPath, false);
            } else {
                console.log("\nIgnoring...");
            }
        }
    }

    async printSummary() {
        await this._setupWordsFile();
        await this._setupFilePaths();

        const dumpObj = {};

        for (const fPath of this.filePaths) {
            let lines = await this._getLinesFromFile(fPath);

            const wordCount = {};
            _.forEach(this.replaceWords, (w) => {
                wordCount[w] = 0;
            });

            wordCount["totalCount"] = 0;

            for (const w of this.replaceWords) {
                for (const line of lines) {
                    if (_.lowerCase(line).includes(w)) {
                        if (!_.keys(dumpObj).includes(fPath)) {
                            dumpObj[fPath] = [];
                        }
                        wordCount[w]++;
                    }
                }
            }

            for (const w in wordCount) {
                if (wordCount[w] == 0) {
                    delete wordCount[w];
                }
            }

            if (_.some(_.values(wordCount), (cnt) => cnt > 0)) {
                wordCount["totalCount"] = _.sum(_.values(wordCount));
                dumpObj[fPath] = wordCount;
            }
        }

        await fs.writeFile("summary.json", JSON.stringify(dumpObj), "utf8");

        console.log(dumpObj);

        return dumpObj;
    }

    async dumpJSON(verbose = false) {
        await this._setupWordsFile();
        await this._setupFilePaths();

        const dumpObj = {};

        for (const fPath of this.filePaths) {
            let lines = await this._getLinesFromFile(fPath);

            for (const w of this.replaceWords) {
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    if (_.lowerCase(line).includes(w)) {
                        if (!_.keys(dumpObj).includes(fPath)) {
                            dumpObj[fPath] = [];
                        }
                        dumpObj[fPath].push({
                            lineno: i,
                            word: w,
                            replacements: this.wordsObj[w],
                            line: verbose ? line : null,
                        });
                    }
                }
            }
        }

        await fs.writeFile("results.json", JSON.stringify(dumpObj), "utf8");

        return dumpObj;
    }
}

module.exports = { BLM: new BLM() };
