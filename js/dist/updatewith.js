/*!
  * Bootstrap updatewith.js v4.3.1 (https://getbootstrap.com/)
  * Copyright 2011-2020 The Bootstrap Authors (https://github.com/twbs/bootstrap/graphs/contributors)
  * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
  */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('jquery'), require('./util.js')) :
  typeof define === 'function' && define.amd ? define(['jquery', './util.js'], factory) :
  (global = global || self, global.UpdateWith = factory(global.jQuery, global.Util));
}(this, function ($$1, Util) { 'use strict';

  $$1 = $$1 && $$1.hasOwnProperty('default') ? $$1['default'] : $$1;
  Util = Util && Util.hasOwnProperty('default') ? Util['default'] : Util;

  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
  }

  function _defineProperty(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    } else {
      obj[key] = value;
    }

    return obj;
  }

  function _objectSpread(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i] != null ? arguments[i] : {};
      var ownKeys = Object.keys(source);

      if (typeof Object.getOwnPropertySymbols === 'function') {
        ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) {
          return Object.getOwnPropertyDescriptor(source, sym).enumerable;
        }));
      }

      ownKeys.forEach(function (key) {
        _defineProperty(target, key, source[key]);
      });
    }

    return target;
  }

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

  /**
   * --------------------------------------------------------------------------
   * Bootstrap (v4.1.3): updateWith.js
   * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
   * --------------------------------------------------------------------------
   */

  var UpdateWith = function ($) {
    /**
     * ------------------------------------------------------------------------
     * Constants
     * ------------------------------------------------------------------------
     */
    var NAME = 'updateWith';
    var VERSION = '4.1.3';
    var DATA_KEY = 'lc.updateWith';
    var EVENT_KEY = "." + DATA_KEY;
    var DATA_API_KEY = '.data-api';
    var JQUERY_NO_CONFLICT = $.fn[NAME];
    var Default = {
      url: '',
      params: false,
      scrollOffset: -14,
      spinner: true,
      scrollTo: true
    };
    var DefaultType = {
      url: 'string',
      params: '(boolean|string)',
      scrollOffset: 'number',
      spinner: 'boolean',
      scrollTo: 'boolean'
    };
    var Selector = {
      DATA_TOGGLE: '[data-toggle="updateWith"]'
    };
    var Event = {
      HIDE: "hide" + EVENT_KEY,
      HIDDEN: "hidden" + EVENT_KEY,
      SHOW: "show" + EVENT_KEY,
      SHOWN: "shown" + EVENT_KEY,
      CLICK_DATA_API: "click" + EVENT_KEY + DATA_API_KEY
    };
    var ClassName = {
      FADE: 'fade',
      SHOW: 'show'
      /**
       * ------------------------------------------------------------------------
       * Class Definition
       * ------------------------------------------------------------------------
       */

    };

    var UpdateWith =
    /*#__PURE__*/
    function () {
      function UpdateWith(element, config) {
        this._config = this._getConfig(config);
        this._element = element;
        this._isShown = true;
        this.that = $("#" + element.id);

        this._ajax();
      } // Getters


      var _proto = UpdateWith.prototype;

      // Public
      _proto.toggle = function toggle(relatedTarget) {
        return this._isShown ? this.hide() : this.show(relatedTarget);
      };

      _proto.show = function show(relatedTarget) {
        if (this._isTransitioning || this._isShown) {
          return;
        }

        if ($(this._element).hasClass(ClassName.FADE)) {
          this._isTransitioning = true;
        }

        var showEvent = $.Event(Event.SHOW, {
          relatedTarget: relatedTarget
        });
        $(this._element).trigger(showEvent);

        if (this._isShown || showEvent.isDefaultPrevented()) {
          return;
        }

        this._isShown = true;
      };

      _proto.hide = function hide(event) {
        var _this = this;

        if (event) {
          event.preventDefault();
        }

        if (this._isTransitioning || !this._isShown) {
          return;
        }

        var hideEvent = $.Event(Event.HIDE);
        $(this._element).trigger(hideEvent);

        if (!this._isShown || hideEvent.isDefaultPrevented()) {
          return;
        }

        this._isShown = false;
        var transition = $(this._element).hasClass(ClassName.FADE);

        if (transition) {
          this._isTransitioning = true;
        }

        $(this._element).removeClass(ClassName.SHOW);

        if (transition) {
          var transitionDuration = Util.getTransitionDurationFromElement(this._element);
          $(this._element).one(Util.TRANSITION_END, function (event) {
            return _this._hideUpdateWith(event);
          }).emulateTransitionEnd(transitionDuration);
        } else {
          this._hideUpdateWith();
        }
      };

      _proto.dispose = function dispose() {
        $.removeData(this._element, DATA_KEY);
        $(window, document, this._element, this._backdrop).off(EVENT_KEY);
        this._config = null;
        this._element = null;
        this._isShown = null;
      } // Private
      ;

      _proto._getConfig = function _getConfig(config) {
        config = _objectSpread({}, Default, config);
        Util.typeCheckConfig(NAME, config, DefaultType);
        return config;
      };

      _proto._ajax = function _ajax() {
        var _this2 = this;

        var spinner = '<div class="col w-100 p-4"><div class="progress"><div class="progress-bar progress-bar-striped bg-secondary progress-bar-animated p-4" role="progressbar" style="width: 100%" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100"></div></div></div>';
        var scroll = 618;
        var tweak = 206;
        var now = 1;
        var elementTop = this.that.offset().top;
        var elementBottom = this.that.offset().top + this.that.outerHeight();
        var screenBottom = $(window).scrollTop() + $(window).innerHeight();
        var screenTop = $(window).scrollTop(); // Pop in the spinner

        var showSpinner = function showSpinner() {
          if (_this2._config.spinner) {
            _this2.that.hide(tweak);

            window.setTimeout(function () {
              _this2.that.html(spinner);

              _this2.that.show(tweak);

              if (screenBottom > elementTop && screenTop < elementBottom) ; else if (_this2._config.scrollTo) {
                // the spinner is not visible, give feedback and show it
                $('html').animate({
                  scrollTop: _this2.that.offset().top + _this2._config.scrollOffset
                }, scroll);
              }
            }, tweak);
          }
        };

        window.setTimeout(showSpinner, now);

        var doFetch = function doFetch() {
          var painter = function painter(text) {
            _this2.that.hide();

            _this2.that.html(text);

            _this2.that.show(tweak); // Make it visible


            if (_this2._config.scrollTo) {
              $('html').animate({
                scrollTop: _this2.that.offset().top + _this2._config.scrollOffset
              }, scroll);
            }
          };

          if (_this2._config.params !== false) {
            ajah$1.DoWithPost(painter, _this2._config.url, _this2._config.params);
          } else {
            ajah$1.DoWith(painter, _this2._config.url);
          }
        };

        window.setTimeout(doFetch, scroll);
      };

      _proto._showElement = function _showElement(relatedTarget) {
        var _this3 = this;

        var transition = $(this._element).hasClass(ClassName.FADE);

        if (!this._element.parentNode || this._element.parentNode.nodeType !== Node.ELEMENT_NODE) {
          // Don't move updateWith's DOM position
          document.body.appendChild(this._element);
        }

        this._element.style.display = 'block';

        this._element.removeAttribute('aria-hidden');

        this._element.scrollTop = 0;

        if (transition) {
          Util.reflow(this._element);
        }

        $(this._element).addClass(ClassName.SHOW);
        var shownEvent = $.Event(Event.SHOWN, {
          relatedTarget: relatedTarget
        });

        var transitionComplete = function transitionComplete() {
          _this3._isTransitioning = false;
          $(_this3._element).trigger(shownEvent);
        };

        if (transition) {
          var transitionDuration = Util.getTransitionDurationFromElement(this._element);
          $(this._dialog).one(Util.TRANSITION_END, transitionComplete).emulateTransitionEnd(transitionDuration);
        } else {
          transitionComplete();
        }
      };

      _proto._hideUpdateWith = function _hideUpdateWith() {
        this._element.style.display = 'none';

        this._element.setAttribute('aria-hidden', true);

        this._isTransitioning = false;
      } // Static
      ;

      UpdateWith._jQueryInterface = function _jQueryInterface(config, relatedTarget) {
        return this.each(function () {
          var data = $(this).data(DATA_KEY);

          var _config = _objectSpread({}, Default, $(this).data(), typeof config === 'object' && config ? config : {}); // Always start with a new object


          data = new UpdateWith(this, _config);
          $(this).data(DATA_KEY, data);

          if (typeof config === 'string') {
            if (typeof data[config] === 'undefined') {
              throw new TypeError("No method named \"" + config + "\"");
            }

            data[config](relatedTarget);
          } else if (_config.show) {
            data.show(relatedTarget);
          }
        });
      };

      _createClass(UpdateWith, null, [{
        key: "VERSION",
        get: function get() {
          return VERSION;
        }
      }, {
        key: "Default",
        get: function get() {
          return Default;
        }
      }]);

      return UpdateWith;
    }();
    /**
     * ------------------------------------------------------------------------
     * Data Api implementation
     * ------------------------------------------------------------------------
     */


    $(document).on(Event.CLICK_DATA_API, Selector.DATA_TOGGLE, function (event) {
      var _this4 = this;

      var target;
      var selector = Util.getSelectorFromElement(this);

      if (selector) {
        target = document.querySelector(selector);
      }

      var config = $(target).data(DATA_KEY) ? 'toggle' : _objectSpread({}, $(target).data(), $(this).data());

      if (this.tagName === 'A' || this.tagName === 'AREA') {
        event.preventDefault();
      }

      var $target = $(target).one(Event.SHOW, function (showEvent) {
        if (showEvent.isDefaultPrevented()) {
          // Only register focus restorer if updateWith will actually get shown
          return;
        }

        $target.one(Event.HIDDEN, function () {
          if ($(_this4).is(':visible')) {
            _this4.focus();
          }
        });
      });

      UpdateWith._jQueryInterface.call($(target), config, this);
    });
    /**
     * ------------------------------------------------------------------------
     * jQuery
     * ------------------------------------------------------------------------
     */

    $.fn[NAME] = UpdateWith._jQueryInterface;
    $.fn[NAME].Constructor = UpdateWith;

    $.fn[NAME].noConflict = function () {
      $.fn[NAME] = JQUERY_NO_CONFLICT;
      return UpdateWith._jQueryInterface;
    };

    return UpdateWith;
  }($$1);

  return UpdateWith;

}));
//# sourceMappingURL=updatewith.js.map
