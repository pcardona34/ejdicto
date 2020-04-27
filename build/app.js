(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
/*!chibi 3.0.9, Copyright 2012-2017 Kyle Barrow, released under MIT license */
(function () {
	'use strict';

	var readyfn = [],
		loadedfn = [],
		domready = false,
		pageloaded = false,
		jsonpcount = 0,
		d = document,
		w = window;

	// Fire any function calls on ready event
	function fireReady() {
		var i;
		domready = true;
		for (i = 0; i < readyfn.length; i += 1) {
			readyfn[i]();
		}
		readyfn = [];
	}

	// Fire any function calls on loaded event
	function fireLoaded() {
		var i;
		pageloaded = true;
		// For browsers with no DOM loaded support
		if (!domready) {
			fireReady();
		}
		for (i = 0; i < loadedfn.length; i += 1) {
			loadedfn[i]();
		}
		loadedfn = [];
	}

	// Check DOM ready, page loaded
	if (d.addEventListener) {
		// Standards
		d.addEventListener('DOMContentLoaded', fireReady, false);
		w.addEventListener('load', fireLoaded, false);
	} else if (d.attachEvent) {
		// IE
		d.attachEvent('onreadystatechange', fireReady);
		// IE < 9
		w.attachEvent('onload', fireLoaded);
	} else {
		// Anything else
		w.onload = fireLoaded;
	}

	// Utility functions

	// Loop through node array
	function nodeLoop(fn, nodes) {
		var i;
		// Good idea to walk up the DOM
		for (i = nodes.length - 1; i >= 0; i -= 1) {
			fn(nodes[i]);
		}
	}

	// Convert to camel case
	function cssCamel(property) {
		return property.replace(/-\w/g, function (result) {return result.charAt(1).toUpperCase(); });
	}

	// Get computed style
	function computeStyle(elm, property) {
		// IE, everything else or null
		return (elm.currentStyle) ? elm.currentStyle[cssCamel(property)] : (w.getComputedStyle) ? w.getComputedStyle(elm, null).getPropertyValue(property) : null;

	}

	// Returns URI encoded query string pair
	function queryPair(name, value) {
		return encodeURIComponent(name).replace(/%20/g, '+') + '=' + encodeURIComponent(value).replace(/%20/g, '+');
	}

	// Set CSS, important to wrap in try to prevent error thrown on unsupported property
	function setCss(elm, property, value) {
		try {
			elm.style[cssCamel(property)] = value;
		} catch (e) {
			console.error('Could not set css style property "' + property + '".');
		}
	}

	// Show CSS
	function showCss(elm) {
		elm.style.display = '';
		// For elements still hidden by style block
		if (computeStyle(elm, 'display') === 'none') {
			elm.style.display = 'block';
		}
	}

	// Serialize form & JSON values
	function serializeData(nodes) {
		var querystring = '', subelm, i, j;
		if (nodes.constructor === Object) { // Serialize JSON data
			for (subelm in nodes) {
				if (nodes.hasOwnProperty(subelm)) {
					if (nodes[subelm].constructor === Array) {
						for (i = 0; i < nodes[subelm].length; i += 1) {
							querystring += '&' + queryPair(subelm, nodes[subelm][i]);
						}
					} else {
						querystring += '&' + queryPair(subelm, nodes[subelm]);
					}
				}
			}
		} else { // Serialize node data
			nodeLoop(function (elm) {
				if (elm.nodeName === 'FORM') {
					for (i = 0; i < elm.elements.length; i += 1) {
						subelm = elm.elements[i];

						if (!subelm.disabled) {
							switch (subelm.type) {
							// Ignore buttons, unsupported XHR 1 form fields
							case 'button':
							case 'image':
							case 'file':
							case 'submit':
							case 'reset':
								break;

							case 'select-one':
								if (subelm.length > 0) {
									querystring += '&' + queryPair(subelm.name, subelm.value);
								}
								break;

							case 'select-multiple':
								for (j = 0; j < subelm.length; j += 1) {
									if (subelm[j].selected) {
										querystring += '&' + queryPair(subelm.name, subelm[j].value);
									}
								}
								break;

							case 'checkbox':
							case 'radio':
								if (subelm.checked) {
									querystring += '&' + queryPair(subelm.name, subelm.value);
								}
								break;

							// Everything else including shinny new HTML5 input types
							default:
								querystring += '&' + queryPair(subelm.name, subelm.value);
							}
						}
					}
				}
			}, nodes);
		}
		// Tidy up first &
		return (querystring.length > 0) ? querystring.substring(1) : '';
	}

	// Class helper
	function classHelper(classes, action, nodes) {
		var classarray, search, replace, i, has = false;
		if (classes) {
			// Trim any whitespace
			classarray = classes.split(/\s+/);
			nodeLoop(function (elm) {
				for (i = 0; i < classarray.length; i += 1) {
					search = new RegExp('\\b' + classarray[i] + '\\b', 'g');
					replace = new RegExp(' *' + classarray[i] + '\\b', 'g');
					if (action === 'remove') {
						elm.className = elm.className.replace(replace, '');
					} else if (action === 'toggle') {
						elm.className = (elm.className.match(search)) ? elm.className.replace(replace, '') : elm.className + ' ' + classarray[i];
					} else if (action === 'has') {
						if (elm.className.match(search)) {
							has = true;
							break;
						}
					}
				}
			}, nodes);
		}
		return has;
	}

	// HTML insertion helper
	function insertHtml(value, position, nodes) {
		var tmpnodes, tmpnode;
		if (value) {
			nodeLoop(function (elm) {
				// No insertAdjacentHTML support for FF < 8 and IE doesn't allow insertAdjacentHTML table manipulation, so use this instead
				// Convert string to node. We can't innerHTML on a document fragment
				tmpnodes = d.createElement('div');
				tmpnodes.innerHTML = value;
				while ((tmpnode = tmpnodes.lastChild) !== null) {
					// Catch error in unlikely case elm has been removed
					try {
						if (position === 'before') {
							elm.parentNode.insertBefore(tmpnode, elm);
						} else if (position === 'after') {
							elm.parentNode.insertBefore(tmpnode, elm.nextSibling);
						} else if (position === 'append') {
							elm.appendChild(tmpnode);
						} else if (position === 'prepend') {
							elm.insertBefore(tmpnode, elm.firstChild);
						}
					} catch (e) {break; }
				}
			}, nodes);
		}
	}

	// Get nodes and return chibi
	function chibi(selector) {
		var cb, nodes = [], json = false, nodelist, i;

		if (selector) {

			// Element node, would prefer to use (selector instanceof HTMLElement) but no IE support
			if (selector.nodeType && selector.nodeType === 1) {
				nodes = [selector]; // return element as node list
			} else if (typeof selector === 'object') {
				// JSON, document object or node list, would prefer to use (selector instanceof NodeList) but no IE support
				json = (typeof selector.length !== 'number');
				nodes = selector;
			} else if (typeof selector === 'string') {

				// A very light querySelectorAll polyfill for IE < 8. It suits my needs but is restricted to IE CSS support, is no speed demon, and does leave older mobile browsers in the cold (that support neither querySelectorAll nor currentStyle/getComputedStyle). If you want to use a fuller featured selector engine like Qwery, Sizzle et al, just return results to the nodes array: nodes = altselectorengine(selector)

				// IE < 8
				if (!d.querySelectorAll) {
					// Polyfill querySelectorAll
					d.querySelectorAll = function (selector) {

						var style, head = d.getElementsByTagName('head')[0], allnodes, selectednodes = [], i;

						style = d.createElement('STYLE');
						style.type = 'text/css';

						if (style.styleSheet) {
							style.styleSheet.cssText = selector + ' {a:b}';

							head.appendChild(style);

							allnodes = d.getElementsByTagName('*');

							for (i = 0; i < allnodes.length; i += 1) {
								if (computeStyle(allnodes[i], 'a') === 'b') {
									selectednodes.push(allnodes[i]);
								}
							}

							head.removeChild(style);
						}

						return selectednodes;
					};
				}

				nodelist = d.querySelectorAll(selector);

				// Convert node list to array so results have full access to array methods
				// Array.prototype.slice.call not supported in IE < 9 and often slower than loop anyway
				for (i = 0; i < nodelist.length; i += 1) {
					nodes[i] = nodelist[i];
				}

			}
		}

		// Only attach nodes if not JSON
		cb = json ? {} : nodes;

		// Public functions

		// Fire on DOM ready
		cb.ready = function (fn) {
			if (fn) {
				if (domready) {
					fn();
					return cb;
				} else {
					readyfn.push(fn);
				}
			}
		};
		// Fire on page loaded
		cb.loaded = function (fn) {
			if (fn) {
				if (pageloaded) {
					fn();
					return cb;
				} else {
					loadedfn.push(fn);
				}
			}
		};
		// Executes a function on nodes
		cb.each = function (fn) {
			if (typeof fn === 'function') {
				nodeLoop(function (elm) {
					// <= IE 8 loses scope so need to apply
					return fn.apply(elm, arguments);
				}, nodes);
			}
			return cb;
		};
		// Find first
		cb.first = function () {
			return chibi(nodes.shift());
		};
		// Find last
		cb.last = function () {
			return chibi(nodes.pop());
		};
		// Find odd
		cb.odd = function () {
			var odds = [], i;
			for (i = 0; i < nodes.length; i += 2) {
				odds.push(nodes[i]);
			}
			return chibi(odds);
		};
		// Find even
		cb.even = function () {
			var evens = [], i;
			for (i = 1; i < nodes.length; i += 2) {
				evens.push(nodes[i]);
			}
			return chibi(evens);
		};
		// Hide node
		cb.hide = function () {
			nodeLoop(function (elm) {
				elm.style.display = 'none';
			}, nodes);
			return cb;
		};
		// Show node
		cb.show = function () {
			nodeLoop(function (elm) {
				showCss(elm);
			}, nodes);
			return cb;
		};
		// Toggle node display
		cb.toggle = function () {
			nodeLoop(function (elm) {
				// computeStyle instead of style.display == 'none' catches elements that are hidden via style block
				if (computeStyle(elm, 'display') === 'none') {
					showCss(elm);
				} else {
					elm.style.display = 'none';
				}

			}, nodes);
			return cb;
		};
		// Remove node
		cb.remove = function () {
			nodeLoop(function (elm) {
				// Catch error in unlikely case elm has been removed
				try {
					elm.parentNode.removeChild(elm);
				} catch (e) {}
			}, nodes);
			return chibi();
		};
		// Get/Set CSS
		cb.css = function (property, value) {
			if (property) {
				if (value || value === '') {
					nodeLoop(function (elm) {
						setCss(elm, property, value);
					}, nodes);
					return cb;
				}
				if (nodes[0]) {
					if (nodes[0].style[cssCamel(property)]) {
						return nodes[0].style[cssCamel(property)];
					}
					if (computeStyle(nodes[0], property)) {
						return computeStyle(nodes[0], property);
					}
				}
			}
		};
		// Get class(es)
		cb.getClass = function () {
			if (nodes[0] && nodes[0].className.length > 0) {
				// Weak IE trim support
				return nodes[0].className.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '').replace(/\s+/,' ');
			}
		};
		// Set (replaces) classes
		cb.setClass = function (classes) {
			if (classes || classes === '') {
				nodeLoop(function (elm) {
					elm.className = classes;
				}, nodes);
			}
			return cb;
		};
		// Add class
		cb.addClass = function (classes) {
			if (classes) {
				nodeLoop(function (elm) {
					elm.className += ' ' + classes;
				}, nodes);
			}
			return cb;
		};
		// Remove class
		cb.removeClass = function (classes) {
			classHelper(classes, 'remove', nodes);
			return cb;
		};
		// Toggle class
		cb.toggleClass = function (classes) {
			classHelper(classes, 'toggle', nodes);
			return cb;
		};
		// Has class
		cb.hasClass = function (classes) {
			return classHelper(classes, 'has', nodes);
		};
		// Get/set HTML
		cb.html = function (value) {
			if (value || value === '') {
				nodeLoop(function (elm) {
					elm.innerHTML = value;
				}, nodes);
				return cb;
			}
			if (nodes[0]) {
				return nodes[0].innerHTML;
			}
		};
		// Insert HTML before selector
		cb.htmlBefore = function (value) {
			insertHtml(value, 'before', nodes);
			return cb;
		};
		// Insert HTML after selector
		cb.htmlAfter = function (value) {
			insertHtml(value, 'after', nodes);
			return cb;
		};
		// Insert HTML after selector innerHTML
		cb.htmlAppend = function (value) {
			insertHtml(value, 'append', nodes);
			return cb;
		};
		// Insert HTML before selector innerHTML
		cb.htmlPrepend = function (value) {
			insertHtml(value, 'prepend', nodes);
			return cb;
		};
		// Get/Set HTML attributes
		cb.attr = function (property, value) {
			if (property) {
				property = property.toLowerCase();
				// IE < 9 doesn't allow style or class via get/setAttribute so switch. cssText returns prettier CSS anyway
				if (value || value === '') {
					nodeLoop(function (elm) {
						if (property === 'style') {
							elm.style.cssText = value;
						} else if (property === 'class') {
							elm.className = value;
						} else {
							elm.setAttribute(property, value);
						}
					}, nodes);
					return cb;
				}
				if (nodes[0]) {
					if (property === 'style') {
						if (nodes[0].style.cssText) {
							return nodes[0].style.cssText;
						}
					} else if (property === 'class') {
						if (nodes[0].className) {
							return nodes[0].className;
						}
					} else {
						if (nodes[0].getAttribute(property)) {
							return nodes[0].getAttribute(property);
						}
					}
				}
			}
		};
		// Get/Set HTML data property
		cb.data = function (key, value) {
			if (key) {
				return cb.attr('data-'+key, value);
			}
		};
		// Get/Set form element values
		cb.val = function (value) {
			var values, i, j;
			if (value || value === '') {
				nodeLoop(function (elm) {
					switch (elm.nodeName) {
					case 'SELECT':
						if (typeof value === 'string' || typeof value === 'number') {
							value = [value];
						}
						for (i = 0; i < elm.length; i += 1) {
							// Multiple select
							for (j = 0; j < value.length; j += 1) {
								elm[i].selected = '';
								if (elm[i].value === value[j]) {
									elm[i].selected = 'selected';
									break;
								}
							}
						}
						break;
					case 'INPUT':
					case 'TEXTAREA':
					case 'BUTTON':
						elm.value = value;
						break;
					}
				}, nodes);

				return cb;
			}
			if (nodes[0]) {
				switch (nodes[0].nodeName) {
				case 'SELECT':
					values = [];
					for (i = 0; i < nodes[0].length; i += 1) {
						if (nodes[0][i].selected) {
							values.push(nodes[0][i].value);
						}
					}
					return (values.length > 1) ? values : values[0];
				case 'INPUT':
				case 'TEXTAREA':
				case 'BUTTON':
					return nodes[0].value;
				}
			}
		};
		// Return matching checked checkbox or radios
		cb.checked = function (check) {
			if (typeof check === 'boolean') {
				nodeLoop(function (elm) {
					if (elm.nodeName === 'INPUT' && (elm.type === 'checkbox' || elm.type === 'radio')) {
						elm.checked = check;
					}
				}, nodes);
				return cb;
			}
			if (nodes[0] && nodes[0].nodeName === 'INPUT' && (nodes[0].type === 'checkbox' || nodes[0].type === 'radio')) {
				return (!!nodes[0].checked);
			}
		};
		// Add event handler
		cb.on = function (event, fn) {
			if (selector === w || selector === d) {
				nodes = [selector];
			}
			nodeLoop(function (elm) {
				if (d.addEventListener) {
					elm.addEventListener(event, fn, false);
				} else if (d.attachEvent) {
					// <= IE 8 loses scope so need to apply, we add this to object so we can detach later (can't detach anonymous functions)
					elm[event + fn] =  function () { return fn.apply(elm, arguments); };
					elm.attachEvent('on' + event, elm[event + fn]);
				}
			}, nodes);
			return cb;
		};
		// Remove event handler
		cb.off = function (event, fn) {
			if (selector === w || selector === d) {
				nodes = [selector];
			}
			nodeLoop(function (elm) {
				if (d.addEventListener) {
					elm.removeEventListener(event, fn, false);
				} else if (d.attachEvent) {
					elm.detachEvent('on' + event, elm[event + fn]);
					// Tidy up
					elm[event + fn] = null;
				}
			}, nodes);
			return cb;
		};
		// Basic XHR 1, no file support. Shakes fist at IE
		cb.ajax = function (url, method, callback, nocache, nojsonp) {
			var xhr,
				query = serializeData(nodes),
				type = (method) ? method.toUpperCase() : 'GET',
				hostsearch = new RegExp('http[s]?://(.*?)/', 'gi'),
				domain = hostsearch.exec(url),
				timestamp = '_ts=' + (+new Date()),
				head = d.getElementsByTagName('head')[0],
				jsonpcallback = 'chibi' + (+new Date()) + (jsonpcount += 1),
				script;

			if (query && (type === 'GET' || type === 'DELETE')) {
				url += (url.indexOf('?') === -1) ? '?' + query : '&' + query;
				query = null;
			}

			// JSONP if cross domain url
			if (type === 'GET' && !nojsonp && domain && w.location.host !== domain[1]) {

				if (nocache) {
					url += (url.indexOf('?') === -1) ? '?' + timestamp : '&' + timestamp;
				}

				// Replace possible encoded ?
				url = url.replace('=%3F', '=?');

				// Replace jsonp ? with callback
				if (callback && url.indexOf('=?') !== -1) {

					url = url.replace('=?', '=' + jsonpcallback);

					w[jsonpcallback] = function (data) {
						try {
							callback(data, 200);
						} catch (e) {}

						// Tidy up
						w[jsonpcallback] = undefined;
					};
				}

				// JSONP
				script = document.createElement('script');
				script.async = true;
				script.src = url;

				// Tidy up
				script.onload = function () {
					head.removeChild(script);
				};

				head.appendChild(script);

			} else {

				if (w.XMLHttpRequest) {
					xhr = new XMLHttpRequest();
				} else if (w.ActiveXObject) {
					xhr = new ActiveXObject('Microsoft.XMLHTTP'); // IE < 9
				}

				if (xhr) {

					if (nocache) {
						url += (url.indexOf('?') === -1) ? '?' + timestamp : '&' + timestamp;
					}

					// Douglas Crockford: "Synchronous programming is disrespectful and should not be employed in applications which are used by people"
					xhr.open(type, url, true);

					xhr.onreadystatechange = function () {
						if (xhr.readyState === 4) {
							if (callback) {
								callback(xhr.responseText, xhr.status);
							}
						}
					};

					xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

					if (type === 'POST' || type === 'PUT') {
						xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
					}

					xhr.send(query);

				}
			}
			return cb;
		};
		// Alias to cb.ajax(url, 'get', callback, nocache, nojsonp)
		cb.get = function (url, callback, nocache, nojsonp) {
			return cb.ajax(url, 'get', callback, nocache, nojsonp);
		};
		// Alias to cb.ajax(url, 'post', callback, nocache)
		cb.post = function (url, callback, nocache) {
			return cb.ajax(url, 'post', callback, nocache);
		};

		return cb;
	}

	// Set Chibi's global namespace here ($)
	w.$ = chibi;

}());

},{}],2:[function(require,module,exports){
'use strict';

exports.__esModule = true;
// istanbul ignore next

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

// istanbul ignore next

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

var _handlebarsBase = require('./handlebars/base');

var base = _interopRequireWildcard(_handlebarsBase);

// Each of these augment the Handlebars object. No need to setup here.
// (This is done to easily share code between commonjs and browse envs)

var _handlebarsSafeString = require('./handlebars/safe-string');

var _handlebarsSafeString2 = _interopRequireDefault(_handlebarsSafeString);

var _handlebarsException = require('./handlebars/exception');

var _handlebarsException2 = _interopRequireDefault(_handlebarsException);

var _handlebarsUtils = require('./handlebars/utils');

var Utils = _interopRequireWildcard(_handlebarsUtils);

var _handlebarsRuntime = require('./handlebars/runtime');

var runtime = _interopRequireWildcard(_handlebarsRuntime);

var _handlebarsNoConflict = require('./handlebars/no-conflict');

var _handlebarsNoConflict2 = _interopRequireDefault(_handlebarsNoConflict);

// For compatibility and usage outside of module systems, make the Handlebars object a namespace
function create() {
  var hb = new base.HandlebarsEnvironment();

  Utils.extend(hb, base);
  hb.SafeString = _handlebarsSafeString2['default'];
  hb.Exception = _handlebarsException2['default'];
  hb.Utils = Utils;
  hb.escapeExpression = Utils.escapeExpression;

  hb.VM = runtime;
  hb.template = function (spec) {
    return runtime.template(spec, hb);
  };

  return hb;
}

var inst = create();
inst.create = create;

_handlebarsNoConflict2['default'](inst);

inst['default'] = inst;

exports['default'] = inst;
module.exports = exports['default'];


},{"./handlebars/base":3,"./handlebars/exception":6,"./handlebars/no-conflict":19,"./handlebars/runtime":20,"./handlebars/safe-string":21,"./handlebars/utils":22}],3:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports.HandlebarsEnvironment = HandlebarsEnvironment;
// istanbul ignore next

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _utils = require('./utils');

var _exception = require('./exception');

var _exception2 = _interopRequireDefault(_exception);

var _helpers = require('./helpers');

var _decorators = require('./decorators');

var _logger = require('./logger');

var _logger2 = _interopRequireDefault(_logger);

var _internalProtoAccess = require('./internal/proto-access');

var VERSION = '4.7.6';
exports.VERSION = VERSION;
var COMPILER_REVISION = 8;
exports.COMPILER_REVISION = COMPILER_REVISION;
var LAST_COMPATIBLE_COMPILER_REVISION = 7;

exports.LAST_COMPATIBLE_COMPILER_REVISION = LAST_COMPATIBLE_COMPILER_REVISION;
var REVISION_CHANGES = {
  1: '<= 1.0.rc.2', // 1.0.rc.2 is actually rev2 but doesn't report it
  2: '== 1.0.0-rc.3',
  3: '== 1.0.0-rc.4',
  4: '== 1.x.x',
  5: '== 2.0.0-alpha.x',
  6: '>= 2.0.0-beta.1',
  7: '>= 4.0.0 <4.3.0',
  8: '>= 4.3.0'
};

exports.REVISION_CHANGES = REVISION_CHANGES;
var objectType = '[object Object]';

function HandlebarsEnvironment(helpers, partials, decorators) {
  this.helpers = helpers || {};
  this.partials = partials || {};
  this.decorators = decorators || {};

  _helpers.registerDefaultHelpers(this);
  _decorators.registerDefaultDecorators(this);
}

HandlebarsEnvironment.prototype = {
  constructor: HandlebarsEnvironment,

  logger: _logger2['default'],
  log: _logger2['default'].log,

  registerHelper: function registerHelper(name, fn) {
    if (_utils.toString.call(name) === objectType) {
      if (fn) {
        throw new _exception2['default']('Arg not supported with multiple helpers');
      }
      _utils.extend(this.helpers, name);
    } else {
      this.helpers[name] = fn;
    }
  },
  unregisterHelper: function unregisterHelper(name) {
    delete this.helpers[name];
  },

  registerPartial: function registerPartial(name, partial) {
    if (_utils.toString.call(name) === objectType) {
      _utils.extend(this.partials, name);
    } else {
      if (typeof partial === 'undefined') {
        throw new _exception2['default']('Attempting to register a partial called "' + name + '" as undefined');
      }
      this.partials[name] = partial;
    }
  },
  unregisterPartial: function unregisterPartial(name) {
    delete this.partials[name];
  },

  registerDecorator: function registerDecorator(name, fn) {
    if (_utils.toString.call(name) === objectType) {
      if (fn) {
        throw new _exception2['default']('Arg not supported with multiple decorators');
      }
      _utils.extend(this.decorators, name);
    } else {
      this.decorators[name] = fn;
    }
  },
  unregisterDecorator: function unregisterDecorator(name) {
    delete this.decorators[name];
  },
  /**
   * Reset the memory of illegal property accesses that have already been logged.
   * @deprecated should only be used in handlebars test-cases
   */
  resetLoggedPropertyAccesses: function resetLoggedPropertyAccesses() {
    _internalProtoAccess.resetLoggedProperties();
  }
};

var log = _logger2['default'].log;

exports.log = log;
exports.createFrame = _utils.createFrame;
exports.logger = _logger2['default'];


},{"./decorators":4,"./exception":6,"./helpers":7,"./internal/proto-access":16,"./logger":18,"./utils":22}],4:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports.registerDefaultDecorators = registerDefaultDecorators;
// istanbul ignore next

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _decoratorsInline = require('./decorators/inline');

var _decoratorsInline2 = _interopRequireDefault(_decoratorsInline);

function registerDefaultDecorators(instance) {
  _decoratorsInline2['default'](instance);
}


},{"./decorators/inline":5}],5:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _utils = require('../utils');

exports['default'] = function (instance) {
  instance.registerDecorator('inline', function (fn, props, container, options) {
    var ret = fn;
    if (!props.partials) {
      props.partials = {};
      ret = function (context, options) {
        // Create a new partials stack frame prior to exec.
        var original = container.partials;
        container.partials = _utils.extend({}, original, props.partials);
        var ret = fn(context, options);
        container.partials = original;
        return ret;
      };
    }

    props.partials[options.args[0]] = options.fn;

    return ret;
  });
};

module.exports = exports['default'];


},{"../utils":22}],6:[function(require,module,exports){
'use strict';

exports.__esModule = true;
var errorProps = ['description', 'fileName', 'lineNumber', 'endLineNumber', 'message', 'name', 'number', 'stack'];

function Exception(message, node) {
  var loc = node && node.loc,
      line = undefined,
      endLineNumber = undefined,
      column = undefined,
      endColumn = undefined;

  if (loc) {
    line = loc.start.line;
    endLineNumber = loc.end.line;
    column = loc.start.column;
    endColumn = loc.end.column;

    message += ' - ' + line + ':' + column;
  }

  var tmp = Error.prototype.constructor.call(this, message);

  // Unfortunately errors are not enumerable in Chrome (at least), so `for prop in tmp` doesn't work.
  for (var idx = 0; idx < errorProps.length; idx++) {
    this[errorProps[idx]] = tmp[errorProps[idx]];
  }

  /* istanbul ignore else */
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, Exception);
  }

  try {
    if (loc) {
      this.lineNumber = line;
      this.endLineNumber = endLineNumber;

      // Work around issue under safari where we can't directly set the column value
      /* istanbul ignore next */
      if (Object.defineProperty) {
        Object.defineProperty(this, 'column', {
          value: column,
          enumerable: true
        });
        Object.defineProperty(this, 'endColumn', {
          value: endColumn,
          enumerable: true
        });
      } else {
        this.column = column;
        this.endColumn = endColumn;
      }
    }
  } catch (nop) {
    /* Ignore if the browser is very particular */
  }
}

Exception.prototype = new Error();

exports['default'] = Exception;
module.exports = exports['default'];


},{}],7:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports.registerDefaultHelpers = registerDefaultHelpers;
exports.moveHelperToHooks = moveHelperToHooks;
// istanbul ignore next

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _helpersBlockHelperMissing = require('./helpers/block-helper-missing');

var _helpersBlockHelperMissing2 = _interopRequireDefault(_helpersBlockHelperMissing);

var _helpersEach = require('./helpers/each');

var _helpersEach2 = _interopRequireDefault(_helpersEach);

var _helpersHelperMissing = require('./helpers/helper-missing');

var _helpersHelperMissing2 = _interopRequireDefault(_helpersHelperMissing);

var _helpersIf = require('./helpers/if');

var _helpersIf2 = _interopRequireDefault(_helpersIf);

var _helpersLog = require('./helpers/log');

var _helpersLog2 = _interopRequireDefault(_helpersLog);

var _helpersLookup = require('./helpers/lookup');

var _helpersLookup2 = _interopRequireDefault(_helpersLookup);

var _helpersWith = require('./helpers/with');

var _helpersWith2 = _interopRequireDefault(_helpersWith);

function registerDefaultHelpers(instance) {
  _helpersBlockHelperMissing2['default'](instance);
  _helpersEach2['default'](instance);
  _helpersHelperMissing2['default'](instance);
  _helpersIf2['default'](instance);
  _helpersLog2['default'](instance);
  _helpersLookup2['default'](instance);
  _helpersWith2['default'](instance);
}

function moveHelperToHooks(instance, helperName, keepHelper) {
  if (instance.helpers[helperName]) {
    instance.hooks[helperName] = instance.helpers[helperName];
    if (!keepHelper) {
      delete instance.helpers[helperName];
    }
  }
}


},{"./helpers/block-helper-missing":8,"./helpers/each":9,"./helpers/helper-missing":10,"./helpers/if":11,"./helpers/log":12,"./helpers/lookup":13,"./helpers/with":14}],8:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _utils = require('../utils');

exports['default'] = function (instance) {
  instance.registerHelper('blockHelperMissing', function (context, options) {
    var inverse = options.inverse,
        fn = options.fn;

    if (context === true) {
      return fn(this);
    } else if (context === false || context == null) {
      return inverse(this);
    } else if (_utils.isArray(context)) {
      if (context.length > 0) {
        if (options.ids) {
          options.ids = [options.name];
        }

        return instance.helpers.each(context, options);
      } else {
        return inverse(this);
      }
    } else {
      if (options.data && options.ids) {
        var data = _utils.createFrame(options.data);
        data.contextPath = _utils.appendContextPath(options.data.contextPath, options.name);
        options = { data: data };
      }

      return fn(context, options);
    }
  });
};

