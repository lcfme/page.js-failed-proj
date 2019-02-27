var fs = require('fs');
var path = require('path');

var IMPORT_REGEXP = /^\s*import\s+('|")(.+)\1(?:\s+as\s+([$_A-z][$_A-z0-9]*))?\s*$/;
var __pwd = process.cwd();

compiler.filesCache = {};

function compiler(input, opts) {
    var i = 0;
    var imports = [];
    opts = opts || {};

    skipWhitespace();
    while (input.charAt(i) && input.charAt(i) === '/') {
        ++i;
        if (input.charAt(i) === '/') {
            ++i;
            lineComment();
        } else if (input.charAt(i) === '*') {
            ++i;
            multiLineComment();
        }
        skipWhitespace();
    }
    input = input.slice(i);
    var r = [];
    for (var i = 0; i < imports.length; ++i) {
        var filePath = path.join(opts.baseDir || __pwd, imports[i].Path);
        var fileObj;
        if (compiler.filesCache[filePath]) {
            fileObj = compiler.filesCache[filePath];
        }
        var fileRaw = fs.readFileSync(filePath).toString();
        if (imports[i].VarName) {
            fileRaw =
                'var ' +
                imports[i].VarName +
                ' = "' +
                escapeQuote(fileRaw) +
                '"';
        }
        fileObj = compiler(
            fileRaw,
            Object.assign(opts, {
                baseDir: path.dirname(filePath)
            })
        );
        compiler.filesCache[filePath] = fileObj;
        r.push(fileObj.code);
    }
    r.push(input);
    return {
        imports: imports,
        code: r.join('\n;')
    };

    function skipWhitespace() {
        while (input.charAt(i) && /\s/.test(input.charAt(i))) ++i;
    }

    function escapeQuote(input) {
        for (var i = input.length; i--; ) {
            if (input.charAt(i) === '"' || input.charAt(i) === '\'') {
                input = input.slice(0, i) + '\\' + input.slice(i);
            }
        }
        return input;
    }

    function lineComment() {
        var val = '';
        while (input.charAt(i) && input.charAt(i) !== '\n') {
            val += input.charAt(i++);
        }
        var m = filterImport(val);
        if (m) {
            imports.push(m);
        }
    }

    function multiLineComment() {
        var val = '';
        while (
            input.charAt(i) &&
            !(input.charAt(i) === '*' && input.charAt(i + 1) === '/')
        ) {
            val += input.charAt(i++);
        }
        ++i;
        ++i;
        var m = filterImport(val);
        if (m) {
            imports.push(m);
        }
    }

    function filterImport(comment = '') {
        var m = comment.match(IMPORT_REGEXP);
        if (m) {
            return {
                Type: 'import',
                Path: m[2],
                VarName: m[3]
            };
        }
        return null;
    }
}

module.exports = compiler;
