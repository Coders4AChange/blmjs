# BLM

This repository has blm.js package which can be leveraged as a commandline tool and javascript package to remove objectionable words from the code repositories, files and directories. Furthermore, it also provides a dictionary of objectionable words and alternatives that can be used for those words, this library can be edited and extended as per the requirement of user.

This library and tool allows users to view the occurences of problematic words, their recommended alternatives and also metadata information regarding the frequency of occurences of the problematic words throughout the repository.


## REQUIREMENTS
- OS Platform: Linux, Unix, Mac OS, Windows
- npm
- Node

## INSTALLATION

`npm i @coders4achange/blmjs`

## USAGE

All the options are provided by the package and tool are listed in the help.

```
coders@coders4acause blmjs % node blm.js --help
Usage: blm [options]

Options:
  -V, --version           output the version number
  -i, --interactive       Replace interactively (default: false)
  -j, --json              Dump changes as json (default: false)
  -p, --path <path>       Path (File/Dir) to transform (default: "./")
  -w, --wordsFile <file>  Words File (default: "./lib/words.json")
  -r, --replaceAll        Replace all instances (default: false)
  -v, --verbose           Verbosity of JSON output (default: false)
  -s, --summary           Summary (default: true)
  -h, --help              display help for command
```

For quick usage, directly run the tool on a repo using `-p/ --path` option.

```
bash-3.2$ node blm.js -p/tmp/test-repo
{
  '/tmp/test-repo/src/a.txt': { abort: 1, blacklist: 1, master: 1, totalCount: 3 },
  '/tmp/test-repo/src/b.txt': { master: 1, whitelist: 1, segregate: 1, totalCount: 3 },
  '/tmp/test-repo/test/test.py': { kill: 1, totalCount: 1 }
}
```
