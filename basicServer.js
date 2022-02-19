//
// VERSION 2.1!
//
// run like this:
//
// > node myserver.js
//

process.on('uncaughtException', function(err) {
  console.log(err)
})


var DONTCACHE = true;

var PORT = process.argv[2]
if(!PORT || isNaN(PORT)) PORT = "44440";
PORT = parseInt(PORT);

var root = process.argv[3];
if(root){
  process.chdir(root)
  console.log("(root is "+root+")");
}

console.log("== == == == == == == == ==\n"+
            "basicServer on port "+PORT+" ...");

const http = require("http");
const PROTOCOL = "HTTP";
const fs = require("fs");
const path = require("path");
const url = require("url");
const mimeTypes = {
  ".html"  : "text/html",
  ".js"    : "text/javascript",
  ".mjs"   : "text/javascript",
  ".css"   : "text/css",
  ".ico"   : "image/x-icon",
  ".png"   : "image/png",
  ".jpg"   : "image/jpeg",
  ".gif"   : "image/gif",
  ".svg"   : "image/svg+xml",
  ".json"  : "application/json",
  ".woff"  : "font/woff",
  ".woff2" : "font/woff2",
  ".txt"   : "text/plain",

  ".otf"   : "font/otf",
  ".ttf"   : "font/ttf",
  ".less"  : "text/css",
  ".wav"   : "audio/wav",
  ".ogg"   : "audio/ogg",
  ".mp3"   : "audio/mp3",

  ".vilmonicomponent":"bludgeonsoft/addon",
  ".jsx"   : "bludgeonsoft/jsx",

};
const server = http.createServer();

var MODULES = {};

server.on("request", (req, res) => {
try{
  //- - - - - - - - - - - - - - - - - - - - - - - - - - - 
  function trace(msg, status){
    res.writeHead(status||200, {"Content-Type": "text/plain"});
    res.write(msg+"\n");
  }
  trace.error = function(msg){
    trace("ERROR: "+msg, 500);
  }
  //- - - - - - - - - - - - - - - - - - - - - - - - - - - 

  var parsedUrl;
  try {
    const baseURL =  PROTOCOL + '://' + req.headers.host + '/';
    parsedUrl = new URL(req.url, baseURL);
  } catch (error) {
    console.log("== == == == "+( error ) );//
    parsedUrl = url.parse(req.url);
  }

  let pathName = parsedUrl.pathname;
  pathName = decodeURIComponent(pathName);
  let ext = path.extname(pathName);

  // To handle URLs with trailing "/" by removing aforementioned "/"
  // then redirecting the user to that URL using the "Location" header
  if (pathName !== "/" && pathName[pathName.length - 1] === "/") {
    res.writeHead(302, {"Location": pathName.slice(0, -1)})
    res.end()
    return
  }

  // If the request is for the root directory, return index.html
  // Otherwise, append ".html" to any other request without an extension
  if (pathName === "/") { 
    ext = ".html" 
    pathName = "/index.html"
  } else if (!ext) { 
    ext = ".html" 
    pathName += ext
  }

  // Construct a valid file path so the relevant assets can be accessed
  const filePath = path.join(process.cwd(), pathName);

  // Check if the requested asset exists on the server
  var exists = fs.existsSync(filePath);
  if (!exists) {
    console.log("File does not exist: " + pathName)
    res.writeHead(404, {"Content-Type": "text/plain"})
    res.write("404 Not Found")
    res.end()
    return
  }

  // check mime types
  if(!mimeTypes[ext]) {
    fs.appendFileSync("missingMimeTypes.txt", ext+"\n", 'utf8');
    console.log("Mime type does not exist: " + pathName)
  }
  // Otherwise, respond with a 200 OK status, 
  // and add the correct content-type header

  //* * * * * * * * * * * * * * * * * * * JS (
  if(ext==".jsx"){
    ///try{        
    ///  var fileText = fs.readFileSync(filePath);
    ///  var result = eval( "(" + fileText + ")" );
    ///  res.writeHead( result.status||200, result.header || {"Content-Type": "text/plain"} );
    ///  res.write(result.body);
    ///}
    ///catch(e){
    ///  res.writeHead(500, {"Content-Type": "text/plain"});
    ///  res.write("500.1 Problam Found: "+e);
    ///}
    ///res.end();

    //% throw $m(req,-1);


    var MODULE = MODULES[pathName];
    var moduleError;

    // make new module
    if(!MODULE){
      /* EVAL version * /
      var fileText = fs.readFileSync(filePath);
      try{
        MODULE = eval( "(" + fileText + ")" );
        if(typeof MODULE != "function"){
          throw( "module '"+filePath+"' is not a fn");
        }
        else{
          MODULES[pathName] = MODULE;
        }
      }
      catch(error){
        MODULE = false;
        moduleError = error;
      }
      /* REQUIRE version */
      console.log("loading jsx: " + filePath)
      MODULE = require(filePath);

      /**/
    }
    // run module
    if(MODULE){
      MODULE(req, res, function(body, header, status){
        res.writeHead( status||200, header||{"Content-Type": "text/plain"} );
        res.write(body||"this page intentionally left blank");
        res.end();
      });
    }
    // module wrong
    else if(MODULE!==false){
      delete MODULES[pathName];
      res.writeHead(500, {"Content-Type": "text/plain"});
      res.write("500.1 Problam: No module for '"+pathName+"'");
      res.end();
    }
    // eval error
    else{
      res.writeHead(500, {"Content-Type": "text/plain"});
      res.write("500.2 Module problam found: "+moduleError);
      res.end();
    }
    if(DONTCACHE) delete MODULES[pathName];
  }
  //* * * * * * * * * * * * * * * * * * * * * )
  else{
    // Read file from the computer and stream it to the response
    res.writeHead(200, {"Content-Type": mimeTypes[ext]||"text/plain"})
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  }
}
catch(e){
  res.writeHead(500, {"Content-Type": "text/plain"})
  res.write("500.3 Problam Found "+e)
  res.end()
}

});

