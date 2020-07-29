const fs = require("fs").promises;
const fsSync = require("fs");
const path = require("path");
const readline = require('readline');
const prompt = require("prompt");
const _ = require("lodash");
const { promisify } = require("util");

const getPromptAsync = promisify(prompt.get);

class BLM {
    async use(wordsFile="./lib/words.json") {
        const file_ = await fs.readFile(wordsFile, 'utf8');
        this.words = JSON.parse(file_);
    }

    async traverse(dir) {
        const files = await fs.readdir(dir);
        let filePaths = [];

        for (const file of files) {
            const fPath = path.resolve(dir, file);
            const fsStat = await fs.stat(fPath);

            if (fsStat.isDirectory()) {
                const paths = await this.traverse(fPath)
                filePaths = filePaths.concat(paths);
            } else {
                filePaths.push(fPath);
            }
        }

        return filePaths;
    }

    async replace(fPath, ignorePrompt=false) {
        const fileStream = fsSync.createReadStream(fPath);
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
          });

        const property = {
            name: "option",
            type: 'integer',
            message: "Which word do you want to replace with? [0-9]",
            validator: /[0-9]*/,
            warning: "Respond with a number",
            default: -1,
        };

        const lines = [];
        let didReplace = false;

        for await (let line of rl) {
            const wordsCheck = Object.keys(this.words);


            if (wordsCheck.some(w => line.includes(w))) {
                for (const w of wordsCheck) {
                    if (_.lowerCase(line).includes(w)) {
                        if (ignorePrompt === false) {
                            console.log(`\nWord [${w}] is present in line: [${line}]`);
                            console.log(`Following replacement options are available: [${_.join(this.words[w])}]`);
                            const result = await getPromptAsync(property);

                            if (result.option !== -1) {
                                didReplace = true;
                                line = _.replace(line, w, this.words[w][result.option]);
                            }
                        } else {
                            didReplace = true;
                            line = _.replace(line, w, this.words[w][0]);
                        }
                    }
                }
            }
            lines.push(line);
        }

        if (didReplace === true) {
            await fs.writeFile(fPath, _.join(lines, '\n'));
        }
    }
}

module.exports = { BLM };
