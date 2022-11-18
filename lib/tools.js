const url = require('url');
const { extname } = require('path');
const ServerType = require('./serverType.json');

function GetServerType(path){
    const _extName = extname(path); // 后缀名
    const _type = `Content-Type: ${ServerType[_extName] || 'text/html'};charset:"utf-8"`;
    return  _type;
}
 
function GetParamsFromUrl(request){
    if(!request || !request.url) return null;
    const path = url.parse(request.url).pathname.replace(/\s*/g,"")
    const params = url.parse(request.url).query
    path.substr(1)
    const _params = {};
    if(params){
       params.split('&').forEach(p=>{
          if(p){
             const _p = p.split('=');
             _params[_p[0]] = _p[1];
          }
       })
    }
    return {...request, path, params:_params};
}
 
module.exports = {
    GetServerType,
    GetParamsFromUrl
}

