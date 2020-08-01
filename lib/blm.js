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
                if (!this.replaceWords.some((w) => line.includes(w))) {
                    lines.push(line);
                }
            }
        }

        return lines;
    }

    _replaceWordInLine(line, oldWord, newWord) {
        this.didReplace = true;
        const reg = new RegExp("(" + oldWord + ")", "ig");
        const replacer = (c, i) =>
            c.match(/[A-Z]/) ? newWord[i].toUpperCase() : newWord[i];

        return line.replace(reg, (match) => match.replace(/./g, replacer));
    }

    async _replaceWordsWithPrompt(line) {
        const wordsInLine = _.filter(this.replaceWords, (w) =>
            line.includes(w)
        );

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

    _replaceWordsWithoutPrompt(line) {
        const wordsInLine = _.filter(this.replaceWords, (w) =>
            line.includes(w)
        );

        _.forEach(wordsInLine, (w) => {
            line = this._replaceWordInLine(lowerLine);
        });

        return line;
    }

    /**
     * Replace words in a line based on words file
     *
     * @param {*} line The line in the file
     * @param {*} ignorePrompt Whether to take user input for every replacement.
     */
    async _replaceWords(line, ignorePrompt = false) {
        if (!this.replaceWords.some((w) => line.includes(w))) {
            return line;
        }

        if (ignorePrompt === true) {
            return this._replaceWordsWithoutPrompt(line);
        }

        return this._replaceWordsWithPrompt(line, wordsInLine);
    }

    /**
     * Use a specific words file.
     *
     * @param {*} wordsFile The file to use which contains the replacement words.
     */
    async use(wordsFile = "./lib/words.json") {
        const file_ = await fs.readFile(wordsFile, "utf8");
        this.wordsObj = JSON.parse(file_);
        this.replaceWords = _.keys(this.wordsObj);

        return this;
    }

    withFile(file_ = null) {
        if (file_ === null) {
            throw new Error("File cannot be null");
        }

        this.file_ = file;
        this.filePaths = [file_];

        return this;
    }

    async withDirectory(dir_ = null) {
        if (dir_ === null) {
            throw new Error("Directory cannot be null");
        }

        this.dir_ = dir_;
        this.filePaths = this.filePaths.concat(await this._traverse(dir_));

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
    async replace(fPath, ignorePrompt = false) {
        let lines = await this._getLinesFromFile(fPath);
        lines = lines.map((line) => this.replaceWords(line, ignorePrompt));
        lines = await Promise.all(lines);

        if (this.didReplace === true) {
            await fs.writeFile(fPath, _.join(lines, "\n"));
        } else {
            console.log("Words not found in file.");
        }
    }

    async printSummary() {
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
    }

    async dumpJSON(verbose = false) {
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
    }
}

module.exports = { BLM };
