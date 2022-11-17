const fs = require('fs');
const url = require('url');
const { extname } = require('path');
const ServerType = require('./serverType.json');
const { DISK_PATH } = require('../setting.json');
const crypto = require('crypto');

const ResponseContentType = {
    json:{'Content-Type': 'application/json;charset=UTF-8'},
    file:{'Content-Type': 'application/json;charset=UTF-8'},
 }
 const ResponseMsg = {
    success:'success',
    fail:'fail',
 }
 const ResponseStatus = {
    success:200,
    fail:500,
    error:404,
 }
 
 
 function ResultWrap(data,code,msg){
    return JSON.stringify({
       data,
       code:code || ResponseStatus.success,
       msg:msg || ResponseMsg.success,
    })
 }

 function GetServerType(path){
    const _extName = extname(path); // 后缀名
    const _type = `Content-Type: ${ServerType[_extName] || 'text/html'};charset:"utf-8"`;
    return  _type;
 }
 

module.exports = {
    ResponseContentType,
    ResponseMsg,
    ResponseStatus,
    GetServerType,
    ResultWrap,
    GetParamsFromUrl,
    GetIpAddress,
}

