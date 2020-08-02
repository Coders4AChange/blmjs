const mock = require("mock-fs");
const { BLM } = require("../blm");
const fs = require("fs").promises;
const appRoot = require("app-root-path").toString();

describe("e2e tests", () => {
    beforeEach(() => {
        jest.spyOn(console, "log").mockImplementation(() => {});

        mock({
            "path/to/fake/dir": {
                "some-file.txt": "master blacklist",
                "empty-dir": {
                    /** empty directory */
                },
                "another-dir": {
                    "test.json": "blah master blah",
                },
            },
            "path/to/file.txt": mock.file({
                ctime: new Date(1),
                mtime: new Date(2),
                atime: new Date(3),
                uid: 42,
                gid: 43,
                content: "master",
            }),
            "./lib/words.json": mock.file({
                ctime: new Date(1),
                mtime: new Date(2),
                atime: new Date(3),
                uid: 42,
                gid: 43,
                content: `${JSON.stringify({
                    master: ["primary", "controller"],
                    blacklist: ["denylist"],
                })}`,
            }),
            "./summary.json": mock.file({
                content: "",
            }),
            "./results.json": mock.file({
                content: "",
            }),
        });
    });

    afterEach(() => mock.restore());

    test("print summary -> file", async (done) => {
        const expectedOutput = {
            "path/to/file.txt": { master: 1, totalCount: 1 },
        };
        const summary = await BLM.with("path/to/file.txt").printSummary();
        expect(summary).toStrictEqual(expectedOutput);

        const fileContents = JSON.parse(
            await fs.readFile("summary.json", "utf-8"),
        );
        expect(fileContents).toStrictEqual(expectedOutput);
        done();
    });

    test("print summary -> directory", async (done) => {
        const expectedOutput = {
            [`${appRoot}/path/to/fake/dir/another-dir/test.json`]: {
                master: 1,
                totalCount: 1,
            },
            [`${appRoot}/path/to/fake/dir/some-file.txt`]: {
                blacklist: 1,
                master: 1,
                totalCount: 2,
            },
        };

        const summary = await BLM.with("path/to/fake/dir").printSummary();
        expect(summary).toStrictEqual(expectedOutput);

        const fileContents = JSON.parse(
            await fs.readFile("summary.json", "utf-8"),
        );
        expect(fileContents).toStrictEqual(expectedOutput);
        done();
    });

    test("dump json results -> file", async (done) => {
        const expectedOutput = {
            "path/to/file.txt": [
                {
                    line: null,
                    lineno: 0,
                    replacements: ["primary", "controller"],
                    word: "master",
                },
            ],
        };

        const jsonDump = await BLM.with("path/to/file.txt").dumpJSON();
        expect(jsonDump).toStrictEqual(expectedOutput);
        const fileContents = JSON.parse(
            await fs.readFile("results.json", "utf-8"),
        );

        expect(fileContents).toStrictEqual(expectedOutput);

        done();
    });

    test("dump json results -> dir", async (done) => {
        const expectedOutput = {
            [`${appRoot}/path/to/fake/dir/some-file.txt`]: [
                {
                    line: null,
                    lineno: 0,
                    replacements: ["primary", "controller"],
                    word: "master",
                },
                {
                    line: null,
                    lineno: 0,
                    replacements: ["denylist"],
                    word: "blacklist",
                },
            ],
            [`${appRoot}/path/to/fake/dir/another-dir/test.json`]: [
                {
                    line: null,
                    lineno: 0,
                    replacements: ["primary", "controller"],
                    word: "master",
                },
            ],
        };

        const jsonDump = await BLM.with("path/to/fake/dir").dumpJSON();
        expect(jsonDump).toStrictEqual(expectedOutput);
        const fileContents = JSON.parse(
            await fs.readFile("results.json", "utf-8"),
        );

        expect(fileContents).toStrictEqual(expectedOutput);
        done();
    });

    test("dump json results verbose -> file", async (done) => {
        const expectedOutput = {
            "path/to/file.txt": [
                {
                    line: "master",
                    lineno: 0,
                    replacements: ["primary", "controller"],
                    word: "master",
                },
            ],
        };

        const jsonDump = await BLM.with("path/to/file.txt").dumpJSON(true);
        expect(jsonDump).toStrictEqual(expectedOutput);
        const fileContents = JSON.parse(
            await fs.readFile("results.json", "utf-8"),
        );

        expect(fileContents).toStrictEqual(expectedOutput);

        done();
    });

    test("dump json results verbose -> dir", async (done) => {
        const expectedOutput = {
            [`${appRoot}/path/to/fake/dir/some-file.txt`]: [
                {
                    line: "master blacklist",
                    lineno: 0,
                    replacements: ["primary", "controller"],
                    word: "master",
                },
                {
                    line: "master blacklist",
                    lineno: 0,
                    replacements: ["denylist"],
                    word: "blacklist",
                },
            ],
            [`${appRoot}/path/to/fake/dir/another-dir/test.json`]: [
                {
                    line: "blah master blah",
                    lineno: 0,
                    replacements: ["primary", "controller"],
                    word: "master",
                },
            ],
        };

        const jsonDump = await BLM.with("path/to/fake/dir").dumpJSON(true);
        expect(jsonDump).toStrictEqual(expectedOutput);
        const fileContents = JSON.parse(
            await fs.readFile("results.json", "utf-8"),
        );

        expect(fileContents).toStrictEqual(expectedOutput);
        done();
    });

    test("replace file results -> file", async (done) => {
        const expectedOutput = "primary";

        const jsonDump = await BLM.with("path/to/file.txt").replace();
        expect(jsonDump).toStrictEqual([expectedOutput]);
        const fileContents = await fs.readFile("path/to/file.txt", "utf-8");

        expect(fileContents).toStrictEqual(expectedOutput);

        done();
    });

    test("replace file results -> dir", async (done) => {
        const expectedOutput = ["blah primary blah", "primary denylist"];

        const jsonDump = await BLM.with("path/to/fake/dir").replace();
        expect(jsonDump).toStrictEqual(expectedOutput);

        // const fileContents = await fs.readFile("path/to/file.txt", "utf-8");
        // expect(fileContents).toStrictEqual(expectedOutput);

        done();
    });
});