module.exports = exports['default'];


},{"../utils":22}],9:[function(require,module,exports){
(function (global){
'use strict';

exports.__esModule = true;
// istanbul ignore next

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _utils = require('../utils');

var _exception = require('../exception');

var _exception2 = _interopRequireDefault(_exception);

exports['default'] = function (instance) {
  instance.registerHelper('each', function (context, options) {
    if (!options) {
      throw new _exception2['default']('Must pass iterator to #each');
    }

    var fn = options.fn,
        inverse = options.inverse,
        i = 0,
        ret = '',
        data = undefined,
        contextPath = undefined;

    if (options.data && options.ids) {
      contextPath = _utils.appendContextPath(options.data.contextPath, options.ids[0]) + '.';
    }

    if (_utils.isFunction(context)) {
      context = context.call(this);
    }

    if (options.data) {
      data = _utils.createFrame(options.data);
    }

    function execIteration(field, index, last) {
      if (data) {
        data.key = field;
        data.index = index;
        data.first = index === 0;
        data.last = !!last;

        if (contextPath) {
          data.contextPath = contextPath + field;
        }
      }

      ret = ret + fn(context[field], {
        data: data,
        blockParams: _utils.blockParams([context[field], field], [contextPath + field, null])
      });
    }

    if (context && typeof context === 'object') {
      if (_utils.isArray(context)) {
        for (var j = context.length; i < j; i++) {
          if (i in context) {
            execIteration(i, i, i === context.length - 1);
          }
        }
      } else if (global.Symbol && context[global.Symbol.iterator]) {
        var newContext = [];
        var iterator = context[global.Symbol.iterator]();
        for (var it = iterator.next(); !it.done; it = iterator.next()) {
          newContext.push(it.value);
        }
        context = newContext;
        for (var j = context.length; i < j; i++) {
          execIteration(i, i, i === context.length - 1);
        }
      } else {
        (function () {
          var priorKey = undefined;

          Object.keys(context).forEach(function (key) {
            // We're running the iterations one step out of sync so we can detect
            // the last iteration without have to scan the object twice and create
            // an itermediate keys array.
            if (priorKey !== undefined) {
              execIteration(priorKey, i - 1);
            }
            priorKey = key;
            i++;
          });
          if (priorKey !== undefined) {
            execIteration(priorKey, i - 1, true);
          }
        })();
      }
    }

    if (i === 0) {
      ret = inverse(this);
    }

    return ret;
  });
};

module.exports = exports['default'];


}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../exception":6,"../utils":22}],10:[function(require,module,exports){
'use strict';

exports.__esModule = true;
// istanbul ignore next

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _exception = require('../exception');

var _exception2 = _interopRequireDefault(_exception);

exports['default'] = function (instance) {
  instance.registerHelper('helperMissing', function () /* [args, ]options */{
    if (arguments.length === 1) {
      // A missing field in a {{foo}} construct.
      return undefined;
    } else {
      // Someone is actually trying to call something, blow up.
      throw new _exception2['default']('Missing helper: "' + arguments[arguments.length - 1].name + '"');
    }
  });
};

module.exports = exports['default'];


},{"../exception":6}],11:[function(require,module,exports){
'use strict';

exports.__esModule = true;
// istanbul ignore next

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _utils = require('../utils');

var _exception = require('../exception');

var _exception2 = _interopRequireDefault(_exception);

exports['default'] = function (instance) {
  instance.registerHelper('if', function (conditional, options) {
    if (arguments.length != 2) {
      throw new _exception2['default']('#if requires exactly one argument');
    }
    if (_utils.isFunction(conditional)) {
      conditional = conditional.call(this);
    }

    // Default behavior is to render the positive path if the value is truthy and not empty.
    // The `includeZero` option may be set to treat the condtional as purely not empty based on the
    // behavior of isEmpty. Effectively this determines if 0 is handled by the positive path or negative.
    if (!options.hash.includeZero && !conditional || _utils.isEmpty(conditional)) {
      return options.inverse(this);
    } else {
      return options.fn(this);
    }
  });

  instance.registerHelper('unless', function (conditional, options) {
    if (arguments.length != 2) {
      throw new _exception2['default']('#unless requires exactly one argument');
    }
    return instance.helpers['if'].call(this, conditional, {
      fn: options.inverse,
      inverse: options.fn,
      hash: options.hash
    });
  });
};

module.exports = exports['default'];


},{"../exception":6,"../utils":22}],12:[function(require,module,exports){
'use strict';

exports.__esModule = true;

exports['default'] = function (instance) {
  instance.registerHelper('log', function () /* message, options */{
    var args = [undefined],
        options = arguments[arguments.length - 1];
    for (var i = 0; i < arguments.length - 1; i++) {
      args.push(arguments[i]);
    }

    var level = 1;
    if (options.hash.level != null) {
      level = options.hash.level;
    } else if (options.data && options.data.level != null) {
      level = options.data.level;
    }
    args[0] = level;

    instance.log.apply(instance, args);
  });
};

module.exports = exports['default'];


},{}],13:[function(require,module,exports){
'use strict';

exports.__esModule = true;

exports['default'] = function (instance) {
  instance.registerHelper('lookup', function (obj, field, options) {
    if (!obj) {
      // Note for 5.0: Change to "obj == null" in 5.0
      return obj;
    }
    return options.lookupProperty(obj, field);
  });
};

module.exports = exports['default'];


},{}],14:[function(require,module,exports){
'use strict';

exports.__esModule = true;
// istanbul ignore next

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _utils = require('../utils');

var _exception = require('../exception');

var _exception2 = _interopRequireDefault(_exception);

exports['default'] = function (instance) {
  instance.registerHelper('with', function (context, options) {
    if (arguments.length != 2) {
      throw new _exception2['default']('#with requires exactly one argument');
    }
    if (_utils.isFunction(context)) {
      context = context.call(this);
    }

    var fn = options.fn;

    if (!_utils.isEmpty(context)) {
      var data = options.data;
      if (options.data && options.ids) {
        data = _utils.createFrame(options.data);
        data.contextPath = _utils.appendContextPath(options.data.contextPath, options.ids[0]);
      }

      return fn(context, {
        data: data,
        blockParams: _utils.blockParams([context], [data && data.contextPath])
      });
    } else {
      return options.inverse(this);
    }
  });
};

module.exports = exports['default'];


},{"../exception":6,"../utils":22}],15:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports.createNewLookupObject = createNewLookupObject;

var _utils = require('../utils');

/**
 * Create a new object with "null"-prototype to avoid truthy results on prototype properties.
 * The resulting object can be used with "object[property]" to check if a property exists
 * @param {...object} sources a varargs parameter of source objects that will be merged
 * @returns {object}
 */

function createNewLookupObject() {
  for (var _len = arguments.length, sources = Array(_len), _key = 0; _key < _len; _key++) {
    sources[_key] = arguments[_key];
  }

  return _utils.extend.apply(undefined, [Object.create(null)].concat(sources));
}


},{"../utils":22}],16:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports.createProtoAccessControl = createProtoAccessControl;
exports.resultIsAllowed = resultIsAllowed;
exports.resetLoggedProperties = resetLoggedProperties;
// istanbul ignore next

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

var _createNewLookupObject = require('./create-new-lookup-object');

var _logger = require('../logger');

var logger = _interopRequireWildcard(_logger);

var loggedProperties = Object.create(null);

function createProtoAccessControl(runtimeOptions) {
  var defaultMethodWhiteList = Object.create(null);
  defaultMethodWhiteList['constructor'] = false;
  defaultMethodWhiteList['__defineGetter__'] = false;
  defaultMethodWhiteList['__defineSetter__'] = false;
  defaultMethodWhiteList['__lookupGetter__'] = false;

  var defaultPropertyWhiteList = Object.create(null);
  // eslint-disable-next-line no-proto
  defaultPropertyWhiteList['__proto__'] = false;

  return {
    properties: {
      whitelist: _createNewLookupObject.createNewLookupObject(defaultPropertyWhiteList, runtimeOptions.allowedProtoProperties),
      defaultValue: runtimeOptions.allowProtoPropertiesByDefault
    },
    methods: {
      whitelist: _createNewLookupObject.createNewLookupObject(defaultMethodWhiteList, runtimeOptions.allowedProtoMethods),
      defaultValue: runtimeOptions.allowProtoMethodsByDefault
    }
  };
}

function resultIsAllowed(result, protoAccessControl, propertyName) {
  if (typeof result === 'function') {
    return checkWhiteList(protoAccessControl.methods, propertyName);
  } else {
    return checkWhiteList(protoAccessControl.properties, propertyName);
  }
}

function checkWhiteList(protoAccessControlForType, propertyName) {
  if (protoAccessControlForType.whitelist[propertyName] !== undefined) {
    return protoAccessControlForType.whitelist[propertyName] === true;
  }
  if (protoAccessControlForType.defaultValue !== undefined) {
    return protoAccessControlForType.defaultValue;
  }
  logUnexpecedPropertyAccessOnce(propertyName);
  return false;
}

function logUnexpecedPropertyAccessOnce(propertyName) {
  if (loggedProperties[propertyName] !== true) {
    loggedProperties[propertyName] = true;
    logger.log('error', 'Handlebars: Access has been denied to resolve the property "' + propertyName + '" because it is not an "own property" of its parent.\n' + 'You can add a runtime option to disable the check or this warning:\n' + 'See https://handlebarsjs.com/api-reference/runtime-options.html#options-to-control-prototype-access for details');
  }
}

function resetLoggedProperties() {
  Object.keys(loggedProperties).forEach(function (propertyName) {
    delete loggedProperties[propertyName];
  });
}


},{"../logger":18,"./create-new-lookup-object":15}],17:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports.wrapHelper = wrapHelper;

