const http = require('http');
// const fs = require('fs');
const FileServer = require('./lib/fileServer');
const defaultFile = "/src/pages/index/index.html";
const { PORT } = require("./setting.json") // 端口号
const API = require("./lib/apiList");
const fs = require('fs');
const url = require('url');
const { extname } = require('path');
const ServerType = require('./lib/serverType.json');


function GetIpAddress(){
   const System = require("os");
   const NetInfo = System.networkInterfaces();
   for(let key in NetInfo){
      if(key === 'en8' && NetInfo[key]){ 
         let _ip = '';
         NetInfo[key].forEach(add=>{
            if(add.family === 'IPv4'){
               _ip = add.address;
            }
         })
         return _ip;
      }
   }
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


function GetServerType(path){
   const _extName = extname(path); // 后缀名
   const _type = `Content-Type: ${ServerType[_extName] || 'text/html'};charset:"utf-8"`;
   return  _type;
}


// 创建服务器
http.createServer( function (request, response) {
   const _urlInfo = GetParamsFromUrl(request);
   var pathname = _urlInfo.path || defaultFile;
   pathname = pathname !== '/'?pathname:defaultFile; // 如果是空路径，使用默认路径
   if(API[pathname]){
      FileServer[API[pathname].fn](request, _urlInfo.params, response);
      return;
   }
   const _file = pathname.substr(1); // 去除最前面的 ‘/’
   fs.readFile(_file, function (err, data) {
      if (!err) {
         // HTTP 状态码: 200 : OK
         // Content Type: text/html
         response.writeHead(200, GetServerType(pathname));    
         // 响应文件内容
         // response.write(data.toString());
      }else{             
         console.log(err);
         // HTTP 状态码: 404 : NOT FOUND
         // Content Type: text/html
         response.writeHead(404, {'Content-Type': 'text/html'});
      }
      //  发送响应数据
      response.end(data);
   });   
}).listen(PORT);
// 控制台会输出以下信息
console.log(`*** 使用期间请勿关闭此窗口 ***`);
console.log('');
console.log(`本机访问地址1:  http://127.0.0.1:${PORT} `);
console.log(`本机访问地址2:  http://${GetIpAddress()}:${PORT} `);
console.log(`连接同一Wi-Fi/路由下其它的设备访问地址:  http://${GetIpAddress()}:${PORT} `);