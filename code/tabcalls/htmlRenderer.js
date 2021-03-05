

function htmlRenderer(filename,htmlTemplates) {
  
      htmlTemplates.keyLoop(function(html_id,template) {
         Object.defineProperties(template, {
           db: {
             value: {},
             configurable: true,
             enumerable: true
           },
           html: {
             value: renderThis.bind(template),
             configurable: false,
             enumerable: false
           }
         });
     });
  
      function loadFileContents(filename,cb,backoff,maxBackoff) {
          var xhttp = new XMLHttpRequest();
          backoff = backoff || 1000;
          maxBackoff = maxBackoff || 30000;
          xhttp.onreadystatechange = function() {
              if ( (this.readyState == 4 ) && 

                   ( ( this.status >= 200  && this.status < 300 )  || 
                     ( this.status === 304 ) )
                 ) {
                  var txt = this.responseText;
                  return window.setTimeout(cb,10,undefined,txt);
              }

              if (this.readyState == 4 && this.status != 200 && this.status !== 0) {
                  return cb ({code:this.status});
              }
          };
          xhttp.onerror = function() {

             console.log  ("XMLHttpRequest error");
             setTimeout(function(){
                 loadFileContents(filename,cb,Math.min(backoff*2,maxBackoff),maxBackoff);
             },backoff);
          };
          xhttp.open("GET", filename, true);
          xhttp.send();
      }
  
        function preRenderSpanIds (html) {
          var chop = html.split('<span data-template-id="');
          if (chop.length===1) return html;
          return chop.map(function(chunk,index){
             if (index===0) return chunk;
             var id = chunk.split('"')[0];
             var remain = chunk.split('</span>').slice(1).join('</span>');
             return "${"+id+"}"+remain;
          }).join('');
          
        }

        function preRenderClassIds (html) {
          var chop = html.split('template-dataset-');
          if (chop.length===1) return html;
          return chop.map(function(chunk,index){
             if (index===0) return chunk;
             var term=chunk.indexOf('"');
             if (term>=0) {
                 var id = chunk.substr(0,term);
                 var remain = chunk.substr(term);
                 return "${"+id+"}"+remain;
             }
             return chunk;
          }).join('');
          
        }

        function renderThis (db) {
          var template = this.template;
          db = db || this.db;

          if (typeof db==='object' && db.constructor===Array) {
            
             var result = {
                events : {},
                html : ''
             };
            
            
             db.map(
                   renderHtml.bind(this,template)
             ).forEach(function(r){
                 result.html += r.html+'\n';
               
               
                 r.events.keyLoop(function(id,source){
                    var dest = result.events[id];
                    if (!dest) {
                       result.events[id]={};
                       dest = result.events[id];
                   }
                   
                   source.keyLoop(function(eventName,event){
                      dest[eventName] = event;
                   })

                 });

             });
            
             return result;
            
         }
         return renderHtml(
             template,
             db,
         );
        }

        function renderHtml(html,db) {
          
            var keys = Object.keys(db);
          
            var busy=keys.length>0;
          
            var render = 
              busy ? 
              function(k){

                   var entry = db[k];

                   if (typeof entry=== 'object') {
                       return;
                   }

                   var chop = html.split('${'+k+'}');
                
                   if (chop.length===1) return;

                   busy = true;
                   html = chop.join( entry.toString() );
                
              } : 
              false;

            while(busy) {
                busy = false;
                keys.forEach(render);
            }
          
            return html;
          
        }

        function extractHtmlChunk(html,chunkName,replace) {
            var 
            prefix = '<!--['+chunkName+'.start]-->',
            suffix = '<!--['+chunkName+'.end]-->';

            var chunks = html.split(prefix);

                if (chunks.length===2) {
                html = chunks[1]; 
                var chunks2 = html.split(suffix);
                if (chunks2.length===2) {
                    if (replace) {
                      return chunks[0] + replace + chunks2[1];
                    } else {
                      return chunks2[0]; 
                    }
                }
            }
            return false;
        }
    
       var 
       documentEvents = [],
       templateHtml,firstCall=undefined;
        
       loadFileContents(filename,function (err,html){
         if (!err) {
           
           var html_span = preRenderSpanIds(html);
           templateHtml = preRenderClassIds(html_span);
           
           
           
           htmlTemplates.keyLoop(function(html_id,item){
             item.template = extractHtmlChunk(templateHtml,html_id);
           })
           
           if (firstCall) {
               var fn = firstCall; 
               firstCall=false;
               fn();
           }
         }

      });
        
        return function (dbs) {
            console.log("rendering",dbs);
            var fetch = function () {
              
                    
               documentEvents.splice(0,documentEvents.length);
               
              dbs.keyLoop(function(html_id,DB){  
                 var 
                 h = '',
                  
                  process_DB_data = function (template_id,DB_DATA) {
                    
                    
                    var TEMPLATE = htmlTemplates[template_id],
                        
                        process_DB = function (DB) {
                          
                          
                          h += TEMPLATE.html( DB );

                          DB.keyLoop(function(x){

                            if (x.type === 'object' ) {
                              var entry={};
                              entry[x.key]=x.value;
                              documentEvents.push(entry);
                            }
                            
                          },true);
                          
                        };
                   
                   if (typeof DB_DATA==='object') {
                        if (DB_DATA.constructor===Array) {
                           DB_DATA.forEach(process_DB);
                        } else {
                           process_DB(DB_DATA);
                        }
                    }
                    
                 };   
                     

                  if (typeof DB=='object') {
                    
                      
                       
                      if (DB.constructor===Array) {

                        DB.forEach(function(ELEMENT){
                          var 
                          
                          template_id = Object.keys(ELEMENT)[0],
                              
                          DATA=ELEMENT[template_id];
                          
                          process_DB_data(template_id,DATA);

                        });

                      } else {
                        
                         var template_id = html_id;
                         process_DB_data(template_id,DB);
                        
                      }
                    
                    document.getElementById(html_id).innerHTML = h;
                    
                  }
                 
                  else {
                    console.log("can't fetch :"+html_id);
                  }
               });
              
              
                
               documentEvents.forEach(function(elementEventIndex){
                 
                 
                 elementEventIndex.keyLoop(function(html_id,item){
                      
                      var 
                      element = document.getElementById(html_id);
                     

                      if (  typeof element==='object' && 
                            element!==null && 
                            element.nodeName && 
                            typeof element.addEventListener==='function' ) {

                        item.keyLoop(function(eventName){
                          var handler =item[eventName];
                          if (typeof handler==='function') {
                             //console.log("adding",eventName,"handler to",html_id,"in",item);
                             element.addEventListener(eventName,function(e){ 
                               console.log("invoking",eventName,"handler to",html_id,"in",item,"el id=",e.target.id);
                               handler (typeof e === 'object' ? e.target : e ) ;
                             });
                          }
                        });
                        
                        

                      } else {
                        
                        console.log("element", element===null ? "for "+html_id +" is null":  ( 
                          
                          html_id,"(",typeof element,") can't set events nodeName=",
                                    typeof element.nodeName,  "addEventListener=",typeof element.addEventListener)
                                             
                                    );
                        
                      }
                      


                  });  

              });


            };

            if (typeof templateHtml==='string') {
               return fetch();
            }
           
        }
    }
 