function wrapHelper(helper, transformOptionsFn) {
  if (typeof helper !== 'function') {
    // This should not happen, but apparently it does in https://github.com/wycats/handlebars.js/issues/1639
    // We try to make the wrapper least-invasive by not wrapping it, if the helper is not a function.
    return helper;
  }
  var wrapper = function wrapper() /* dynamic arguments */{
    var options = arguments[arguments.length - 1];
    arguments[arguments.length - 1] = transformOptionsFn(options);
    return helper.apply(this, arguments);
  };
  return wrapper;
}


},{}],18:[function(require,module,exports){
'use strict';

exports.__esModule = true;

var _utils = require('./utils');

var logger = {
  methodMap: ['debug', 'info', 'warn', 'error'],
  level: 'info',

  // Maps a given level value to the `methodMap` indexes above.
  lookupLevel: function lookupLevel(level) {
    if (typeof level === 'string') {
      var levelMap = _utils.indexOf(logger.methodMap, level.toLowerCase());
      if (levelMap >= 0) {
        level = levelMap;
      } else {
        level = parseInt(level, 10);
      }
    }

    return level;
  },

  // Can be overridden in the host environment
  log: function log(level) {
    level = logger.lookupLevel(level);

    if (typeof console !== 'undefined' && logger.lookupLevel(logger.level) <= level) {
      var method = logger.methodMap[level];
      // eslint-disable-next-line no-console
      if (!console[method]) {
        method = 'log';
      }

      for (var _len = arguments.length, message = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        message[_key - 1] = arguments[_key];
      }

      console[method].apply(console, message); // eslint-disable-line no-console
    }
  }
};

exports['default'] = logger;
module.exports = exports['default'];


},{"./utils":22}],19:[function(require,module,exports){
(function (global){
'use strict';

exports.__esModule = true;

exports['default'] = function (Handlebars) {
  /* istanbul ignore next */
  var root = typeof global !== 'undefined' ? global : window,
      $Handlebars = root.Handlebars;
  /* istanbul ignore next */
  Handlebars.noConflict = function () {
    if (root.Handlebars === Handlebars) {
      root.Handlebars = $Handlebars;
    }
    return Handlebars;
  };
};

module.exports = exports['default'];


}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],20:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports.checkRevision = checkRevision;
exports.template = template;
exports.wrapProgram = wrapProgram;
exports.resolvePartial = resolvePartial;
exports.invokePartial = invokePartial;
exports.noop = noop;
// istanbul ignore next

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

// istanbul ignore next

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

var _utils = require('./utils');

var Utils = _interopRequireWildcard(_utils);

var _exception = require('./exception');

var _exception2 = _interopRequireDefault(_exception);

var _base = require('./base');

var _helpers = require('./helpers');

var _internalWrapHelper = require('./internal/wrapHelper');

var _internalProtoAccess = require('./internal/proto-access');

function checkRevision(compilerInfo) {
  var compilerRevision = compilerInfo && compilerInfo[0] || 1,
      currentRevision = _base.COMPILER_REVISION;

  if (compilerRevision >= _base.LAST_COMPATIBLE_COMPILER_REVISION && compilerRevision <= _base.COMPILER_REVISION) {
    return;
  }

  if (compilerRevision < _base.LAST_COMPATIBLE_COMPILER_REVISION) {
    var runtimeVersions = _base.REVISION_CHANGES[currentRevision],
        compilerVersions = _base.REVISION_CHANGES[compilerRevision];
    throw new _exception2['default']('Template was precompiled with an older version of Handlebars than the current runtime. ' + 'Please update your precompiler to a newer version (' + runtimeVersions + ') or downgrade your runtime to an older version (' + compilerVersions + ').');
  } else {
    // Use the embedded version info since the runtime doesn't know about this revision yet
    throw new _exception2['default']('Template was precompiled with a newer version of Handlebars than the current runtime. ' + 'Please update your runtime to a newer version (' + compilerInfo[1] + ').');
  }
}

function template(templateSpec, env) {
  /* istanbul ignore next */
  if (!env) {
    throw new _exception2['default']('No environment passed to template');
  }
  if (!templateSpec || !templateSpec.main) {
    throw new _exception2['default']('Unknown template object: ' + typeof templateSpec);
  }

  templateSpec.main.decorator = templateSpec.main_d;

  // Note: Using env.VM references rather than local var references throughout this section to allow
  // for external users to override these as pseudo-supported APIs.
  env.VM.checkRevision(templateSpec.compiler);

  // backwards compatibility for precompiled templates with compiler-version 7 (<4.3.0)
  var templateWasPrecompiledWithCompilerV7 = templateSpec.compiler && templateSpec.compiler[0] === 7;

  function invokePartialWrapper(partial, context, options) {
    if (options.hash) {
      context = Utils.extend({}, context, options.hash);
      if (options.ids) {
        options.ids[0] = true;
      }
    }
    partial = env.VM.resolvePartial.call(this, partial, context, options);

    var extendedOptions = Utils.extend({}, options, {
      hooks: this.hooks,
      protoAccessControl: this.protoAccessControl
    });

    var result = env.VM.invokePartial.call(this, partial, context, extendedOptions);

    if (result == null && env.compile) {
      options.partials[options.name] = env.compile(partial, templateSpec.compilerOptions, env);
      result = options.partials[options.name](context, extendedOptions);
    }
    if (result != null) {
      if (options.indent) {
        var lines = result.split('\n');
        for (var i = 0, l = lines.length; i < l; i++) {
          if (!lines[i] && i + 1 === l) {
            break;
          }

          lines[i] = options.indent + lines[i];
        }
        result = lines.join('\n');
      }
      return result;
    } else {
      throw new _exception2['default']('The partial ' + options.name + ' could not be compiled when running in runtime-only mode');
    }
  }

  // Just add water
  var container = {
    strict: function strict(obj, name, loc) {
      if (!obj || !(name in obj)) {
        throw new _exception2['default']('"' + name + '" not defined in ' + obj, {
          loc: loc
        });
      }
      return obj[name];
    },
    lookupProperty: function lookupProperty(parent, propertyName) {
      var result = parent[propertyName];
      if (result == null) {
        return result;
      }
      if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
        return result;
      }

      if (_internalProtoAccess.resultIsAllowed(result, container.protoAccessControl, propertyName)) {
        return result;
      }
      return undefined;
    },
    lookup: function lookup(depths, name) {
      var len = depths.length;
      for (var i = 0; i < len; i++) {
        var result = depths[i] && container.lookupProperty(depths[i], name);
        if (result != null) {
          return depths[i][name];
        }
      }
    },
    lambda: function lambda(current, context) {
      return typeof current === 'function' ? current.call(context) : current;
    },

    escapeExpression: Utils.escapeExpression,
    invokePartial: invokePartialWrapper,

    fn: function fn(i) {
      var ret = templateSpec[i];
      ret.decorator = templateSpec[i + '_d'];
      return ret;
    },

    programs: [],
    program: function program(i, data, declaredBlockParams, blockParams, depths) {
      var programWrapper = this.programs[i],
          fn = this.fn(i);
      if (data || depths || blockParams || declaredBlockParams) {
        programWrapper = wrapProgram(this, i, fn, data, declaredBlockParams, blockParams, depths);
      } else if (!programWrapper) {
        programWrapper = this.programs[i] = wrapProgram(this, i, fn);
      }
      return programWrapper;
    },

    data: function data(value, depth) {
      while (value && depth--) {
        value = value._parent;
      }
      return value;
    },
    mergeIfNeeded: function mergeIfNeeded(param, common) {
      var obj = param || common;

      if (param && common && param !== common) {
        obj = Utils.extend({}, common, param);
      }

      return obj;
    },
    // An empty object to use as replacement for null-contexts
    nullContext: Object.seal({}),

    noop: env.VM.noop,
    compilerInfo: templateSpec.compiler
  };

  function ret(context) {
    var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    var data = options.data;

    ret._setup(options);
    if (!options.partial && templateSpec.useData) {
      data = initData(context, data);
    }
    var depths = undefined,
        blockParams = templateSpec.useBlockParams ? [] : undefined;
    if (templateSpec.useDepths) {
      if (options.depths) {
        depths = context != options.depths[0] ? [context].concat(options.depths) : options.depths;
      } else {
        depths = [context];
      }
    }

    function main(context /*, options*/) {
      return '' + templateSpec.main(container, context, container.helpers, container.partials, data, blockParams, depths);
    }

    main = executeDecorators(templateSpec.main, main, container, options.depths || [], data, blockParams);
    return main(context, options);
  }

  ret.isTop = true;

  ret._setup = function (options) {
    if (!options.partial) {
      var mergedHelpers = Utils.extend({}, env.helpers, options.helpers);
      wrapHelpersToPassLookupProperty(mergedHelpers, container);
      container.helpers = mergedHelpers;

      if (templateSpec.usePartial) {
        // Use mergeIfNeeded here to prevent compiling global partials multiple times
        container.partials = container.mergeIfNeeded(options.partials, env.partials);
      }
      if (templateSpec.usePartial || templateSpec.useDecorators) {
        container.decorators = Utils.extend({}, env.decorators, options.decorators);
      }

      container.hooks = {};
      container.protoAccessControl = _internalProtoAccess.createProtoAccessControl(options);

      var keepHelperInHelpers = options.allowCallsToHelperMissing || templateWasPrecompiledWithCompilerV7;
      _helpers.moveHelperToHooks(container, 'helperMissing', keepHelperInHelpers);
      _helpers.moveHelperToHooks(container, 'blockHelperMissing', keepHelperInHelpers);
    } else {
      container.protoAccessControl = options.protoAccessControl; // internal option
      container.helpers = options.helpers;
      container.partials = options.partials;
      container.decorators = options.decorators;
      container.hooks = options.hooks;
    }
  };

  ret._child = function (i, data, blockParams, depths) {
    if (templateSpec.useBlockParams && !blockParams) {
      throw new _exception2['default']('must pass block params');
    }
    if (templateSpec.useDepths && !depths) {
      throw new _exception2['default']('must pass parent depths');
    }

    return wrapProgram(container, i, templateSpec[i], data, 0, blockParams, depths);
  };
  return ret;
}

function wrapProgram(container, i, fn, data, declaredBlockParams, blockParams, depths) {
  function prog(context) {
    var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    var currentDepths = depths;
    if (depths && context != depths[0] && !(context === container.nullContext && depths[0] === null)) {
      currentDepths = [context].concat(depths);
    }

    return fn(container, context, container.helpers, container.partials, options.data || data, blockParams && [options.blockParams].concat(blockParams), currentDepths);
  }

  prog = executeDecorators(fn, prog, container, depths, data, blockParams);

  prog.program = i;
  prog.depth = depths ? depths.length : 0;
  prog.blockParams = declaredBlockParams || 0;
  return prog;
}

/**
 * This is currently part of the official API, therefore implementation details should not be changed.
 */

function resolvePartial(partial, context, options) {
  if (!partial) {
    if (options.name === '@partial-block') {
      partial = options.data['partial-block'];
    } else {
      partial = options.partials[options.name];
    }
  } else if (!partial.call && !options.name) {
    // This is a dynamic partial that returned a string
    options.name = partial;
    partial = options.partials[partial];
  }
  return partial;
}

function invokePartial(partial, context, options) {
  // Use the current closure context to save the partial-block if this partial
  var currentPartialBlock = options.data && options.data['partial-block'];
  options.partial = true;
  if (options.ids) {
    options.data.contextPath = options.ids[0] || options.data.contextPath;
  }

  var partialBlock = undefined;
  if (options.fn && options.fn !== noop) {
    (function () {
      options.data = _base.createFrame(options.data);
      // Wrapper function to get access to currentPartialBlock from the closure
      var fn = options.fn;
      partialBlock = options.data['partial-block'] = function partialBlockWrapper(context) {
        var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

        // Restore the partial-block from the closure for the execution of the block
        // i.e. the part inside the block of the partial call.
        options.data = _base.createFrame(options.data);
        options.data['partial-block'] = currentPartialBlock;
        return fn(context, options);
      };
      if (fn.partials) {
        options.partials = Utils.extend({}, options.partials, fn.partials);
      }
    })();
  }

  if (partial === undefined && partialBlock) {
    partial = partialBlock;
  }

  if (partial === undefined) {
    throw new _exception2['default']('The partial ' + options.name + ' could not be found');
  } else if (partial instanceof Function) {
    return partial(context, options);
  }
}

function noop() {
  return '';
}

function initData(context, data) {
  if (!data || !('root' in data)) {
    data = data ? _base.createFrame(data) : {};
    data.root = context;
  }
  return data;
}

function executeDecorators(fn, prog, container, depths, data, blockParams) {
  if (fn.decorator) {
    var props = {};
    prog = fn.decorator(prog, props, container, depths && depths[0], data, blockParams, depths);
    Utils.extend(prog, props);
  }
  return prog;
}

function wrapHelpersToPassLookupProperty(mergedHelpers, container) {
  Object.keys(mergedHelpers).forEach(function (helperName) {
    var helper = mergedHelpers[helperName];
    mergedHelpers[helperName] = passLookupPropertyOption(helper, container);
  });
}

function passLookupPropertyOption(helper, container) {
  var lookupProperty = container.lookupProperty;
  return _internalWrapHelper.wrapHelper(helper, function (options) {
    return Utils.extend({ lookupProperty: lookupProperty }, options);
  });
}


},{"./base":3,"./exception":6,"./helpers":7,"./internal/proto-access":16,"./internal/wrapHelper":17,"./utils":22}],21:[function(require,module,exports){
// Build out our basic SafeString type
'use strict';

exports.__esModule = true;
function SafeString(string) {
  this.string = string;
}

SafeString.prototype.toString = SafeString.prototype.toHTML = function () {
  return '' + this.string;
};

exports['default'] = SafeString;
module.exports = exports['default'];


},{}],22:[function(require,module,exports){
'use strict';

exports.__esModule = true;
exports.extend = extend;
exports.indexOf = indexOf;
exports.escapeExpression = escapeExpression;
exports.isEmpty = isEmpty;
exports.createFrame = createFrame;
exports.blockParams = blockParams;
exports.appendContextPath = appendContextPath;
var escape = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '`': '&#x60;',
  '=': '&#x3D;'
};

var badChars = /[&<>"'`=]/g,
    possible = /[&<>"'`=]/;

function escapeChar(chr) {
  return escape[chr];
}

function extend(obj /* , ...source */) {
  for (var i = 1; i < arguments.length; i++) {
    for (var key in arguments[i]) {
      if (Object.prototype.hasOwnProperty.call(arguments[i], key)) {
        obj[key] = arguments[i][key];
      }
    }
  }

  return obj;
}

var toString = Object.prototype.toString;

exports.toString = toString;
// Sourced from lodash
// https://github.com/bestiejs/lodash/blob/master/LICENSE.txt
/* eslint-disable func-style */
var isFunction = function isFunction(value) {
  return typeof value === 'function';
};
// fallback for older versions of Chrome and Safari
/* istanbul ignore next */
if (isFunction(/x/)) {
  exports.isFunction = isFunction = function (value) {
    return typeof value === 'function' && toString.call(value) === '[object Function]';
  };
}
exports.isFunction = isFunction;

/* eslint-enable func-style */

/* istanbul ignore next */
var isArray = Array.isArray || function (value) {
  return value && typeof value === 'object' ? toString.call(value) === '[object Array]' : false;
};

exports.isArray = isArray;
// Older IE versions do not directly support indexOf so we must implement our own, sadly.

function indexOf(array, value) {
  for (var i = 0, len = array.length; i < len; i++) {
    if (array[i] === value) {
      return i;
    }
  }
  return -1;
}

function escapeExpression(string) {
  if (typeof string !== 'string') {
    // don't escape SafeStrings, since they're already safe
    if (string && string.toHTML) {
      return string.toHTML();
    } else if (string == null) {
      return '';
    } else if (!string) {
      return string + '';
    }

    // Force a string conversion as this will be done by the append regardless and
    // the regex test will do this transparently behind the scenes, causing issues if
    // an object's to string has escaped characters in it.
    string = '' + string;
  }

  if (!possible.test(string)) {
    return string;
  }
  return string.replace(badChars, escapeChar);
}

function isEmpty(value) {
  if (!value && value !== 0) {
    return true;
  } else if (isArray(value) && value.length === 0) {
    return true;
  } else {
    return false;
  }
}

function createFrame(object) {
  var frame = extend({}, object);
  frame._parent = object;
  return frame;
}

function blockParams(params, ids) {
  params.path = ids;
  return params;
}

function appendContextPath(contextPath, id) {
  return (contextPath ? contextPath + '.' : '') + id;
}


},{}],23:[function(require,module,exports){
module.exports = require("handlebars/runtime")["default"];

},{"handlebars/runtime":2}],24:[function(require,module,exports){
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.Navigo = factory());
}(this, (function () { 'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function isPushStateAvailable() {
  return !!(typeof window !== 'undefined' && window.history && window.history.pushState);
}

function Navigo(r, useHash, hash) {
  this.root = null;
  this._routes = [];
  this._useHash = useHash;
  this._hash = typeof hash === 'undefined' ? '#' : hash;
  this._paused = false;
  this._destroyed = false;
  this._lastRouteResolved = null;
  this._notFoundHandler = null;
  this._defaultHandler = null;
  this._usePushState = !useHash && isPushStateAvailable();
  this._onLocationChange = this._onLocationChange.bind(this);
  this._genericHooks = null;
  this._historyAPIUpdateMethod = 'pushState';

  if (r) {
    this.root = useHash ? r.replace(/\/$/, '/' + this._hash) : r.replace(/\/$/, '');
  } else if (useHash) {
    this.root = this._cLoc().split(this._hash)[0].replace(/\/$/, '/' + this._hash);
  }

  this._listen();
  this.updatePageLinks();
}

function clean(s) {
  if (s instanceof RegExp) return s;
  return s.replace(/\/+$/, '').replace(/^\/+/, '^/');
}

function regExpResultToParams(match, names) {
  if (names.length === 0) return null;
  if (!match) return null;
  return match.slice(1, match.length).reduce(function (params, value, index) {
    if (params === null) params = {};
    params[names[index]] = decodeURIComponent(value);
    return params;
  }, null);
}

function replaceDynamicURLParts(route) {
  var paramNames = [],
      regexp;

  if (route instanceof RegExp) {
    regexp = route;
  } else {
    regexp = new RegExp(route.replace(Navigo.PARAMETER_REGEXP, function (full, dots, name) {
      paramNames.push(name);
      return Navigo.REPLACE_VARIABLE_REGEXP;
    }).replace(Navigo.WILDCARD_REGEXP, Navigo.REPLACE_WILDCARD) + Navigo.FOLLOWED_BY_SLASH_REGEXP, Navigo.MATCH_REGEXP_FLAGS);
  }
  return { regexp: regexp, paramNames: paramNames };
}

function getUrlDepth(url) {
  return url.replace(/\/$/, '').split('/').length;
}

function compareUrlDepth(urlA, urlB) {
  return getUrlDepth(urlB) - getUrlDepth(urlA);
}

function findMatchedRoutes(url) {
  var routes = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

  return routes.map(function (route) {
    var _replaceDynamicURLPar = replaceDynamicURLParts(clean(route.route)),
        regexp = _replaceDynamicURLPar.regexp,
        paramNames = _replaceDynamicURLPar.paramNames;

    var match = url.replace(/^\/+/, '/').match(regexp);
    var params = regExpResultToParams(match, paramNames);

    return match ? { match: match, route: route, params: params } : false;
  }).filter(function (m) {
    return m;
  });
}

function match(url, routes) {
  return findMatchedRoutes(url, routes)[0] || false;
}

function root(url, routes) {
  var matched = routes.map(function (route) {
    return route.route === '' || route.route === '*' ? url : url.split(new RegExp(route.route + '($|\/)'))[0];
  });
  var fallbackURL = clean(url);

  if (matched.length > 1) {
    return matched.reduce(function (result, url) {
      if (result.length > url.length) result = url;
      return result;
    }, matched[0]);
  } else if (matched.length === 1) {
    return matched[0];
  }
  return fallbackURL;
}

function isHashChangeAPIAvailable() {
  return typeof window !== 'undefined' && 'onhashchange' in window;
}

function extractGETParameters(url) {
  return url.split(/\?(.*)?$/).slice(1).join('');
}

function getOnlyURL(url, useHash, hash) {
  var onlyURL = url,
      split;
  var cleanGETParam = function cleanGETParam(str) {
    return str.split(/\?(.*)?$/)[0];
  };

  if (typeof hash === 'undefined') {
    // To preserve BC
    hash = '#';
  }

  if (isPushStateAvailable() && !useHash) {
    onlyURL = cleanGETParam(url).split(hash)[0];
  } else {
    split = url.split(hash);
    onlyURL = split.length > 1 ? cleanGETParam(split[1]) : cleanGETParam(split[0]);
  }

  return onlyURL;
}

function manageHooks(handler, hooks, params) {
  if (hooks && (typeof hooks === 'undefined' ? 'undefined' : _typeof(hooks)) === 'object') {
    if (hooks.before) {
      hooks.before(function () {
        var shouldRoute = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

        if (!shouldRoute) return;
        handler();
        hooks.after && hooks.after(params);
      }, params);
      return;
    } else if (hooks.after) {
      handler();
      hooks.after && hooks.after(params);
      return;
    }
  }
  handler();
}

function isHashedRoot(url, useHash, hash) {
  if (isPushStateAvailable() && !useHash) {
    return false;
  }

  if (!url.match(hash)) {
    return false;
  }

  var split = url.split(hash);

  return split.length < 2 || split[1] === '';
}

Navigo.prototype = {
  helpers: {
    match: match,
    root: root,
    clean: clean,
    getOnlyURL: getOnlyURL
  },
  navigate: function navigate(path, absolute) {
    var to;

    path = path || '';
    if (this._usePushState) {
      to = (!absolute ? this._getRoot() + '/' : '') + path.replace(/^\/+/, '/');
      to = to.replace(/([^:])(\/{2,})/g, '$1/');
      history[this._historyAPIUpdateMethod]({}, '', to);
      this.resolve();
    } else if (typeof window !== 'undefined') {
      path = path.replace(new RegExp('^' + this._hash), '');
      window.location.href = window.location.href.replace(/#$/, '').replace(new RegExp(this._hash + '.*$'), '') + this._hash + path;
    }
    return this;
  },
  on: function on() {
    var _this = this;

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    if (typeof args[0] === 'function') {
      this._defaultHandler = { handler: args[0], hooks: args[1] };
    } else if (args.length >= 2) {
      if (args[0] === '/') {
        var func = args[1];

        if (_typeof(args[1]) === 'object') {
          func = args[1].uses;
        }

        this._defaultHandler = { handler: func, hooks: args[2] };
      } else {
        this._add(args[0], args[1], args[2]);
      }
    } else if (_typeof(args[0]) === 'object') {
      var orderedRoutes = Object.keys(args[0]).sort(compareUrlDepth);

      orderedRoutes.forEach(function (route) {
        _this.on(route, args[0][route]);
      });
    }
    return this;
  },
  off: function off(handler) {
    if (this._defaultHandler !== null && handler === this._defaultHandler.handler) {
      this._defaultHandler = null;
    } else if (this._notFoundHandler !== null && handler === this._notFoundHandler.handler) {
      this._notFoundHandler = null;
    }
    this._routes = this._routes.reduce(function (result, r) {
      if (r.handler !== handler) result.push(r);
      return result;
    }, []);
    return this;
  },
  notFound: function notFound(handler, hooks) {
    this._notFoundHandler = { handler: handler, hooks: hooks };
    return this;
  },
  resolve: function resolve(current) {
    var _this2 = this;

    var handler, m;
    var url = (current || this._cLoc()).replace(this._getRoot(), '');

    if (this._useHash) {
      url = url.replace(new RegExp('^\/' + this._hash), '/');
    }

    var GETParameters = extractGETParameters(current || this._cLoc());
    var onlyURL = getOnlyURL(url, this._useHash, this._hash);

    if (this._paused) return false;

    if (this._lastRouteResolved && onlyURL === this._lastRouteResolved.url && GETParameters === this._lastRouteResolved.query) {
      if (this._lastRouteResolved.hooks && this._lastRouteResolved.hooks.already) {
        this._lastRouteResolved.hooks.already(this._lastRouteResolved.params);
      }
      return false;
    }

    m = match(onlyURL, this._routes);

    if (m) {
      this._callLeave();
      this._lastRouteResolved = {
        url: onlyURL,
        query: GETParameters,
        hooks: m.route.hooks,
        params: m.params,
        name: m.route.name
      };
      handler = m.route.handler;
      manageHooks(function () {
        manageHooks(function () {
          m.route.route instanceof RegExp ? handler.apply(undefined, m.match.slice(1, m.match.length)) : handler(m.params, GETParameters);
        }, m.route.hooks, m.params, _this2._genericHooks);
      }, this._genericHooks, m.params);
      return m;
    } else if (this._defaultHandler && (onlyURL === '' || onlyURL === '/' || onlyURL === this._hash || isHashedRoot(onlyURL, this._useHash, this._hash))) {
      manageHooks(function () {
        manageHooks(function () {
          _this2._callLeave();
          _this2._lastRouteResolved = { url: onlyURL, query: GETParameters, hooks: _this2._defaultHandler.hooks };
          _this2._defaultHandler.handler(GETParameters);
        }, _this2._defaultHandler.hooks);
      }, this._genericHooks);
      return true;
    } else if (this._notFoundHandler) {
      manageHooks(function () {
        manageHooks(function () {
          _this2._callLeave();
          _this2._lastRouteResolved = { url: onlyURL, query: GETParameters, hooks: _this2._notFoundHandler.hooks };
          _this2._notFoundHandler.handler(GETParameters);
        }, _this2._notFoundHandler.hooks);
      }, this._genericHooks);
    }
    return false;
  },
  destroy: function destroy() {
    this._routes = [];
    this._destroyed = true;
    this._lastRouteResolved = null;
    this._genericHooks = null;
    clearTimeout(this._listeningInterval);
    if (typeof window !== 'undefined') {
      window.removeEventListener('popstate', this._onLocationChange);
      window.removeEventListener('hashchange', this._onLocationChange);
    }
  },
  updatePageLinks: function updatePageLinks() {
    var self = this;

    if (typeof document === 'undefined') return;

    this._findLinks().forEach(function (link) {
      if (!link.hasListenerAttached) {
        link.addEventListener('click', function (e) {
          if ((e.ctrlKey || e.metaKey) && e.target.tagName.toLowerCase() == 'a') {
            return false;
          }
          var location = self.getLinkPath(link);

          if (!self._destroyed) {
            e.preventDefault();
            self.navigate(location.replace(/\/+$/, '').replace(/^\/+/, '/'));
          }
        });
        link.hasListenerAttached = true;
      }
    });
  },
  generate: function generate(name) {
    var data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    var result = this._routes.reduce(function (result, route) {
      var key;

      if (route.name === name) {
        result = route.route;
        for (key in data) {
          result = result.toString().replace(':' + key, data[key]);
        }
      }
      return result;
    }, '');

    return this._useHash ? this._hash + result : result;
  },
  link: function link(path) {
    return this._getRoot() + path;
  },
  pause: function pause() {
    var status = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

    this._paused = status;
    if (status) {
      this._historyAPIUpdateMethod = 'replaceState';
    } else {
      this._historyAPIUpdateMethod = 'pushState';
    }
  },
  resume: function resume() {
    this.pause(false);
  },
  historyAPIUpdateMethod: function historyAPIUpdateMethod(value) {
    if (typeof value === 'undefined') return this._historyAPIUpdateMethod;
    this._historyAPIUpdateMethod = value;
    return value;
  },
  disableIfAPINotAvailable: function disableIfAPINotAvailable() {
    if (!isPushStateAvailable()) {
      this.destroy();
    }
  },
  lastRouteResolved: function lastRouteResolved() {
    return this._lastRouteResolved;
  },
  getLinkPath: function getLinkPath(link) {
    return link.getAttribute('href');
  },
  hooks: function hooks(_hooks) {
    this._genericHooks = _hooks;
  },

  _add: function _add(route) {
    var handler = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
    var hooks = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

    if (typeof route === 'string') {
      route = encodeURI(route);
    }
    this._routes.push((typeof handler === 'undefined' ? 'undefined' : _typeof(handler)) === 'object' ? {
      route: route,
      handler: handler.uses,
      name: handler.as,
      hooks: hooks || handler.hooks
    } : { route: route, handler: handler, hooks: hooks });

    return this._add;
  },
  _getRoot: function _getRoot() {
    if (this.root !== null) return this.root;
    this.root = root(this._cLoc().split('?')[0], this._routes);
    return this.root;
  },
  _listen: function _listen() {
    var _this3 = this;

    if (this._usePushState) {
      window.addEventListener('popstate', this._onLocationChange);
    } else if (isHashChangeAPIAvailable()) {
      window.addEventListener('hashchange', this._onLocationChange);
    } else {
      var cached = this._cLoc(),
          current = void 0,
          _check = void 0;

      _check = function check() {
        current = _this3._cLoc();
        if (cached !== current) {
          cached = current;
          _this3.resolve();
        }
        _this3._listeningInterval = setTimeout(_check, 200);
      };
      _check();
    }
  },
  _cLoc: function _cLoc() {
    if (typeof window !== 'undefined') {
      if (typeof window.__NAVIGO_WINDOW_LOCATION_MOCK__ !== 'undefined') {
        return window.__NAVIGO_WINDOW_LOCATION_MOCK__;
      }
      return clean(window.location.href);
    }
    return '';
  },
  _findLinks: function _findLinks() {
    return [].slice.call(document.querySelectorAll('[data-navigo]'));
  },
  _onLocationChange: function _onLocationChange() {
    this.resolve();
  },
  _callLeave: function _callLeave() {
    var lastRouteResolved = this._lastRouteResolved;

    if (lastRouteResolved && lastRouteResolved.hooks && lastRouteResolved.hooks.leave) {
      lastRouteResolved.hooks.leave(lastRouteResolved.params);
    }
  }
};

Navigo.PARAMETER_REGEXP = /([:*])(\w+)/g;
Navigo.WILDCARD_REGEXP = /\*/g;
Navigo.REPLACE_VARIABLE_REGEXP = '([^\/]+)';
Navigo.REPLACE_WILDCARD = '(?:.*)';
Navigo.FOLLOWED_BY_SLASH_REGEXP = '(?:\/$|$)';
Navigo.MATCH_REGEXP_FLAGS = '';

return Navigo;

})));

},{}],25:[function(require,module,exports){
module.exports={
  "name": "ejdicto",
  "version": "2.0.0",
  "description": "Version améliorée de jDicto",
  "main": "build/app.js",
  "directories": {
    "lib": "lib"
  },
  "scripts": {
    "help": "bash ./outils.sh help",
    "dev": "bash ./outils.sh dev",
    "vendors": "bash ./outils.sh vendors",
    "build": "bash ./outils.sh build",
    "test": "bash ./outils.sh test",
    "clean": "bash ./outils.sh clean",
    "deploy": "bash ./outils.sh deploy"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/pcardona34/ejdicto.git"
  },
  "keywords": [
    "dictée",
    "réécriture",
    "exerciseur"
  ],
  "author": "Patrick Cardona",
  "license": "GPL-3.0-or-later",
  "bugs": {
    "url": "https://github.com/pcardona34/ejdicto/issues"
  },
  "homepage": "https://github.com/pcardona34/ejdicto#readme",
  "dependencies": {
    "chibijs": "^3.0.9",
    "navigo": "^7.1.2"
  },
  "devDependencies": {
    "clean-css": "^4.2.3",
    "handlebars": "^4.7.6",
    "hbsfy": "^2.8.1",
    "http-server": "^0.12.1",
    "jsmin": "^1.0.1"
  }
}

},{}],26:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    return "<!-- ==================================\n *            e j D i c t o             *\n * ==================================== *\n * (c)2012-2020 - Patrick Cardona       *\n * Licence GPL version 3 ou ultérieure  *\n * VOIR la licence complète à la racine *\n * ==================================== -->\n \n <!-- Template : aideAmelioration.hbs -->\n\n<header class=\"texte-fonce\">\n<h3>Je vérifie...</h3>\n</header>\n	<ul class=\"w3-ul\">\n        <li>Les homophones : <b>a</b> ou <b>à</b> ? <b>et</b> ou <b>est</b> ? etc.\n		</li>\n		<li>Les accords au sein du groupe nominal.\n		</li>\n		<li>\n			Les accords du verbe avec son sujet :\n			 attention au sujet parfois inversé ou composé de plusieurs noms&nbsp;.\n			 Attention à la présence de pronoms sournois, placés entre le sujet et le verbe.\n		</li>\n		<li>\n			Je fais attention aux accords plus subtils : mots éloignés ou détachés, participe passé...\n		</li>\n		<li>\n		    Pour les mots que je ne reconnais pas, je peux les chercher dans un\n		     <a href=\"https://www.dictionnaire-academie.fr\" \n		    target=\"_blank\" class=\"w3-button texte-lien\">dictionnaire</a>...\n        </li>\n	</ul>";
},"useData":true});

},{"hbsfy/runtime":23}],27:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    return "<!-- ==================================\n *            e j D i c t o             *\n * ==================================== *\n * (c)2012-2020 - Patrick Cardona       *\n * Licence GPL version 3 ou ultérieure  *\n * VOIR la licence complète à la racine *\n * ==================================== -->\n \n <!-- Template : aideDictam.hbs -->\n\n<header>\n<h3 class=\"texte-fonce\">Pour accéder aux versions aménagées des dictées</h3>\n</header>\n <ul class=\"w3-ul\">\n    <li>Affichez la page d'accueil de l'application&nbsp;: \n    <span class=\"texte-lien\"><i class=\"icon-home\"></i></span></li>\n    <li>Sélectionnez le menu <span class=\"texte-lien\">\n    « <i class=\"icon-profil\"> Profil </i>»</span>.</li>\n    <li>Dans la page du profil courant, cliquez sur le bouton \n    <span class=\"texte-lien\">[modifier]</span>.</li>\n    <li>Dans les options du profil, sélectionnez votre niveau de classe (liste déroulante).</li>\n    <li>Cochez l'option <span class=\"texte-lien\">« dictée aménagée »</span>.\n    <li>Cliquez sur le menu <span class=\"texte-lien\">« <i class=\"icon-liste\"> \n    liste des dictées </i>»</span>.</li>\n</ul>\n  <p>\n  Désormais, vous disposez de la liste des dictées aménagées disponibles.\n  </p>";
},"useData":true});

},{"hbsfy/runtime":23}],28:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    return "<!-- ==================================\n *            e j D i c t o             *\n * ==================================== *\n * (c)2012-2020 - Patrick Cardona       *\n * Licence GPL version 3 ou ultérieure  *\n * VOIR la licence complète à la racine *\n * ==================================== -->\n \n <!-- Template : aidePriseEnMain.hbs -->\n\n\n	<h3 class=\"texte-fonce\">Boutons de la saisie</h3>\n<div class=\"w3-container w3-padding\">\n	<table class=\"w3-table w3-bordered\">\n	<tr>\n	<th>Bouton</th><th>Action</th>\n	</tr>\n    <tr>\n    <td><span class=\"analogue w3-padding\">\n    <i class=\"icon-editer\"></i></span></td>\n    <td>Mode édition</td>\n    </tr>\n    <tr>\n    <td><span class=\"analogue w3-padding\">\n    <i class=\"icon-assistant\"></i></span></td>\n    <td>Mode assistant de la dictée aménagée&nbsp;: des choix vous sont proposés.</td>\n    </tr>\n    <td><span class=\"analogue w3-padding\">\n    <i class=\"icon-omega\"></i></span></td>\n    <td>Affiche ou masque la barre des caractères spéciaux.</td>\n    </tr>\n    <tr>\n    <td><span class=\"analogue w3-padding\">\n    <i class=\"icon-corbeille\"></i></span>\n    </td>\n    <td>Affiche le texte initial (réécriture) ou efface toute la saisie (dictée).</td>\n    </tr>\n    <td><span class=\"analogue w3-padding\">\n    <i class=\"icon-verifier\"></i></span>\n    </td>\n    <td>Soumet le texte saisi au correcteur <sup>(1)</sup>.</td>\n    </tr>\n    <tr>\n    <td><span class=\"analogue w3-padding\">\n    <i class=\"icon-finir\"></i></span>\n    </td>\n    <td>Termine l'exercice et affiche la correction finale.</td>\n	</table>\n	\n<p><sup>(1)</sup> Si le correcteur détecte des erreurs, il affiche un message \ninvitant à améliorer la saisie du texte.</p>\n</div>";
},"useData":true});

},{"hbsfy/runtime":23}],29:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    return "<!-- ==================================\n *            e j D i c t o             *\n * ==================================== *\n * (c)2012-2020 - Patrick Cardona       *\n * Licence GPL version 3 ou ultérieure  *\n * VOIR la licence complète à la racine *\n * ==================================== -->\n \n <!-- Template : aideTemplate.hbs -->\n\n\n<header>\n<h3 class=\"texte-fonce\">Précaution avant un usage mobile</h3>\n</header>\n	<ul class=\"w3-ul\">\n\n  <ol>\n  <li>Avant de pouvoir écouter une dictée en usage mobile,\n  prenez la précaution de vous connecter en activant\n  le Wifi.</li>\n  <li>Écoutez la dictée une fois.</li>\n  <li>Désactivez le Wifi.</li>\n  </ol>\n  </ul>\n  <p>Vous êtes maintenant en mesure de l'écouter hors connexion.</p>";
},"useData":true});

},{"hbsfy/runtime":23}],30:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "  <button class=\"w3-bar-item w3-button tablink \n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(data && lookupProperty(data,"first")),{"name":"if","hash":{},"fn":container.program(2, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":17,"column":2},"end":{"line":19,"column":9}}})) != null ? stack1 : "")
    + "  \" onclick=\"afficheRubrique(event, '"
    + alias4(((helper = (helper = lookupProperty(helpers,"lien") || (depth0 != null ? lookupProperty(depth0,"lien") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"lien","hash":{},"data":data,"loc":{"start":{"line":20,"column":37},"end":{"line":20,"column":45}}}) : helper)))
    + "')\">"
    + alias4(((helper = (helper = lookupProperty(helpers,"legende") || (depth0 != null ? lookupProperty(depth0,"legende") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"legende","hash":{},"data":data,"loc":{"start":{"line":20,"column":49},"end":{"line":20,"column":60}}}) : helper)))
    + " \n  </button>\n";
},"2":function(container,depth0,helpers,partials,data) {
    return "  triadic\n";
},"4":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=container.lambda, alias2=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "	    <li><a href=\""
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"module") : depth0)) != null ? lookupProperty(stack1,"site") : stack1), depth0))
    + "\" \n	    target=\"_blank\" class=\"texte-lien\">"
    + alias2(alias1((depth0 != null ? lookupProperty(depth0,"appname") : depth0), depth0))
    + "</a> de "
    + alias2(alias1((depth0 != null ? lookupProperty(depth0,"auteur") : depth0), depth0))
    + ". \n	    Licence "
    + alias2(alias1((depth0 != null ? lookupProperty(depth0,"licence") : depth0), depth0))
    + ". \n	    <a href=\""
    + alias2(alias1((depth0 != null ? lookupProperty(depth0,"code") : depth0), depth0))
    + "\" target=\"_blank\" class=\"texte-lien\">\n	    <i class=\"icon-lien\"></i> Code source</a></li>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<!-- ==================================\n *            e j D i c t o             *\n * ==================================== *\n * (c)2012-2020 - Patrick Cardona       *\n * Licence GPL version 3 ou ultérieure  *\n * VOIR la licence complète à la racine *\n * ==================================== -->\n\n<!-- Template : aproposTemplate.hbs -->\n\n<!-- Onglets / tabs -->\n\n<div class=\"w3-padding-24 <w3-border\">\n<div class=\"w3-bar w3-light-grey w3-border\">\n"
    + ((stack1 = lookupProperty(helpers,"each").call(alias1,(depth0 != null ? lookupProperty(depth0,"rubs") : depth0),{"name":"each","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":15,"column":0},"end":{"line":22,"column":9}}})) != null ? stack1 : "")
    + "</div>\n</div>\n\n<div id=\"apropos\" class=\"rubrique\">\n<div class=\"w3-container\">\n    <h3 class=\"texte-fonce\">À propos de "
    + alias4(((helper = (helper = lookupProperty(helpers,"app_name") || (depth0 != null ? lookupProperty(depth0,"app_name") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"app_name","hash":{},"data":data,"loc":{"start":{"line":28,"column":40},"end":{"line":28,"column":54}}}) : helper)))
    + "\n     - version "
    + alias4(((helper = (helper = lookupProperty(helpers,"version") || (depth0 != null ? lookupProperty(depth0,"version") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"version","hash":{},"data":data,"loc":{"start":{"line":29,"column":15},"end":{"line":29,"column":26}}}) : helper)))
    + "</h3>\n    <p>Cette application Web permet de s'exercer en orthographe de \n    manière autonome en proposant des exercices variés : dictées, \n    réécritures...</p>\n    <p>Pour débuter, choisissez une <b>liste</b> dans le menu.</p>\n</div>\n</div>\n\n<div id=\"fabrique\" class=\"rubrique\" style=\"display:none\">\n<div class=\"w3-container\">\n    <h3 class=\"texte-fonce\">Fabrique de "
    + alias4(((helper = (helper = lookupProperty(helpers,"app_name") || (depth0 != null ? lookupProperty(depth0,"app_name") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"app_name","hash":{},"data":data,"loc":{"start":{"line":39,"column":40},"end":{"line":39,"column":54}}}) : helper)))
    + "</h3>\n    <p><b>"
    + alias4(((helper = (helper = lookupProperty(helpers,"app_name") || (depth0 != null ? lookupProperty(depth0,"app_name") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"app_name","hash":{},"data":data,"loc":{"start":{"line":40,"column":10},"end":{"line":40,"column":24}}}) : helper)))
    + "</b> a été réalisé grâce aux logiciels \nsuivants&nbsp;:</p>\n    <ul style=\"list-style: none\">\n"
    + ((stack1 = lookupProperty(helpers,"each").call(alias1,(depth0 != null ? lookupProperty(depth0,"module") : depth0),{"name":"each","hash":{},"fn":container.program(4, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":43,"column":5},"end":{"line":49,"column":14}}})) != null ? stack1 : "")
    + "    </ul>\n</div>\n</div>\n\n<div id=\"credits\" class=\"rubrique\" style=\"display:none\">\n<div class=\"w3-container\">\n    <h3 class=\"texte-fonce\">Crédit photo</h3>\n    <p>Le dessin de l'encrier en page d'accueil est l'œuvre de Rawpixel : \n    <a target=\"_blank\" href=\"http://www.freepik.com\" class=\"texte-lien\">\n    designed by rawpixel.com / Freepik</a></p>\n</div>\n</div>\n\n\n\n";
},"useData":true});

},{"hbsfy/runtime":23}],31:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"unless").call(depth0 != null ? depth0 : (container.nullContext || {}),(data && lookupProperty(data,"last")),{"name":"unless","hash":{},"fn":container.program(2, data, 0, blockParams, depths),"inverse":container.program(4, data, 0, blockParams, depths),"data":data,"loc":{"start":{"line":16,"column":2},"end":{"line":30,"column":13}}})) != null ? stack1 : "");
},"2":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var alias1=container.escapeExpression, alias2=container.lambda, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "\n  <input type=\"radio\" class=\"w3-radio\" name=\"lacune_"
    + alias1((lookupProperty(helpers,"indexPlusUn")||(depth0 && lookupProperty(depth0,"indexPlusUn"))||container.hooks.helperMissing).call(depth0 != null ? depth0 : (container.nullContext || {}),(depths[1] != null ? lookupProperty(depths[1],"nom") : depths[1]),{"name":"indexPlusUn","hash":{},"data":data,"loc":{"start":{"line":18,"column":52},"end":{"line":18,"column":74}}}))
    + "\" \n  value=\""
    + alias1(alias2(depth0, depth0))
    + "\">\n  <label>"
    + alias1(alias2(depth0, depth0))
    + "</label>\n\n";
},"4":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "  &nbsp;&nbsp;&nbsp;\n  <span class=\"w3-button w3-round-xxlarge triadic\" id=\"bouton_insertion_"
    + alias3((lookupProperty(helpers,"indexPlusUn")||(depth0 && lookupProperty(depth0,"indexPlusUn"))||alias2).call(alias1,(depths[1] != null ? lookupProperty(depths[1],"nom") : depths[1]),{"name":"indexPlusUn","hash":{},"data":data,"loc":{"start":{"line":24,"column":72},"end":{"line":24,"column":94}}}))
    + "\"\nonclick=\"inserer_mot('lacune_"
    + alias3((lookupProperty(helpers,"indexPlusUn")||(depth0 && lookupProperty(depth0,"indexPlusUn"))||alias2).call(alias1,(depths[1] != null ? lookupProperty(depths[1],"nom") : depths[1]),{"name":"indexPlusUn","hash":{},"data":data,"loc":{"start":{"line":25,"column":29},"end":{"line":25,"column":51}}}))
    + "')\">\n  "
    + alias3((lookupProperty(helpers,"indexPlusUn")||(depth0 && lookupProperty(depth0,"indexPlusUn"))||alias2).call(alias1,(depths[1] != null ? lookupProperty(depths[1],"nom") : depths[1]),{"name":"indexPlusUn","hash":{},"data":data,"loc":{"start":{"line":26,"column":2},"end":{"line":26,"column":24}}}))
    + "\n  <i class=\"icon-finir\"></i>\n  </span>\n\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<!-- ==================================\n *            e j D i c t o             *\n * ==================================== *\n * (c)2012-2020 - Patrick Cardona       *\n * Licence GPL version 3 ou ultérieure  *\n * VOIR la licence complète à la racine *\n * ==================================== -->\n \n<!-- Handlebars Partial : assistantDeLaSaisieTemplate.hbs -->\n\n<!-- Affiche une proposition de saisie sous forme de QCU -->\n\n<form class=\"w3-container w3-border w3-padding\"\nname=\"form_"
    + alias3((lookupProperty(helpers,"indexPlusUn")||(depth0 && lookupProperty(depth0,"indexPlusUn"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"nom") : depth0),{"name":"indexPlusUn","hash":{},"data":data,"loc":{"start":{"line":14,"column":11},"end":{"line":14,"column":30}}}))
    + "\" id=\"form_"
    + alias3((lookupProperty(helpers,"indexPlusUn")||(depth0 && lookupProperty(depth0,"indexPlusUn"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"nom") : depth0),{"name":"indexPlusUn","hash":{},"data":data,"loc":{"start":{"line":14,"column":41},"end":{"line":14,"column":60}}}))
    + "\">\n"
    + ((stack1 = lookupProperty(helpers,"each").call(alias1,depth0,{"name":"each","hash":{},"fn":container.program(1, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"loc":{"start":{"line":15,"column":0},"end":{"line":31,"column":9}}})) != null ? stack1 : "")
    + "</form>\n\n";
},"useData":true,"useDepths":true});

},{"hbsfy/runtime":23}],32:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<!-- ==================================\n *            e j D i c t o             *\n * ==================================== *\n * (c)2012-2020 - Patrick Cardona       *\n * Licence GPL version 3 ou ultérieure  *\n * VOIR la licence complète à la racine *\n * ==================================== -->\n \n<!-- Handlebars Partial : barreCaracteresTemplate.hbs -->\n\n<!-- Affichage d'un bouton carctère spécial -->\n\n    <button onclick=\"inserer('"
    + alias4(((helper = (helper = lookupProperty(helpers,"car") || (depth0 != null ? lookupProperty(depth0,"car") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"car","hash":{},"data":data,"loc":{"start":{"line":13,"column":30},"end":{"line":13,"column":37}}}) : helper)))
    + "','ma_saisie')\" class=\"w3-bar-item w3-button w3-border\">"
    + alias4(((helper = (helper = lookupProperty(helpers,"car") || (depth0 != null ? lookupProperty(depth0,"car") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"car","hash":{},"data":data,"loc":{"start":{"line":13,"column":93},"end":{"line":13,"column":100}}}) : helper)))
    + "</button>\n";
},"useData":true});

},{"hbsfy/runtime":23}],33:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "  <button class=\"w3-bar-item w3-button w3-border tablink \n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(data && lookupProperty(data,"first")),{"name":"if","hash":{},"fn":container.program(2, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":20,"column":2},"end":{"line":22,"column":9}}})) != null ? stack1 : "")
    + "  \" onclick=\"afficheRubrique(event, '"
    + alias4(((helper = (helper = lookupProperty(helpers,"lien") || (depth0 != null ? lookupProperty(depth0,"lien") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"lien","hash":{},"data":data,"loc":{"start":{"line":23,"column":37},"end":{"line":23,"column":45}}}) : helper)))
    + "')\">"
    + alias4(((helper = (helper = lookupProperty(helpers,"legende") || (depth0 != null ? lookupProperty(depth0,"legende") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"legende","hash":{},"data":data,"loc":{"start":{"line":23,"column":49},"end":{"line":23,"column":60}}}) : helper)))
    + " \n  </button>\n";
},"2":function(container,depth0,helpers,partials,data) {
    return "  triadic\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<!-- ==================================\n *            e j D i c t o             *\n * ==================================== *\n * (c)2012-2020 - Patrick Cardona       *\n * Licence GPL version 3 ou ultérieure  *\n * VOIR la licence complète à la racine *\n * ==================================== -->\n\n<!-- Template : licence : contenu paginé\n  licenceTemplate.hbs\n-->\n\n<!-- Onglets / tabs -->\n\n<div class=\"w3-padding\">\n<div class=\"w3-center\" style=\"max-width: 400px\">\n<div class=\"w3-bar\">\n"
    + ((stack1 = lookupProperty(helpers,"each").call(alias1,(depth0 != null ? lookupProperty(depth0,"rubs") : depth0),{"name":"each","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":18,"column":0},"end":{"line":25,"column":9}}})) != null ? stack1 : "")
    + "</div>\n</div>\n</div>\n\n<div id=\"page1\" class=\"rubrique\">\n<div class=\"w3-container\">\n  <div style=\"max-width: 400px\">\n    <p style=\"text-align: justify\">\n      Copyright &copy; "
    + alias4(((helper = (helper = lookupProperty(helpers,"debut") || (depth0 != null ? lookupProperty(depth0,"debut") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"debut","hash":{},"data":data,"loc":{"start":{"line":34,"column":23},"end":{"line":34,"column":34}}}) : helper)))
    + "-"
    + alias4(((helper = (helper = lookupProperty(helpers,"actuel") || (depth0 != null ? lookupProperty(depth0,"actuel") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"actuel","hash":{},"data":data,"loc":{"start":{"line":34,"column":35},"end":{"line":34,"column":47}}}) : helper)))
    + " "
    + alias4(((helper = (helper = lookupProperty(helpers,"auteur") || (depth0 != null ? lookupProperty(depth0,"auteur") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"auteur","hash":{},"data":data,"loc":{"start":{"line":34,"column":48},"end":{"line":34,"column":60}}}) : helper)))
    + "<br><br>\n      "
    + ((stack1 = ((helper = (helper = lookupProperty(helpers,"texte_page_1") || (depth0 != null ? lookupProperty(depth0,"texte_page_1") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"texte_page_1","hash":{},"data":data,"loc":{"start":{"line":35,"column":6},"end":{"line":35,"column":24}}}) : helper))) != null ? stack1 : "")
    + ".</p>\n  </div>\n</div>\n</div>\n\n<div id=\"page2\" class=\"rubrique\">\n<div class=\"w3-container\">\n  <div style=\"max-width: 400px\">\n    <p style=\"text-align: justify\">\n      "
    + ((stack1 = ((helper = (helper = lookupProperty(helpers,"texte_page_2") || (depth0 != null ? lookupProperty(depth0,"texte_page_2") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"texte_page_2","hash":{},"data":data,"loc":{"start":{"line":44,"column":6},"end":{"line":44,"column":24}}}) : helper))) != null ? stack1 : "")
    + ".</p>\n  </div>\n</div>\n</div>\n\n</div>\n\n";
},"useData":true});

},{"hbsfy/runtime":23}],34:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    return "<!-- ==================================\n *            e j D i c t o             *\n * ==================================== *\n * (c)2012-2020 - Patrick Cardona       *\n * Licence GPL version 3 ou ultérieure  *\n * VOIR la licence complète à la racine *\n * ==================================== -->\n\n<!-- Template : zone de notification\n  notificationTemplate.hbs\n-->\n\n    <div class=\"w3-modal-content w3-round\">\n    <div class=\"w3-container\">\n      <p class=\"w3-right-align\">\n      <button class=\"w3-button texte-fonce\" onclick=\"$('#notification').hide()\">\n      <i class=\"icon-fermer\"></i>\n      </button>\n      </p>\n      <h4 id=\"titre_message\" class=\"w3-center texte-fonce\"></h4>\n      <p id=\"contenu_message\"></p>\n    </div>\n    </div>\n\n";
},"useData":true});

},{"hbsfy/runtime":23}],35:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    return "<!-- ==================================\n *            e j D i c t o             *\n * ==================================== *\n * (c)2012-2020 - Patrick Cardona       *\n * Licence GPL version 3 ou ultérieure  *\n * VOIR la licence complète à la racine *\n * ==================================== -->\n\n<!-- Template : pied de page\n  piedTemplate.hbs\n-->\n\n<!-- Pied de page -->\n\n    <footer class=\"w3-bottom w3-center fonce\">\n      &copy; 2012-2020 Patrick Cardona &mdash; \n      Application hébergée par <a href=\"https://github.com\" target=\"_blank\">\n      <img src=\"./static/images/github.png\">\n      </a>\n    </footer>";
},"useData":true});

},{"hbsfy/runtime":23}],36:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=container.escapeExpression, alias2=container.lambda, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<!-- ==================================\n *            e j D i c t o             *\n * ==================================== *\n * (c)2012-2020 - Patrick Cardona       *\n * Licence GPL version 3 ou ultérieure  *\n * VOIR la licence complète à la racine *\n * ==================================== -->\n \n<!-- Handlebars Partial : sourcesAudioTemplate.hbs -->\n\n<source src=\"./static/audio/dictee"
    + alias1(((helper = (helper = lookupProperty(helpers,"cid") || (depth0 != null ? lookupProperty(depth0,"cid") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"cid","hash":{},"data":data,"loc":{"start":{"line":11,"column":34},"end":{"line":11,"column":41}}}) : helper)))
    + "."
    + alias1(alias2(((stack1 = (depth0 != null ? lookupProperty(depth0,"format") : depth0)) != null ? lookupProperty(stack1,"extension") : stack1), depth0))
    + "\" \ntype=\"audio/"
    + alias1(alias2(((stack1 = (depth0 != null ? lookupProperty(depth0,"format") : depth0)) != null ? lookupProperty(stack1,"type") : stack1), depth0))
    + "\">\n\n\n\n";
},"useData":true});

},{"hbsfy/runtime":23}],37:[function(require,module,exports){
/* ==================================== *
 *            e j D i c t o             *
 * ==================================== *
 * (c)2012-2020 - Patrick Cardona       *
 * Licence GPL version 3 ou ultérieure  *
 * VOIR la licence complète à la racine *
 * ==================================== */

/* CommonJS compatible format */

/* ===========================================
 *      A i d e    g é n é r a l e
 *      dans ejDicto
 * ===========================================
 */

/* Masquer / afficher l'aide dans son ensemble */

exports.masquer_aide = function () {
  $("#aide").hide();
};

exports.afficher_aide = function () {
  $("#aide").show();
};

/* Affichage / masquage des sections de l'aide en accordéon */
exports.alterner_section_aide = function (id) {
  let section = document.getElementById(id);
  if (section.className.indexOf("w3-show") == -1) {
    section.className += " w3-show";
  } else {
    section.className = section.className.replace(" w3-show", "");
  }
};
},{}],38:[function(require,module,exports){
/* ==================================== *
 *            e j D i c t o             *
 * ==================================== *
 * (c)2012-2020 - Patrick Cardona       *
 * Licence GPL version 3 ou ultérieure  *
 * VOIR la licence complète à la racine *
 * ==================================== */

/* CommonJS compatible format */

/* ===========================================
 *      a s s i s t a n t
 *      de la saisie : dictée aménagée
 * ===========================================
 */

/* Nécessaire pour afficher le 
message d'erreur popup */
const Popup = require('./messageModule.js').Popup;
const popup = new Popup();

/* Insère le mot sélectionné dans la dictée aménagée */
exports.inserer_mot = function (inputName){
    try {
      let choix = document.querySelector('input[name="'+inputName +'"]:checked').value;
      let num = inputName.slice(7);
      substituer_etiquette(choix, num) &&  $("#form_" + num).hide()
      && sessionStorage.setItem("ejdicto_form" + num, true);
      return true;
    }
    catch (erreur) {
      popup.afficherMessage(1);
    }

};

function substituer_etiquette(motChoisi,num){
  let maSaisie = document.getElementById("ma_saisie");
  let saisie = maSaisie.value;
  sortie = saisie.replace("_("+num+")_", motChoisi.trim());
  maSaisie.value = sortie;
  sessionStorage.setItem("dictee", sortie);
  actualiser_assistant(false);
  return true;
}

exports.actualiser_assistant = function(messageTerminer = false) {
  let nombre = 0;
  let dictee;
  if (sessionStorage.getItem("dictee")){
    dictee = sessionStorage.getItem("dictee");
  }else{
    dictee = $("#ma_saisie").val();
  }
  let indice;
  let nMots = 10;
  let motif = ""
  for (indice = 0;indice < nMots; indice++){
    motif = "_(" +((indice + 1))+ ")_";
    if (dictee.indexOf(motif) !== -1){
      nombre++;
      $("#form_"+(indice + 1)).show();
    }else{
      $("#form_"+(indice + 1)).hide();
    }
  }
  if ( nombre > 0 ) {
    $("#assistant").show();
    $(".autres_boutons").hide();
    if ( messageTerminer === true ){
      popup.afficherMessage(6);
      return true;
    }
  }else{
    if (messageTerminer === false){
      messageAssistantIndisponible();
      }
      $(".autres_boutons").show();
      $("#assistant").hide();
  }
  return false;
};

function messageAssistantIndisponible() {
  /* Est-ce une dictée aménagée ? */
  let amenagement = profil.retourne("ejdictoProfilAmenagement", false);
  if ( amenagement === 'true' ){
    popup.afficherMessage(7);
  }
}

},{"./messageModule.js":43}],39:[function(require,module,exports){
/* ==================================== *
 *            e j D i c t o             *
 * ==================================== *
 * (c)2012-2020 - Patrick Cardona       *
 * Licence GPL version 3 ou ultérieure  *
 * VOIR la licence complète à la racine *
 * ==================================== */

/* CommonJS compatible format */

/* ===========================================
 *      c a r s p e c
 *      utilities
 * ===========================================
 */

/* Insertion de caractères spéciaux dans le champ de formulaire textarea */ 

/* Insertion de caractères spéciaux
 * Fonction liée au composant : barreCaracteresSpeciauxTemplate.hbs
 */

/*
* args[0] : car : type string, the typo selected.
* args[1] : cible : type id du DOM, identifie la zone textarea où insérer le caractère
*/

exports.inserer = function () {
		var args = arguments;
		var car = args[0];
		var cible = args[1];
		var zone = document.getElementById(cible);
		zone.focus();
		if(typeof zone.selectionStart != 'undefined')
			{
			let start = zone.selectionStart;
			let end = zone.selectionEnd;
			let insText = zone.value.substring(start, end);
			zone.value = zone.value.substr(0, start) + car + zone.value.substr(end);
			let pos;
			pos = start + car.length;
			zone.selectionStart = pos;
			zone.selectionEnd = pos;
			document.getElementById(cible).value = zone.value;
			}
};


},{}],40:[function(require,module,exports){
/* CommonJS compatible format */

/* =============================================
 * Javascript Diff Algorithm
 *  By John Resig (http://ejohn.org/)
 *  Modified by Chu Alan "sprite"
 *  Modifications pour ejDicto : Patrick cardona, 
 *  2019-2020, under the same license
 *
 *  Released under the MIT license.
 *
 *  More Info:
 *  http://ejohn.org/projects/javascript-diff-algorithm/
 * ==============================================
 */

/* ==================================================
 * CAUTION! These are very modified functions to deal
 * under my needs within
 * the ejDicto project.
 * Don't use those outside this project and search 
 * then the original ones
 * by John Resig. See the URL above.
 * ==================================================
 */

function escape(s) {
    var n = s;
    n = n.replace(/&/g, "&amp;");
    n = n.replace(/</g, "&lt;");
    n = n.replace(/>/g, "&gt;");
    return n;
}

/* Fonction de comparaison de chaines */

exports.diffString = function ( o, n ) {
  let nbre = 0; /* nombre de chaînes erronées */
  o = o.replace(/\s+$/, '');
  n = n.replace(/\s+$/, '');

  var out = diff(o == "" ? [] : o.split(/\s+/), n == "" ? [] : n.split(/\s+/) );
  var str = "";

  var oSpace = o.match(/\s+/g);
  if (oSpace == null) {
    oSpace = ["\n"];
  } else {
    oSpace.push("\n");
  }
  var nSpace = n.match(/\s+/g);
  if (nSpace == null) {
    nSpace = ["\n"];
  } else {
    nSpace.push("\n");
  }

  if (out.n.length == 0) {
      for (var i = 0; i < out.o.length; i++) {
        str += "<del>" + escape(out.o[i]) + oSpace[i] + "</del>";
          nbre++;
      }
  } else {
    if (out.n[0].text == null) {
      for (n = 0; n < out.o.length && out.o[n].text == null; n++) {
        str += "<del>" + escape(out.o[n]) + oSpace[n] + "</del>";
          nbre++;
      }
    }

    for ( var i = 0; i < out.n.length; i++ ) {
      if (out.n[i].text == null) {
        str += "<ins>" + escape(out.n[i]) + nSpace[i] + "</ins>";
          nbre++;
      } else {
        var pre = "";
        for (n = out.n[i].row + 1; n < out.o.length && out.o[n].text == null; n++ ) {
          pre += "<del>" + escape(out.o[n]) + oSpace[n] + "</del>";
          nbre++;
        }
        str += " " + out.n[i].text + nSpace[i] + pre;
      }
    }
  }
  let bilan = "";
  if ( nbre > 0 ){
    bilan = 2;
  }else{
    bilan = 3;
  }
    return {bilan: bilan, corrigee: str};
}

/* Function : Diff */

function diff( o, n ) {
  var ns = new Object();
  var os = new Object();
  
  for ( var i = 0; i < n.length; i++ ) {
    if ( ns[ n[i] ] == null )
      ns[ n[i] ] = { rows: new Array(), o: null };
    ns[ n[i] ].rows.push( i );
  }
  
  for ( var i = 0; i < o.length; i++ ) {
    if ( os[ o[i] ] == null )
      os[ o[i] ] = { rows: new Array(), n: null };
    os[ o[i] ].rows.push( i );
  }
  
  for ( var i in ns ) {
    if ( ns[i].rows.length == 1 && typeof(os[i]) != "undefined" && os[i].rows.length == 1 ) {
      n[ ns[i].rows[0] ] = { text: n[ ns[i].rows[0] ], row: os[i].rows[0] };
      o[ os[i].rows[0] ] = { text: o[ os[i].rows[0] ], row: ns[i].rows[0] };
    }
  }
  
  for ( var i = 0; i < n.length - 1; i++ ) {
    if ( n[i].text != null && n[i+1].text == null && n[i].row + 1 < o.length && o[ n[i].row + 1 ].text == null && 
         n[i+1] == o[ n[i].row + 1 ] ) {
      n[i+1] = { text: n[i+1], row: n[i].row + 1 };
      o[n[i].row+1] = { text: o[n[i].row+1], row: i + 1 };
    }
  }
  
  for ( var i = n.length - 1; i > 0; i-- ) {
    if ( n[i].text != null && n[i-1].text == null && n[i].row > 0 && o[ n[i].row - 1 ].text == null && 
         n[i-1] == o[ n[i].row - 1 ] ) {
      n[i-1] = { text: n[i-1], row: n[i].row - 1 };
      o[n[i].row-1] = { text: o[n[i].row-1], row: i - 1 };
    }
  }
  
  return { o: o, n: n };
}


},{}],41:[function(require,module,exports){
/* ==================================== *
 *            e j D i c t o             *
 * ==================================== *
 * (c)2012-2020 - Patrick Cardona       *
 * Licence GPL version 3 ou ultérieure  *
 * VOIR la licence complète à la racine *
 * ==================================== */

/* CommonJS compatible format */

const Popup = require('./messageModule.js').Popup;
const popup = new Popup();
const actualiser_assistant = require('./assistantModule.js').actualiser_assistant;
const diffString = require ('./diffModule.js').diffString;

/* ==================================== *
 *    e j D i c t o   Core functions    *
 * ==================================== *
 * Utilisation d'une instance dans le template 'saisirTemplate.hbs' 
 */

var exercice = {
    saisie: "",
    fourni: "",
    attendu: "",
    erreurCode: 0,
    correction: "",
    typeExercice: ""
};


/* On initialise l'objet exercice à partir des données de l'interface : 
 * On vérifie que toutes les données utiles sont présentes : succès => true
 */

exercice.init = function () {
	this.saisie = document.getElementById("ma_saisie").value;
	this.attendu = document.getElementById("attendu").textContent;
	this.fourni = document.getElementById("fourni").textContent;
	this.erreurCode = 0;
	this.correction = "";
	this.typeExercice = document.getElementById("type_exercice").textContent;
	if (this.saisie.length > 0) {
		if (this.attendu.length > 0) {
			return true;
		}	
		else {
			this.erreurCode = 2;
			console.log(this.erreurCode);
			return false;
		}
	}	
	else {
		this.erreurCode = 1;
		return false;
	}
};
/* Fin de la méthode init() */

/* Méthode : corriger() */
exercice.corriger = function () {
    let msgid;
    if ( this.init() === true ) {
	/* On compare le texte saisi au texte attendu :
	 * On récupère l'objet de résultat sortie
	 *  le bilan : sortie.bilan
	 *  et le corrigé : sortie.corrigee
	 */
	var sortie = diffString(this.saisie, this.attendu);
	/* On remplace les retours à la ligne par le code HTML :
     * On peut afficher par dessus (popup) le bilan
     */
    let msgid = sortie.bilan;
    popup.afficherMessage(msgid);
    }else{
	if (this.erreurCode === 1) {
		msgid = 5;
	}else{
	    msgid = 4;
	}
	popup.afficherMessage(msgid);
    }
};
 /* Fin de la méthode corriger() */

/* Méthode : terminer() */
exercice.terminer = function () {
    if ( this.init() === true ) {
    let msgid;
    /* On vérifie qu'il ne reste aucune lacune */
      if (actualiser_assistant(true)) {
        return false;
        }

	/*  On compare le texte saisi au texte de référence :
	 *  On récupère l'objet de résultat sortie
	 *   =>  le corrigé : sortie.corrigee
	 */
	var sortie = diffString(this.saisie, this.attendu);
	/* On remplace les retours à la ligne par le code HTML */
	this.correction = sortie.corrigee.replace(/\n/g,"<br />");
    /* On propage la correction dans la zone ad hoc */
    document.getElementById("corrige").innerHTML = this.correction;
    /* On affiche cette zone */
    document.getElementById("zone_correction").style.display = "block";
    /* On masque le menu et la zone de saisie */
    document.getElementById("menu").style.display = "none";
    document.getElementById("zone_saisie").style.display = "none";
    /* On nettoie le magasin de la session */
    if (sessionStorage.getItem(this.typeExercice)){
        sessionStorage.removeItem(this.typeExercice);
        }
	return true;
    }else{
	if (this.erreurCode === 1) {
		msgid = 5;
	}else{
        msgid = 4;
	}
	popup.afficherMessage(msgid);
    }
};
 /* Fin de la méthode terminer() */

// Méthode : pour masquer la correction	
exercice.masquerCorrection = function () {
	document.getElementById("zone_correction").style.display = "none";
	document.getElementById("zone_saisie").style.display = "block";
}; // Fin de la méthode masquer_correction()


// Méthode : pour réinitialiser la zone de saisie...
exercice.recommencerSaisie = function () {
	document.getElementById("ma_saisie").value = document.getElementById("fourni").textContent;
    sessionStorage.clear();
	if (profil.retourne("ejdictoProfilAmenagement")){
	  $("#assistant").hide();
	}
}; // Fin de la méthode recommencer()

// Fin des méthodes de la classe exercice

exports.exercice = exercice;


},{"./assistantModule.js":38,"./diffModule.js":40,"./messageModule.js":43}],42:[function(require,module,exports){
/* ==================================== *
 *            e j D i c t o             *
 * ==================================== *
 * (c)2012-2020 - Patrick Cardona       *
 * Licence GPL version 3 ou ultérieure  *
 * VOIR la licence complète à la racine *
 * ==================================== */

/* CommonJS compatible format */

/* Fonctions : filtrage de liste : filtre.js */
/* Inspiré de w3schools :
/* https://www.w3schools.com/howto/howto_js_filter_lists.asp */

exports.filtrer = function (IDListe, motif) {
    let filtre, ul, li, a, i, txtValue;
    filtre = motif.toUpperCase();
    ul = document.getElementById(IDListe);
    li = ul.getElementsByTagName("li");
    for (i = 0; i < li.length; i++) {
        a = li[i].getElementsByTagName("a")[0];
        txtValue = a.textContent || a.innerText;
        if (txtValue.toUpperCase().indexOf(filtre) > -1) {
            li[i].style.display = "";
        } else {
            li[i].style.display = "none";
        }
    }
}
},{}],43:[function(require,module,exports){
/* ==================================== *
 *            e j D i c t o             *
 * ==================================== *
 * (c)2012-2020 - Patrick Cardona       *
 * Licence GPL version 3 ou ultérieure  *
 * VOIR la licence complète à la racine *
 * ==================================== */

/* CommonJS compatible format */

/* Fonctions de gestion d'un message popup */


const infos = require('../../../static/config/popups.json').infos;
/* Notifications ( message modal ) */
/*const Toastify = require('toastify-js');*/

class Popup {
  constructor (msgid = '000') {
	this.msgid = msgid;
	this.message = "Un message...";
	this.titre = "Titre";
  }
}

/* Méthode : préparation du message */
Popup.prototype.preparer = function (msgid) {
  this.msgid = msgid;
  let info = infos[msgid];
  this.titre = info.titre;
  this.message = info.contenu;
};

/* Méthode : affichage du message */
Popup.prototype.afficherMessage = function (msgid) {
  this.preparer(msgid);
  $("#titre_message").html(this.titre);
  $("#contenu_message").html(this.message);
  $("#notification").show();
}; // Fin de la méthode afficher_message()

// Fin des méthodes de la classe Popup

exports.Popup = Popup;


},{"../../../static/config/popups.json":82}],44:[function(require,module,exports){

exports.derouler_navigation = function () {
  $("#menu_gauche").show();
};

exports.refermer_navigation = function () {
    $("#menu_gauche").hide();
};

},{}],45:[function(require,module,exports){
/* ==================================== *
 *            e j D i c t o             *
 * ==================================== *
 * (c)2012-2020 - Patrick Cardona       *
 * Licence GPL version 3 ou ultérieure  *
 * VOIR la licence complète à la racine *
 * ==================================== */

/* CommonJS compatible format */

/* -----------------------------------
 *    Gestion des onglets (tabs)
 * -----------------------------------
 */

/* Tabs function */
/* Inspired from W3.css tutorial :
*  https://www.w3schools.com/w3css/w3css_tabulators.asp
*/

exports.afficheRubrique = function (evt, nomRubrique) {
  let i, rubriques, tablinks;
  rubriques = document.getElementsByClassName("rubrique");
  for (i = 0; i < rubriques.length; i++) {
    rubriques[i].style.display = "none";
  }
  tablinks = document.getElementsByClassName("tablink");
  for (i = 0; i < rubriques.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" triadic", "");
  }
  $('#'+ nomRubrique).show();
  evt.currentTarget.className += " triadic";
  return true;
};


},{}],46:[function(require,module,exports){
/* ==================================== *
 *            e j D i c t o             *
 * ==================================== *
 * (c)2012-2020 - Patrick Cardona       *
 * Licence GPL version 3 ou ultérieure  *
 * VOIR la licence complète à la racine *
 * ==================================== */

/* Gestion du PROFIL de l'utilisateur */

/* Objet profil */

var profil = {};

/* Méthodes de l'objet Profil */

profil.retourne = function(cle, defaut){
   if (localStorage.getItem(cle)){
    valeur = localStorage.getItem(cle);
    }else{
    valeur = defaut;
    }
    return valeur;
};


profil.changeNiveau = function() {
      let niveau = $("#niveau_choisi").val();
      localStorage.setItem("ejdictoProfilNiveau", niveau);
};

profil.changeAmenagement = function() {
      let amenagement = $("#amenagement_choisi").checked();
      localStorage.setItem("ejdictoProfilAmenagement", amenagement);
};


/* On expose l'objet profil */
exports.profil = profil;
},{}],47:[function(require,module,exports){
/* ==================================== *
 *            e j D i c t o             *
 * ==================================== *
 * (c)2012-2020 - Patrick Cardona       *
 * Licence GPL version 3 ou ultérieure  *
 * VOIR la licence complète à la racine *
 * ==================================== */

/* Script majeur en phase de développement : main.js
 * Compilé, il produit app.js dans le dossier 'build'
 *  --------------------------------
 * Appels des dépendances
 * Définiton du routage
 * Compilation des templates
 * --------------------------------
*/

"use strict";
/*jslint browser: true*/
/*global window*/

/* VERSION */
const versionApp = require('../package.json').version;

/* Messages de l'interface */
const MSG = require('../static/config/messages.json').msg;

/* Modules locaux */
window.afficheRubrique = require('./lib/scripts/ongletModule.js').afficheRubrique;
window.exercice = require('./lib/scripts/exerciceModule.js').exercice;
window.inserer = require('./lib/scripts/carspecModule.js').inserer;
window.profil = require('./lib/scripts/profilModule.js').profil;
window.inserer_mot = require('./lib/scripts/assistantModule.js').inserer_mot;
window.actualiser_assistant = require('./lib/scripts/assistantModule.js').actualiser_assistant;
window.afficher_aide = require('./lib/scripts/aideModule.js').afficher_aide;
window.masquer_aide = require('./lib/scripts/aideModule.js').masquer_aide;
window.alterner_section_aide = require('./lib/scripts/aideModule.js').alterner_section_aide;
window.filtrer = require('./lib/scripts/filtre.js').filtrer;
window.derouler_navigation = require('./lib/scripts/navigation.js').derouler_navigation;
window.refermer_navigation = require('./lib/scripts/navigation.js').refermer_navigation;

/* Dépendances externes : frameworks & modules*/
/* Runtime de compilation des templates Handlebars avec le bundler Browserify */
const Handlebars = require('hbsfy/runtime');
/* Routeur : Navigo */
const Navigo = require('navigo/lib/navigo');
/* Fonctions de manipulation du DOM (un JQuery lite) */
const chibi = require('chibijs/chibi');

/* ========================================
 *          H e l p e r s
 *           Génériques
 * ========================================
 */
 
/* Passer en capitale la première lettre de la chaine */
Handlebars.registerHelper("capitalisePremiereLettre", function (sChaine) {
  if(typeof sChaine === 'string') {
    return sChaine.charAt(0).toUpperCase() + sChaine.slice(1);
    }
    return null;
});

/* Condition sur la cible (type d'exercice) */
Handlebars.registerHelper("cibleEstUneDictee", function (sCible) {
  if(sCible == 'dictee'){
    return true;
    }else{
    return false;
    }
});

/* Interprète les valeurs booléennes en paire OUI / NON */
Handlebars.registerHelper("interpreteLogique", function (bValeur) {
  if( bValeur === "true" ){
    return "Oui"
    }else{
    return "Non"
    }
});

/* Interprète les niveaux d'enseignement : chiffre => nom */
Handlebars.registerHelper("interpreteNiveau", function (sChiffre) {
    let niveau = "";
    let etalon = sChiffre;
    switch(etalon) {
  case "5":
    niveau = "Cinquième";
    break;
  case "3":
    niveau = "Troisième";
    break;
  default:
    return "Tous";
  }
  return niveau;

});

/* Helper : Filtre par niveau */
Handlebars.registerHelper("estDuNiveauRequis", function (sNiveau) {
  let niveauProfil = profil.retourne("ejdictoProfilNiveau", false);
  if ( niveauProfil !== false ){
      niveauProfil += "e";
      if ( sNiveau === niveauProfil ){
        return true;
      }else{
        return false;
      }
  }
  /* Aucun profil => aucun filtre */
  return true;
});

/* Helper : filtre établissant la disponibilité d'une version aménagée de la dictée */

Handlebars.registerHelper("existeEnVersionAmenagee", function (info_dictam){
  let amenagement = profil.retourne("ejdictoProfilAmenagement", false);
  if ( amenagement === "true" ){
        if ( info_dictam === true ){
            return true;
        }else{
            return false;
        }
  }else{
    return true;
  }
});


/* Helper : contexte <=> la dictée choisie est-elle aménagée ? */

Handlebars.registerHelper("cetteDicteeEstAmenagee", function (exercice){
  let amenagement = profil.retourne("ejdictoProfilAmenagement", false);
  if ( amenagement === "true" && exercice === "dictée" ){
    return true;
  }
  return false;
});


/* Helper : on remplace les balises _( et )_ par des tags HTML */
Handlebars.registerHelper("afficheLesEtiquettes", function (texte, lacunes){
  /* Alternatives */
  let index;
  for (index = 0; index < 10; index++){
  texte = texte.replace(((index + 1)).toString(), lacunes[index].trim());
  }
  /* Etiquettes numérotées */
  let sortie = texte.replace(new RegExp(/_\(/,'g'), "<span class='w3-tag w3-round clair'>");
  sortie = sortie.replace(new RegExp(/\)_/,'g'), "</span>");
  return sortie;
});

/* Helper : augmente l'index de 1 */
Handlebars.registerHelper("indexPlusUn", function (index){
  let indice = 0;
  if (typeof index === 'integer'){
  indice = ++index;
  }else{
  indice = parseInt(index, 10);
  indice = indice + 1;
  }
  return indice;
});

/* Helper : découpe une proposition en mots */
Handlebars.registerHelper("decoupeLaProposition", function (proposition) {
  let mots = proposition.split("|");
  return mots;
});

/* Helper : encode HTML (entitie, etc.) */
Handlebars.registerHelper('encodeChaine',function(chaine){
    return new Handlebars.SafeString(chaine);
});

/* Helper : cherche si un mot a été inséré :
 * dans ce cas, on cache le formulaire */
Handlebars.registerHelper("ceChoixEstMasque", function(indice){
  let formulaire = "_form" + (indice + 1);
  if (sessionStorage.getItem("ejdicto" + formulaire)){
    return true;
    }
  return false;
});


/* Niveaux d'enseignement */
const niveaux = require ('../static/config/niveaux.json').niveaux;


/* ========================================
 *          Templates des menus
 * ========================================
 */

/* Modèle des menus : générique */
const menuTemplate = require("./menus/menuTemplate.hbs");
/* Modèle menu : contexte Dictée */
const menuExerciceTemplate = require("./menus/menuExerciceTemplate.hbs");
/* Modèle menu : contexte Liste */
const menuListeTemplate = require("./menus/menuListeTemplate.hbs");

/* ========================================
 *           Composants (Partials)
              et sections
              de l'Aide
 * ========================================
 */

/* Bouton caractère spécial */
Handlebars.registerPartial("barre", require("./composants/barreCaracteresTemplate.hbs"));
/* Source de fichier audio */
Handlebars.registerPartial("sourceaudio", require("./composants/sourceAudioTemplate.hbs"));
/* Assistant de la saisie */
Handlebars.registerPartial("assistant",
require("./composants/assistantDeLaSaisieTemplate.hbs"));
/* Page Apropos */
Handlebars.registerPartial("apropos",
require("./composants/aproposTemplate.hbs"));
/* Licence */
Handlebars.registerPartial("licence",
require("./composants/licenceTemplate.hbs"));
/* Section de l'aide : prise en main */
Handlebars.registerPartial("prise_en_main",
require("./aides/aidePriseEnMain.hbs"));
/* Section de l'aide : amélioration de la saisie */
Handlebars.registerPartial("amelioration",
require("./aides/aideAmelioration.hbs"));
/* Section de l'aide : dictée aménagée */
Handlebars.registerPartial("dictam",
require("./aides/aideDictam.hbs"));
/* Section de l'aide : usage mobile */
Handlebars.registerPartial("usage_mobile",
require("./aides/aideUsageMobile.hbs"));

/* ========================================
 *          Templates des Pages
 * ========================================
 */


/* Gestion erreur de routage : 404 page not found */
const erreurTemplate = require("./pages/erreurTemplate.hbs");
/* Page d'accueil générale */
const accueilTemplate = require("./pages/accueilTemplate.hbs");
/* Liste des exercices */
const listeTemplate = require("./pages/listeTemplate.hbs");
/* Page d'accueil d'un exercice : dictée, etc. */
const accueilExerciceTemplate = require("./pages/accueilExerciceTemplate.hbs");
/* Sous-Page : contexte Dictee : lecteur audio */
const ecouterTemplate = require("./pages/ecouterTemplate.hbs");
/* Sous-Page : contexte exercice (dictee, etc) : saisie et correction */
const saisirTemplate = require("./pages/saisirTemplate.hbs");
/* Sous-Page : contexte exercice (dictée ou réécriture) : mentions légales */
const mentionsTemplate = require("./pages/mentionsTemplate.hbs");
/* Sommaire aide contexte dictée */
const aideTemplate = require("./pages/aideTemplate.hbs");
/* Sous-Page dans le contexte Reecriture : consigne */
const consigneReecritureTemplate = require("./pages/consigneReecritureTemplate.hbs");
/* Page de gestion du profil */
const profilTemplate = require("./pages/profilTemplate.hbs");
/* Formulaire de modification du profil */
const formProfilTemplate = require("./pages/formProfilTemplate.hbs");
/* Pied de page */
const piedDePageTemplate = require("./composants/piedTemplate.hbs");
/* Zone de notification */
const notificationTemplate = require("./composants/notificationTemplate.hbs");
const zone_notification = notificationTemplate();

/* =========================================================
 *    On charge l'interface via un événement global load
 * =========================================================
 */

window.addEventListener('load', () => {
 /* Zones cibles */
const menu = $('#menu');
const app = $('#app');

const aide = $("#aide");
const notification = $("#notification"); 
const piedDePage = piedDePageTemplate();

/* ==================================================
 *                 * MENUS *
 * ==================================================
 */

/* On importe les données du menu dans le contexte Accueil */
const dataMenuAccueil = require("../static/config/menu_accueil.json").menu;
const menuAccueil = menuTemplate(dataMenuAccueil);
/* On importe les données du menu Liste */
/* Sera réutilisé de manière dynamique dans le template de menu de liste... */
const dataMenuListe = require("../static/config/menu_liste.json").menu;
/* On importe les données du menu Aide */
const dataMenuAide = require("../static/config/menu_aide.json").menu;
const menuAide = menuTemplate(dataMenuAide);
/* On importe les données du menu Profil */
const dataMenuProfil = require("../static/config/menu_profil.json").menu;
const menuProfil = menuTemplate(dataMenuProfil);
/* On importe les données du menu Modprefs (modification du profil) */
const dataMenuModprefs = require("../static/config/menu_modprefs.json").menu;
const menuModprefs = menuTemplate(dataMenuModprefs);

/*  On importe et on conserve les items des menus 
 *  dans les contextes Dictée et Réécriture 
 *  IMPORTANT ! Du fait de l'appel avec le contexte 'did' 
 *  supplémentaire, on importe 
 *  directement le tableau des items dans ce cas.
 */
const dataMenuDictee = require("../static/config/menu_dictee.json").menu;
const dataMenuEcouter = require("../static/config/menu_ecouter.json").menu;
const dataMenuSaisirDictee = require("../static/config/menu_saisir_dictee.json").menu;
const dataMenuMentionsDictee = require("../static/config/menu_mentions_dictee.json").menu;
/* Idem pour les menus de réécriture */
const dataMenuReecriture = require("../static/config/menu_reecriture.json").menu;
const dataMenuConsigne = require("../static/config/menu_consigne.json").menu;
const dataMenuSaisirReecriture = require("../static/config/menu_saisir_reecriture.json").menu;
const dataMenuMentionsReecriture = require("../static/config/menu_mentions_reecriture.json").menu;

/* =================================================
 *                 * Formats Audio *
 * =================================================
 */

const formatAudio = require("../static/config/format_audio.json").source;

/* ================================================
 *           Table des caractères spéciaux
 * ================================================
 */
 
 const tableCaracteres = 
require("../static/config/table_caracteres.json").caracteres;




/* ===========================
 *     A I D E
 *     Initialisation
 *     du contenu
 * ===========================
 */
 
 /* Données du modèle Apropos (partial appelé dans le template Aide) */
    let moduleJSONdata = require ('../static/config/apropos.json');
    let rubriquesJSONdataApropos = require ('../static/config/rubriques_apropos.json').rubriques;
    let modeleApropos = {
	  'app_name': 'ejDicto',
	  'module': moduleJSONdata,
	  'rubs': rubriquesJSONdataApropos,
	  'version': versionApp
    };
/* Données du modèle Licence (partial appelé dans le template Aide) */
    let dataLicence = require("../static/config/licence.json").licence;
    let rubriquesJSONdataLicence = require ('../static/config/rubriques_licence.json').rubriques;
    let texte_page_1 = dataLicence.pages[0].texte;
    let texte_page_2 = dataLicence.pages[1].texte;
    let now = new Date();
	let actuel = now.getFullYear();
    let modeleLicence = {
      'debut': dataLicence.debut,
	  'actuel': actuel,
	  'auteur': dataLicence.auteur,
	  'texte_page_1': texte_page_1,
	  'texte_page_2': texte_page_2,
	  "rubs": rubriquesJSONdataLicence
    };
  let contenu = {
    'modeleApropos': modeleApropos,
    'modeleLicence': modeleLicence
  }
  const SommaireAide = aideTemplate(contenu);
  

 /*
  * ===========================
  *       *  ROUTAGE *
  * ===========================
  */

/* Déclaration du routage */
var root = "/ejdicto/";
var useHash = true;
var hash = '#!';
var router = new Navigo(root, useHash, hash);


/* Autres routes */
 router.on({

 /* === Aide === */
 'aide': function () {
  app.html(SommaireAide);
  menu.html(menuAide);
  },


 /* === Liste des dictées === */
    'liste/dictees': function () {
    let niveau = profil.retourne("ejdictoProfilNiveau",0)
	let JSONdata = require('../static/config/liste_dictees.json');
	let contenu = {
		'info': JSONdata,
		'exercice': 'dictée',
		'cible': 'dictee',
		'niveau': niveau
		}
	let html = listeTemplate(contenu);
	dataMenuListe.exercice = 'dictée';
	const menuListe = menuListeTemplate(dataMenuListe);
	menu.html(menuListe);
	app.html(html);
	},


 /* === Liste des réécritures === */
    'liste/reecritures': function () {
    let niveau = profil.retourne("ejdictoProfilNiveau",0)
	let JSONdata = require('../static/config/liste_reecritures.json');
	let contenu = {
		'info': JSONdata,
		'exercice': 'réécriture',
		'cible': 'reecriture',
		'niveau': niveau
		}
	let html = listeTemplate(contenu);
	dataMenuListe.exercice = 'réécriture';
    const menuListe = menuListeTemplate(dataMenuListe);
	menu.html(menuListe);
	app.html(html);
	},



 /* === Page du contexte Dictee === */
    /* une dictée a été choisie => id -> did */
    'dictee/:id': function (params) {
	let contenu = {
		'did': params.id,
		'exercice': 'dictée',
		'consigne': MSG.consigneDictee,
		'consigneDicteeAmenagee': MSG.consigneDicteeAmenagee,
		'lien': 'ecouter',
		'legende': 'écoute'
	};
	let html = accueilExerciceTemplate(contenu);
    dataMenuDictee.did = params.id;
    dataMenuDictee.exercice = 'dictée';
	let menuD = menuExerciceTemplate(dataMenuDictee);
	menu.html(menuD);
	app.html(html);
	},


 /* === Page du contexte Réécriture === */
    /* une réécriture a été choisie => id -> did */
    'reecriture/:id': function (params) {
	let contenu = {
		'did': params.id,
		'exercice': 'réécriture',
		'consigne': "D'abord, lisez attentivement la consigne de la \
          réécriture. Notez au brouillon les passages à transformer",
		'lien': 'consigne',
		'legende': 'consigne'
	}
	let html = accueilExerciceTemplate(contenu);
	dataMenuReecriture.did = params.id;
	dataMenuReecriture.exercice = 'réécriture';
	let menuR = menuExerciceTemplate(dataMenuReecriture);
	menu.html(menuR);
	app.html(html);
	},


 /* === Page avec un lecteur audio === */ 
  /* écoute de la dictée choisie : id -> did */
  'ecouter/:id': function (params) {
  /* Rubriques des onglets : dictée aménagée */
  let rubriquesJSONdata = require ('../static/config/rubriques_dictam.json').rubriques;
  /* Source des données de la dictée choisie... */
  let source = "./static/data/dictee" + params.id + ".json";
  /* Est-ce une dictée aménagée ? */
  let amenagement = profil.retourne("ejdictoProfilAmenagement", false);
  if ( amenagement === 'true' ){
    source = "./static/data/dictam" + params.id + ".json";
  }
    /* On récupère les données de la dictée */
    fetch(source)
		.then((response) => {
		  return response.json();
        })
        .then((data) => {
		    /* On prépare le contenu du template 'ecouterTemplate' */
	let contenu = {
		'did': params.id,
		'sources': formatAudio,
		'fourni': data.fourni,
		'lacunes': data.lacunes || "",
		'exercice': 'dictée',
		'rubs': rubriquesJSONdata,
		'mots' : data.consigne
	};
	let html = ecouterTemplate(contenu);
	app.html(html);
    /* Menu de la dictée avec contexte 'did' */
	/* On gère l'échec de la récupération des données... */
	}).catch((err) => {
		console.log("Erreur: "+ err);
	 });
    /* Gestion du menu */
    dataMenuEcouter.did = params.id;
    dataMenuEcouter.exercice = 'dictée';
	let menuD = menuExerciceTemplate(dataMenuEcouter);
	menu.html(menuD);
	},


  /* === Page de saisie et de correction de la dictée === */
  /* c'est le coeur de l'application */
  'saisir/dictee/:id': function (params) {
  /* Source des données de la dictée choisie... */
  let source = "./static/data/dictee" + params.id + ".json";
  /* Est-ce une dictée aménagée ? */
  let amenagement = profil.retourne("ejdictoProfilAmenagement", false);
  if ( amenagement === 'true' ){
    source = "./static/data/dictam" + params.id + ".json";
  }
    /* On récupère les données de la dictée sélectionnée
    	 Au format JSon et on complète ce contenu pour 
    	 Initialiser le template 'saisir...' et afficher son contenu... */
	fetch(source)
		.then((response) => {
		  return response.json();
        })
        .then((data) => {
		    /* On prépare le contenu du template 'saisirTemplate...' */
			let contenu = {};
		    /* On prépare le contenu du Partial 'barre' */
			contenu.caracteres = tableCaracteres;
		    /* On ajoute les autres données :
		     * id de la dictée : passé en paramètre de l'URL
		     */
 			contenu.did = params.id;
			/* On passe les paramètres du type d'exercice */
			contenu.exercice = 'dictée';
			contenu.cible = 'dictee';
		    /* Les données récupérées à partir du fichier 
		     *  dictee + id + .json
             */
			contenu.attendu = data.attendu;
			contenu.fourni = data.fourni;
		    /* On récupère une éventuelle saisie... */
		    if (sessionStorage.getItem("dictee")){
		      contenu.saisie = sessionStorage.getItem("dictee");
		    }else{
		    contenu.saisie = contenu.fourni;
		    }
		    /* On passe les propositions de saisie à l'assistant
		    dans le contexte d'une dictée aménagée */
		    if ( amenagement ) {
		      contenu.propositions = data.lacunes;
		    }
		    /* On crée le contenu de la zone de saisie */
		    let html = saisirTemplate(contenu);
		    	/* On l'intègre dans le document */
		    app.html(html);

	/* On gère l'échec de la récupération des données... */
	}).catch((err) => {
		console.log("Erreur: "+ err);
	 });

	/* On crée et on affiche le menu lié au contexte Dictée */
    dataMenuSaisirDictee.did = params.id;
    dataMenuSaisirDictee.exercice = 'dictée';
	let menuD = menuExerciceTemplate(dataMenuSaisirDictee);
	menu.html(menuD);
    /* Notifications */
    notification.html(zone_notification);
	}, /* Fin du routage vers la page de saisie de la dictée... */


   /* =====================================================
    * Page de saisie et de correction de la réécriture... 
    * =====================================================
    */
  'saisir/reecriture/:id': function (params) {
    	/* On récupère les données de la réécriture sélectionnée
    	 * Au format JSon et on complète ce contenu pour 
    	 * Initialiser le template 'saisirr...' et afficher son contenu... 
    	 */
    fetch("./static/data/jecho" + params.id + ".json")
    	.then((response) => {
		  return response.json();
        })
        .then((data) => {
		    /* On prépare le contenu du template 'saisir...' */
			let contenu = {};
		    /* On prépare le contenu du Partial 'barre' */
			contenu.caracteres = tableCaracteres;
		    /* On ajoute les autres données :
		     *  id de la réécriture : passé en paramètre de l'URL
		     */
			contenu.did = params.id;
		    /* Les données récupérées à partir du fichier 
		     * jecho + id + .json :
		     */
            /* C'est le texte initial */
			contenu.fourni = data.fourni;
			/* C'est le texte transformé attendu */
			contenu.attendu = data.attendu;
		    /* On récupère une éventuelle saisie... */
		    contenu.saisie = "";
		    if (sessionStorage.getItem("reecriture")){
		      contenu.saisie = sessionStorage.getItem("reecriture");
		    }else{
		      /* Sinon, c'est le texte initial... */
		      contenu.saisie = contenu.fourni;
		    }
		    /* On passe aussi le type d'exercice */
            contenu.exercice = 'réécriture';
            contenu.cible = 'reecriture';
		    /* On crée le contenu de la zone de saisie */
		    let html = saisirTemplate(contenu);
            /* On l'intègre dans le document */
		    app.html(html);
		    /* On ajoute la zone de notification */
            notification.html(zone_notification);

	/* On gère l'échec de la récupération des données... */
	}).catch((err) => {
		console.log("Erreur: "+ err);
	 });

	/* On crée et on affiche le menu lié au contexte : modèle Dictée */
    dataMenuSaisirReecriture.did = params.id;
    dataMenuSaisirReecriture.exercice = 'réécriture';
	let menuR = menuExerciceTemplate(dataMenuSaisirReecriture);
	menu.html(menuR);
	/* Notifications */
    notification.html(zone_notification);
	}, /* Fin du routage vers la page de saisie de la réécriture... */


 /* -------------------------------------------
  *  === Page des mentions de la dictée ===
  * -------------------------------------------
  */
    'mentions/dictee/:id': function (params) {

  /* On récupère les données de l'exercice sélectionné
   * Au format JSon et on complète ce contenu pour 
   * Initialiser le template 'saisir...' et afficher son contenu... 
   */
    fetch("./static/data/dictee" + params.id + ".json")
    	.then((response) => {
		  return response.json();
        })
        .then((data) => {
		    /* On prépare le contenu du template 'mentions...' */
			let contenu = {};
		    /* id de la dictée : passé en paramètre de l'URL */
			contenu.did = params.id;
		    /* Les données récupérées à partir du 
		     * fichier dictee + id + .json : 
             */
			contenu.auteur = data.auteur;
			contenu.titre = data.titre;
			contenu.prof = data.prof;
            contenu.ouvrage = data.ouvrage;
            contenu.exercice = 'dictée';
            contenu.cible = 'dictee';
            contenu.remarque = data.remarque || "";
            contenu.voix = data.voix || "";
            /* On ajoute une condition pour montrer 
             * le bouton de partage 
             */
            if(navigator.share){
              contenu.partage = true;
            }else{
              contenu.partage = false;
            }
		    /* On crée le contenu de la zone de mentions */
		    let html = mentionsTemplate(contenu);
		    	/* On l'intègre dans le document */
		    app.html(html);

	/* On gère l'échec de la récupération des données... */
	}).catch((err) => {
		console.log("Erreur: "+ err);
    });
	/* On crée et on affiche le menu lié au contexte Dictée */
	dataMenuMentionsDictee.did = params.id;
	dataMenuMentionsDictee.exercice = 'dictée';
	let menuD = menuExerciceTemplate(dataMenuMentionsDictee);
	menu.html(menuD);
	}, /* Fin du routage vers la page des mentions de la dictée */

 /* ---------------------------------------------
  *  === Page des mentions de la réécriture ===
  *  --------------------------------------------
  */
    'mentions/reecriture/:id': function (params) {

  /* On récupère les données de la réécriture sélectionnée
   *  Au format JSon et on complète ce contenu pour 
   *  Initialiser le template 'saisir_reecriture...' et afficher son contenu... 
   */
    fetch("./static/data/jecho" + params.id + ".json")
        .then((response) => {
          return response.json();
        })
        .then((data) => {
      /* On prépare le contenu du template 'mentions...' */
      let contenu = {};
		    /* id de la récriture : passé en paramètre de l'URL */
			contenu.did = params.id;
		    /* Les données récupérées à partir 
		     * du fichier dictee + id + .json :
		     */
			contenu.auteur = data.auteur;
			contenu.titre = data.titre;
			contenu.prof = data.prof;
            contenu.ouvrage = data.ouvrage;
            contenu.exercice = 'réécriture';
            contenu.cible = 'reecriture';
            /* On ajoute une condition pour montrer 
            le bouton de partage */
            if(navigator.share){
              contenu.partage = true;
            }else{
              contenu.partage = false;
            }
		    /* On crée le contenu de la zone de mentions */
		    let html = mentionsTemplate(contenu);
		    /* On l'intègre dans le document */
		    app.html(html);

	/* On gère l'échec de la récupération des données. */
	}).catch((err) => {
		console.log("Erreur: "+ err);
    });
	/* On crée et on affiche le menu lié au contexte Réécriture 
	 * Même modèle que celui de la dictée
	 */
	dataMenuMentionsReecriture.did = params.id;
	dataMenuMentionsReecriture.exercice = 'réécriture';
	let menuR = menuExerciceTemplate(dataMenuMentionsReecriture);
	menu.html(menuR);
	},

 /* --------------------------------------------
  * === Page de la consigne de la réécriture ===
  * --------------------------------------------
  */
    'consigne/:id': function (params) {

  /* On récupère les données de la réécriture sélectionnée
   *  Au format JSon et on complète ce contenu pour 
   *  Initialiser le template 'consigneReecritureTemplate' et afficher son contenu...
   */
    fetch("./static/data/jecho" + params.id + ".json")
        .then((response) => {
          return response.json();
        })
        .then((data) => {
      /* On prépare le contenu du template 'consigne...' */
      let contenu = {};
		    /* id de la réécriture : passé en paramètre de l'URL */
			contenu.did = params.id;
		    /* Les données récupérées à partir 
		     * du fichier dictee + id + .json :
		     */
			contenu.consigne = data.consigne;
			/* Texte initial */
			contenu.fourni = data.fourni;
		    /* On crée le contenu de la zone de consigne */
		    let html = consigneReecritureTemplate(contenu);
		    /* On l'intègre dans le document */
		    app.html(html);

	/* On gère l'échec de la récupération des données... */
	}).catch((err) => {
		console.log("Erreur: "+ err);
    });
	/* On crée et on affiche le menu lié au contexte Réécriture 
	 * Même modèle que celui de la dictée
	 */
    dataMenuConsigne.did = params.id;
    dataMenuConsigne.exercice = 'réécriture';
	let menuR = menuExerciceTemplate(dataMenuConsigne);
	menu.html(menuR);
	},

  /* =========================================================
   * === Page de gestion du profil / éventuellement modifié ===
   * =========================================================
   */
   'profil': function(){
    let niveau = profil.retourne('ejdictoProfilNiveau','tous');
    let amenagement = profil.retourne('ejdictoProfilAmenagement',false);
    let contenu = {
      'niveau': niveau,
      'amenagement': amenagement,
    };
    let html = profilTemplate(contenu);
    app.html(html);
    menu.html(menuProfil);
    },

  /* ===========================================
   * === Formulaire : modification du profil ===
   * ===========================================
   */
   'modprefs': function(){
    let checked;
    let amenagement = profil.retourne('ejdictoProfilAmenagement',false);
    if ( amenagement === "true" || amenagement === true ){
      checked = "checked";
      }else{
      checked = "";
      }
    let contenu = {
      'niveaux': niveaux,
      'checked': checked
    };
    let html = formProfilTemplate(contenu);
    app.html(html);
    menu.html(menuModprefs);
    },

  /* =========================
   * === Chemin générique ===
   * =========================
   */

  '*': function() {
  let html = accueilTemplate({"bienvenue": MSG.bienvenue});
  app.html(html);
  app.htmlAppend(piedDePage);
  menu.html(menuAccueil);
  menu.show();
  sessionStorage.clear();

  }
  /* Résolution de la toute */
}).resolve();


 /* ===========================
  * === Page d'accueil ===
  * ===========================
  */
 router.on(function () {
 let html = accueilTemplate({"bienvenue": "Bienvenue dans votre espace d'entrainement en orthographe !"});
 app.html(html);
 menu.html(menuAccueil);
 sessionStorage.clear();
 }).resolve();



/* =============================
 * ===   Route inconnue ===
 * ============================
 */
router.notFound(function () {
 const html = erreurTemplate({
 couleur: 'yellow',
 titre: 'Erreur 404 - Page introuvable !',
 message: 'Ce chemin n\'existe pas.'
    });
 menu.html(menuAccueil)
 app.html(html);
  });

/* Fin table de routage */



}); /* Fin de event load */


},{"../package.json":25,"../static/config/apropos.json":62,"../static/config/format_audio.json":63,"../static/config/licence.json":64,"../static/config/liste_dictees.json":65,"../static/config/liste_reecritures.json":66,"../static/config/menu_accueil.json":67,"../static/config/menu_aide.json":68,"../static/config/menu_consigne.json":69,"../static/config/menu_dictee.json":70,"../static/config/menu_ecouter.json":71,"../static/config/menu_liste.json":72,"../static/config/menu_mentions_dictee.json":73,"../static/config/menu_mentions_reecriture.json":74,"../static/config/menu_modprefs.json":75,"../static/config/menu_profil.json":76,"../static/config/menu_reecriture.json":77,"../static/config/menu_saisir_dictee.json":78,"../static/config/menu_saisir_reecriture.json":79,"../static/config/messages.json":80,"../static/config/niveaux.json":81,"../static/config/rubriques_apropos.json":83,"../static/config/rubriques_dictam.json":84,"../static/config/rubriques_licence.json":85,"../static/config/table_caracteres.json":86,"./aides/aideAmelioration.hbs":26,"./aides/aideDictam.hbs":27,"./aides/aidePriseEnMain.hbs":28,"./aides/aideUsageMobile.hbs":29,"./composants/aproposTemplate.hbs":30,"./composants/assistantDeLaSaisieTemplate.hbs":31,"./composants/barreCaracteresTemplate.hbs":32,"./composants/licenceTemplate.hbs":33,"./composants/notificationTemplate.hbs":34,"./composants/piedTemplate.hbs":35,"./composants/sourceAudioTemplate.hbs":36,"./lib/scripts/aideModule.js":37,"./lib/scripts/assistantModule.js":38,"./lib/scripts/carspecModule.js":39,"./lib/scripts/exerciceModule.js":41,"./lib/scripts/filtre.js":42,"./lib/scripts/navigation.js":44,"./lib/scripts/ongletModule.js":45,"./lib/scripts/profilModule.js":46,"./menus/menuExerciceTemplate.hbs":48,"./menus/menuListeTemplate.hbs":49,"./menus/menuTemplate.hbs":50,"./pages/accueilExerciceTemplate.hbs":51,"./pages/accueilTemplate.hbs":52,"./pages/aideTemplate.hbs":53,"./pages/consigneReecritureTemplate.hbs":54,"./pages/ecouterTemplate.hbs":55,"./pages/erreurTemplate.hbs":56,"./pages/formProfilTemplate.hbs":57,"./pages/listeTemplate.hbs":58,"./pages/mentionsTemplate.hbs":59,"./pages/profilTemplate.hbs":60,"./pages/saisirTemplate.hbs":61,"chibijs/chibi":1,"hbsfy/runtime":23,"navigo/lib/navigo":24}],48:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "  <a href=\""
    + alias4(((helper = (helper = lookupProperty(helpers,"lien") || (depth0 != null ? lookupProperty(depth0,"lien") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"lien","hash":{},"data":data,"loc":{"start":{"line":18,"column":11},"end":{"line":18,"column":19}}}) : helper)))
    + "\" class=\"w3-bar-item w3-button w3-light-gray w3-border\">\n  "
    + ((stack1 = ((helper = (helper = lookupProperty(helpers,"icone") || (depth0 != null ? lookupProperty(depth0,"icone") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"icone","hash":{},"data":data,"loc":{"start":{"line":19,"column":2},"end":{"line":19,"column":13}}}) : helper))) != null ? stack1 : "")
    + " "
    + alias4(((helper = (helper = lookupProperty(helpers,"legende") || (depth0 != null ? lookupProperty(depth0,"legende") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"legende","hash":{},"data":data,"loc":{"start":{"line":19,"column":14},"end":{"line":19,"column":25}}}) : helper)))
    + "</a>\n";
},"3":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3=container.escapeExpression, alias4=container.lambda, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"bouton") : depth0),{"name":"if","hash":{},"fn":container.program(4, data, 0, blockParams, depths),"inverse":container.program(6, data, 0, blockParams, depths),"data":data,"loc":{"start":{"line":27,"column":2},"end":{"line":31,"column":9}}})) != null ? stack1 : "")
    + "  \n<!-- Actions -->\n"
    + ((stack1 = lookupProperty(helpers,"each").call(alias1,(depths[1] != null ? lookupProperty(depths[1],"actions") : depths[1]),{"name":"each","hash":{},"fn":container.program(8, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"loc":{"start":{"line":34,"column":0},"end":{"line":41,"column":9}}})) != null ? stack1 : "")
    + "  <div class=\"w3-container\">\n    <h1>"
    + alias3(((helper = (helper = lookupProperty(helpers,"titre") || (depth0 != null ? lookupProperty(depth0,"titre") : depth0)) != null ? helper : alias2),(typeof helper === "function" ? helper.call(alias1,{"name":"titre","hash":{},"data":data,"loc":{"start":{"line":43,"column":8},"end":{"line":43,"column":17}}}) : helper)))
    + " de la "
    + alias3(alias4((depths[1] != null ? lookupProperty(depths[1],"exercice") : depths[1]), depth0))
    + " "
    + alias3(alias4((depths[1] != null ? lookupProperty(depths[1],"did") : depths[1]), depth0))
    + "\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(lookupProperty(helpers,"cetteDicteeEstAmenagee")||(depth0 && lookupProperty(depth0,"cetteDicteeEstAmenagee"))||alias2).call(alias1,(depths[1] != null ? lookupProperty(depths[1],"exercice") : depths[1]),{"name":"cetteDicteeEstAmenagee","hash":{},"data":data,"loc":{"start":{"line":44,"column":11},"end":{"line":44,"column":47}}}),{"name":"if","hash":{},"fn":container.program(13, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"loc":{"start":{"line":44,"column":5},"end":{"line":46,"column":12}}})) != null ? stack1 : "")
    + "    </h1>\n  </div>\n</div>\n";
},"4":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <button class=\"w3-button w3-"
    + alias4(((helper = (helper = lookupProperty(helpers,"couleur") || (depth0 != null ? lookupProperty(depth0,"couleur") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"couleur","hash":{},"data":data,"loc":{"start":{"line":28,"column":32},"end":{"line":28,"column":43}}}) : helper)))
    + " w3-xlarge\" onclick=\""
    + alias4(((helper = (helper = lookupProperty(helpers,"action") || (depth0 != null ? lookupProperty(depth0,"action") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"action","hash":{},"data":data,"loc":{"start":{"line":28,"column":64},"end":{"line":28,"column":74}}}) : helper)))
    + "\">"
    + ((stack1 = ((helper = (helper = lookupProperty(helpers,"icone") || (depth0 != null ? lookupProperty(depth0,"icone") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"icone","hash":{},"data":data,"loc":{"start":{"line":28,"column":76},"end":{"line":28,"column":87}}}) : helper))) != null ? stack1 : "")
    + "</button>\n";
},"6":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <a href=\""
    + ((stack1 = ((helper = (helper = lookupProperty(helpers,"action") || (depth0 != null ? lookupProperty(depth0,"action") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"action","hash":{},"data":data,"loc":{"start":{"line":30,"column":13},"end":{"line":30,"column":25}}}) : helper))) != null ? stack1 : "")
    + "\" class=\"w3-button w3-"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"couleur") || (depth0 != null ? lookupProperty(depth0,"couleur") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"couleur","hash":{},"data":data,"loc":{"start":{"line":30,"column":47},"end":{"line":30,"column":58}}}) : helper)))
    + " w3-xlarge\">"
    + ((stack1 = ((helper = (helper = lookupProperty(helpers,"icone") || (depth0 != null ? lookupProperty(depth0,"icone") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"icone","hash":{},"data":data,"loc":{"start":{"line":30,"column":70},"end":{"line":30,"column":81}}}) : helper))) != null ? stack1 : "")
    + "</a>\n";
},"8":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"bouton") : depth0),{"name":"if","hash":{},"fn":container.program(9, data, 0),"inverse":container.program(11, data, 0),"data":data,"loc":{"start":{"line":35,"column":2},"end":{"line":40,"column":9}}})) != null ? stack1 : "");
},"9":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "      <button onclick=\""
    + alias4(((helper = (helper = lookupProperty(helpers,"lien") || (depth0 != null ? lookupProperty(depth0,"lien") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"lien","hash":{},"data":data,"loc":{"start":{"line":36,"column":23},"end":{"line":36,"column":31}}}) : helper)))
    + "/"
    + alias4(container.lambda(((stack1 = (data && lookupProperty(data,"root"))) && lookupProperty(stack1,"did")), depth0))
    + "\" class=\"w3-bar-item w3-button w3-"
    + alias4(((helper = (helper = lookupProperty(helpers,"couleur") || (depth0 != null ? lookupProperty(depth0,"couleur") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"couleur","hash":{},"data":data,"loc":{"start":{"line":36,"column":79},"end":{"line":36,"column":90}}}) : helper)))
    + " w3-right\">"
    + ((stack1 = ((helper = (helper = lookupProperty(helpers,"icone") || (depth0 != null ? lookupProperty(depth0,"icone") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"icone","hash":{},"data":data,"loc":{"start":{"line":36,"column":101},"end":{"line":36,"column":112}}}) : helper))) != null ? stack1 : "")
    + " "
    + alias4(((helper = (helper = lookupProperty(helpers,"legende") || (depth0 != null ? lookupProperty(depth0,"legende") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"legende","hash":{},"data":data,"loc":{"start":{"line":36,"column":113},"end":{"line":36,"column":124}}}) : helper)))
    + " \n      </button>\n";
},"11":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "      <a href=\""
    + alias4(((helper = (helper = lookupProperty(helpers,"lien") || (depth0 != null ? lookupProperty(depth0,"lien") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"lien","hash":{},"data":data,"loc":{"start":{"line":39,"column":15},"end":{"line":39,"column":23}}}) : helper)))
    + "/"
    + alias4(container.lambda(((stack1 = (data && lookupProperty(data,"root"))) && lookupProperty(stack1,"did")), depth0))
    + "\" class=\"w3-bar-item w3-button w3-"
    + alias4(((helper = (helper = lookupProperty(helpers,"couleur") || (depth0 != null ? lookupProperty(depth0,"couleur") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"couleur","hash":{},"data":data,"loc":{"start":{"line":39,"column":71},"end":{"line":39,"column":82}}}) : helper)))
    + " w3-right\">"
    + ((stack1 = ((helper = (helper = lookupProperty(helpers,"icone") || (depth0 != null ? lookupProperty(depth0,"icone") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"icone","hash":{},"data":data,"loc":{"start":{"line":39,"column":93},"end":{"line":39,"column":104}}}) : helper))) != null ? stack1 : "")
    + " "
    + alias4(((helper = (helper = lookupProperty(helpers,"legende") || (depth0 != null ? lookupProperty(depth0,"legende") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"legende","hash":{},"data":data,"loc":{"start":{"line":39,"column":105},"end":{"line":39,"column":116}}}) : helper)))
    + "</a>\n";
},"13":function(container,depth0,helpers,partials,data) {
    return "	    aménagée\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<!-- ==================================\n *            e j D i c t o             *\n * ==================================== *\n * (c)2012-2020 - Patrick Cardona       *\n * Licence GPL version 3 ou ultérieure  *\n * VOIR la licence complète à la racine *\n * ==================================== -->\n\n <!-- Navigation : Menu : menuExerciceTemplate.hbs -->\n\n<!-- ============================================ -->\n\n<!-- Sidebar -->\n<div class=\"w3-sidebar w3-bar-block\" style=\"display:none\" id=\"menu_gauche\">\n  <button onclick=\"refermer_navigation()\" class=\"w3-bar-item w3-button w3-large w3-text-teal\">Fermer \n  <i class=\"icon-retourner w3-right\"></i></button>\n"
    + ((stack1 = lookupProperty(helpers,"each").call(alias1,(depth0 != null ? lookupProperty(depth0,"items") : depth0),{"name":"each","hash":{},"fn":container.program(1, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"loc":{"start":{"line":17,"column":0},"end":{"line":20,"column":11}}})) != null ? stack1 : "")
    + "\n</div>\n\n<!-- Contexte -->\n<div class=\"w3-"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"couleur") || (depth0 != null ? lookupProperty(depth0,"couleur") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(alias1,{"name":"couleur","hash":{},"data":data,"loc":{"start":{"line":25,"column":15},"end":{"line":25,"column":26}}}) : helper)))
    + "\">\n"
    + ((stack1 = lookupProperty(helpers,"with").call(alias1,(depth0 != null ? lookupProperty(depth0,"contexte") : depth0),{"name":"with","hash":{},"fn":container.program(3, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"loc":{"start":{"line":26,"column":0},"end":{"line":50,"column":9}}})) != null ? stack1 : "");
},"useData":true,"useDepths":true});

},{"hbsfy/runtime":23}],49:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "  <a href=\""
    + alias4(((helper = (helper = lookupProperty(helpers,"lien") || (depth0 != null ? lookupProperty(depth0,"lien") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"lien","hash":{},"data":data,"loc":{"start":{"line":18,"column":11},"end":{"line":18,"column":19}}}) : helper)))
    + "\" class=\"w3-bar-item w3-button w3-light-gray w3-border\">\n  "
    + ((stack1 = ((helper = (helper = lookupProperty(helpers,"icone") || (depth0 != null ? lookupProperty(depth0,"icone") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"icone","hash":{},"data":data,"loc":{"start":{"line":19,"column":2},"end":{"line":19,"column":13}}}) : helper))) != null ? stack1 : "")
    + " "
    + alias4(((helper = (helper = lookupProperty(helpers,"legende") || (depth0 != null ? lookupProperty(depth0,"legende") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"legende","hash":{},"data":data,"loc":{"start":{"line":19,"column":14},"end":{"line":19,"column":25}}}) : helper)))
    + "</a>\n";
},"3":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"bouton") : depth0),{"name":"if","hash":{},"fn":container.program(4, data, 0, blockParams, depths),"inverse":container.program(6, data, 0, blockParams, depths),"data":data,"loc":{"start":{"line":27,"column":2},"end":{"line":31,"column":9}}})) != null ? stack1 : "")
    + "  \n<!-- Actions -->\n"
    + ((stack1 = lookupProperty(helpers,"each").call(alias1,(depths[1] != null ? lookupProperty(depths[1],"actions") : depths[1]),{"name":"each","hash":{},"fn":container.program(8, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"loc":{"start":{"line":34,"column":0},"end":{"line":41,"column":9}}})) != null ? stack1 : "")
    + "  <div class=\"w3-container\">\n    <h1>"
    + alias3(((helper = (helper = lookupProperty(helpers,"titre") || (depth0 != null ? lookupProperty(depth0,"titre") : depth0)) != null ? helper : alias2),(typeof helper === "function" ? helper.call(alias1,{"name":"titre","hash":{},"data":data,"loc":{"start":{"line":43,"column":8},"end":{"line":43,"column":17}}}) : helper)))
    + " des "
    + alias3(container.lambda((depths[1] != null ? lookupProperty(depths[1],"exercice") : depths[1]), depth0))
    + "s \n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(lookupProperty(helpers,"cetteDicteeEstAmenagee")||(depth0 && lookupProperty(depth0,"cetteDicteeEstAmenagee"))||alias2).call(alias1,(depths[1] != null ? lookupProperty(depths[1],"exercice") : depths[1]),{"name":"cetteDicteeEstAmenagee","hash":{},"data":data,"loc":{"start":{"line":44,"column":10},"end":{"line":44,"column":46}}}),{"name":"if","hash":{},"fn":container.program(13, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"loc":{"start":{"line":44,"column":4},"end":{"line":46,"column":8}}})) != null ? stack1 : "")
    + "    </h1>\n  </div>\n</div>\n";
},"4":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <button class=\"w3-button w3-"
    + alias4(((helper = (helper = lookupProperty(helpers,"couleur") || (depth0 != null ? lookupProperty(depth0,"couleur") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"couleur","hash":{},"data":data,"loc":{"start":{"line":28,"column":32},"end":{"line":28,"column":43}}}) : helper)))
    + " w3-xlarge\" onclick=\""
    + alias4(((helper = (helper = lookupProperty(helpers,"action") || (depth0 != null ? lookupProperty(depth0,"action") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"action","hash":{},"data":data,"loc":{"start":{"line":28,"column":64},"end":{"line":28,"column":74}}}) : helper)))
    + "\">"
    + ((stack1 = ((helper = (helper = lookupProperty(helpers,"icone") || (depth0 != null ? lookupProperty(depth0,"icone") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"icone","hash":{},"data":data,"loc":{"start":{"line":28,"column":76},"end":{"line":28,"column":87}}}) : helper))) != null ? stack1 : "")
    + "</button>\n";
},"6":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <a href=\""
    + ((stack1 = ((helper = (helper = lookupProperty(helpers,"action") || (depth0 != null ? lookupProperty(depth0,"action") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"action","hash":{},"data":data,"loc":{"start":{"line":30,"column":13},"end":{"line":30,"column":25}}}) : helper))) != null ? stack1 : "")
    + "\" class=\"w3-button w3-"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"couleur") || (depth0 != null ? lookupProperty(depth0,"couleur") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"couleur","hash":{},"data":data,"loc":{"start":{"line":30,"column":47},"end":{"line":30,"column":58}}}) : helper)))
    + " w3-xlarge\">"
    + ((stack1 = ((helper = (helper = lookupProperty(helpers,"icone") || (depth0 != null ? lookupProperty(depth0,"icone") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"icone","hash":{},"data":data,"loc":{"start":{"line":30,"column":70},"end":{"line":30,"column":81}}}) : helper))) != null ? stack1 : "")
    + "</a>\n";
},"8":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"bouton") : depth0),{"name":"if","hash":{},"fn":container.program(9, data, 0),"inverse":container.program(11, data, 0),"data":data,"loc":{"start":{"line":35,"column":2},"end":{"line":40,"column":9}}})) != null ? stack1 : "");
},"9":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "      <button onclick=\""
    + alias4(((helper = (helper = lookupProperty(helpers,"lien") || (depth0 != null ? lookupProperty(depth0,"lien") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"lien","hash":{},"data":data,"loc":{"start":{"line":36,"column":23},"end":{"line":36,"column":31}}}) : helper)))
    + "\" class=\"w3-bar-item w3-button w3-"
    + alias4(((helper = (helper = lookupProperty(helpers,"couleur") || (depth0 != null ? lookupProperty(depth0,"couleur") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"couleur","hash":{},"data":data,"loc":{"start":{"line":36,"column":65},"end":{"line":36,"column":76}}}) : helper)))
    + " w3-right\">"
    + ((stack1 = ((helper = (helper = lookupProperty(helpers,"icone") || (depth0 != null ? lookupProperty(depth0,"icone") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"icone","hash":{},"data":data,"loc":{"start":{"line":36,"column":87},"end":{"line":36,"column":98}}}) : helper))) != null ? stack1 : "")
    + " "
    + alias4(((helper = (helper = lookupProperty(helpers,"legende") || (depth0 != null ? lookupProperty(depth0,"legende") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"legende","hash":{},"data":data,"loc":{"start":{"line":36,"column":99},"end":{"line":36,"column":110}}}) : helper)))
    + " \n      </button>\n";
},"11":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "      <a href=\""
    + alias4(((helper = (helper = lookupProperty(helpers,"lien") || (depth0 != null ? lookupProperty(depth0,"lien") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"lien","hash":{},"data":data,"loc":{"start":{"line":39,"column":15},"end":{"line":39,"column":23}}}) : helper)))
    + "\" class=\"w3-bar-item w3-button w3-"
    + alias4(((helper = (helper = lookupProperty(helpers,"couleur") || (depth0 != null ? lookupProperty(depth0,"couleur") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"couleur","hash":{},"data":data,"loc":{"start":{"line":39,"column":57},"end":{"line":39,"column":68}}}) : helper)))
    + " w3-right\">"
    + ((stack1 = ((helper = (helper = lookupProperty(helpers,"icone") || (depth0 != null ? lookupProperty(depth0,"icone") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"icone","hash":{},"data":data,"loc":{"start":{"line":39,"column":79},"end":{"line":39,"column":90}}}) : helper))) != null ? stack1 : "")
    + " "
    + alias4(((helper = (helper = lookupProperty(helpers,"legende") || (depth0 != null ? lookupProperty(depth0,"legende") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"legende","hash":{},"data":data,"loc":{"start":{"line":39,"column":91},"end":{"line":39,"column":102}}}) : helper)))
    + "</a>\n";
},"13":function(container,depth0,helpers,partials,data) {
    return "	 aménagées\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<!-- ==================================\n *            e j D i c t o             *\n * ==================================== *\n * (c)2012-2020 - Patrick Cardona       *\n * Licence GPL version 3 ou ultérieure  *\n * VOIR la licence complète à la racine *\n * ==================================== -->\n\n <!-- Navigation : Menu : menuTemplate.hbs -->\n\n<!-- ============================================ -->\n\n<!-- Sidebar -->\n<div class=\"w3-sidebar w3-bar-block\" style=\"display:none\" id=\"menu_gauche\">\n  <button onclick=\"refermer_navigation()\" class=\"w3-bar-item w3-button w3-large w3-text-teal\">Fermer \n  <i class=\"icon-fermer\"></i></button>\n"
    + ((stack1 = lookupProperty(helpers,"each").call(alias1,(depth0 != null ? lookupProperty(depth0,"items") : depth0),{"name":"each","hash":{},"fn":container.program(1, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"loc":{"start":{"line":17,"column":0},"end":{"line":20,"column":11}}})) != null ? stack1 : "")
    + "\n</div>\n\n<!-- Contexte -->\n<div class=\"w3-"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"couleur") || (depth0 != null ? lookupProperty(depth0,"couleur") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(alias1,{"name":"couleur","hash":{},"data":data,"loc":{"start":{"line":25,"column":15},"end":{"line":25,"column":26}}}) : helper)))
    + "\">\n"
    + ((stack1 = lookupProperty(helpers,"with").call(alias1,(depth0 != null ? lookupProperty(depth0,"contexte") : depth0),{"name":"with","hash":{},"fn":container.program(3, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"loc":{"start":{"line":26,"column":0},"end":{"line":50,"column":9}}})) != null ? stack1 : "");
},"useData":true,"useDepths":true});

},{"hbsfy/runtime":23}],50:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "  <a href=\""
    + alias4(((helper = (helper = lookupProperty(helpers,"lien") || (depth0 != null ? lookupProperty(depth0,"lien") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"lien","hash":{},"data":data,"loc":{"start":{"line":19,"column":11},"end":{"line":19,"column":19}}}) : helper)))
    + "\" class=\"w3-bar-item w3-button w3-light-gray w3-border-bottom\">\n  "
    + ((stack1 = ((helper = (helper = lookupProperty(helpers,"icone") || (depth0 != null ? lookupProperty(depth0,"icone") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"icone","hash":{},"data":data,"loc":{"start":{"line":20,"column":2},"end":{"line":20,"column":13}}}) : helper))) != null ? stack1 : "")
    + " "
    + alias4(((helper = (helper = lookupProperty(helpers,"legende") || (depth0 != null ? lookupProperty(depth0,"legende") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"legende","hash":{},"data":data,"loc":{"start":{"line":20,"column":14},"end":{"line":20,"column":25}}}) : helper)))
    + "</a>\n";
},"3":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"bouton") : depth0),{"name":"if","hash":{},"fn":container.program(4, data, 0, blockParams, depths),"inverse":container.program(6, data, 0, blockParams, depths),"data":data,"loc":{"start":{"line":27,"column":2},"end":{"line":31,"column":9}}})) != null ? stack1 : "")
    + "  \n<!-- Actions -->\n"
    + ((stack1 = lookupProperty(helpers,"each").call(alias1,(depths[1] != null ? lookupProperty(depths[1],"actions") : depths[1]),{"name":"each","hash":{},"fn":container.program(8, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"loc":{"start":{"line":34,"column":0},"end":{"line":41,"column":9}}})) != null ? stack1 : "")
    + "  <div class=\"w3-container\">\n    <h1>"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"titre") || (depth0 != null ? lookupProperty(depth0,"titre") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(alias1,{"name":"titre","hash":{},"data":data,"loc":{"start":{"line":43,"column":8},"end":{"line":43,"column":17}}}) : helper)))
    + "</h1>\n  </div>\n</div>\n";
},"4":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <button class=\"w3-button w3-"
    + alias4(((helper = (helper = lookupProperty(helpers,"couleur") || (depth0 != null ? lookupProperty(depth0,"couleur") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"couleur","hash":{},"data":data,"loc":{"start":{"line":28,"column":32},"end":{"line":28,"column":43}}}) : helper)))
    + " w3-xlarge\" onclick=\""
    + alias4(((helper = (helper = lookupProperty(helpers,"action") || (depth0 != null ? lookupProperty(depth0,"action") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"action","hash":{},"data":data,"loc":{"start":{"line":28,"column":64},"end":{"line":28,"column":74}}}) : helper)))
    + "\">"
    + ((stack1 = ((helper = (helper = lookupProperty(helpers,"icone") || (depth0 != null ? lookupProperty(depth0,"icone") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"icone","hash":{},"data":data,"loc":{"start":{"line":28,"column":76},"end":{"line":28,"column":87}}}) : helper))) != null ? stack1 : "")
    + "</button>\n";
},"6":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <a href=\""
    + ((stack1 = ((helper = (helper = lookupProperty(helpers,"action") || (depth0 != null ? lookupProperty(depth0,"action") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"action","hash":{},"data":data,"loc":{"start":{"line":30,"column":13},"end":{"line":30,"column":25}}}) : helper))) != null ? stack1 : "")
    + "\" class=\"w3-button w3-"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"couleur") || (depth0 != null ? lookupProperty(depth0,"couleur") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"couleur","hash":{},"data":data,"loc":{"start":{"line":30,"column":47},"end":{"line":30,"column":58}}}) : helper)))
    + " w3-xlarge\">"
    + ((stack1 = ((helper = (helper = lookupProperty(helpers,"icone") || (depth0 != null ? lookupProperty(depth0,"icone") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"icone","hash":{},"data":data,"loc":{"start":{"line":30,"column":70},"end":{"line":30,"column":81}}}) : helper))) != null ? stack1 : "")
    + "</a>\n";
},"8":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"bouton") : depth0),{"name":"if","hash":{},"fn":container.program(9, data, 0),"inverse":container.program(11, data, 0),"data":data,"loc":{"start":{"line":35,"column":2},"end":{"line":40,"column":9}}})) != null ? stack1 : "");
},"9":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "      <button onclick=\""
    + alias4(((helper = (helper = lookupProperty(helpers,"lien") || (depth0 != null ? lookupProperty(depth0,"lien") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"lien","hash":{},"data":data,"loc":{"start":{"line":36,"column":23},"end":{"line":36,"column":31}}}) : helper)))
    + "\" class=\"w3-bar-item w3-button w3-"
    + alias4(((helper = (helper = lookupProperty(helpers,"couleur") || (depth0 != null ? lookupProperty(depth0,"couleur") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"couleur","hash":{},"data":data,"loc":{"start":{"line":36,"column":65},"end":{"line":36,"column":76}}}) : helper)))
    + " w3-right\">"
    + ((stack1 = ((helper = (helper = lookupProperty(helpers,"icone") || (depth0 != null ? lookupProperty(depth0,"icone") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"icone","hash":{},"data":data,"loc":{"start":{"line":36,"column":87},"end":{"line":36,"column":98}}}) : helper))) != null ? stack1 : "")
    + " "
    + alias4(((helper = (helper = lookupProperty(helpers,"legende") || (depth0 != null ? lookupProperty(depth0,"legende") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"legende","hash":{},"data":data,"loc":{"start":{"line":36,"column":99},"end":{"line":36,"column":110}}}) : helper)))
    + " \n      </button>\n";
},"11":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "      <a href=\""
    + alias4(((helper = (helper = lookupProperty(helpers,"lien") || (depth0 != null ? lookupProperty(depth0,"lien") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"lien","hash":{},"data":data,"loc":{"start":{"line":39,"column":15},"end":{"line":39,"column":23}}}) : helper)))
    + "\" class=\"w3-bar-item w3-button w3-"
    + alias4(((helper = (helper = lookupProperty(helpers,"couleur") || (depth0 != null ? lookupProperty(depth0,"couleur") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"couleur","hash":{},"data":data,"loc":{"start":{"line":39,"column":57},"end":{"line":39,"column":68}}}) : helper)))
    + " w3-right\">"
    + ((stack1 = ((helper = (helper = lookupProperty(helpers,"icone") || (depth0 != null ? lookupProperty(depth0,"icone") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"icone","hash":{},"data":data,"loc":{"start":{"line":39,"column":79},"end":{"line":39,"column":90}}}) : helper))) != null ? stack1 : "")
    + " "
    + alias4(((helper = (helper = lookupProperty(helpers,"legende") || (depth0 != null ? lookupProperty(depth0,"legende") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"legende","hash":{},"data":data,"loc":{"start":{"line":39,"column":91},"end":{"line":39,"column":102}}}) : helper)))
    + "</a>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<!-- ==================================\n *            e j D i c t o             *\n * ==================================== *\n * (c)2012-2020 - Patrick Cardona       *\n * Licence GPL version 3 ou ultérieure  *\n * VOIR la licence complète à la racine *\n * ==================================== -->\n\n <!-- Navigation : Menu : menuTemplate.hbs -->\n\n<!-- ============================================ -->\n\n<!-- Sidebar -->\n<div class=\"w3-sidebar w3-bar-block w3-card\" style=\"display:none\" id=\"menu_gauche\">\n  <button onclick=\"refermer_navigation()\" \n  class=\"w3-bar-item w3-button w3-blue-gray\">Fermer \n  <i class=\"icon-retourner w3-right\"></i></button>\n"
    + ((stack1 = lookupProperty(helpers,"each").call(alias1,(depth0 != null ? lookupProperty(depth0,"items") : depth0),{"name":"each","hash":{},"fn":container.program(1, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"loc":{"start":{"line":18,"column":0},"end":{"line":21,"column":11}}})) != null ? stack1 : "")
    + "</div>\n\n<!-- Contexte -->\n<div class=\""
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"couleur") || (depth0 != null ? lookupProperty(depth0,"couleur") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(alias1,{"name":"couleur","hash":{},"data":data,"loc":{"start":{"line":25,"column":12},"end":{"line":25,"column":23}}}) : helper)))
    + "\">\n"
    + ((stack1 = lookupProperty(helpers,"with").call(alias1,(depth0 != null ? lookupProperty(depth0,"contexte") : depth0),{"name":"with","hash":{},"fn":container.program(3, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"loc":{"start":{"line":26,"column":0},"end":{"line":46,"column":9}}})) != null ? stack1 : "");
},"useData":true,"useDepths":true});

},{"hbsfy/runtime":23}],51:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "              "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"consigneDicteeAmenagee") || (depth0 != null ? lookupProperty(depth0,"consigneDicteeAmenagee") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"consigneDicteeAmenagee","hash":{},"data":data,"loc":{"start":{"line":20,"column":14},"end":{"line":20,"column":42}}}) : helper)))
    + "\n";
},"3":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "              "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"consigne") || (depth0 != null ? lookupProperty(depth0,"consigne") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"consigne","hash":{},"data":data,"loc":{"start":{"line":22,"column":14},"end":{"line":22,"column":26}}}) : helper)))
    + "\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=depth0 != null ? depth0 : (container.nullContext || {}), lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<!-- ==================================\n *            e j D i c t o             *\n * ==================================== *\n * (c)2012-2020 - Patrick Cardona       *\n * Licence GPL version 3 ou ultérieure  *\n * VOIR la licence complète à la racine *\n * ==================================== -->\n\n<!-- Template : accueilExerciceTemplate -->\n\n<div class=\"w3-container\">\n<header class=\"w3-container\">\n<h3 class=\"w3-round w3-padding analogue\">Mode d'emploi</h3>\n</header>\n<div class=\"w3-container\">\n<ul class=\"w3-ul w3-padding\">\n\n		<li><span class=\"w3-badge triadic\">1</span> \n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(lookupProperty(helpers,"cetteDicteeEstAmenagee")||(depth0 && lookupProperty(depth0,"cetteDicteeEstAmenagee"))||container.hooks.helperMissing).call(alias1,(depth0 != null ? lookupProperty(depth0,"exercice") : depth0),{"name":"cetteDicteeEstAmenagee","hash":{},"data":data,"loc":{"start":{"line":19,"column":12},"end":{"line":19,"column":45}}}),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.program(3, data, 0),"data":data,"loc":{"start":{"line":19,"column":6},"end":{"line":23,"column":19}}})) != null ? stack1 : "")
    + "		</li>\n		<li>\n			<span class=\"w3-badge triadic\">2</span> Saisissez votre \n            texte et obtenez un bilan. Si des erreurs persistent, \n            tentez d'améliorer cette saisie.\n		</li>\n		<li>\n			<span class=\"w3-badge triadic\">3</span> Quand vous aurez \n			effectué toutes les corrections possibles, \n			terminez la saisie pour voir la correction.\n		</li>\n	</ul>\n</div>\n</div>";
},"useData":true});

},{"hbsfy/runtime":23}],52:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<!-- ==================================\n *            e j D i c t o             *\n * ==================================== *\n * (c)2012-2020 - Patrick Cardona       *\n * Licence GPL version 3 ou ultérieure  *\n * VOIR la licence complète à la racine *\n * ==================================== -->\n \n <!-- accueilTemplate.hbs -->\n\n <div class=\"w3-container\" id=\"page_accueil\">\n <div class=\"w3-display-container\">\n   <img src=\"./static/images/encrier.jpg\" class=\"w3-image w3-opacity-max\"\n   alt=\"Le logo représente un encrier avec une plume.\">\n   <div class=\"w3-padding-48\">\n   <h1 class=\"w3-wide w3-display-middle texte-fonce\" >"
    + ((stack1 = (lookupProperty(helpers,"encodeChaine")||(depth0 && lookupProperty(depth0,"encodeChaine"))||container.hooks.helperMissing).call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"bienvenue") : depth0),{"name":"encodeChaine","hash":{},"data":data,"loc":{"start":{"line":16,"column":54},"end":{"line":16,"column":83}}})) != null ? stack1 : "")
    + "</h1>\n  </div>\n </div>\n </div>\n\n";
},"useData":true});

},{"hbsfy/runtime":23}],53:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<!-- ==================================\n *            e j D i c t o             *\n * ==================================== *\n * (c)2012-2020 - Patrick Cardona       *\n * Licence GPL version 3 ou ultérieure  *\n * VOIR la licence complète à la racine *\n * ==================================== -->\n \n <!-- Template : aideTemplate.hbs -->\n\n<div class=\"w3-container w3-padding\">\n\n<!-- Prise en main -->\n<button onclick=\"alterner_section_aide('aide0')\" class=\"w3-button w3-light-gray w3-block w3-left-align \nw3-border w3-mobile\">\nPrise en main\n</button>\n<div id=\"aide0\" class=\"w3-container w3-hide w3-border\">\n"
    + ((stack1 = container.invokePartial(lookupProperty(partials,"prise_en_main"),depth0,{"name":"prise_en_main","data":data,"helpers":helpers,"partials":partials,"decorators":container.decorators})) != null ? stack1 : "")
    + "</div>\n\n<!-- Améliorer ma saisie -->\n<button onclick=\"alterner_section_aide('aide1')\" class=\"w3-button w3-light-gray w3-block w3-left-align\n w3-border w3-mobile\">\nAméliorer ma saisie\n</button>\n<div id=\"aide1\" class=\"w3-container w3-hide w3-border\">\n"
    + ((stack1 = container.invokePartial(lookupProperty(partials,"amelioration"),depth0,{"name":"amelioration","data":data,"helpers":helpers,"partials":partials,"decorators":container.decorators})) != null ? stack1 : "")
    + "</div>\n\n<!-- Dictée aménagée -->\n<button onclick=\"alterner_section_aide('aide2')\" class=\"w3-button w3-light-gray w3-block w3-left-align\n w3-border w3-mobile\">\nDictée aménagée\n</button>\n<div id=\"aide2\" class=\"w3-container w3-hide w3-border\">\n"
    + ((stack1 = container.invokePartial(lookupProperty(partials,"dictam"),depth0,{"name":"dictam","data":data,"helpers":helpers,"partials":partials,"decorators":container.decorators})) != null ? stack1 : "")
    + "</div>\n\n<!-- Dictée en usage mobile -->\n<button onclick=\"alterner_section_aide('aide3')\" class=\"w3-button w3-light-gray w3-block w3-left-align\n w3-border w3-mobile\">\nUsage mobile\n</button>\n<div id=\"aide3\" class=\"w3-container w3-hide w3-border\">\n"
    + ((stack1 = container.invokePartial(lookupProperty(partials,"usage_mobile"),depth0,{"name":"usage_mobile","data":data,"helpers":helpers,"partials":partials,"decorators":container.decorators})) != null ? stack1 : "")
    + "</div>\n\n<!-- A propos -->\n<button onclick=\"alterner_section_aide('aide4')\" class=\"w3-button w3-light-gray w3-block w3-left-align\n w3-border w3-mobile\">\nÀ propos\n</button>\n<div id=\"aide4\" class=\"w3-container w3-hide w3-border\">\n"
    + ((stack1 = container.invokePartial(lookupProperty(partials,"apropos"),(depth0 != null ? lookupProperty(depth0,"modeleApropos") : depth0),{"name":"apropos","data":data,"helpers":helpers,"partials":partials,"decorators":container.decorators})) != null ? stack1 : "")
    + "</div>\n\n<!-- licence -->\n<button onclick=\"alterner_section_aide('aide5')\" class=\"w3-button w3-light-gray\n w3-block w3-left-align\n w3-border w3-mobile\">\nLicence\n</button>\n<div id=\"aide5\" class=\"w3-container w3-hide w3-border\">\n<header>\n<h3 class=\"texte-fonce\">Licence</h3>\n</header>\n"
    + ((stack1 = container.invokePartial(lookupProperty(partials,"licence"),(depth0 != null ? lookupProperty(depth0,"modeleLicence") : depth0),{"name":"licence","data":data,"helpers":helpers,"partials":partials,"decorators":container.decorators})) != null ? stack1 : "")
    + "</div>\n\n</div>\n";
},"usePartial":true,"useData":true});

},{"hbsfy/runtime":23}],54:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<!-- ==================================\n *            e j D i c t o             *\n * ==================================== *\n * (c)2012-2020 - Patrick Cardona       *\n * Licence GPL version 3 ou ultérieure  *\n * VOIR la licence complète à la racine *\n * ==================================== -->\n \n <!-- Template : consigneReecritureTemplate.hbs -->\n\n\n<div class=\"w3-container\">\n\n  <p>"
    + alias4(((helper = (helper = lookupProperty(helpers,"consigne") || (depth0 != null ? lookupProperty(depth0,"consigne") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"consigne","hash":{},"data":data,"loc":{"start":{"line":14,"column":5},"end":{"line":14,"column":17}}}) : helper)))
    + "</p>\n\n  <div class=\"w3-card-4\">\n    <div class=\"w3-container w3-padding analogue\">\n      <h3>Texte initial</h3>\n    </div>\n    <div class=\"w3-container w3-padding\">\n      <p>"
    + alias4(((helper = (helper = lookupProperty(helpers,"fourni") || (depth0 != null ? lookupProperty(depth0,"fourni") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"fourni","hash":{},"data":data,"loc":{"start":{"line":21,"column":9},"end":{"line":21,"column":19}}}) : helper)))
    + "</p>\n    </div>\n  </div>\n\n</div>\n";
},"useData":true});

},{"hbsfy/runtime":23}],55:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = container.invokePartial(lookupProperty(partials,"sourceaudio"),depth0,{"name":"sourceaudio","hash":{"cid":(depths[1] != null ? lookupProperty(depths[1],"did") : depths[1]),"format":(depth0 != null ? lookupProperty(depth0,"format") : depth0)},"data":data,"indent":"      ","helpers":helpers,"partials":partials,"decorators":container.decorators})) != null ? stack1 : "");
},"3":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"w3-container\">\n<div class=\"w3-card\">\n<header class=\"w3-container w3-green\">\n<h4 class=\"w3-green\">Mots ou expressions</h4>\n</header>\n<div class=\"w3-container w3-light-grey\">\n<p class=\"w3-center\">"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"mots") || (depth0 != null ? lookupProperty(depth0,"mots") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"mots","hash":{},"data":data,"loc":{"start":{"line":29,"column":21},"end":{"line":29,"column":29}}}) : helper)))
    + "</p>\n</div>\n</div>\n</div>\n";
},"5":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"w3-padding-24\">\n<div class=\"w3-bar w3-light-grey w3-border\">\n"
    + ((stack1 = lookupProperty(helpers,"each").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"rubs") : depth0),{"name":"each","hash":{},"fn":container.program(6, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":38,"column":0},"end":{"line":45,"column":9}}})) != null ? stack1 : "")
    + "</div>\n</div>\n";
},"6":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "  <button class=\"w3-bar-item w3-button tablink \n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(data && lookupProperty(data,"first")),{"name":"if","hash":{},"fn":container.program(7, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":40,"column":2},"end":{"line":42,"column":9}}})) != null ? stack1 : "")
    + "  \" onclick=\"afficheRubrique(event, '"
    + alias4(((helper = (helper = lookupProperty(helpers,"lien") || (depth0 != null ? lookupProperty(depth0,"lien") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"lien","hash":{},"data":data,"loc":{"start":{"line":43,"column":37},"end":{"line":43,"column":45}}}) : helper)))
    + "')\">"
    + alias4(((helper = (helper = lookupProperty(helpers,"legende") || (depth0 != null ? lookupProperty(depth0,"legende") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"legende","hash":{},"data":data,"loc":{"start":{"line":43,"column":49},"end":{"line":43,"column":60}}}) : helper)))
    + " \n  </button>\n";
},"7":function(container,depth0,helpers,partials,data) {
    return "  triadic\n";
},"9":function(container,depth0,helpers,partials,data) {
    return "class=\"rubrique\"\n";
},"11":function(container,depth0,helpers,partials,data) {
    return "		    Puis affichez le texte aménagé \n            et notez vos choix au brouillon avec méthode : <br>\n            <ol><li>Mon choix 1 : ...</li><li>Etc</li></ol>\n";
},"13":function(container,depth0,helpers,partials,data) {
    return "			Puis écoutez-la de nouveau, en la notant sur votre \n			cahier de brouillon. \n";
},"15":function(container,depth0,helpers,partials,data,blockParams) {
    var stack1, alias1=depth0 != null ? depth0 : (container.nullContext || {}), lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div id=\"texte\" class=\"rubrique\"\nstyle=\"display: none\">\n<div class=\"w3-container\">\n    <h3 class=\"texte-fonce\">Texte aménagé</h3>\n    <p style=\"max-width: 500px\">\n    "
    + ((stack1 = (lookupProperty(helpers,"afficheLesEtiquettes")||(depth0 && lookupProperty(depth0,"afficheLesEtiquettes"))||container.hooks.helperMissing).call(alias1,(depth0 != null ? lookupProperty(depth0,"fourni") : depth0),(depth0 != null ? lookupProperty(depth0,"lacunes") : depth0),{"name":"afficheLesEtiquettes","hash":{},"data":data,"blockParams":blockParams,"loc":{"start":{"line":86,"column":4},"end":{"line":86,"column":45}}})) != null ? stack1 : "")
    + "\n    </p>\n</div>\n</div>\n\n<div id=\"choix\" class=\"rubrique\"\nstyle=\"display: none\">\n<div class=\"w3-container\">\n    <h3 class=\"texte-fonce\">Propositions</h3>\n    <ul class=\"w3-ul\">\n"
    + ((stack1 = lookupProperty(helpers,"each").call(alias1,(depth0 != null ? lookupProperty(depth0,"lacunes") : depth0),{"name":"each","hash":{},"fn":container.program(16, data, 1, blockParams),"inverse":container.noop,"data":data,"blockParams":blockParams,"loc":{"start":{"line":96,"column":6},"end":{"line":98,"column":15}}})) != null ? stack1 : "")
    + "    </ul>\n</div>\n</div>\n";
},"16":function(container,depth0,helpers,partials,data,blockParams) {
    var alias1=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "      <li>"
    + alias1((lookupProperty(helpers,"indexPlusUn")||(depth0 && lookupProperty(depth0,"indexPlusUn"))||container.hooks.helperMissing).call(depth0 != null ? depth0 : (container.nullContext || {}),(data && lookupProperty(data,"index")),{"name":"indexPlusUn","hash":{},"data":data,"loc":{"start":{"line":97,"column":10},"end":{"line":97,"column":32}}}))
    + ") "
    + alias1(container.lambda(blockParams[0][0], depth0))
    + "</li>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<!-- ==================================\n *            e j D i c t o             *\n * ==================================== *\n * (c)2012-2020 - Patrick Cardona       *\n * Licence GPL version 3 ou ultérieure  *\n * VOIR la licence complète à la racine *\n * ==================================== -->\n \n <!-- Template : ecouterTemplate.hbs -->\n\n\n<div class=\"w3-container\">\n    <audio controls=\"controls\">\n      <!-- Partial : source audio -->\n"
    + ((stack1 = lookupProperty(helpers,"each").call(alias1,(depth0 != null ? lookupProperty(depth0,"sources") : depth0),{"name":"each","hash":{},"fn":container.program(1, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"blockParams":blockParams,"loc":{"start":{"line":15,"column":6},"end":{"line":17,"column":15}}})) != null ? stack1 : "")
    + "      <p>Erreur de chargement du fichier audio...</p>\n    </audio>\n</div>\n\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"mots") : depth0),{"name":"if","hash":{},"fn":container.program(3, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"blockParams":blockParams,"loc":{"start":{"line":22,"column":0},"end":{"line":33,"column":7}}})) != null ? stack1 : "")
    + "\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(lookupProperty(helpers,"cetteDicteeEstAmenagee")||(depth0 && lookupProperty(depth0,"cetteDicteeEstAmenagee"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"exercice") : depth0),{"name":"cetteDicteeEstAmenagee","hash":{},"data":data,"blockParams":blockParams,"loc":{"start":{"line":35,"column":6},"end":{"line":35,"column":39}}}),{"name":"if","hash":{},"fn":container.program(5, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"blockParams":blockParams,"loc":{"start":{"line":35,"column":0},"end":{"line":48,"column":7}}})) != null ? stack1 : "")
    + "\n<div id=\"conseils\" \n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(lookupProperty(helpers,"cetteDicteeEstAmenagee")||(depth0 && lookupProperty(depth0,"cetteDicteeEstAmenagee"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"exercice") : depth0),{"name":"cetteDicteeEstAmenagee","hash":{},"data":data,"blockParams":blockParams,"loc":{"start":{"line":51,"column":6},"end":{"line":51,"column":39}}}),{"name":"if","hash":{},"fn":container.program(9, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"blockParams":blockParams,"loc":{"start":{"line":51,"column":0},"end":{"line":53,"column":7}}})) != null ? stack1 : "")
    + ">\n<div class=\"w3-container\">\n    <h3 class=\"w3-padding w3-round analogue\">Conseils</h3>\n	<ul class=\"w3-ul\">\n		<li>D'abord, écoutez une première fois la dictée, \n		sans chercher à l'écrire. Efforcez-vous d'en saisir le sens.\n		</li>\n		<li>\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(lookupProperty(helpers,"cetteDicteeEstAmenagee")||(depth0 && lookupProperty(depth0,"cetteDicteeEstAmenagee"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"exercice") : depth0),{"name":"cetteDicteeEstAmenagee","hash":{},"data":data,"blockParams":blockParams,"loc":{"start":{"line":62,"column":8},"end":{"line":62,"column":41}}}),{"name":"if","hash":{},"fn":container.program(11, data, 0, blockParams, depths),"inverse":container.program(13, data, 0, blockParams, depths),"data":data,"blockParams":blockParams,"loc":{"start":{"line":62,"column":2},"end":{"line":69,"column":15}}})) != null ? stack1 : "")
    + "			Au besoin, mettez en pause le \n			lecteur audio.\n		</li>\n		<li>\n			Relisez-vous en écoutant une dernière fois la dictée.\n		</li>\n	</ul>\n</div>\n</div>\n\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(lookupProperty(helpers,"cetteDicteeEstAmenagee")||(depth0 && lookupProperty(depth0,"cetteDicteeEstAmenagee"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"exercice") : depth0),{"name":"cetteDicteeEstAmenagee","hash":{},"data":data,"blockParams":blockParams,"loc":{"start":{"line":80,"column":6},"end":{"line":80,"column":39}}}),{"name":"if","hash":{},"fn":container.program(15, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"blockParams":blockParams,"loc":{"start":{"line":80,"column":0},"end":{"line":102,"column":7}}})) != null ? stack1 : "");
},"usePartial":true,"useData":true,"useDepths":true,"useBlockParams":true});

},{"hbsfy/runtime":23}],56:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<!-- ==================================\n *            e j D i c t o             *\n * ==================================== *\n * (c)2012-2020 - Patrick Cardona       *\n * Licence GPL version 3 ou ultérieure  *\n * VOIR la licence complète à la racine *\n * ==================================== -->\n\n\n<!-- Template: erreur 404 : erreurTemplate.hbs -->\n\n<div class=\"w3-panel w3-"
    + alias4(((helper = (helper = lookupProperty(helpers,"couleur") || (depth0 != null ? lookupProperty(depth0,"couleur") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"couleur","hash":{},"data":data,"loc":{"start":{"line":12,"column":24},"end":{"line":12,"column":35}}}) : helper)))
    + "\" style=\"height:250px;\">\n<br />\n<h2 class=\"w3-center\">\n<i class=\"fa fa-exclamation\"></i> "
    + alias4(((helper = (helper = lookupProperty(helpers,"titre") || (depth0 != null ? lookupProperty(depth0,"titre") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"titre","hash":{},"data":data,"loc":{"start":{"line":15,"column":34},"end":{"line":15,"column":43}}}) : helper)))
    + "</h2>\n<div class=\"w3-display-middle\">"
    + alias4(((helper = (helper = lookupProperty(helpers,"message") || (depth0 != null ? lookupProperty(depth0,"message") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"message","hash":{},"data":data,"loc":{"start":{"line":16,"column":31},"end":{"line":16,"column":42}}}) : helper)))
    + "</div>\n</div>\n";
},"useData":true});

},{"hbsfy/runtime":23}],57:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "  <option value=\""
    + alias4(((helper = (helper = lookupProperty(helpers,"chiffre") || (depth0 != null ? lookupProperty(depth0,"chiffre") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"chiffre","hash":{},"data":data,"loc":{"start":{"line":25,"column":17},"end":{"line":25,"column":28}}}) : helper)))
    + "\">"
    + alias4(((helper = (helper = lookupProperty(helpers,"nom") || (depth0 != null ? lookupProperty(depth0,"nom") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"nom","hash":{},"data":data,"loc":{"start":{"line":25,"column":30},"end":{"line":25,"column":37}}}) : helper)))
    + "</option>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<!-- ==================================\n *            e j D i c t o             *\n * ==================================== *\n * (c)2012-2020 - Patrick Cardona       *\n * Licence GPL version 3 ou ultérieure  *\n * VOIR la licence complète à la racine *\n * ==================================== -->\n\n<!-- Template : formulaire de modification du profil \n  formProfilTemplate.hbs :\n-->\n\n<div class=\"w3-container\">\n\n<div class=\"w3-container w3-padding w3-border\" style=\"max-width: 500px\"\n id=\"zone_saisie_preferences\">\n<form class=\"w3-container>\n<label for=\"niveau_choisi\" class=\"w3-text-teal\">\nNiveau d'enseignement\n</label>\n<select name=\"niveau_choisi\" id=\"niveau_choisi\" class=\"w3-select w3-border w3-mobile\"\n  onchange=\"profil.changeNiveau()\">\n<option value=\"\" disabled selected>Choisissez un niveau</option>\n"
    + ((stack1 = lookupProperty(helpers,"each").call(alias1,(depth0 != null ? lookupProperty(depth0,"niveaux") : depth0),{"name":"each","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":24,"column":0},"end":{"line":26,"column":9}}})) != null ? stack1 : "")
    + "</select>\n<input type=\"checkbox\" name=\"amenagement_choisi\" \nid=\"amenagement_choisi\" class=\"w3-check\" "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"checked") || (depth0 != null ? lookupProperty(depth0,"checked") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(alias1,{"name":"checked","hash":{},"data":data,"loc":{"start":{"line":29,"column":41},"end":{"line":29,"column":52}}}) : helper)))
    + " \nonchange=\"profil.changeAmenagement()\">\n<label for=\"amenagement_choisi\">\nDictée aménagée\n</label>\n</form>\n</div>\n\n</div>\n";
},"useData":true});

},{"hbsfy/runtime":23}],58:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, alias1=depth0 != null ? depth0 : (container.nullContext || {}), lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"if").call(alias1,(lookupProperty(helpers,"estDuNiveauRequis")||(depth0 && lookupProperty(depth0,"estDuNiveauRequis"))||container.hooks.helperMissing).call(alias1,(depth0 != null ? lookupProperty(depth0,"niveau") : depth0),{"name":"estDuNiveauRequis","hash":{},"data":data,"loc":{"start":{"line":37,"column":11},"end":{"line":37,"column":42}}}),{"name":"if","hash":{},"fn":container.program(2, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"loc":{"start":{"line":37,"column":5},"end":{"line":49,"column":12}}})) != null ? stack1 : "");
},"2":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, alias1=depth0 != null ? depth0 : (container.nullContext || {}), lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"if").call(alias1,(lookupProperty(helpers,"cibleEstUneDictee")||(depth0 && lookupProperty(depth0,"cibleEstUneDictee"))||container.hooks.helperMissing).call(alias1,(depths[1] != null ? lookupProperty(depths[1],"cible") : depths[1]),{"name":"cibleEstUneDictee","hash":{},"data":data,"loc":{"start":{"line":38,"column":14},"end":{"line":38,"column":42}}}),{"name":"if","hash":{},"fn":container.program(3, data, 0, blockParams, depths),"inverse":container.program(6, data, 0, blockParams, depths),"data":data,"loc":{"start":{"line":38,"column":8},"end":{"line":48,"column":12}}})) != null ? stack1 : "");
},"3":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, alias1=depth0 != null ? depth0 : (container.nullContext || {}), lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"if").call(alias1,(lookupProperty(helpers,"existeEnVersionAmenagee")||(depth0 && lookupProperty(depth0,"existeEnVersionAmenagee"))||container.hooks.helperMissing).call(alias1,(depth0 != null ? lookupProperty(depth0,"dictam") : depth0),{"name":"existeEnVersionAmenagee","hash":{},"data":data,"loc":{"start":{"line":39,"column":14},"end":{"line":39,"column":51}}}),{"name":"if","hash":{},"fn":container.program(4, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"loc":{"start":{"line":39,"column":8},"end":{"line":43,"column":12}}})) != null ? stack1 : "");
},"4":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var alias1=container.lambda, alias2=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "        <li><a href=\"#!"
    + alias2(alias1((depths[1] != null ? lookupProperty(depths[1],"cible") : depths[1]), depth0))
    + "/"
    + alias2(alias1((depth0 != null ? lookupProperty(depth0,"id") : depth0), depth0))
    + "\" class=\"w3-bar-item w3-button\">\n			    "
    + alias2(alias1((depth0 != null ? lookupProperty(depth0,"id") : depth0), depth0))
    + " : "
    + alias2(alias1((depth0 != null ? lookupProperty(depth0,"titre") : depth0), depth0))
    + " </a>\n	    </li>\n";
},"6":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var alias1=container.lambda, alias2=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "	    <li><a href=\"#!"
    + alias2(alias1((depths[1] != null ? lookupProperty(depths[1],"cible") : depths[1]), depth0))
    + "/"
    + alias2(alias1((depth0 != null ? lookupProperty(depth0,"id") : depth0), depth0))
    + "\" class=\"w3-bar-item w3-button\">\n			    "
    + alias2(alias1((depth0 != null ? lookupProperty(depth0,"id") : depth0), depth0))
    + " : "
    + alias2(alias1((depth0 != null ? lookupProperty(depth0,"titre") : depth0), depth0))
    + " </a>\n	    </li>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<!-- ==================================\n *            e j D i c t o             *\n * ==================================== *\n * (c)2012-2020 - Patrick Cardona       *\n * Licence GPL version 3 ou ultérieure  *\n * VOIR la licence complète à la racine *\n * ==================================== -->\n\n<!-- Liste filtrée des dictées ou des réécritures\n  listeTemplate.hbs\n  -->\n\n\n<div class=\"w3-container w3-padding\">\n\n<div class=\"w3-card-4 w3-light-gray\" id=\"panneau_recherche\" style=\"display: none\">\n	<div class=\"w3-container analogue\">\n		  <h3>Chercher une "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"exercice") || (depth0 != null ? lookupProperty(depth0,"exercice") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(alias1,{"name":"exercice","hash":{},"data":data,"loc":{"start":{"line":18,"column":21},"end":{"line":18,"column":33}}}) : helper)))
    + "</h3>\n	</div>\n	<div class=\"w3-container w3-padding-16\">\n	<form>\n		<label class=\"w3-text-gray\"><i class=\"icon-filtre\"></i> Filtre :</label>\n		<input class=\"w3-input w3-border w3-padding\" \n		type=\"text\" \n		placeholder=\"Titre ou numéro...\" \n		spellcheck=\"false\" \n	    oninput=\"filtrer('liste', this.value)\">\n	</form>\n	</div>\n</div>\n\n<div class=\"w3-container w3-padding\">\n\n    <ul id=\"liste\" class=\"w3-bar-block w3-border w3-light-gray\" \n    style=\"list-style-type: none; margin: 0; padding: 0\">\n"
    + ((stack1 = lookupProperty(helpers,"each").call(alias1,(depth0 != null ? lookupProperty(depth0,"info") : depth0),{"name":"each","hash":{},"fn":container.program(1, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"loc":{"start":{"line":36,"column":5},"end":{"line":50,"column":14}}})) != null ? stack1 : "")
    + "    </ul>\n</div>\n\n</div>\n";
},"useData":true,"useDepths":true});

},{"hbsfy/runtime":23}],59:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "        <button class=\"w3-button w3-right\" \n        onclick=\"navigator.share({title: 'ejDicto: \n"
    + ((stack1 = ((helper = (helper = lookupProperty(helpers,"exercice") || (depth0 != null ? lookupProperty(depth0,"exercice") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"exercice","hash":{},"data":data,"loc":{"start":{"line":21,"column":0},"end":{"line":21,"column":14}}}) : helper))) != null ? stack1 : "")
    + " "
    + ((stack1 = ((helper = (helper = lookupProperty(helpers,"did") || (depth0 != null ? lookupProperty(depth0,"did") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"did","hash":{},"data":data,"loc":{"start":{"line":21,"column":15},"end":{"line":21,"column":24}}}) : helper))) != null ? stack1 : "")
    + "',\n        text: 'Découvrez la "
    + ((stack1 = ((helper = (helper = lookupProperty(helpers,"exercice") || (depth0 != null ? lookupProperty(depth0,"exercice") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"exercice","hash":{},"data":data,"loc":{"start":{"line":22,"column":28},"end":{"line":22,"column":42}}}) : helper))) != null ? stack1 : "")
    + " "
    + ((stack1 = ((helper = (helper = lookupProperty(helpers,"did") || (depth0 != null ? lookupProperty(depth0,"did") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"did","hash":{},"data":data,"loc":{"start":{"line":22,"column":43},"end":{"line":22,"column":52}}}) : helper))) != null ? stack1 : "")
    + "',\n        url: 'https://pcardona34.github.io/ejdicto/#!"
    + ((stack1 = ((helper = (helper = lookupProperty(helpers,"cible") || (depth0 != null ? lookupProperty(depth0,"cible") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"cible","hash":{},"data":data,"loc":{"start":{"line":23,"column":53},"end":{"line":23,"column":64}}}) : helper))) != null ? stack1 : "")
    + "/"
    + ((stack1 = ((helper = (helper = lookupProperty(helpers,"did") || (depth0 != null ? lookupProperty(depth0,"did") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"did","hash":{},"data":data,"loc":{"start":{"line":23,"column":65},"end":{"line":23,"column":76}}}) : helper))) != null ? stack1 : "")
    + "'})\">\n        <i class=\"icon-partage\"></i>\n        </button>\n";
},"3":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<br>\n        "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"remarque") || (depth0 != null ? lookupProperty(depth0,"remarque") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"remarque","hash":{},"data":data,"loc":{"start":{"line":36,"column":8},"end":{"line":36,"column":20}}}) : helper)))
    + "\n";
},"5":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "  	 	<p>Avec la voix de "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"voix") || (depth0 != null ? lookupProperty(depth0,"voix") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"voix","hash":{},"data":data,"loc":{"start":{"line":66,"column":24},"end":{"line":66,"column":32}}}) : helper)))
    + ".\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<!-- ==================================\n *            e j D i c t o             *\n * ==================================== *\n * (c)2012-2020 - Patrick Cardona       *\n * Licence GPL version 3 ou ultérieure  *\n * VOIR la licence complète à la racine *\n * ==================================== -->\n\n<!-- Template : mentions légales\n  mentionsTemplate.hbs\n -->\n\n<!-- Bouton de partage conditionnel : nécessite l'API\nsur le client concerné -->\n   <div class=\"w3-container w3-padding\">\n		<div class=\"w3-card\">\n		<header class=\"w3-padding analogue\">\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"partage") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":18,"column":2},"end":{"line":26,"column":16}}})) != null ? stack1 : "")
    + "		<h3>Mentions légales</h3>\n        </header>\n\n		<div class=\"w3-container\">\n		<h3 class=\"texte-fonce\">"
    + alias4(((helper = (helper = lookupProperty(helpers,"titre") || (depth0 != null ? lookupProperty(depth0,"titre") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"titre","hash":{},"data":data,"loc":{"start":{"line":31,"column":26},"end":{"line":31,"column":37}}}) : helper)))
    + "</h3>\n		<p class=\"mention\"><b>Référence :</b>\n		<span class=\"auteur\">"
    + alias4(((helper = (helper = lookupProperty(helpers,"auteur") || (depth0 != null ? lookupProperty(depth0,"auteur") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"auteur","hash":{},"data":data,"loc":{"start":{"line":33,"column":23},"end":{"line":33,"column":35}}}) : helper)))
    + "</span>,\n        <em>"
    + alias4(((helper = (helper = lookupProperty(helpers,"ouvrage") || (depth0 != null ? lookupProperty(depth0,"ouvrage") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"ouvrage","hash":{},"data":data,"loc":{"start":{"line":34,"column":12},"end":{"line":34,"column":25}}}) : helper)))
    + "</em>\n        "
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"remarque") : depth0),{"name":"if","hash":{},"fn":container.program(3, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":35,"column":8},"end":{"line":37,"column":15}}})) != null ? stack1 : "")
    + "	 	</p>\n  	 	<p class=\"mention\"><b>\n  	 	"
    + alias4((lookupProperty(helpers,"capitalisePremiereLettre")||(depth0 && lookupProperty(depth0,"capitalisePremiereLettre"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"exercice") : depth0),{"name":"capitalisePremiereLettre","hash":{},"data":data,"loc":{"start":{"line":40,"column":5},"end":{"line":40,"column":42}}}))
    + " proposée par </b></span>"
    + alias4(((helper = (helper = lookupProperty(helpers,"prof") || (depth0 != null ? lookupProperty(depth0,"prof") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"prof","hash":{},"data":data,"loc":{"start":{"line":40,"column":67},"end":{"line":40,"column":77}}}) : helper)))
    + "  \n  	 	<a rel=\"license\" href=\"http://creativecommons.org/licenses/by-nc/4.0/\">\n  	 	<img alt=\"Licence Creative Commons\" \n  	 	style=\"border-width:0\" \n  	 	src=\"../../static/images/ccbync.png\" />\n  	 	</a>\n  	 	</p>\n  	 	<p class=\"w3-hide-small\"><span xmlns:dct=\"http://purl.org/dc/terms/\" \n  	 	href=\"http://purl.org/dc/dcmitype/Dataset\" property=\"dct:title\" rel=\"dct:type\">\n  	 	Cette "
    + alias4(((helper = (helper = lookupProperty(helpers,"exercice") || (depth0 != null ? lookupProperty(depth0,"exercice") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"exercice","hash":{},"data":data,"loc":{"start":{"line":49,"column":11},"end":{"line":49,"column":23}}}) : helper)))
    + "</span> de\n  	 	<a xmlns:cc=\"http://creativecommons.org/ns#\" \n  	 	href=\"https://pcardona34.github.io/ejdicto\" \n  	 	property=\"cc:attributionName\" \n  	 	rel=\"cc:attributionURL\" \n  	 	target=\"_blank\"\n  	 	class=\"w3-button\">\n  	 	l'application ejDicto\n  	 	</a> est mise à disposition selon les termes de la licence internationale \n  	 	<a rel=\"license\" \n  	 	href=\"http://creativecommons.org/licenses/by-nc/4.0/\"\n  	 	target=\"_blank\"\n  	 	class=\"w3-button\">\n  	 	Creative Commons\n  	 	</a>  Attribution - \n  	 	Pas d’Utilisation Commerciale 4.0.</p>\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"voix") : depth0),{"name":"if","hash":{},"fn":container.program(5, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":65,"column":5},"end":{"line":67,"column":12}}})) != null ? stack1 : "")
    + "  	 	</p>\n		</div>\n        </div>\n</div>\n";
},"useData":true});

},{"hbsfy/runtime":23}],60:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<!-- ==================================\n *            e j D i c t o             *\n * ==================================== *\n * (c)2012-2020 - Patrick Cardona       *\n * Licence GPL version 3 ou ultérieure  *\n * VOIR la licence complète à la racine *\n * ==================================== -->\n\n<!-- Template d'affichage du profil \n  profilTemplate.hbs :\n-->\n\n<div class=\"w3-container\">\n\n<div class=\"w3-panel\" id=\"preferences\" style=\"display: block\">\n<table class=\"w3-table w3-striped w3-border\" style=\"max-width: 500px\">\n<tr>\n<th>Option</th><th>Valeur</th>\n</tr>\n<tr>\n<td>Niveau</td>\n<td><span id=\"niveau\">"
    + alias3((lookupProperty(helpers,"interpreteNiveau")||(depth0 && lookupProperty(depth0,"interpreteNiveau"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"niveau") : depth0),{"name":"interpreteNiveau","hash":{},"data":data,"loc":{"start":{"line":22,"column":22},"end":{"line":22,"column":49}}}))
    + "</span></td>\n</tr>\n<tr>\n<td>Dictée aménagée</td>\n<td><span id=\"amenage\">"
    + alias3((lookupProperty(helpers,"interpreteLogique")||(depth0 && lookupProperty(depth0,"interpreteLogique"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"amenagement") : depth0),{"name":"interpreteLogique","hash":{},"data":data,"loc":{"start":{"line":26,"column":23},"end":{"line":26,"column":56}}}))
    + "</span></td>\n</table>\n</div>\n\n</div>\n";
},"useData":true});

},{"hbsfy/runtime":23}],61:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(container,depth0,helpers,partials,data,blockParams) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <!-- ============================================= -->\n    <!-- Assistant de la saisie : partial -->\n    <div>\n    <h3 class=\"texte-fonce\"><i class=\"icon-fermer w3-button\" \n    onclick=\"$('#assistant').hide();$('.autres_boutons').show()\"></i>Assistant de la saisie \n    </h3>\n"
    + ((stack1 = lookupProperty(helpers,"each").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"propositions") : depth0),{"name":"each","hash":{},"fn":container.program(2, data, 1, blockParams),"inverse":container.noop,"data":data,"blockParams":blockParams,"loc":{"start":{"line":26,"column":4},"end":{"line":28,"column":13}}})) != null ? stack1 : "")
    + "    </div>\n";
},"2":function(container,depth0,helpers,partials,data,blockParams) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = container.invokePartial(lookupProperty(partials,"assistant"),(lookupProperty(helpers,"decoupeLaProposition")||(depth0 && lookupProperty(depth0,"decoupeLaProposition"))||container.hooks.helperMissing).call(depth0 != null ? depth0 : (container.nullContext || {}),blockParams[0][0],{"name":"decoupeLaProposition","hash":{},"data":data,"blockParams":blockParams,"loc":{"start":{"line":27,"column":17},"end":{"line":27,"column":51}}}),{"name":"assistant","hash":{"nom":(data && lookupProperty(data,"index"))},"data":data,"blockParams":blockParams,"indent":"    ","helpers":helpers,"partials":partials,"decorators":container.decorators})) != null ? stack1 : "");
},"4":function(container,depth0,helpers,partials,data) {
    return "    <span>\n	    <button onclick=\"actualiser_assistant()\" class=\"w3-button w3-right\"\n	    title=\"Assistant\">\n    		<i class=\"icon-assistant\"></i>\n	    </button>\n    </span>\n";
},"6":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = container.invokePartial(lookupProperty(partials,"barre"),depth0,{"name":"barre","data":data,"helpers":helpers,"partials":partials,"decorators":container.decorators})) != null ? stack1 : "");
},"8":function(container,depth0,helpers,partials,data) {
    return "	onclick=\"$('#assistant').hide();$('.autres_boutons').show()\" \n	";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data,blockParams) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<!-- ==================================\n *            e j D i c t o             *\n * ==================================== *\n * (c)2012-2020 - Patrick Cardona       *\n * Licence GPL version 3 ou ultérieure  *\n * VOIR la licence complète à la racine *\n * ==================================== -->\n<!-- Template de saisie, correction et affichage de la correction \n    saisirTemplate.hbs\n -->\n<!-- A --><div class=\"w3-container\">\n\n<!-- Zone responsive -->\n<!-- -B --><div class=\"w3-cell-row\" id=\"zone_saisie\">\n\n\n<!-- Début de cell : assistant -->\n<!-- --C --><div id=\"assistant\" class=\"w3-cell w3-mobile w3-margin-right\" style=\"display: none\">\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(lookupProperty(helpers,"cetteDicteeEstAmenagee")||(depth0 && lookupProperty(depth0,"cetteDicteeEstAmenagee"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"exercice") : depth0),{"name":"cetteDicteeEstAmenagee","hash":{},"data":data,"blockParams":blockParams,"loc":{"start":{"line":19,"column":6},"end":{"line":19,"column":39}}}),{"name":"if","hash":{},"fn":container.program(1, data, 0, blockParams),"inverse":container.noop,"data":data,"blockParams":blockParams,"loc":{"start":{"line":19,"column":0},"end":{"line":30,"column":7}}})) != null ? stack1 : "")
    + "<!-- --C-BIS --></div> <!-- Fin de la zone cell (fin assistant) -->\n\n\n<!-- Zone : cell saisie du texte -->\n<!-- --D --><div class=\"w3-cell w3-mobile\">\n<!-- ---E --><div class=\"w3-card\">\n\n<!-- zone de boutons : actions sur la saisie -->\n<!-- ----F --><div>\n<nav class=\"w3-bar w3-large fonce\">\n    <span class=\"autres_boutons\">\n	    <button onclick=\"$('#barre_car_spec').toggle()\" class=\"w3-button\"\n	    title=\"Insérer des caractères spéciaux\">\n    		<i class=\"icon-omega\"></i>\n	    </button>\n    	<button class=\"w3-button\" onclick=\"exercice.recommencerSaisie()\"\n    	title=\"Recommencer\">\n    	<i class=\"icon-corbeille\"></i>\n    	</button>\n		<button class=\"w3-button\" onclick=\"exercice.corriger()\"\n		title=\"Vérifier\">\n		<i class=\"icon-verifier\"></i>\n		</button>\n		<button class=\"w3-button\" onclick=\"exercice.terminer()\"\n		title=\"Terminer\">\n		<i class=\"icon-finir\"></i>\n		</button>\n    </span>\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(lookupProperty(helpers,"cetteDicteeEstAmenagee")||(depth0 && lookupProperty(depth0,"cetteDicteeEstAmenagee"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"exercice") : depth0),{"name":"cetteDicteeEstAmenagee","hash":{},"data":data,"blockParams":blockParams,"loc":{"start":{"line":59,"column":10},"end":{"line":59,"column":43}}}),{"name":"if","hash":{},"fn":container.program(4, data, 0, blockParams),"inverse":container.noop,"data":data,"blockParams":blockParams,"loc":{"start":{"line":59,"column":4},"end":{"line":66,"column":11}}})) != null ? stack1 : "")
    + "    <span>\n    <button onclick=\"$('.autres_boutons').show();$('#assistant').hide()\" \n    class=\"w3-button w3-right\"\n    title=\"Modifier le texte\">\n    	<i class=\"icon-editer\"></i>\n	</button>\n	</span>\n    </nav>\n<!-- F-BIS --></div><!-- fin zone de boutons -->\n\n\n<!-- Barre de caractères spéciaux et zone de saisie -->\n<!-- G --><div class=\"w3-card\">\n<!-- H --><div id=\"conteneur_barre\" class=\"w3-bar w3-light-gray\">\n<!-- I --><div id=\"barre_car_spec\" class=\"w3-light-gray\" style=\"display: none\">\n"
    + ((stack1 = lookupProperty(helpers,"each").call(alias1,(depth0 != null ? lookupProperty(depth0,"caracteres") : depth0),{"name":"each","hash":{},"fn":container.program(6, data, 0, blockParams),"inverse":container.noop,"data":data,"blockParams":blockParams,"loc":{"start":{"line":82,"column":0},"end":{"line":84,"column":9}}})) != null ? stack1 : "")
    + "<!-- I-BIS --></div>\n<!-- H-BIS --></div>\n<!-- G-BIS --></div><!-- Fin des caractères spéciaux\n\n\n<!-- Zone de saisie du texte de l'exercice -->\n<textarea \n	id=\"ma_saisie\" \n	spellcheck=\"false\" \n	class=\"w3-block\" \n	rows=\"15\" \n	placeholder=\"Saisissez ici le texte de votre "
    + alias4(((helper = (helper = lookupProperty(helpers,"exercice") || (depth0 != null ? lookupProperty(depth0,"exercice") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"exercice","hash":{},"data":data,"blockParams":blockParams,"loc":{"start":{"line":96,"column":46},"end":{"line":96,"column":58}}}) : helper)))
    + " notée au brouillon...\" \n	onblur=\"sessionStorage.setItem('"
    + alias4(((helper = (helper = lookupProperty(helpers,"cible") || (depth0 != null ? lookupProperty(depth0,"cible") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"cible","hash":{},"data":data,"blockParams":blockParams,"loc":{"start":{"line":97,"column":33},"end":{"line":97,"column":42}}}) : helper)))
    + "', this.value)\" \n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(lookupProperty(helpers,"cetteDicteeEstAmenagee")||(depth0 && lookupProperty(depth0,"cetteDicteeEstAmenagee"))||alias2).call(alias1,(depth0 != null ? lookupProperty(depth0,"exercice") : depth0),{"name":"cetteDicteeEstAmenagee","hash":{},"data":data,"blockParams":blockParams,"loc":{"start":{"line":98,"column":7},"end":{"line":98,"column":40}}}),{"name":"if","hash":{},"fn":container.program(8, data, 0, blockParams),"inverse":container.noop,"data":data,"blockParams":blockParams,"loc":{"start":{"line":98,"column":1},"end":{"line":100,"column":8}}})) != null ? stack1 : "")
    + ">"
    + alias4(((helper = (helper = lookupProperty(helpers,"saisie") || (depth0 != null ? lookupProperty(depth0,"saisie") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"saisie","hash":{},"data":data,"blockParams":blockParams,"loc":{"start":{"line":100,"column":9},"end":{"line":100,"column":19}}}) : helper)))
    + "</textarea>\n\n\n<!-- E-BIS --></div>  <!-- Fin de la zone de type card -->\n<!-- D-BIS --></div>  <!-- Fin de la Cell (2) -->\n<!-- B-BIS --></div> <!-- fin de zone responsive responsive-->\n\n\n<!-- J --><div id=\"zone_correction\" class=\"w3-container\" style=\"display: none\">\n <h3 class=\"w3-text-teal\">Correction\n   <a href=\"#!\" class=\"w3-button w3-text-teal\" data-navigo>\n  <i class=\"icon-fermer\"></i></a>\n </h3>\n<p id=\"corrige\" class=\"correction\"></p>\n<!-- J-BIS --></div> <!-- Fin div zone_correction -->\n\n<!-- A-BIS --></div> <!-- fin de la zone englobante des zones de la page -->\n\n<!-- ================================================== -->\n\n<!-- BLOC MASQUE: MAIS NECESSAIRE POUR LA CORRECTION\n    Son contenu est utilisé par la méthode corriger() de l'objet Dictee -->\n\n<!-- Texte attendu après la transformation -->\n<div id=\"attendu\" style=\"visibility: hidden\">"
    + alias4(((helper = (helper = lookupProperty(helpers,"attendu") || (depth0 != null ? lookupProperty(depth0,"attendu") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"attendu","hash":{},"data":data,"blockParams":blockParams,"loc":{"start":{"line":124,"column":45},"end":{"line":124,"column":56}}}) : helper)))
    + "</div>\n<!-- Texte initial, c-à-d avant la transformation -->\n<div id=\"fourni\" style=\"visibility: hidden\">"
    + alias4(((helper = (helper = lookupProperty(helpers,"fourni") || (depth0 != null ? lookupProperty(depth0,"fourni") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"fourni","hash":{},"data":data,"blockParams":blockParams,"loc":{"start":{"line":126,"column":44},"end":{"line":126,"column":54}}}) : helper)))
    + "</div>\n<div id=\"type_exercice\" style=\"visibility: hidden\">"
    + alias4(((helper = (helper = lookupProperty(helpers,"cible") || (depth0 != null ? lookupProperty(depth0,"cible") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"cible","hash":{},"data":data,"blockParams":blockParams,"loc":{"start":{"line":127,"column":51},"end":{"line":127,"column":60}}}) : helper)))
    + "</div>\n";
},"usePartial":true,"useData":true,"useBlockParams":true});

},{"hbsfy/runtime":23}],62:[function(require,module,exports){
module.exports=/* ==================================== *
 *            e j D i c t o             *
 * ==================================== *
 * (c)2012-2020 - Patrick Cardona       *
 * Licence GPL version 3 ou ultérieure  *
 * VOIR la licence complète à la racine *
 * ==================================== */

/*
 * Données au format JSON
 * de la page A propos : sources et contributions
 * dans le cadre du projet ejDicto
 */

[
	{
		"appname": "Agrégateur de scripts (bundle) : Browserify",
		"auteur": "Browserify.org",
		"site": "http://browserify.org/",
		"licence": "MIT",
		"code": "https://github.com/browserify"
	},
	{
		"appname": "Serveur de développement : Budo",
		"auteur": "Matt DesLauriers",
		"site": "https://github.com/mattdesl/budo/blob/master/README.md",
		"licence": "MIT",
		"code": "https://github.com/mattdesl/budo"
	},
	{
		"appname": "Manipulation du DOM : Chibi",
		"auteur": "Kyle Barrow",
		"site": "https://github.com/kylebarrow/chibi",
		"licence": "MIT",
		"code": "https://github.com/kylebarrow/chibi"
	},
	{
		"appname": "Minification du code CSS : cleanCSS",
		"auteur": "Jakub Pawlowicz",
		"site": "https://www.npmjs.com/package/clean-css",
		"licence": "MIT",
		"code": "https://github.com/jakubpawlowicz/clean-css"
	},
    {
		"appname": "Template : Handlebars",
		"auteur": "Yehuda Katz",
		"site": "https://handlebarsjs.com/",
		"licence": "MIT",
		"code": "https://github.com/wycats/handlebars.js"
	},
	{
		"appname": "Handlebars avec Browserify : hbsfy",
		"auteur": "Esa-Matti Suuronen",
		"site": "https://www.npmjs.com/package/hbsfy",
		"licence": "MIT",
		"code": "https://github.com/epeli/node-hbsfy"
	},
	{
		"appname": "Icones : IcoMoon Free Version",
		"auteur": "Keyamoon",
		"site": "https://icomoon.io/",
		"licence": "GPL / CC BY 4.0",
		"code": "https://github.com/Keyamoon/IcoMoon-Free/archive/master.zip"
	},
	{
		"appname": "Comparaison de chaines : JsDiff",
		"auteur": "John Resig",
		"site": "http://ejohn.org/",
		"licence": "MIT",
		"code": "https://github.com/kpdecker/jsdiff"
	},
    {
      "appname": "Minification du code JS : jsmin",
      "auteur": "D. Crockford, F. Marcia, P. Krumins",
      "site": "https://www.npmjs.com/package/jsmin",
      "licence": "All right reserved",
      "code": "https://github.com/pkrumins/node-jsmin"
    },
	{
		"appname": "Routage : Navigo",
		"auteur": "Krasimir Tsonev",
		"site": "https://github.com/krasimir/navigo",
		"licence": "MIT",
		"code": "https://github.com/krasimir/navigo"
	},
    {
        "appname": "Service Worker : vanilla-pwa",
        "auteur": "Arjun Mahishi",
        "site": "https://www.npmjs.com/package/vanilla-pwa",
        "licence": "MIT",
        "code": "https://github.com/arjunmahishi/vanilla-pwa"
    },
    {
		"appname": "Style : W3.css",
		"auteur": "W3schools",
		"site": "https://www.w3schools.com/w3css/default.asp",
		"licence": "Usage libre",
		"code": "https://github.com/JaniRefsnes/w3css"
	}
]

},{}],63:[function(require,module,exports){
module.exports=/* Formats audio invoqués dans les propriétés "source" de la balise 
 * audio
 */

{
  'source': [
		        {'format':{'extension': 'mp3', 'type': 'mpeg'}},
		        {'format':{'extension': 'ogg', 'type': 'ogg'}},
		        {'format':{'extension': 'aac', 'type': 'aac'}}
            ]
}

},{}],64:[function(require,module,exports){
module.exports=/* Contenu de la licence */

{ 'licence': 
  {
  'auteur': 'Patrick Cardona',
  'debut': '2012',
  'pages': [
    { 
      "texte": "Le code JavaScript de cette page est un \
      logiciel libre. Vous pouvez le redistribuer et/ou le \
      modifier selon les termes de la licence GNU General \
      Public License (GNU GPL) telle que publiée \
      par la Free  Software Foundation, en version 3 de la \
      licence, ou (à votre discrétion) toute version \
      ultérieure. Le code est distribué SANS AUCUNE \
      GARANTIE ; sans même la garantie implicite de \
      MARCHANDABILITÉ ou d'ADÉQUATION À UN BUT PARTICULIER. \
      Consultez la GNU GPL pour plus de détails."
    },
    {
      "texte": "En tant que permission supplémentaire selon \
      les termes de la GNU GPL version 3 section 7, vous pouvez \
      distribuer des formes « non-source » (par ex., minimisées \
      ou compactées) de ce code sans la copie de la GNU GPL \
      normalement requise section 4, à condition d'inclure \
      cette notice de licence et une URL par laquelle \
      les destinataires peuvent accéder au code source \
      correspondant.<br><br> \
      Consultez la licence GNU GPL pour plus de détails: \
      <br /><a href='http://www.gnu.org/licenses/' target='_blank'>\
      http://www.gnu.org/licenses/</a>"
    }]
  }
}
},{}],65:[function(require,module,exports){
module.exports=/* ==================================== *
 *            e j D i c t o             *
 * ==================================== *
 * (c)2012-2020 - Patrick Cardona       *
 * Licence GPL version 3 ou ultérieure  *
 * VOIR la licence complète à la racine *
 * ==================================== */

/*
 * Liste des dictées au format JSON
 * Champs : id, titre et niveau.
 *
 */


[
    {
	"id": "51",
	"titre": "La rose",
	"niveau": "5e",
	"dictam": false
    },
    {
	"id": "52",
	"titre": "Un comportement étrange",
	"niveau": "5e",
	"dictam": false
    },
    {
	"id": "53",
	"titre": "Un château inquiétant",
	"niveau": "5e",
	"dictam": false
    },
    {
	"id": "54",
	"titre": "Les maximes de Scapin",
	"niveau" : "5e",
	"dictam": false
    },
    {
	"id": "55",
	"titre": "Le chagrin de Charlemagne",
	"niveau" : "5e",
	"dictam": false
    },
    {
	"id": "56",
	"titre": "Une mésaventure de Renart",
	"niveau" : "5e",
	"dictam": true
    },
    {
	"id": "31",
	"titre": "Le cerf",
	"niveau": "3e",
	"dictam": true
    },    {
	"id": "32",
	"titre": "Le tourisme",
	"niveau": "3e",
	"dictam": false
    },
    {
	"id": "33",
	"titre": "La villa Aurore (1)",
	"niveau": "3e",
		"dictam": false
    },
    {
	"id": "34",
	"titre": "La villa Aurore (2)",
	"niveau": "3e",
	"dictam": false
    },
    {
	"id": "35",
	"titre": "Ma mère et la maladie",
	"niveau": "3e",
	"dictam": false
    },
    {
    "id": "36",
    "titre": "La fontaine",
    "niveau": "3e",
    "dictam": true
    }
]


},{}],66:[function(require,module,exports){
module.exports=/* ==================================== *
 *            e j D i c t o             *
 * ==================================== *
 * (c)2012-2020 - Patrick Cardona       *
 * Licence GPL version 3 ou ultérieure  *
 * VOIR la licence complète à la racine *
 * ==================================== */

/*
 * Liste des réécritures au format JSON
 * Champs : id, titre et niveau.
 *
 */


[
    {
	"id": "501",
	"titre": "Remplacement de groupes nominaux [1]",
	"niveau": "5e"
    },
    {
	"id": "502",
	"titre": "Remplacement de groupes nominaux [2]",
	"niveau": "5e"
    },
    {
	"id": "52",
	"titre": "Accords dans la dictée 52",
	"niveau": "5e"
    },
    {
	"id": "32",
	"titre": "Accords dans la dictée 32",
	"niveau": "3e"
    }
]


},{}],67:[function(require,module,exports){
module.exports=/* Données template du menu Accueil */

{ 'menu': {
'couleur': 'fonce',
'contexte': {
    'bouton': true,
    'titre': 'ejDicto',
    'icone': '☰',
    'action': 'derouler_navigation()',
},
'items': [
    {
    'icone': "<i class='icon-liste'></i>",
    'legende': 'Liste des dictées',
    'lien': '#!liste/dictees'
    },
    {
    'icone': "<i class='icon-liste'></i>",
    'legende': 'Liste des réécritures',
    'lien': '#!liste/reecritures'
    }
],
'actions':[
    {
    'bouton': false,
    'icone': "<i class='icon-profil'></i>",
    'legende': 'Profil',
    'lien': '#!profil'
    },
    {
    'bouton': false,
    'icone': "<i class='icon-aide'></i>",
    'legende': 'Aide',
    'lien': '#!aide'
    }
]}}


},{}],68:[function(require,module,exports){
module.exports=/* Données template du menu Aide */

{ 'menu': {
'couleur': 'clair',
'contexte': {
    'bouton': false,
    'titre': 'Aide',
    'icone': "<i class='icon-retourner'></i>",
    'action': '#!'
},
'items': [],
'actions':[]
}}


},{}],69:[function(require,module,exports){
module.exports=/* Items du menu dans le contexte réécriture */

{ 'menu': {
'did': '',
'couleur': 'blue-gray',
'contexte': {
    'bouton': false,
    'titre': 'Consigne',
    'icone': "<i class='icon-retourner'></i>",
    'action': '#!liste/reecritures'
},
'items': [],
'actions':[
    {
    'bouton': false,
    'icone': "<i class='icon-info'></i>",
    'legende': 'Mentions légales',
    'lien': '#!mentions/reecriture'
    },
    {
    'bouton': false,
    'icone': "<i class='icon-plume'></i>",
    'legende': 'Saisir la réécriture',
    'lien': '#!saisir/reecriture'
    }
]
}}


},{}],70:[function(require,module,exports){
module.exports=/* Items du menu dans le contexte dictée */

{ 'menu': {
'did': '',
'couleur': 'blue-gray',
'contexte': {
    'bouton': false,
    'titre': 'Accueil',
    'icone': "<i class='icon-retourner'></i>",
    'action': '#!liste/dictees'
},
'items': [],
'actions':[
    {
    'bouton': false,
    'icone': "<i class='icon-info'></i>",
    'legende': 'Mentions légales',
    'lien': '#!mentions/dictee'
    },
    {
    'bouton': false,
    'icone': "<i class='icon-plume'></i>",
    'legende': 'Saisir la dictée',
    'lien': '#!saisir/dictee'
    },
    {
    'bouton': false,
    'icone': "<i class='icon-ecouteurs'></i>",
    'legende': 'Écouter la dictée',
    'lien': '#!ecouter'
    }
]
}}


},{}],71:[function(require,module,exports){
module.exports=/* Items du menu dans le contexte : écouter */

{ 'menu': {
'did': '',
'couleur': 'blue-gray',
'contexte': {
    'bouton': false,
    'titre': 'Écoute',
    'icone': "<i class='icon-retourner'></i>",
    'action': '#!liste/dictees'
},
'items': [],
'actions':[
    {
    'bouton': false,
    'icone': "<i class='icon-info'></i>",
    'legende': 'Mentions légales',
    'lien': '#!mentions/dictee'
    },
    {
    'bouton': false,
    'icone': "<i class='icon-plume'></i>",
    'legende': 'Saisir la dictée',
    'lien': '#!saisir/dictee'
    }
]
}}


},{}],72:[function(require,module,exports){
module.exports=/* Données template du menu Liste */

{ 'menu': {
'exercice': 'exercice',
'couleur': 'blue-gray',
'contexte': {
    'bouton': false,
    'titre': 'Liste',
    'icone': "<i class='icon-retourner'></i>",
    'action': '#!'
},
'items': [],
'actions':[
    {
    'bouton': true,
    'icone': "<i class='icon-recherche'></i>",
    'legende': 'Filtrer la liste',
    'lien': "$('#panneau_recherche').toggle()"
    }
]}}


},{}],73:[function(require,module,exports){
module.exports=/* Items du menu dans le contexte dictée */

{ 'menu': {
'did': '',
'couleur': 'blue-gray',
'contexte': {
    'bouton': false,
    'titre': 'Mentions légales',
    'icone': "<i class='icon-retourner'></i>",
    'action': '#!liste/dictees'
},
'items': [],
'actions':[
    {
    'bouton': false,
    'icone': "<i class='icon-plume'></i>",
    'legende': 'Saisir la dictée',
    'lien': '#!saisir/dictee'
    },
    {
    'bouton': false,
    'icone': "<i class='icon-ecouteurs'></i>",
    'legende': 'Écouter la dictée',
    'lien': '#!ecouter'
    }
]
}}


},{}],74:[function(require,module,exports){
module.exports=/* Items du menu dans le contexte mentions : réécriture */

{ 'menu': {
'did': '',
'couleur': 'blue-gray',
'contexte': {
    'bouton': false,
    'titre': 'Mentions légales',
    'icone': "<i class='icon-retourner'></i>",
    'action': '#!liste/reecritures'
},
'items': [],
'actions':[
    {
    'bouton': false,
    'icone': "<i class='icon-plume'></i>",
    'legende': 'Saisir la réécriture',
    'lien': '#!saisir/reecriture'
    },
    {
    'bouton': false,
    'icone': "<i class='icon-consigne'></i>",
    'legende': 'Consigne de la réécriture',
    'lien': '#!consigne'
    }
]
}}


},{}],75:[function(require,module,exports){
module.exports=/* Données template du menu Modprefs (modifications du profil) */

{ 'menu': {
'couleur': 'clair',
'contexte': {
    'bouton': false,
    'titre': 'Modification du profil',
    'icone': "<i class='icon-gauche'></i>",
    'action': '#!profil'
},
'items': [],
'actions':[
    {
    'bouton': false,
    'icone': "<i class='icon-finir'></i>",
    'legende': 'Appliquer',
    'lien': '#!profil'
    },
]
}}


},{}],76:[function(require,module,exports){
module.exports=/* Données template du menu Profil */

{ 'menu': {
'couleur': 'clair',
'contexte': {
    'bouton': false,
    'titre': 'Profil',
    'icone': "<i class='icon-retourner'></i>",
    'action': '#!'
},
'items': [],
'actions':[
    {
    'bouton': false,
    'icone': "<i class='icon-editer'></i>",
    'legende': 'Modifier le profil',
    'lien': '#!modprefs'
    },
]
}}


},{}],77:[function(require,module,exports){
module.exports=/* Items du menu dans le contexte réécriture */

{ 'menu': {
'did': '',
'couleur': 'blue-gray',
'contexte': {
    'bouton': false,
    'titre': 'Accueil',
    'icone': "<i class='icon-retourner'></i>",
    'action': '#!liste/reecritures'
},
'items': [],
'actions':[
    {
    'bouton': false,
    'icone': "<i class='icon-info'></i>",
    'legende': 'Mentions légales',
    'lien': '#!mentions/reecriture'
    },
    {
    'bouton': false,
    'icone': "<i class='icon-plume'></i>",
    'legende': 'Saisir la réécriture',
    'lien': '#!saisir/reecriture'
    },
    {
    'bouton': false,
    'icone': "<i class='icon-consigne'></i>",
    'legende': 'Consigne de la réécriture',
    'lien': '#!consigne'
    }
]
}}


},{}],78:[function(require,module,exports){
module.exports=/* Items du menu dans le contexte dictée */

{ 'menu': {
'did': '',
'couleur': 'blue-gray',
'contexte': {
    'bouton': false,
    'titre': 'Saisie',
    'icone': "<i class='icon-retourner'></i>",
    'action': '#!liste/dictees'
},
'items': [],
'actions':[
    {
    'bouton': false,
    'icone': "<i class='icon-info'></i>",
    'legende': 'Mentions légales',
    'lien': '#!mentions/dictee'
    },
    {
    'bouton': false,
    'icone': "<i class='icon-ecouteurs'></i>",
    'legende': 'Écouter la dictée',
    'lien': '#!ecouter'
    }
]
}}


},{}],79:[function(require,module,exports){
module.exports=/* Items du menu dans le contexte dictée */

{ 'menu': {
'did': '',
'couleur': 'blue-gray',
'contexte': {
    'bouton': false,
    'titre': 'Saisie',
    'icone': "<i class='icon-retourner'></i>",
    'action': '#!liste/reecritures'
},
'items': [],
'actions':[
    {
    'bouton': false,
    'icone': "<i class='icon-info'></i>",
    'legende': 'Mentions légales',
    'lien': '#!mentions/reecriture'
    },
    {
    'bouton': false,
    'icone': "<i class='icon-consigne'></i>",
    'legende': 'Consigne de la réécriture',
    'lien': '#!consigne'
    }
]
}}


},{}],80:[function(require,module,exports){
module.exports=/* Messages de l'interface */


{
"msg": {
  "bienvenue": "Bienvenue dans votre espace d'entrainement en orthographe&nbsp;!",
  "consigneDictee": "D'abord, écoutez la dictée et notez-la au brouillon",
  "consigneDicteeAmenagee": "Écoutez la dictée en parcourant le \
        texte lacunaire. Passez la souris au-dessus des lacunes pour \
        découvrir les choix proposés. Notez-les au brouillon."
  }
}
},{}],81:[function(require,module,exports){
module.exports=/* Niveaux d'enseignement */

{
  'niveaux': [
              { 'chiffre': '5', 'nom': 'Cinquième' },
              { 'chiffre': '3', 'nom': 'Troisième' },
              { 'chifrre': '*', 'nom': 'Tous' }
  ]
}
},{}],82:[function(require,module,exports){
module.exports=/* Messages popup */

{
  "infos": [{
    "msgid": "0",
    "titre": "Message de cette application",
    "contenu": "Ce message permet de tester le module de notification !",
  }, {
    "msgid": "1",
    "titre": "Mode d'emploi",
    "contenu": "Vous devez sélectionner un mot !",
  }, {
    "msgid": "2",
    "titre": "Bilan",
    "contenu": "Vous pouvez encore améliorer votre saisie.",
  }, {
    "msgid": "3",
    "titre": "Bilan",
    "contenu": "Parfait ! Aucune erreur.",
  }, {
    "msgid": "4",
    "titre": "Erreur 4 dans l'application",
    "contenu": "Le texte attendu est manquant."
  }, {
    "msgid": "5",
    "titre": "Mode d'emploi",
    "contenu": "Aucun texte n'a été saisi."
  }, {
    "msgid": "6",
    "titre": "Assistant",
    "contenu": "Vous n'avez pas encore remplacé toutes les lacunes."
  }, {
    "msgid": "7",
    "titre": "Assistant indisponible",
    "contenu": "Il ne reste aucune lacune à remplacer."
  }
  ]
}

},{}],83:[function(require,module,exports){
module.exports=/* Rubriques des onglets : page A propos */

{ 'rubriques': [
  { 
  'lien': 'apropos',
  'legende': "À propos"
  },
  {
  'lien': 'fabrique',
  'legende': "Fabrique"
  },
  {
  'lien': 'credits',
  'legende': "Crédits"
  }
  ]
}

},{}],84:[function(require,module,exports){
module.exports=/* Rubriques des onglets : page A propos */

{ 'rubriques': [
  {
  'lien': 'conseils',
  'legende': "Conseils"
  },
  {
  'lien': 'texte',
  'legende': "Texte aménagé"
  },
  {
  'lien': 'choix',
  'legende': "Propositions"
  }
  ]
}

},{}],85:[function(require,module,exports){
module.exports=/* Rubriques des onglets : page Licence */

{ 'rubriques': [
  { 
  'lien': 'page1',
  'legende': "1"
  },
  {
  'lien': 'page2',
  'legende': "2"
  }
]
}

},{}],86:[function(require,module,exports){
module.exports=/* Table des caractères spéciaux */

{
  'caracteres': [
    { car: '«' },
    { car: '—' },
    { car: '»' },
    { car: '…' },
    { car: 'œ' },
    { car: 'Œ' },
    { car: 'É' },
    { car: 'À' }
    ]
}
},{}]},{},[47]);
