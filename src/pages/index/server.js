let tracks = '';

let __FileMap = null;
let __FileTrack = 'root';

function GetTrack(folderID){
    __FileTrack.push({
        id: folderID,
        name: __FileMap[folderID].name,
    });
    if(__FileMap[folderID].parentDirectory){
        GetTrack(__FileMap[folderID].parentDirectory);
    }else{
        __FileTrack.reverse();
    }
}

const Http = {
    get fileMap(){return __FileMap},
    get fileTrack(){return __FileMap},
    GetFolder(id = null){ // 选择目录
        return new Promise(resolve=>{
            axios.get(`/api/root/folder?id=${id||''}`).then(res=>{
                tracks = {
                    ...res,
                    selectChild: null,
                };
                __FileMap = res.data.data.fileMap;
                __FileTrack = [];
                GetTrack(res.data.data.fileInfo.id);
                resolve({data:{fileInfo: res.data.data.fileInfo, folderTrack: __FileTrack}});
            });
        })
    },
    CreateFolder(params){
        return new Promise((resolve, reject)=>{
            if(!params || !params.name || !params.id){ 
                reject({msg:"参数错误"});
                return;
            }
            params.name = encodeURIComponent(params.name);
            axios.get(`/api/create/folder?id=${params.id}&name=${params.name}`).then(res=>{
                console.log('api/create/folder');
                console.log(res);
                res.data.code === 200 ? resolve(res.data) : reject(res.data);
            });
        })
    },
    UploadFiles(fileID,files){
        const formData = new FormData();
        console.log("file===",files);
        formData.append("file_upload", files[0]);
        return new Promise((resolve, reject)=>{
            axios.post(`/api/upload/files?file_id=${fileID}`, formData, {
                headers: {
                'Content-Type': 'multipart/form-data'
                }
            }).then(res=>{
                console.log("UploadFiles complete: ",res);
                res.data.code === 200 ? resolve(res.data) : reject(res.data);
            })
        })
    },
    DownloadFiles(file){
        const downloadurl = `/api/download/files?id=${file.id}`;
        var link = document.createElement('a');
        //设置下载的文件名
        link.download = file.name;
        link.style.display = 'none';
        //设置下载路径
        link.href = downloadurl;
        //触发点击
        document.body.appendChild(link);
        link.click();
        //移除节点
        document.body.removeChild(link);

        // return new Promise((resolve, reject)=>{
        //     axios.post(`/api/download/files?id=${fileID}`).then(res=>{
        //         console.log("DownloadFiles complete: ",res);
        //     })
        // })
    },
}