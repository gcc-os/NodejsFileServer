const API = {
   FSRootFolder: '/api/root/folder',
   CreateFolder: '/api/create/folder',
   "/api/create/folder":{
      fn:"CreateFolder",
      params:{
         id:{require:1},
         name:{require:1},
      },
   },
   "/api/root/folder":{
      fn:"GetRootFolder",
   },
   "/api/upload/files":{
      fn:"UploadFiles",
   },
   "/api/download/files":{
      fn:"DownloadFiles",
   },
   FSFolder: '/api/folder'
}

module.exports = API;