describe("unit tests", () => {
    beforeEach(() => {
        jest.spyOn(console, "log").mockImplementation(() => {});

        mock({
            "path/to/file.txt": mock.file({
                ctime: new Date(1),
                mtime: new Date(2),
                atime: new Date(3),
                uid: 42,
                gid: 43,
                content: "master\nhello\nblah blacklist",
            }),
        });
    });

    afterEach(() => mock.restore());

    test("_getLinesFromFile", async (done) => {
        const lines = await BLM._getLinesFromFile("path/to/file.txt");
        expect(lines).toStrictEqual(["master", "hello", "blah blacklist"]);

        const linesFilter = await BLM._getLinesFromFile(
            "path/to/file.txt",
            true,
        );
        expect(linesFilter).toStrictEqual(["master", "blah blacklist"]);
        done();
    });

    test("_replaceWordInLine", (done) => {
        let newLine = BLM._replaceWordInLine(
            "MASTER Blaster",
            "master",
            "super",
        );
        expect(newLine).toStrictEqual("SUPER Blaster");

        newLine = BLM._replaceWordInLine("master Blaster", "master", "super");
        expect(newLine).toStrictEqual("super Blaster");
        done();
    });

    test("_replaceWords", async (done) => {
        let newLine = await BLM._replaceWords("master blaster", true);
        expect(newLine).toStrictEqual("primary blaster");

        newLine = await BLM._replaceWords("blaster", false);
        expect(newLine).toStrictEqual("blaster");
        done();
    });
});
