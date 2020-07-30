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
    /**
     * Use a specific words file.
     *
     * @param {*} wordsFile The file to use which contains the replacement words.
     */
    async use(wordsFile = "./lib/words.json") {
        const file_ = await fs.readFile(wordsFile, "utf8");
        this.words = JSON.parse(file_);
        this.wordsCheck = _.keys(this.words);
        this.didReplace = false;
    }

    /**
     * Recursively traverse a directory and return file paths.
     *
     * @param {*} dir Directory to traverse
     */
    async traverse(dir) {
        const files = await fs.readdir(dir);
        let filePaths = [];

        for (const file of files) {
            const fPath = path.resolve(dir, file);
            const fsStat = await fs.stat(fPath);

            if (fsStat.isDirectory()) {
                const paths = await this.traverse(fPath);
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
    async getLinesFromFile(fPath) {
        const fileStream = fsSync.createReadStream(fPath);
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity,
        });

        const lines = [];
        for await (const line of rl) {
            lines.push(line);
        }

        return lines;
    }

    _replaceWordInLine(line, oldWord, newWord) {
        this.didReplace = true;
        return _.replace(line, oldWord, newWord);
    }

    /**
     * Replace words in a line based on words file
     *
     * @param {*} line The line in the file
     * @param {*} ignorePrompt Whether to take user input for every replacement.
     */
    async replaceWords(line, ignorePrompt = false) {
        if (!this.wordsCheck.some((w) => line.includes(w))) {
            return line;
        }

        for (const w of this.wordsCheck) {
            if (!_.lowerCase(line).includes(w)) {
                continue;
            }

            if (ignorePrompt === true) {
                line = this._replaceWordInLine(
                    line,
                    w,
                    this.words[w][result.option]
                );
                continue;
            }

            console.log(`\nWord [${w}] is present in line: [${line}]`);
            console.log(
                `Following replacement options are available: [${_.join(
                    this.words[w]
                )}]`
            );

            const property = {
                name: "option",
                type: "integer",
                message: `Which word do you want to replace with? [0-${
                    this.words[w].length - 1
                }]`,
                validator: /[0-9]*/,
                warning: "Respond with a number",
                default: -1,
            };

            const result = await getPromptAsync(property);

            if (result.option >= 0 && result.option < this.words[w].length) {
                line = this._replaceWordInLine(
                    line,
                    w,
                    this.words[w][result.option]
                );
            } else {
                console.log("Invalid option, ignoring replacement...");
            }
        }

        return line;
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
        let lines = await this.getLinesFromFile(fPath);
        lines = lines.map((line) => this.replaceWords(line, ignorePrompt));
        lines = await Promise.all(lines);

        if (this.didReplace) {
            await fs.writeFile(fPath, _.join(lines, "\n"));
        } else {
            console.log("Words not found in file.");
        }
    }
}

module.exports = { BLM };
