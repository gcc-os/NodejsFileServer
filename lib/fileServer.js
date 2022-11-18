const fs = require('fs');
const crypto = require('crypto');
const formidable = require('formidable');
const { DISK_PATH } = require('../setting.json');
const { GetServerType } = require("./tools");
const ROOT_PATH = "/root";

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

function cryptPwd(password) {
   const md5 = crypto.createHash('md5');
   return md5.update(password).digest('hex');
}

let RootMd5ID = ''
const FileMap = {}

const InitRootFolder = ()=>{
   RootMd5ID = cryptPwd(ROOT_PATH)
   FileMap[RootMd5ID] =  {
         name: "root",
         path: ROOT_PATH,
         id: RootMd5ID,
         isDirectory: true,
         isRoot: true, // 是否是根目录
         parentDirectory: null, // 上级目录
         subFiles: null, // 文件夹的内容
   }
   DISK_PATH.forEach(info=>{
      const {name, path} = info;
      if(!fs.existsSync(path)) return;
      const _Md5ID = cryptPwd(path)
      if(!FileMap[RootMd5ID].subFiles){
         FileMap[RootMd5ID].subFiles = [];
      }
      FileMap[_Md5ID] = {
         name,
         path: path,
         id: _Md5ID,
         isDirectory: true,
         isRoot: false, // 是否是根目录
         parentDirectory: RootMd5ID, // 上级目录
         subFiles: null, // 文件夹的内容
      };
      FileMap[RootMd5ID].subFiles.push(FileMap[_Md5ID]);
   })
}
InitRootFolder()
console.log(FileMap);

function GetRootFolderInfo(rootId){
   return new Promise(mainResolve=>{
      const responseFileInfo = {
         id: rootId,
         name: FileMap[rootId].name,
         files: FileMap[rootId].subFiles.map(_f=>{
            return {
               name:_f.name, 
               id:_f.id,
               isDirectory:_f.isDirectory,
               parentDirectory:rootId,
            }
         })
      }
      mainResolve(responseFileInfo);
   })
}

function GetFolderContent(fileID){
   if(fileID === RootMd5ID) return GetRootFolderInfo(RootMd5ID);
   const path = FileMap[fileID].path;
   return new Promise(mainResolve=>{
      fs.readdir(path, function (err, data) {
         console.log("GetFolderContent====",err, data);
         if(err){
            mainResolve({
               id: FileMap[fileID].id,
               name: FileMap[fileID].name,
               files: []
            })
            return ;
         }
         const _allSearchInfoTasks = [];
         if(data){
            data.forEach(fileName=>{
               _allSearchInfoTasks.push(GetFileInfo(`${path}/${fileName}`, fileName));
            })
         }
         Promise.all(_allSearchInfoTasks).then(fileInfoList=>{
            fileInfoList.forEach(f=>{
               f.parentDirectory = FileMap[fileID].id
            })
            FileMap[fileID].subFiles = fileInfoList.map(f=>f.id);
            const responseFileInfo = {
               id: FileMap[fileID].id,
               name: FileMap[fileID].name,
               files: fileInfoList.map(f=>{
                  return {
                     name:f.name, 
                     id:f.id,
                     isDirectory:f.isDirectory,
                     parentDirectory:fileID,
                  };
               })
            }
            mainResolve(responseFileInfo);
         })
      })
   })
}

function GetFileInfo(path, name){
   return new Promise(resolve=>{
      fs.stat(path, function (err, stats) {
         const fileInfo = {
            name,
            path,
            id: cryptPwd(path),
            isDirectory: stats.isDirectory(),
         };
         FileMap[fileInfo.id] = fileInfo;
         resolve(fileInfo)
     })
   }) 
}

function GetOutputFileMap(){
   const res = {};
   for(let key in FileMap){
      res[key] = {...FileMap[key]};
      delete res[key].path;
   }
   return res;
}

function ResultWrap(data,code,msg){
   return JSON.stringify({
      data,
      code:code || ResponseStatus.success,
      msg:msg || ResponseMsg.success,
   })
}

const FileServer = {
   GetRootFolder(request, params, response){ // 读取根目录文件列表
      console.log("GetRootFolder===", params);
      GetFolderContent(params.id || RootMd5ID).then(fileInfo=>{
         response.writeHead(ResponseStatus.success, ResponseContentType.json);    
         if (fileInfo) {
            response.end(ResultWrap({fileInfo, fileMap: GetOutputFileMap()}));
            return;
         }
         response.end(ResultWrap({},ResponseStatus.fail,ResponseMsg.fail));
      })
   },
   CreateFolder(request, params, response){
      fs.mkdir(`${FileMap[params.id].path}/${decodeURIComponent(params.name)}`,{
         recursive: true
      },res=>{


         if(!res){
            response.writeHead(ResponseStatus.success, ResponseContentType.json);    
            response.end(ResultWrap({}));
            return;
         }
         response.writeHead(ResponseStatus.fail, ResponseContentType.json);    
         response.end(ResultWrap({},ResponseStatus.fail,"创建失败"));
      });
   },
   UploadFiles(request,params, response){
      console.log("formidable=======111");
      const form = new formidable.IncomingForm();
      form.parse(request, function (err, fields, files) {
         console.log("formidable====", FileMap[params.file_id]);
         console.log(err, fields, files)
         if(!files) return;
         const _fileName =  files.file_upload.originalFilename;
         console.log("_fileName===", _fileName);
         var oldpath = files.file_upload.filepath;
         var newpath = FileMap[params.file_id].path + '/' + files.file_upload.originalFilename;
         console.log("oldpath:",oldpath);
         console.log("newpath:",newpath);
         fs.rename(oldpath, newpath, function (err) {
            console.log("err:",err);
            if(!err){
               response.writeHead(ResponseStatus.success, ResponseContentType.json);    
               response.end(ResultWrap({}));
               return;
            }
            response.writeHead(ResponseStatus.fail, ResponseContentType.json);    
            response.end(ResultWrap({},ResponseStatus.fail,"上传失败!"));
         });
      })
   },
   DownloadFiles(request, params, response){
      console.log("DownloadFiles request", request.url);
      console.log("DownloadFiles params", params);
      const _file = FileMap[params.id].path;
      const _fileType = GetServerType(_file);
      console.log("DownloadFiles _fileType===",_fileType);
      console.log("DownloadFiles file", _file);
      fs.readFile(_file, function (err, data) {
         if (!err) {
            response.writeHead(200, _fileType);
            response.end(data);
            return;
         }
         response.writeHead(404, {'Content-Type': 'text/html'});
         response.end({});
      });
   },

}

module.exports = FileServer;