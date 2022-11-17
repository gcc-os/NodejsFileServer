const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const formidable = require('formidable');
const mime = require('mime');
const { DISK_PATH } = require('../setting.json');

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
const RootMd5ID = cryptPwd(DISK_PATH)
const FileMap = {
   [RootMd5ID]: {
      name: "root",
      path: DISK_PATH,
      id: RootMd5ID,
      isDirectory: true,
      isRoot: true, // 是否是根目录
      parentDirectory: null, // 上级目录
      subFilesID: null, // 文件夹的内容
   }
};

function GetFolderContent(fileID){
   console.log("GetFolderContent fileID = ",fileID);
   const path = FileMap[fileID].path;
   return new Promise(mainResolve=>{
      fs.readdir(path, function (err, data) {
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
            FileMap[fileID].subFilesID = fileInfoList.map(f=>f.id);
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
         if (fileInfo) {
            response.writeHead(ResponseStatus.success, ResponseContentType.json);    
            response.end(ResultWrap({fileInfo, fileMap: GetOutputFileMap()}));
            return;
         }
         console.log(err);
         response.writeHead(ResponseStatus.error, ResponseContentType.json);
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
   DownloadFiles(request,params, response){
      console.log("formidable=======222");
      const file = FileMap[params.id].path;
      console.log("file", file);
      const filename = path.basename(file);
      const mimetype = path.extname(file);
      response.setHeader('Content-disposition', 'attachment; filename=' + filename);
      response.setHeader('Content-type', mimetype);
      const filestream = fs.createReadStream(file);
      filestream.pipe(response);
   },

}

module.exports = FileServer;