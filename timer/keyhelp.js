  
/* jshint maxerr: 10000 */
/* jshint esversion: 6 */

function setupKeyHelpText() {
  

  let keys = {}; [].slice.call(document.querySelectorAll("div.key__button")).forEach(
    
    function(div){
      if (div.dataset && div.dataset.key) {
         keys[div.dataset.key.toUpperCase()]=div;
      } else {
          keys[div.innerHTML] = div;
      }
      div.addEventListener("mousedown",keyHelpSimMouseDown);
      div.addEventListener("mouseup",keyHelpSimMouseUp);
      
    }

 );



  document.body.addEventListener("keyup",keyHelpSimUp); 
  document.body.addEventListener("keydown",keyHelpSimDown); 
  
 function keyHelpSimMouseDown (e) {
       defaultKeyDown ({
        key : this.dataset.key || this.innerHTML,
        preventDefault : function(){}
     });
 }
  
  function keyHelpSimMouseUp (e) {
     defaultKeyUp ({
        key : this.dataset.key || this.innerHTML,
        preventDefault : function(){}
     });
 }
  
  
  function keyHelpSimDown(e) {
    let div = keys [(""+e.key).toUpperCase()];
    if (div) {
      div.classList.add('simulate');
      e.preventDefault();
    }
  }

  function keyHelpSimUp(e) {
    let div = keys [(""+e.key).toUpperCase()];
    if (div) {
       div.classList.remove('simulate');
       e.preventDefault();
    }

  }

  
}  
 