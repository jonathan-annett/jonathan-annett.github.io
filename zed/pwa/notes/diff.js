/* global diff_match_patch */

var dmp = new diff_match_patch();

function diff(text1,text2) {
    
  dmp.Diff_Timeout = 2.5;
  dmp.Diff_EditCost = 4;

  var ms_start = (new Date()).getTime();
  var d = dmp.diff_main(text1, text2);
  var ms_end = (new Date()).getTime();

  dmp.diff_cleanupSemantic(d);
   // dmp.diff_cleanupEfficiency(d);
  var ds = dmp.diff_prettyHtml(d);
  //document.getElementById('outputdiv').innerHTML = ds + '<BR>Time: ' + (ms_end - ms_start) / 1000 + 's';
  return ds;
}


document.addEventListener('DOMContentLoaded', function () {
      
    compareFile("js/boot.js");
  
});

const urlbase1 = "https://raw.githubusercontent.com/zedapp/zed/master/app/";
const urlbase2 = "https://jonathan-annett.github.io/zed/app/";

function compareFile(file) {
    
   fetch(urlbase1+file)
   .then(function(response) { return response.text();})
   .then(function (text1){
       fetch(urlbase2+file)
       .then(function(response) { return response.text();})
       .then(function (text2){
           var diffHtml = global.Diff2Html.html( diff(text1,text2) , {
               // options here
           });
           document.getElementById('outputdiv').innerHTML = diffHtml;
       });
   });
}