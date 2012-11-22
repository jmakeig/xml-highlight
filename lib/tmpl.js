// Simple JavaScript Templating
// http://ejohn.org/blog/javascript-micro-templating/
// John Resig - http://ejohn.org/ - MIT Licensed
/*

<script type="text/html" id="user_tmpl">
  <?tmpl for ( var i = 0; i < users.length; i++ ) { ?>
    <li><a href="<?tmpl- users[i].url%>"><?tmpl- users[i].name %></a></li>
  <?tmpl } ?>
</script>

var results = document.getElementById("results");
// Template id's can't have hyphens in them, they must match \W
// dataObject should be an Object whose children will be in scope as local variables
results.innerHTML = tmpl("item_tmpl", {"users": […]});

*/


(function(){
  /*
  function prepareString(str) {
    return str
      .replace(/[\r\t\n]/g, " ")
      .split("<%").join("\t")
      .replace(/((^|%>)[^\t]*)'/g, "$1\r")
      .replace(/\t=(.*?)%>/g, "',$1,'")
      .split("\t").join("');")
      .split("%>").join("p.push('")
      .split("\r").join("\\'")
  }
  */
  function prepareString(str) {
    return str
      .replace(/[\r\t\n]/g, " ")
      .split("<\?tmpl").join("\t")
      .replace(/((^|\?>)[^\t]*)'/g, "$1\r")
      .replace(/\t-(.*?)\?>/g, "',$1,'")
      .split("\t").join("');")
      .split("?>").join("_p.push('")
      .split("\r").join("\\'")
  }
  var cache = {};
  this.tmpl = function tmpl(str, data){
    //if(data) console.dir(data);
    // Figure out if we're getting a template, or if we need to
    // load the template - and be sure to cache the result.
    // console.log(str);
    // console.log(prepareString(str));
    var fn = !/\W/.test(str) ?
      cache[str] = cache[str] ||
        tmpl(document.getElementById(str).innerHTML) :
      // Generate a reusable function that will serve as a template
      // generator (and which will be cached).
      new Function("obj",
        "var _p=[],print=function(){_p.push.apply(_p,arguments);};" +
        
        // Introduce the data as local variables using with(){}
        "with(obj){_p.push('" +
          prepareString(str)
          + "');}return _p.join('');");
    
    // console.log(fn);

    // Provide some basic currying to the user
    return data ? fn( data ) : fn;
  };

  // Load a template externally
  this.tmpl.get = function getTemplate(path, handler, errorHandler) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
      if(this.readyState === 1) { /* Loading */ }
      if(this.readyState === 4) {
        if (this.status >= 200 && this.status < 300) {
          handler(this.responseText);
        } else {
          console.error(this.responseText);
          if(errorHandler) errorHandler(this.responseText);
        }
      }
    }
    xhr.open("GET", path, true);
    xhr.send();
  }
})();
