/* global zip_url_base,zip_files, parent_link*/


/* global ml,self,caches, swResponseZipLib  */
ml([],function(){ml(2,

    {
        ServiceWorkerGlobalScope: function zipFSPaths( lib ) {
            lib = lib ||{};
            // add / override service worker specific methods here
            
            
            return lib;
        } 
    }, {
        ServiceWorkerGlobalScope: [
            ()=> zipFSPaths ()
        ]
        
    }

    );



    function zipFSPaths () {
        const lib = {
            splitZipPaths,
            testPathIsZip,
            testPathIsZipMeta,
        } ;
        
        
        return lib;
        
        
        
        function inclusiveSplit(str,split,replaceText,splitAfter) {
             if (!replaceText) replaceText = split;
             return splitAfter ? str.split(split).map(function(e,i,a){
                return i > 0 ? replaceText+e : e;
             }): str.split(split).map(function(e,i,a){
                 return i < a.length-1 ? e+replaceText : e;
             });
         }

         function multiSplit(str,splits,replaces) {
              /*
        
        multiSplit(
           "https://blah/file.zip/dir/file.zip/dir/js-keygen-master-3a1f4c1f1d4ffce91e4b7a65c5b3b4402cc82866.png/dir/file.zip",
           [ ".zip/", /(?<=\-[a-f0-9]{40})\.png\// ],
           [".zip",".png"])
        
        returns 
        
        ["https://blah/file.zip", "dir/file.zip", "dir/js-keygen-master-3a1f4c1f1d4ffce91e4b7a65c5b3b4402cc82866.png", "dir/file.zip"]
        
        */
             
            const use_splits = splits.slice();
            const use_replaces = replaces.slice();
            const splitFirst = function () {
                const split   = use_splits.shift();
                const replace = use_replaces.shift();
                return function (str) {
                   return inclusiveSplit(str,split,replace);
                }
            };
            const result = splitFirst()(str);
            const collate = function(arr){
               result.push.apply(result,arr);
               arr.splice(0,arr.length);
            };
            while (use_splits.length>0) {
                const temp = result.map (splitFirst());
                result.splice(0,result.length);
                temp.forEach(collate);
                temp.splice(0,temp.length);
            }
            return result; 
         }
         
         function splitZipPaths (str) {
            
            const splitters = [ /(?<=\-[a-f0-9]{40})\.png\// , /\.zip\// ];
            const joiners   = [                     '.png',     '.zip'   ];
            
            return multiSplit(str,splitters,joiners);
        }
        
         function testPathIsZip (path) {
            return /\.zip$/.test(path);
        }
        
        function testPathIsZipMeta (path) {
            return /\.zip\.meta\.js$/.test(path);
        }
        
         function testPathIsPngZip (path) {
            return /(?<=\-[a-f0-9]{40})\.png$/.test(path);
        }
        
    }


 

});

