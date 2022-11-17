const FS = require('fs');
import * as FLS from 'fs';

function FSReadFile(path){
    return new Promise((resolve)=>{
        fs.readdir(path, (a,b,c)=>{
            console.log("读区目录内容:");
            console.log(a);
            console.log(b);
            console.log(c);
            resolve(a);
        })
    })
}

module.exports = FSReadFile;