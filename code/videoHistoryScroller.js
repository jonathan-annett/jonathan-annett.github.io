
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
  
  function videoHistoryScroller (scrollerId,urls,x2) {
    
var
   rateLimitingMsecBetweenVideos=100,
   getEl = document.getElementById.bind(document),
   crEl = document.createElement.bind(document),
     
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
   sizecls = x2 ? ' x2' : '',
  
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
   
   arraymove = function(arr, fromIndex, toIndex) {
            if (fromIndex===toIndex) return;
            if ( (fromIndex<0)|| (toIndex<0) ) return;
            var limit=arr.length-1;
            if ( (fromIndex>limit)|| (toIndex>limit) ) return;
                
            var element = arr[fromIndex];
            arr.splice(fromIndex, 1);
            arr.splice(toIndex, 0, element);
        },
          
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
      snapWidth: document.querySelector("#"+scrollerId+" div.videoHistory").offsetWidth ,
     
      onLongPress: onVideoLongPress,
      onSelected:  onVideosSelected
     
   },
       
   trackerVars = {},
    hiddenVideos = [],
    visibleVideos = [],
    loadedPlayers=function(){
      return visibleVideos.concat(hiddenVideos);
    },
   tracker = track.x (
     "#"+scrollerId+" div.videoHistoryScrollerInner", 
     trackOptions, 
     onVideosSelected
   ),
    displayArea=document.querySelector("#"+scrollerId+' div.player_live');
 

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
        '<div class="videoHistory'+sizecls+'">' + imageHtml(videoId, index) + "</div>"
      );
    }
    
    function scrollerHTML () {
       
      return ( 
        '<div class="videoHistoryScrollerInner">'+
          dragDiv(invalid_videoId,0)+
        '</div>'+
        '<div class="player_live"></div>'
      );
       
     }
    
    function loadImage(src,target,cb) { 
      var  temp = target ? document.createElement("img") : false;

      if (target&& temp) {
        temp.className="img_preloader";
        temp.onload=function() {
          target.src = src;
          target.parentElement.removeChild(temp);
          if (typeof cb==='function') {
             cb(src,target);
          }
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
   
       
    function limitPlayerCount(count) {
       var list = loadedPlayers();
       if (list.length<=count) return; 
       list.slice(count).forEach(removeVideo);
    }
    
    function showVideo(info){
      if (info.player_div_outer) {
        
          var ix = hiddenVideos.indexOf(info);
          if (ix>=0) {
             hiddenVideos.splice(ix,1);
             //console.log("unhid player for",info.videoId);
          }
        
        info.player_div_outer.classList.remove('hideme');
        
        ix = visibleVideos.indexOf(info);
        if(ix<0) {
            visibleVideos.push(info);
        } else {
            arraymove(visibleVideos,ix,0); 
        }
        
          
        
      } else {
         createYouTubePlayer(info, function(){
           
          // console.log("added player for",info.videoId);
           visibleVideos.push(info); 
            if (info.previewElement.classList.contains('playable')) {
              info.player.playVideo(0);
              info.player.setVolume(100);
            }

         });
      }
    }
    
    
    
    function removeVideo(info){
      
      if (info.previewElement.classList.contains('playable')) return;
      
      if (info.player) {
        info.player.stopVideo();
        info.player_div_outer.parentElement.removeChild(info.player_div_outer);

        delete info.player_div_outer;
        delete info.player_div_inner;
        delete info.player_iframe;
        delete info.player;
        delete info._player;
        
        //console.log("removed player for",info.videoId);
        
        var ix = visibleVideos.indexOf(info);
          if (ix>=0) {
             visibleVideos.splice(ix,1);
          }
        
        ix = hiddenVideos.indexOf(info);
          if (ix>=0) {
             hiddenVideos.splice(ix,1);
          }

      } 
    }
    
     function hideVideo(info){
        if (info.previewElement.classList.contains('playable')) return;
        if (info.player) {
          var ix = hiddenVideos.indexOf(info);
          if (ix<0) {
             info.player_div_outer.classList.add('hideme');
             hiddenVideos.push(info);
            // console.log("hid player for",info.videoId);
          } else {
             arraymove(hiddenVideos,ix,0); 
          }
          
          ix = visibleVideos.indexOf(info);
          if (ix>=0) {
             visibleVideos.splice(ix,1);
          }
        }
     }
    
    function onVideoLongPress (el) {
      
       var videoId;
      
      if (el&&typeof el.src==='string'&&el.src.startsWith('http')) 
          videoId =  extractYouTubeId(el.src)
      else
          videoId=el.dataset.videoid;
      
      if (typeof videoId==='string') {
        var info=trackerVars[videoId];
        if (info) {
          
          
          showVideo(info);
          info.previewElement.classList.toggle('playable');
          
          if (info.previewElement.classList.contains('playable')) {
            
              if (info.player) {
                 info.player.playVideo(0);
                
                info.player.setVolume(100); 
               
               
              }
          } else {
              if (info.player) {
                info.player.setVolume(0);
                info.player.stopVideo();
              }
          }
          
        }
        
      }  
      
    } 

    function onVideosSelected(cleanup, index, count, visible, notVisible) {

      var first=visible[0];
      if (first) { 
        var 
          delay=10,
          datasets = visible.map(function(x){ 
          var element = x.children[0];
          var data=element.dataset;
          var db = trackerVars[data.videoid];
          var isNew = !db;
          if (isNew) {
            db=(trackerVars[data.videoid]={
              videoId:data.videoid,
              img:x.children[0].querySelector("img"),
              preview:previewImage(data.videoid),
              previewElement:x,
        
             });
            
              setTimeout(loadImage,delay,db.preview,db.img,function(){
                showVideo(db);
             });
            delay+=10;
          } else {
             showVideo(db);
          }
          return data.videoid;
        });
        //console.log({index,count,ids:datasets});
        notVisible.forEach(function(x){
          var element = x.children[0];
          var data=element.dataset;
          var db = trackerVars[data.videoid];
          if (db) {
             hideVideo(db); 
          }
        });
      }

      cleanup(0.25);  
      
      limitPlayerCount(10);

    } 
    
    
  function createYouTubePlayer(info, index) {
    var cb =
      typeof index === "function"
        ? index
        : function (info, player) {
            player.setVolume(0);
            // player.playVideo();
            // player.setVolume(0);
          };
    index = typeof index === "number" ? index : undefined;

    if (["string", "object"].indexOf(typeof info) >= 0) {
      if (typeof createYouTubePlayer.next_index === "undefined") {
        createYouTubePlayer.api_ready_requests = [];
        createYouTubePlayer.next_index = 0;
      }

      if (typeof info === "string") {
        info = {
          videoId: extractYouTubeId(info),
          opened_via: "" + info,
          __open_cb: cb
        };
       } else {
        if (typeof info.videoId === "string") {
          info.__open_cb = cb;
        } else {
          cb(new Error("invalid player info"));
          return null;
        }
      }

      if (typeof window.onYouTubeIframeAPIReady === "function") {
        if (createYouTubePlayer.api_ready_requests) {
          createYouTubePlayer.api_ready_requests.push(info);
          return info;
        }

        return createYTPlayer(
          info,
          index ? index : createYouTubePlayer.next_index++
        );
      }

      window.onYouTubeIframeAPIReady = function onYouTubeIframeAPIReady() {
        createYouTubePlayer.next_index =
          createYouTubePlayer.api_ready_requests.length;
        createYouTubePlayer.api_ready_requests.forEach(createYTPlayer);
        createYouTubePlayer.api_ready_requests.splice(
          0,
          createYouTubePlayer.next_index
        );
        delete createYouTubePlayer.api_ready_requests;
      };

      var tag = document.createElement("script");
      tag.id = "youtube-iframe-loader";
      tag.src = "https://www.youtube.com/iframe_api";

      var firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      createYouTubePlayer.api_ready_requests.push(info);
      return info;
    }

    return null;
  }

  function createPlayerYTImpl(info) {
    info._player = new YT.Player(info.player_iframe.id, info.youTubeArgs);
  }

  function createYTPlayer(info, ix) {
    var rateLimitingDelay = ix ? ix * rateLimitingMsecBetweenVideos : 0;

    
    
    
    info.player_div_outer = document.createElement("div");
    info.player_div_outer.id = "player_outer_" + ix;
    info.player_div_outer.dataset.index = ix;
    info.player_div_outer.dataset.videoid = info.videoId;
    info.player_div_outer.classList.add("player_outer");
    
    info.player_div_inner = document.createElement("div");
    info.player_div_inner.id = "player_inner_" + ix;
    info.player_div_inner.dataset.index = ix;
    info.player_div_inner.dataset.videoid = info.videoId;
    info.player_div_inner.classList.add("player_inner");
    
    
    info.player_iframe    = document.createElement("div"); 
    info.player_iframe.id = "player_" + ix;
    info.player_iframe.dataset.videoid = info.videoId;
    info.player_iframe.dataset.index = ix;
  
    
    info.player_div_outer.appendChild(info.player_div_inner);
    info.player_div_inner.appendChild(info.player_iframe);
   
    
    if (info.previewElement) {
      info.previewElement.appendChild(info.player_div_outer);
    }

    info.youTubeArgs = {
      videoId: info.videoId,
      events: {
        onReady: function onPlayerReady(event) {
          var cb = info.__open_cb;
          delete info.__open_cb;
          info.player = event.target;
          delete info._player;
          if (typeof cb === "function") cb(info, info.player);
        },
        onStateChange: function onPlayerStateChange(event) {},
        playerVars: info.playerVars || {
          fs: 1,
          controls: 0,
          playsinline: 0,
          enablejsapi: 0,
          modestbranding: 1,
          disablekb: 1,
          autohide: 1,
          autoplay: 0,
          loop: 0,
          volume: 0,
          iv_load_policy: 3,
          origin: location.hostname
        }
      }
    };

    setTimeout(createPlayerYTImpl, rateLimitingDelay, info);

    return info;
  }
    
    var self = {
      push : function (urlOrId) {
        var id = extractYouTubeId(urlOrId);
        if (typeof id==='string' && id.length>0) {
           return tracker.push( id );
        } else {
           return tracker.length;
        }
      },
      pop : tracker.pop
      
    };
    
     Object.defineProperties(self,{
        
        length : {
          
          configurable : false,
          get : function() {
            return tracker.length
          } 
        }
        
      });
    
     
    
    return self;

  }
  
})("videoHistoryScroller");
