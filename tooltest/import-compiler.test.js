const fs = require('fs');
const path = require('path');
const compiler = require('../tools/import-compiler');

console.log(
    compiler(
        fs.readFileSync(path.join(__dirname, './example1.test.js')).toString(),
        {
            baseDir: __dirname
        }
    )
);
