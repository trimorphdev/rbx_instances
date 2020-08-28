const glob = require('glob');
const fs = require('fs');
const path = require('path');

function getObj(name) {
    return require(path.join(__dirname, 'src', name + '.json'));
}

function merge(tbl1, tbl2) {
    let obj = {};

    Object.keys(tbl1).forEach(key => {
        obj[key] = tbl1[key];
    });
    Object.keys(tbl2).forEach(key => {
        if (typeof obj[key] == 'object') {
            obj[key] = merge(obj[key], tbl2[key]);
        } else
            obj[key] = tbl2[key];
    });

    return obj;
}

let files = glob.sync('src/**/*.json');
let obj = {};

//let json = JSON.stringify(generateObject(getObj('Instance')), null, 4);
//console.log(json)

files.forEach(file => {
    let o = getObj(file.slice(4, -5));
    obj[o.name] = o;
});

fs.writeFileSync(path.join(__dirname, 'latest.json'), JSON.stringify(obj));