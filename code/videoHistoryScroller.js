(function (functionName) {
  /*
  MIT License
Copyright (c) 2021 Jonathan Annett
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
  
  */

  if (
    scriptCheck(
      ["cdpn.io", "codepen.io"],
      "jonathan-annett.github.io",
      functionName,
      "function"
    )
  )
    return;
  
  window[functionName]=videoHistoryScroller;
  
  function scriptCheck(e, o, t, n) {
    if ("object" != typeof window || (t && typeof window[t] === n)) return !1;
    var r = document.getElementsByTagName("script"),
      s = r[r.length - 1].src;
    return (
      !!s.startsWith("https://" + o + "/") &&
      !(e.concat([o]).indexOf(location.hostname) >= 0) &&
      (console.error("PLEASE DON'T SERVE THIS FILE FROM " + o),
      console.warn(
        "Please download " + s + " and serve it from your own server."
      ),
      !0)
    );
  }
  
  function videoHistoryScroller (scrollerId,urls) {
    
var
   
   uniq =  function(a) {
        var prims = {"boolean":{}, "number":{}, "string":{}}, objs = [];

        return a.filter(function(item) {
            var type = typeof item;
            if(type in prims)
                return prims[type].hasOwnProperty(item) ? false : (prims[type][item] = true);
            else
                return objs.indexOf(item) >= 0 ? false : objs.push(item);
        });
    },

  
   invalid_videoId = "kvO_nHnvPtQ", // 1 second black screen
   valid_yt_domains = [
    //used by validateYouTubeDomain
    /^www\.youtube\.com$/,
    /^youtu\.be$/,
    /^youtube\.com$/,
    /^www\.youtube-nocookie\.com$/,
    /.\.ytimg\.com$/
  ],
   videoIds = uniq(urls.map(extractYouTubeId)),
   mainScrollerDiv = document.querySelector("#"+scrollerId);
   if (mainScrollerDiv) {
     if (!mainScrollerDiv.classList.contains("videoHistoryScroller")) {
      mainScrollerDiv.classList.add("videoHistoryScroller"); 
     }
   } else {
     mainScrollerDiv = document.createElement("div");
     mainScrollerDiv.setAttribute("id",scrollerId);
     document.body.appendChild(mainScrollerDiv);
     mainScrollerDiv.classList.add("videoHistoryScroller");
   }
   mainScrollerDiv.innerHTML =  scrollerHTML();
    
   var
   track = motionTrack(["mouse", "touch"]),
       
   trackOptions = {
      data: videoIds,
      per_data_html: dragDiv,

      dragClass: "in_drag",
      minusPrefix: "drag_left_",
      plusPrefix: "drag_right_",
      contextClass:"dragmode",
      transformClass: "videoHistory",
      granularity: 10,
      snapWidth: document.querySelector("#"+scrollerId+" div.videoHistory").offsetWidth 
   },
       
   trackerVars = {},
   tracker = track.x (
     "#"+scrollerId+" div.videoHistoryScrollerInner", 
     trackOptions, 
     onVideosSelected
   );
    
    console.log(tracker);

    //https://i3.ytimg.com/vi/NsUWXo8M7UA/hqdefault.jpg
    function extractYouTubeId(url) {
      switch (typeof url) {
        case "object":
          return typeof url.videoId === "string" ? url.videoId : invalid_videoId;
        case "string":
          // pass throu any string that is not a youtube domain
          if (!validateYouTubeDomain(url)) return url;

          var re = /^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))([^#\&\?]*).*/;
          re2 = /^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?$/;
          var res = re.exec(url);
          return res ? res[1].split("/")[0] : undefined;
      }

      return invalid_videoId;
    }

    function validateYouTubeDomain(url) {
      // run against regex
      var this_domain = url.match(/^https?\:\/\/([^\/?#]+)(?:[\/?#]|$)/i);

      return this_domain && !!this_domain[1]
        ? valid_yt_domains.some(function (re) {
        return re.test(this_domain[1]);
      })
      : false;
    }

    function imageHtml(videoId, index) {
      var odd_even = ["even", "odd"][index % 2];
      return (
        '<div class="historyItem ' +
        odd_even +
        '" data-index="' +
        index +
        '" data-videoid="' +
        videoId +
        '" id="vidItem_' +
        index +
        '">' +
        '<div class="ytImgContainer">' +
        '<div class="ytImgWrapper">' +
        ' <div class="ytImgThumbBox">' +
        '<img src="https://img.youtube.com/vi/' +
        videoId +
        '/default.jpg" class="ytImgThumbImg" alt="text">' +
        " </div>" +
        " </div>" +
        "</div>" +
        "</div>"
      );
    }

    function dragDiv(videoId, index) {
      return (
        '<div class="videoHistory x2">' + imageHtml(videoId, index) + "</div>"
      );
    }
    
    function scrollerHTML () {
       
      return ( 
        '<div class="videoHistoryScrollerInner">'+
          dragDiv(invalid_videoId,0)+
        '</div>'
      );
       
     }
    
    function loadImage(src,target) { 
      var  temp = target ? document.createElement("img") : false;

      if (target&& temp) {
        temp.className="img_preloader";
        temp.onload=function() {
          target.src = src;
          target.parentElement.removeChild(temp);
        };
        target.parentElement.appendChild(temp);
        temp.src = src;
        

      }
    }
    
    function previewImage(x) {
      return (
        "https://i3.ytimg.com/vi/" + extractYouTubeId(x) + "/hqdefault.jpg"
      );
    }
    


    function onVideosSelected(cleanup, index, count, visible) {

      var first=visible[0];
      if (first) { 
        var 
          delay=10,
          datasets = visible.map(function(x){ 
          var data=x.children[0].dataset;
          var db = trackerVars[data.videoid];
          var isNew = !db;
          if (isNew) {
            db=(trackerVars[data.videoid]={
              img:x.children[0].querySelector("img"),
              preview:previewImage(data.videoid)
            });
            console.log({db});
            setTimeout(loadImage,delay,db.preview,db.img);
            delay+=10;
          }
          return data.videoid;
        });
        console.log({index,count,ids:datasets});
      }

      cleanup(0.25); 

    } 
    
    var self = {
      push : function (urlOrId) {
        return tracker.push( extractYouTubeId(urlOrId));
      },
      pop : tracker.pop
      
    };
    
     
    
    return self;

  }
  
})("videoHistoryScroller");