server.listen(PORT);








/////*
/////*
/////*
/////*   # # # #  # # # #  #     #  #  #     #  # # # #  
/////*   #     #  #        #     #  #  #     #  #        
/////*   # # # #  # # # #   #   #   #   #   #   # # # #  
/////*   #  #     #          # #    #    # #    #        
/////*   #   #    # # # #     #     #     #     # # # #  
/////*
/////*   #   #  #  #     #   #  # # #   #  #  #  # # #  # # #  # # #  # # #  
/////*   #   #  #  #     # # #  #   #  # # #  #  #      #   #  #   #  #      
/////*   #   #  #  #     # # #  #   #  # # #  #  #      #   #  # # #  # # #  
/////*    # #   #  #     #   #  #   #  # # #  #  #      #   #  # #    #      
/////*     #    #  # # # #   #  # # #  #  #   #  # # #  # # #  #  #   # # #  
/////*
/////*
/////*
///
/////* == == == == == vilmonicoreRevive (  == == == == ==
///// keep discord bot alive
///(function(){
///
///console.log("");
///
///var ONE_MIN = 1000*60;
///
///var options = {
///  hostname: 'vilmonic-discord-bot.glitch.me',
///  path: "",
///  headers: { 
///    "User-Agent": 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36',
///    ///accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
///    ///"accept-encoding": "gzip, deflate, br",
///    ///"accept-language": "en-US,en;q=0.9",
///    ///"cache-control": "no-cache",
///    ///pragma: "no-cache",
///  }
///};
///
///// -- -- -- REVIVE
///function vilmonicoreRevive(){
///  var timeout = ONE_MIN*5 - (Math.random()*ONE_MIN);
///  
///  options.path = "/?code=" + (timeout/ONE_MIN);
///  http.get(options, function(result){
///    console.log("Vilmonicore REVIVING " +
///      "https://vilmonic-discord-bot.glitch.me"+options.path +
///      "\n* RESULT " + result.statusCode + ", NEXT in "+(timeout/ONE_MIN) +" minutes" +
///      "\nbasicServer on port "+PORT+" ...\n");
///  });
///  // LOOP
///  setTimeout(vilmonicoreRevive, timeout);
///}
///
///// BEGIN
///vilmonicoreRevive();
///
///}());
/////* == == == == == vilmonicoreRevive )  == == == == ==










// POST example
//% if(request.method === 'POST' && request.url === '/form-submit') {
//%   let body = '';
//%   
//%   // very important to handle errors
//%   request.on('error', (err) => {
//%       if(err) {
//%           response.writeHead(500, {'Content-Type': 'text/html'});
//%           response.write('An error occurred');
//%           response.end();
//%       }
//%   });
//%   
//%   // read chunks of POST data
//%   request.on('data', chunk => {
//%       body += chunk.toString();
//%   });
//% 
//%   // when complete POST data is received
//%   request.on('end', () => {
//%       // use parse() method
//%       body = querystring.parse(body);
//%       
//%       // { name: 'John', gender: 'MALE', email: 'john@gmail.com' }
//%       console.log(body);
//% 
//%       // rest of the code
//%   });
//% }






//_
//_
//_
//_
//_
//_  #     #  # # # #  # # # #  #        # # # #  
//_  #     #     #        #     #        #        
//_  #     #     #        #     #        # # # #  
//_  #     #     #        #     #              #  
//_  # # # #     #     # # # #  # # # #  # # # #  
//_
//_
//_
//_
//_

//- - - - - - - - - - - - - - - - - - - - - - - - - - - 
function serverPath(url){
  return process.cwd()+url;
}

//= = = = = = = = = = = = = = = = = = = = = = = = = = = show members
///function $m(object){
///  var output = "";
///  var keys = Object.keys(object);
///  for(var i=0, len=keys.length; i<len; i++){
///    var item = keys[i];
///    try{
///      var value = object[item]||"--";
///      value += "";
///    }
///    catch(e){ value = "[error]" }
///    output += ""+item+": "+value+"\n";
///  }
///  return output;
///}
function $m(value, _depth){
  var output = "";
  _depth = _depth||0;
  switch(typeof value){
    case "object":
      if(value instanceof Array){
        // arrays
        output += "[";
        try{
          for(var i=0, len=value.length; i<len; i++){
            if(_depth>0){
              output += "...";
              break;
            }
            output += $m(value[i], _depth+1)+",";
          }
          output = output.replace(/,$/,"");
        } catch(e){output += "*error*"}
        output += "]";
      }
      else{
        // objects
        output += "{";
        try{
          for(var i in value){
            if(_depth>0){
              output += (value.name||"")+"...";
              break;
            }
            output += "\n  "+i+": "+$m(value[i], _depth+1)+",";
          }
          output = output.replace(/,$/,"");
        } catch(e){output += "*error*"}
        output += (_depth>0)?"}":"\n}";
      }
      break;
    case "function":
      // functions
      output+=(value.name||"")+'()';
      break;
    case "string":
      output += '"' + (value.replace(/"/g,'\\"')) +'"';
      break;
    default:
      // everything else
      output += value;
  }
  return output;
};

//- - - - - - - - - - - - - - - - - - - - - - - - - - - unused
function getFileDirectory(str){
  var dir = str.match(/^.*[\/\\]/);
  return dir?dir[0]:"";
};

