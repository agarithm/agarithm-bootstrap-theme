/*!
  * Bootstrap ajah.js v4.3.1 (https://getbootstrap.com/)
  * Copyright 2011-2020 The Bootstrap Authors (https://github.com/twbs/bootstrap/graphs/contributors)
  * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
  */
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global = global || self, global.AJAH = factory());
}(this, function () { 'use strict';

	////////////////////////////////////////////////////////////////////////////////////
	////////////////////////////////////////////////////////////////////////////////////
	////////////////////////////////////////////////////////////////////////////////////
	// AJAH Queue Manager (Asynchronous Javascript and HTML for server side rendering)
	// Copyright Mike Agar 2014
	// MIT License
	//POLYFILL for IE9+ to add remove() function. see: https://developer.mozilla.org/en-US/docs/Web/API/ChildNode/remove
	(function (arr) {
	  arr.forEach(function (item) {
	    if (item.hasOwnProperty('remove')) {
	      return;
	    }

	    Object.defineProperty(item, 'remove', {
	      configurable: true,
	      enumerable: true,
	      writable: true,
	      value: function remove() {
	        if (this.parentNode === null) {
	          return;
	        }

	        this.parentNode.removeChild(this);
	      }
	    });
	  });
	})([Element.prototype, CharacterData.prototype, DocumentType.prototype]);

	function Ajah() {
	  //STATE
	  this.debug = true;
	  this.waiting = new Array(0);
	  this.upload = new Array(0); //low priority File Upload Queue

	  this.uploadActive = false;
	  this.active = new Array(0);
	  this.max_active = 2; //MSIE max concurrent requests.  Some browsers can do more, we should consider dynamically changing this...

	  this.intervalID = null; //timer ID, used to shutdown when waiting queue is empty.

	  this.id = 0; //trick to keep browser from caching results; future use could be to use the id to cancel requests.
	} //////////////////////////////////////////
	// AJAX Helper Functions


	Ajah.prototype.log = function (msg) {
	  if (ajah.debug) {
	    console.log("AJAX[" + this.active.length + "] " + msg);
	  }
	};

	Ajah.prototype.stopMonitor = function () {
	  if (ajah.waiting.length === 0 && ajah.upload.length === 0) {
	    if (this.intervalID) {
	      //shut down the timer;
	      window.clearInterval(this.intervalID);
	      this.intervalID = null;
	      this.log("<<< Stopping interval timer."); //Hide background spinner

	      $("body").css("cursor", "auto");
	    }
	  }
	};

	Ajah.prototype.startMonitor = function () {
	  if (!this.intervalID) {
	    //start the interval to poll for open slot
	    this.intervalID = window.setInterval(function () {
	      ajah.processWaiting();
	    }, 50); //50ms polling

	    aInitialized = true;
	    this.log(">>> Starting interval timer."); //Show background spinner

	    $("body").css("cursor", "progress");
	  }
	};

	Ajah.prototype.finish = function (url) {
	  //Remove url from active queue.
	  function remove(val, from) {
	    for (var i = 0; i < from.length; i++) {
	      if (from[i] === val) {
	        from.splice(i, 1);
	        i--;
	      }
	    }

	    return from;
	  }

	  ajah.active = remove(url, ajah.active);
	}; //HACK: There can be only one!  (id=session_override)


	Ajah.prototype.processSO = function (raw) {
	  var parser = new DOMParser();
	  var html = parser.parseFromString(raw, 'text/html');
	  var newSO;
	  var oldSO;
	  html.innerHTML = raw;

	  if (oldSO = document.getElementById('session_override')) {
	    //Found an old Session Override
	    if (newSO = html.getElementById('session_override')) {
	      //Found a New SO, update the old one, and remove the new one from the RAW result
	      oldSO.innerHTML = newSO.innerHTML;
	      newSO.remove();
	    }
	  }

	  return html.innerHTML;
	};

	Ajah.prototype.processWaiting = function () {
	  function getXmlHttpObject() {
	    var xmlHttp = null;

	    try {
	      // Firefox, Opera 8.0+, Safari
	      xmlHttp = new XMLHttpRequest();
	    } catch (e1) {
	      // Internet Explorer
	      try {
	        xmlHttp = new ActiveXObject("Msxml2.XMLHTTP");
	      } catch (e2) {
	        xmlHttp = new ActiveXObject("Microsoft.XMLHTTP");
	      }
	    }

	    return xmlHttp;
	  }

	  function parseURL(url) {
	    //CREDIT: http://james.padolsey.com/javascript/parsing-urls-with-the-dom/
	    var a = document.createElement('a');
	    a.href = url;
	    return {
	      source: url,
	      protocol: a.protocol.replace(':', ''),
	      host: a.hostname,
	      port: a.port,
	      query: a.search,
	      params: function () {
	        var ret = {},
	            seg = a.search.replace(/^\?/, '').split('&'),
	            len = seg.length,
	            i = 0,
	            s;

	        for (; i < len; i++) {
	          if (!seg[i]) {
	            continue;
	          }

	          s = seg[i].split('=');
	          ret[s[0]] = s[1];
	        }

	        return ret;
	      }(),
	      file: (a.pathname.match(/\/([^\/?#]+)$/i) || [, ''])[1],
	      hash: a.hash.replace('#', ''),
	      path: a.pathname.replace(/^([^\/])/, '/$1'),
	      relative: (a.href.match(/tps?:\/\/[^\/]+(.+)/) || [, ''])[1],
	      segments: a.pathname.replace(/^\//, '').split('/')
	    };
	  }

	  function appendId(url) {
	    var out;
	    var cache_hack;
	    var parts;
	    var session_override; //HACK: ensures all AJAXy transactions are not cached, since the URL is ever changing...

	    ajah.id++;
	    cache_hack = ajah.id + Math.random();
	    parts = parseURL(url);

	    if (parts.query.length === 0) {
	      ajah.log("Ajah.processWaiting() URL Missing query, adding one now.");
	      out = url + "?ajah=" + cache_hack;
	    } else {
	      out = url + "&ajah=" + cache_hack;
	    } //HACK: Third Party Cookies are dying, so we are going to add the Session Override to the URL (session_override)


	    if (session_override = document.getElementById("session_override")) {
	      out = out + "&session_override=" + session_override.innerHTML;
	    }

	    return out;
	  }

	  if (this.active.length < this.max_active) {
	    var request;

	    if (this.waiting[0]) {
	      request = this.waiting.shift();
	      var xmlHttp = null;
	      xmlHttp = getXmlHttpObject();

	      if (xmlHttp === null) {
	        this.log("Failed to GetHttpObject, Aborting.");
	        return;
	      } //Move it to the active queue


	      this.active.push(request.url); //custom lambda function to handle this request
	      //Calls the "func" with whatever is at the endpoint "url"

	      xmlHttp.onreadystatechange = function () {
	        var content;

	        if (xmlHttp.readyState == 4) {
	          switch (xmlHttp.status) {
	            case 200:
	              //HACK: we can only have one active SO id, 
	              //      so update the current one, and remove it from the response
	              content = ajah.processSO(xmlHttp.responseText); //success do what was asked

	              request.func(content);
	              break;

	            default:
	              ajah.log("Server Error Code " + xmlHttp.status + " on url " + request.url);
	          } //and then clean up active queue


	          ajah.finish(request.url);
	          ajah.stopMonitor();
	        }
	      };

	      xmlHttp.open("POST", appendId(request.url), true);

	      if (request.hasOwnProperty('params')) {
	        xmlHttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	        xmlHttp.send(request.params);
	      } else {
	        xmlHttp.send(null);
	      }
	    } else if (this.upload[0]) {
	      //File upload queue.  only do one file upload at a time, 
	      //never use more than one of the available AJAX threads
	      if (!this.uploadActive) {
	        request = this.upload.shift();
	        var XHR = null;
	        XHR = getXmlHttpObject();

	        if (XHR === null) {
	          this.log("Failed to GetHttpObject, Aborting.");
	          return;
	        } //Move it to the active queue


	        this.active.push(request.url);
	        this.uploadActive = true; //custom lambda function to handle this request
	        //Calls the "func" with whatever is at the endpoint "url"

	        XHR.onreadystatechange = function () {
	          if (XHR.readyState == 4) {
	            switch (XHR.status) {
	              case 200:
	                //HACK: we can only have one active SO id, 
	                //      so update the current one, and remove it from the response
	                content = ajah.processSO(xmlHttp.responseText); //success do what was asked

	                request.func(content);
	                break;

	              default:
	                ajah.log("Server Error Code " + XHR.status + " on url " + request.url + " (file upload)");
	            } //and then clean up active queue


	            ajah.uploadActive = false;
	            ajah.finish(request.url);
	            ajah.stopMonitor();
	          }
	        };

	        XHR.open("POST", appendId(request.url) + "&AJAX_FILENAME=" + request.file.name, true);
	        XHR.send(request.file);
	      } else {
	        //busy, so make sure the monitor is running...
	        this.startMonitor();
	      }
	    }
	  } else {
	    //make sure the background handler is running.
	    this.startMonitor();
	  }
	}; //////////////////////////////////////////////////////////////
	// AJAX Interface


	Ajah.prototype.inQueue = function (url) {
	  //Check Active queue
	  for (var i = 0; i < this.active.length; i++) {
	    if (this.active[i] === url) return true;
	  } //Check Waiting queue


	  for (var j = 0; j < this.waiting.length; j++) {
	    if (this.waiting[j].url === url) return true;
	  } //Check Upload queue


	  for (var k = 0; k < this.upload.length; k++) {
	    if (this.upload[k].url === url) return true;
	  }

	  return false;
	};

	Ajah.prototype.Busy = function () {
	  return this.active.length > 0;
	};

	Ajah.prototype.DoWith = function (func, url) {
	  if (!this.inQueue(url)) {
	    this.log("DoWith() on " + url);
	    this.waiting.push({
	      func: func,
	      url: url
	    });
	    window.setTimeout(function () {
	      ajah.processWaiting();
	    }, 1);
	  } else {
	    this.log("DoWith() URL already queued. Skipping this " + url);
	  }
	};

	Ajah.prototype.DoWithPost = function (func, url, params) {
	  if (!this.inQueue(url)) {
	    this.log("DoWith() on " + url);
	    this.waiting.push({
	      func: func,
	      url: url,
	      params: params
	    });
	    window.setTimeout(function () {
	      ajah.processWaiting();
	    }, 1);
	  } else {
	    this.log("DoWith() URL already queued. Skipping this " + url);
	  }
	};

	Ajah.prototype.Send = function (url) {
	  this.log("Send() on " + url);
	  this.DoWith(function (msg) {
	    return;
	  }, url); //throw away the result
	};

	Ajah.prototype.SendFile = function (url, file, func) {
	  this.log("SendFile() " + file.name + " to " + url);
	  this.upload.push({
	    func: func,
	    url: url,
	    file: file
	  });
	  window.setTimeout(function () {
	    ajah.processWaiting();
	  }, 1);
	};

	Ajah.prototype.SelfTest = function (url) {
	  function paint(msg) {
	    LogDiv("ajah_test", "<pre>" + msg + "</pre>");
	  }

	  function done(msg) {
	    LogDiv("ajah_test", "<h3>AJAX Self Test END</h3>");
	  }

	  this.debug = true;
	  if (this.id < 5) LogDiv("ajah_test", "<h3>AJAX Self Test START</h3>");
	  this.DoWith(paint, "robots.txt");
	  this.DoWith(paint, "404.txt");
	  this.DoWith(paint, url);
	  this.Send(url);
	  this.Send(url);
	  this.Send(url);
	  this.Send(url);
	  this.Send(url);
	  this.Send(url);
	  this.Send(url);
	  this.Send(url);
	  this.Send(url);
	  this.Send(url);
	  this.DoWith(paint, url);
	  this.DoWith(paint, url);
	  this.DoWith(paint, url);
	  this.DoWith(paint, url);
	  this.DoWith(paint, url);
	  this.DoWith(paint, url);

	  if (this.id < 10) {
	    window.setTimeout(function () {
	      ajah.SelfTest(url);
	    }, 100 + this.id * 50);
	  } else {
	    this.DoWith(done, "index.php");
	  }
	}; ////////////////////////////////////////////////////////////////////////////////////
	////////////////////////////////////////////////////////////////////////////////////
	////////////////////////////////////////////////////////////////////////////////////
	//AJAX Singleton


	var ajah;
	ajah = new Ajah();
	var ajah$1 = ajah;

	return ajah$1;

}));
//# sourceMappingURL=ajah.js.map
