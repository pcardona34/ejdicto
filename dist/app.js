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
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<!-- ==================================\n *            e j D i c t o             *\n * ==================================== *\n * (c)2012-2020 - Patrick Cardona       *\n * Licence GPL version 3 ou ultérieure  *\n * VOIR la licence complète à la racine *\n * ==================================== -->\n \n<!-- Handlebars Partial : barreCaracteresTemplate.hbs -->\n\n<!-- Affichage d'un bouton carctère spécial -->\n\n    <button onclick=\"carspec.inserer('"
    + alias4(((helper = (helper = lookupProperty(helpers,"car") || (depth0 != null ? lookupProperty(depth0,"car") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"car","hash":{},"data":data,"loc":{"start":{"line":13,"column":38},"end":{"line":13,"column":45}}}) : helper)))
    + "','ma_saisie')\" class=\"w3-bar-item w3-button w3-border\">"
    + alias4(((helper = (helper = lookupProperty(helpers,"car") || (depth0 != null ? lookupProperty(depth0,"car") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"car","hash":{},"data":data,"loc":{"start":{"line":13,"column":101},"end":{"line":13,"column":108}}}) : helper)))
    + "</button>\n";
},"useData":true});

},{"hbsfy/runtime":23}],26:[function(require,module,exports){
/* ==================================== *
 *            e j D i c t o             *
 * ==================================== *
 * (c)2012-2020 - Patrick Cardona       *
 * Licence GPL version 3 ou ultérieure  *
 * VOIR la licence complète à la racine *
 * ==================================== */

// Script majeur en phase de développement : main.js
// Compilé, il produit app.js dans le dossier 'dist'
// --------------------------------
// Appels des dépendances
// Définiton du routage
// Compilation des templates
// --------------------------------

"use strict";
/*jslint browser: true*/
/*global window*/

// Dépendances externes : frameworks / modules
const Handlebars = require('hbsfy/runtime'); // compilation des tempates Handlebars avec le bundler Browserify
const Navigo = require('navigo/lib/navigo'); // Routeur
const chibi = require('chibijs/chibi'); // Fonctions de manipulation du DOM (un JQuery lite)
//const axios = require('axios'); // Requête dynamique de fichiers externes : JSON, etc.


// Menus :
const menuTemplate = require("./menus/menuTemplate.hbs"); // Modèle des menus
const menuDicteeTemplate = require("./menus/menuDicteeTemplate.hbs"); // Modèle menu page Dictee
const menuListeTemplate = require("./menus/menuListeTemplate.hbs"); // Modèle menu contexte de liste

// Composants (Partials) :
Handlebars.registerPartial("barre", require("./composants/barreCaracteresTemplate.hbs")); // Bouton caractère spécial


// Pages
const popupTemplate = require("./pages/popupTemplate.hbs"); // Affiche le contenu du message de notification
const erreurTemplate = require("./pages/erreurTemplate.hbs"); // Gestion erreur 404
const accueilTemplate = require("./pages/accueilTemplate.hbs"); // Page d'accueil
const listeTemplate = require("./pages/listeTemplate.hbs"); // Liste des dictées...
const aproposTemplate = require("./pages/aproposTemplate.hbs"); // Page "à propos..."
const licence1Template = require("./pages/licence1Template.hbs"); // Licence : page 1
const licence2Template = require("./pages/licence2Template.hbs"); // Licence : page 2
const dicteeTemplate = require("./pages/dicteeTemplate.hbs"); // Page globale d'une dictée
const ecouterTemplate = require("./pages/ecouterTemplate.hbs"); // Sous-Page dans le contexte Dictee : avec lecteur audio de la dictée
const saisirTemplate = require("./pages/saisirTemplate.hbs"); // Sous-Page dans le contexte Dictee : saisie et correction de la dictée
const mentionsTemplate = require("./pages/mentionsTemplate.hbs"); // Sous-Page dans le contexte Dictee: mentions légales
const conseilsTemplate = require("./pages/conseilsTemplate.hbs"); // Page de conseils de la saisie
const conseilsRTemplate = require("./pages/conseilsRTemplate.hbs"); // Page de conseils de la saisie
const aideTemplate = require("./pages/aideTemplate.hbs"); // Sommaire aide contexte dictée
const aideRTemplate = require("./pages/aideRTemplate.hbs"); // Sommaire aide contexte réécriture
const aideIconesMobileTemplate = require("./pages/aideIconesMobileTemplate.hbs"); // Aide sur les icônes en version mobile
const aideIconesMobileRTemplate = require("./pages/aideIconesMobileRTemplate.hbs"); // Aide sur les icônes en version mobile
const listeReecrituresTemplate = require("./pages/listeReecrituresTemplate.hbs"); // Liste des réécritures
const reecritureTemplate = require("./pages/reecritureTemplate.hbs"); // Page globale d'une réécriture
const mentionsReecritureTemplate = require("./pages/mentionsReecritureTemplate.hbs"); // Sous-Page dans le contexte Reecriture: mentions légale
const consigneReecritureTemplate = require("./pages/consigneReecritureTemplate.hbs"); // Sous-Page dans le contexte Reecriture : consigne
const saisirReecritureTemplate = require("./pages/saisirReecritureTemplate.hbs"); // Sous-Page dans le contexte Reecriture : saisie


/* ============================================== */
// On charge l'interface via un événement global load
/* ============================================== */
window.addEventListener('load', () => {
 // Zones cibles
const menu = $('#menu');
const app = $('#app');

// On fournit les données au template du menu Accueil 
const menuAccueil = menuTemplate(
{
    item: [
    {
    'icone': 'home',
    'legende': 'ejDicto',
    'lien': '#!',
    'droite': false
    },
    {
    'icone': 'list',
    'legende': 'Liste des dictées',
    'lien': '#!liste',
    'droite': false
    },
    {
    'icone': 'list',
    'legende': 'Liste des réécritures',
    'lien': '#!lister',
    'droite': false
    },
    {
    'icone': 'info',
    'legende': 'Licence',
    'lien': '#!licence/1',
    'droite': false
    },
    {
    'icone': 'help',
    'legende': 'À propos',
    'lien': '#!apropos',
    'droite': true
    },
]}
);

const menuDicteeItems = [
    {
    'icone': 'home',
    'legende': 'ejDicto',
    'lien': '#!',
    'droite': false
    },
    {
    'icone': 'headset',
    'legende': 'Écouter la dictée',
    'lien': '#!ecouter',
    'droite': false
    },
    {
    'icone': 'edit',
    'legende': 'Saisir la dictée',
    'lien': '#!saisir',
    'droite': false
    },
    {
    'icone': 'info',
    'legende': 'Mentions légales',
    'lien': '#!mentions',
    'droite': false
    },
    {
    'icone': 'help',
    'legende': 'Aide',
    'lien': '#!aide',
    'droite': true
    }
];

const menuReecritureItems = [
    {
    'icone': 'home',
    'legende': 'ejDicto',
    'lien': '#!',
    'droite': false
    },
    {
    'icone': 'message',
    'legende': 'Consigne',
    'lien': '#!consigne',
    'droite': false
    },
    {
    'icone': 'edit',
    'legende': 'Saisir la réécriture',
    'lien': '#!saisirr',
    'droite': false
    },
    {
    'icone': 'info',
    'legende': 'Mentions légales',
    'lien': '#!mentionsr',
    'droite': false
    },
    {
    'icone': 'help',
    'legende': 'Aide',
    'lien': '#!aider',
    'droite': true
    }
];



 /* 
  * ===========================
  *       *  ROUTAGE *
  * ===========================
  */

// Déclaration du routage
var root = "/ejdicto/";
var useHash = true;
var hash = '#!';
var router = new Navigo(root, useHash, hash);



// Autres routes

 router.on({
 // Page A propos
 'apropos': function () {
    let JSONdata = require ('../static/config/apropos.json');
    let contenu = {
	'app_name': 'ejDicto',
	'module': JSONdata
    }
    let html = aproposTemplate(contenu);
    app.html(html);
    menu.html(menuAccueil);
    },

 // Licence : page 1
    'licence/1': function () {
    let now = new Date();
	let actuel = now.getFullYear();
	let contenu = {
			'debut': '2012',
			'fin': actuel
		}
	let html = licence1Template(contenu);
	app.html(html);
	menu.html(menuAccueil);
    },

 // Licence : page 2
    'licence/2': function () {
	let html = licence2Template();
	app.html(html);
	menu.html(menuAccueil);
    },

 // Liste des dictées
    'liste': function () {
	let JSONdata = require('../static/config/liste_dictees.json');
	let contenu = {
		'infodictee': JSONdata
		}
	let html = listeTemplate(contenu);
	// Le contexte de liste a son propre menu de navigation
	let menuL = menuListeTemplate();
	menu.html(menuL);
	app.html(html);
	},

 // Liste des réécritures
    'lister': function () {
	let JSONdata = require('../static/config/liste_reecritures.json');
	let contenu = {
		'inforeecriture': JSONdata
		}
	let html = listeReecrituresTemplate(contenu);
	// Le contexte de liste a son propre menu de navigation
	let menuL = menuListeTemplate();
	menu.html(menuL);
	app.html(html);
	},

 // Page du contexte Dictee : une dictée a été choisie => id -> did
    'dictee/:id': function (params) {
	let contenu = {
		'did': params.id
	}
	let html = dicteeTemplate(contenu);
	let menuD = menuDicteeTemplate(
	{
	    'did': params.id,
	    'item': menuDicteeItems
	});
	menu.html(menuD);
	app.html(html);
	},

 // Page du contexte Réécriture : une réécriture a été choisie => id -> did
    'reecriture/:id': function (params) {
	let contenu = {
		'did': params.id
	}
	let html = reecritureTemplate(contenu);
	let menuD = menuDicteeTemplate(
	{
	    'did': params.id,
	    'item': menuReecritureItems
	});
	menu.html(menuD);
	app.html(html);
	},

 // Page avec un lecteur audio : écoute de la dictée
    'ecouter/:id': function (params) {
	let contenu = {
		'did': params.id
	};
	let html = ecouterTemplate(contenu);
  // Menu de la dictée avec contexte 'did'
	let menuD = menuDicteeTemplate(
	{
	    'did': params.id,
	    'item': menuDicteeItems
	});
	menu.html(menuD);
	app.html(html);
	},

   // Page de saisie et de correction de la dictée : c'est le coeur de l'application
  'saisir/:id': function (params) {
    	/* On récupère les données de la dictée sélectionnée
    	 Au format JSon et on complète ce contenu pour 
    	 Initialiser le template 'saisir...' et afficher son contenu... */

fetch('http://example.com/movies.json')
  .then((response) => {
    return response.json();
  })
  .then((data) => {
    console.log(data);
  });

	fetch("./static/data/dictee" + params.id + ".json")
		.then((response) => {
		  return response.json();
        })
        .then((data) => {
		    // On prépare le contenu du template 'saisir...'
			let contenu = {};
		    // On prépare le contenu du Partial 'barre'
			contenu.caracteres = [{car: '«'},{car: '—'},{car: '»'},{car: '…'},{car: 'œ'},{car: 'Œ'},{car: 'É'},{car: 'À'}];
		    // On ajoute les autres données :
		    // id de la dictée : passé en paramètre de l'URL
			contenu.did = params.id;
		    // Les données récupérées à partir du fichier dictee + id + .json :
			contenu.texte = data.texte;
		    // On récupère une éventuelle saisie...
		    contenu.saisie = "";
		    if (sessionStorage.getItem("dictee")){
		      contenu.saisie = sessionStorage.getItem("dictee");
		    }
		    // On crée le contenu de la zone de saisie
		    let html = saisirTemplate(contenu);
		    	// On l'intègre dans le document
		    app.html(html);

	// On gère l'échec de la récupération des données...
	}).catch((err) => {
		console.log("Erreur: "+ err);
	 });

	// On crée et on affiche le menu lié au contexte Dictée
	let menuD = menuDicteeTemplate(
	{
	    'did': params.id,
	    'item': menuDicteeItems
	});
	menu.html(menuD);

	}, // Fin du routage vers la page de saisie de la dictée...


   // Page de saisie et de correction de la réécriture...
  'saisirr/:id': function (params) {
    	/* On récupère les données de la réécriture sélectionnée
    	 Au format JSon et on complète ce contenu pour 
    	 Initialiser le template 'saisirr...' et afficher son contenu... */
    fetch("./static/data/jecho" + params.id + ".json")
    	.then((response) => {
		  return response.json();
        })
        .then((data) => {
		    // On prépare le contenu du template 'saisir...'
			let contenu = {};
		    // On prépare le contenu du Partial 'barre'
			contenu.caracteres = [{car: '«'},{car: '—'},{car: '»'},{car: '…'},{car: 'œ'},{car: 'Œ'},{car: 'É'},{car: 'À'}];
		    // On ajoute les autres données :
		    // id de la réécriture : passé en paramètre de l'URL
			contenu.did = params.id;
		    // Les données récupérées à partir du fichier jecho + id + .json :
			contenu.initial = data.texte; // C'est le texte initial
			contenu.attendu = data.correction; // C'est le texte transformé attendu
		    // On récupère une éventuelle saisie...
		    contenu.saisie = "";
		    if (sessionStorage.getItem("reecriture")){
		      contenu.saisie = sessionStorage.getItem("reecriture");
		    }else{
		      // Sinon, c'est le texte initial...
		      contenu.saisie = contenu.initial;
		    }
		    // On crée le contenu de la zone de saisie
		    let html = saisirReecritureTemplate(contenu);
		    	// On l'intègre dans le document
		    app.html(html);

	// On gère l'échec de la récupération des données...
	}).catch((err) => {
		console.log("Erreur: "+ err);
	 });

	// On crée et on affiche le menu lié au contexte : modèle Dictée
	let menuD = menuDicteeTemplate(
	{
	    'did': params.id,
	    'item': menuReecritureItems
	});
	menu.html(menuD);

	}, // Fin du routage vers la page de saisie de la réécriture...

 // ---------------------------------
 // Page des mentions de la dictée
 // ---------------------------------
    'mentions/:id': function (params) {

  /* On récupère les données de la dictée sélectionnée
	 Au format JSon et on complète ce contenu pour 
	 Initialiser le template 'saisir...' et afficher son contenu... */
    fetch("./static/data/dictee" + params.id + ".json")
    	.then((response) => {
		  return response.json();
        })
        .then((data) => {
		    // On prépare le contenu du template 'mentions...'
			let contenu = {};
		    // id de la dictée : passé en paramètre de l'URL
			contenu.did = params.id;
		    // Les données récupérées à partir du fichier dictee + id + .json :
			contenu.auteur = data.auteur;
			contenu.titre = data.titre;
			contenu.prof = data.prof;
            contenu.ouvrage = data.ouvrage;
		    // On crée le contenu de la zone de mentions
		    let html = mentionsTemplate(contenu);
		    	// On l'intègre dans le document
		    app.html(html);

	// On gère l'échec de la récupération des données...
	}).catch((err) => {
		console.log("Erreur: "+ err);
    });
	// On crée et on affiche le menu lié au contexte Dictée
	let menuD = menuDicteeTemplate(
	{
	    'did': params.id,
	    'item': menuDicteeItems
	});
	menu.html(menuD);
	}, // Fin du routage vers la page des mentions de la dictée

 // ---------------------------------
 // Page des mentions de la réécriture
 // ---------------------------------
    'mentionsr/:id': function (params) {

  /* On récupère les données de la réécriture sélectionnée
    Au format JSon et on complète ce contenu pour 
    Initialiser le template 'saisir_reecriture...' et afficher son contenu... */
    fetch("./static/data/jecho" + params.id + ".json")
        .then((response) => {
          return response.json();
        })
        .then((data) => {
      // On prépare le contenu du template 'mentions...'
      let contenu = {};
		    // id de la dictée : passé en paramètre de l'URL
			contenu.did = params.id;
		    // Les données récupérées à partir du fichier dictee + id + .json :
			contenu.auteur = data.auteur;
			contenu.titre = data.titre;
			contenu.prof = data.prof;
            contenu.ouvrage = data.ouvrage;
		    // On crée le contenu de la zone de mentions
		    let html = mentionsReecritureTemplate(contenu);
		    // On l'intègre dans le document
		    app.html(html);

	// On gère l'échec de la récupération des données...
	}).catch((err) => {
		console.log("Erreur: "+ err);
    });
	// On crée et on affiche le menu lié au contexte Réécriture 
	// Même modèle que celui de la dictée

	let menuD = menuDicteeTemplate(
	{
	    'did': params.id,
	    'item': menuReecritureItems
	});
	menu.html(menuD);
	},

 // ---------------------------------
 // Page de la consigne de la réécriture
 // ---------------------------------
    'consigne/:id': function (params) {

  /* On récupère les données de la réécriture sélectionnée
    Au format JSon et on complète ce contenu pour 
    Initialiser le template 'consigneReecritureTemplate' et afficher son contenu... */
    fetch("./static/data/jecho" + params.id + ".json")
        .then((response) => {
          return response.json();
        })
        .then((data) => {
      // On prépare le contenu du template 'consigne...'
      let contenu = {};
		    // id de la dictée : passé en paramètre de l'URL
			contenu.did = params.id;
		    // Les données récupérées à partir du fichier dictee + id + .json :
			contenu.consigne = data.consigne;
			// Texte initial
			contenu.texte = data.texte;
		    // On crée le contenu de la zone de consigne
		    let html = consigneReecritureTemplate(contenu);
		    // On l'intègre dans le document
		    app.html(html);

	// On gère l'échec de la récupération des données...
	}).catch((err) => {
		console.log("Erreur: "+ err);
    });
	// On crée et on affiche le menu lié au contexte Réécriture 
	// Même modèle que celui de la dictée

	let menuD = menuDicteeTemplate(
	{
	    'did': params.id,
	    'item': menuReecritureItems
	});
	menu.html(menuD);
	},


	// Page de conseils : contexte dictée
	'conseils/:id': function(params){
		let contenu = {
		'did': params.id
	  };
	let html = conseilsTemplate(contenu);
	app.html(html);
  // Menu de la dictée avec son contexte : 'did'
	let menuD = menuDicteeTemplate(
	{
	    'did': params.id,
	    'item': menuDicteeItems
	});
	menu.html(menuD);
  },
  
	// Page de conseils : contexte réécriture
	'conseilsr/:id': function(params){
		let contenu = {
		'did': params.id
	  };
	let html = conseilsRTemplate(contenu);
	app.html(html);
  // Menu de la réécriture sur le modèle Dictée avec son contexte : 'did'
	let menuD = menuDicteeTemplate(
	{
	    'did': params.id,
	    'item': menuReecritureItems
	});
	menu.html(menuD);
  },
  

  // Sommaire de l'aide : contexte dictée
  'aide/:id': function(params){
      let contenu = {
        'did': params.id
        };
      let html = aideTemplate(contenu);
      app.html(html);
  // Menu de la dictée avec son contexte : 'did'
      let menuD = menuDicteeTemplate(
      {
      'did': params.id,
      'item': menuDicteeItems
      });
      menu.html(menuD);
  },

  // Sommaire de l'aide : contexte réécriture
  'aider/:id': function(params){
      let contenu = {
        'did': params.id
        };
      let html = aideRTemplate(contenu);
      app.html(html);
  // Menu de la réécriture sur le modèle Dictée avec son contexte : 'did'
      let menuD = menuDicteeTemplate(
      {
      'did': params.id,
      'item': menuReecritureItems
      });
      menu.html(menuD);
  },

  // Aide sur les icones en version mobile
    'boutons/:id': function(params){
      let contenu = {
        'did': params.id
        };
      let html = aideIconesMobileTemplate(contenu);
      app.html(html);
  // Menu de la dictée avec son contexte : 'did'
      let menuD = menuDicteeTemplate(
      {
      'did': params.id,
      'item': menuDicteeItems
      });
      menu.html(menuD);
  },
  
  // Aide sur les icones en version mobile : contexte Réécriture
    'boutonsr/:id': function(params){
      let contenu = {
        'did': params.id
        };
      let html = aideIconesMobileRTemplate(contenu);
      app.html(html);
  // Menu de la réécriture sur le modèle Dictée avec son contexte : 'did'
      let menuD = menuDicteeTemplate(
      {
      'did': params.id,
      'item': menuReecritureItems
      });
      menu.html(menuD);
  },

  // Chemin générique

  '*': function() {
  let html = accueilTemplate({"bienvenue": "Bienvenue dans votre espace d'entrainement en orthographe !"});
  app.html(html);
  menu.html(menuAccueil);
  menu.show();
  sessionStorage.clear();
  }

}).resolve();


 // Page d'accueil
 router.on(function () {
 let html = accueilTemplate({"bienvenue": "Bienvenue dans votre espace d'entrainement en orthographe !"});
 app.html(html);
 menu.html(menuAccueil);
 sessionStorage.clear();
 
 }).resolve();



// Route inconnue

router.notFound(function () {
 const html = erreurTemplate({
 couleur: 'yellow',
 titre: 'Erreur 404 - Page introuvable !',
 message: 'Ce chemin n\'existe pas.'
    });
 menu.html(menuAccueil)
 app.html(html);
  });



// Fin table de routage

}); // Fin de event load


},{"../static/config/apropos.json":52,"../static/config/liste_dictees.json":53,"../static/config/liste_reecritures.json":54,"./composants/barreCaracteresTemplate.hbs":25,"./menus/menuDicteeTemplate.hbs":27,"./menus/menuListeTemplate.hbs":28,"./menus/menuTemplate.hbs":29,"./pages/accueilTemplate.hbs":30,"./pages/aideIconesMobileRTemplate.hbs":31,"./pages/aideIconesMobileTemplate.hbs":32,"./pages/aideRTemplate.hbs":33,"./pages/aideTemplate.hbs":34,"./pages/aproposTemplate.hbs":35,"./pages/conseilsRTemplate.hbs":36,"./pages/conseilsTemplate.hbs":37,"./pages/consigneReecritureTemplate.hbs":38,"./pages/dicteeTemplate.hbs":39,"./pages/ecouterTemplate.hbs":40,"./pages/erreurTemplate.hbs":41,"./pages/licence1Template.hbs":42,"./pages/licence2Template.hbs":43,"./pages/listeReecrituresTemplate.hbs":44,"./pages/listeTemplate.hbs":45,"./pages/mentionsReecritureTemplate.hbs":46,"./pages/mentionsTemplate.hbs":47,"./pages/popupTemplate.hbs":48,"./pages/reecritureTemplate.hbs":49,"./pages/saisirReecritureTemplate.hbs":50,"./pages/saisirTemplate.hbs":51,"chibijs/chibi":1,"hbsfy/runtime":23,"navigo/lib/navigo":24}],27:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.lambda, alias3=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return " <a "
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(data && lookupProperty(data,"first")),{"name":"if","hash":{},"fn":container.program(2, data, 0, blockParams, depths),"inverse":container.program(4, data, 0, blockParams, depths),"data":data,"loc":{"start":{"line":21,"column":4},"end":{"line":25,"column":11}}})) != null ? stack1 : "")
    + "    data-navigo \n    class=\"w3-bar-item w3-button \n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(data && lookupProperty(data,"first")),{"name":"if","hash":{},"fn":container.program(6, data, 0, blockParams, depths),"inverse":container.program(8, data, 0, blockParams, depths),"data":data,"loc":{"start":{"line":31,"column":4},"end":{"line":40,"column":11}}})) != null ? stack1 : "")
    + "    ><i class=\"material-icons\">"
    + alias3(alias2((depth0 != null ? lookupProperty(depth0,"icone") : depth0), depth0))
    + "</i> "
    + alias3(alias2((depth0 != null ? lookupProperty(depth0,"legende") : depth0), depth0))
    + "</a>\n";
},"2":function(container,depth0,helpers,partials,data) {
    var lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "\n      href=\""
    + container.escapeExpression(container.lambda((depth0 != null ? lookupProperty(depth0,"lien") : depth0), depth0))
    + "\"\n";
},"4":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var alias1=container.lambda, alias2=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "      href=\""
    + alias2(alias1((depth0 != null ? lookupProperty(depth0,"lien") : depth0), depth0))
    + "/"
    + alias2(alias1((depths[1] != null ? lookupProperty(depths[1],"did") : depths[1]), depth0))
    + "\" \n";
},"6":function(container,depth0,helpers,partials,data) {
    return "      w3-teal\"\n";
},"8":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"droite") : depth0),{"name":"if","hash":{},"fn":container.program(9, data, 0),"inverse":container.program(11, data, 0),"data":data,"loc":{"start":{"line":35,"column":6},"end":{"line":39,"column":13}}})) != null ? stack1 : "");
},"9":function(container,depth0,helpers,partials,data) {
    return "        w3-right\"\n";
},"11":function(container,depth0,helpers,partials,data) {
    return "        \"\n";
},"13":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.lambda, alias3=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "  <a "
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(data && lookupProperty(data,"first")),{"name":"if","hash":{},"fn":container.program(2, data, 0, blockParams, depths),"inverse":container.program(4, data, 0, blockParams, depths),"data":data,"loc":{"start":{"line":70,"column":5},"end":{"line":74,"column":11}}})) != null ? stack1 : "")
    + "    data-navigo \n    class=\"w3-bar-item w3-button w3-mobile \n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(data && lookupProperty(data,"first")),{"name":"if","hash":{},"fn":container.program(6, data, 0, blockParams, depths),"inverse":container.program(14, data, 0, blockParams, depths),"data":data,"loc":{"start":{"line":80,"column":4},"end":{"line":91,"column":11}}})) != null ? stack1 : "")
    + "    ><i class=\"material-icons\">"
    + alias3(alias2((depth0 != null ? lookupProperty(depth0,"icone") : depth0), depth0))
    + "</i> "
    + alias3(alias2((depth0 != null ? lookupProperty(depth0,"legende") : depth0), depth0))
    + "</a>\n";
},"14":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"droite") : depth0),{"name":"if","hash":{},"fn":container.program(9, data, 0),"inverse":container.program(11, data, 0),"data":data,"loc":{"start":{"line":84,"column":6},"end":{"line":88,"column":13}}})) != null ? stack1 : "")
    + "      onclick=\"$('#menu_principal_mobile').hide()\"\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data,blockParams,depths) {
    var stack1, alias1=depth0 != null ? depth0 : (container.nullContext || {}), lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<!-- ==================================\n *            e j D i c t o             *\n * ==================================== *\n * (c)2012-2020 - Patrick Cardona       *\n * Licence GPL version 3 ou ultérieure  *\n * VOIR la licence complète à la racine *\n * ==================================== -->\n\n <!-- Navigation : Menu : menuDicteeTemplate.hbs -->\n\n<!-- ============================================ -->\n\n<!-- Menu bureau : medium et large -->\n\n<!-- Barre de menu gris clair -->\n <div class=\"top\">\n <div class=\"w3-hide-small w3-bar w3-light-grey w3-text-teal\" id=\"menu_principal\">\n\n <!-- Gestion du lot de boutons du menu -->\n"
    + ((stack1 = lookupProperty(helpers,"each").call(alias1,(depth0 != null ? lookupProperty(depth0,"item") : depth0),{"name":"each","hash":{},"fn":container.program(1, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"loc":{"start":{"line":20,"column":1},"end":{"line":42,"column":10}}})) != null ? stack1 : "")
    + " </div>\n</div>\n\n<!-- =================================================== -->\n<!-- Menu mobile -->\n\n<div class=\"w3-hide-large w3-hide-medium w3-top w3-display-container w3-dark-grey\">\n <div class=\"display-topleft\">\n  <button onclick=\"$('#menu_principal_mobile').show()\" class=\"w3-button w3-bar-item\">\n    <i class=\"material-icons\">menu</i>\n  </button>\n </div>\n <div class=\"w3-wide w3-large w3-xlarge w3-display-topmiddle\">&nbsp;ejDicto</div>\n</div>\n\n<!-- Barre de menu gris foncé \n      Cachée par défaut -->\n <div class=\"w3-hide-large w3-hide-medium w3-bar w3-top w3-dark-grey\" id=\"menu_principal_mobile\"\n style=\"display: none\">\n\n<!-- Bouton de fermeture à droite : seulement sur mobile -->\n <a class=\"w3-button w3-bar-item w3-right\" onclick=\"$('#menu_principal_mobile').hide()\">\n <i class=\"material-icons\">close</i>\n </a>\n \n <!-- Gestion du lot de boutons du menu -->\n"
    + ((stack1 = lookupProperty(helpers,"each").call(alias1,(depth0 != null ? lookupProperty(depth0,"item") : depth0),{"name":"each","hash":{},"fn":container.program(13, data, 0, blockParams, depths),"inverse":container.noop,"data":data,"loc":{"start":{"line":69,"column":1},"end":{"line":93,"column":10}}})) != null ? stack1 : "")
    + "</div>\n";
},"useData":true,"useDepths":true});

},{"hbsfy/runtime":23}],28:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    return "<!-- ==================================\n *            e j D i c t o             *\n * ==================================== *\n * (c)2012-2020 - Patrick Cardona       *\n * Licence GPL version 3 ou ultérieure  *\n * VOIR la licence complète à la racine *\n * ==================================== -->\n\n <!-- Navigation : Menu : menuListe.hbs -->\n\n<div class=\"w3-top w3-hide-small\">\n  <div class=\"w3-bar w3-light-grey w3-text-teal\">\n\n  <a href=\"#!\" class=\"w3-bar-item w3-button w3-teal\">\n    <i class=\"material-icons\">home</i> ejDicto\n  </a>\n\n  <button onclick=\"$('#panneau_recherche').toggle()\" \n  class=\"w3-bar-item w3-button w3-right\">\n  <i class=\"material-icons\">search</i>\n  </button>\n  </div>\n</div>\n\n\n<!-- ooooooooooooooooooooooooooooooooooooo -->\n\n<!-- Version mobile : on fonce la barre, suffisant pour ce menu. -->\n\n<div class=\"w3-top w3-hide-medium w3-hide-large\">\n  <div class=\"w3-bar w3-dark-grey\">\n\n  <a href=\"#!\" class=\"w3-bar-item w3-button w3-teal\">\n    <i class=\"material-icons\">home</i> jDicto\n  </a>\n\n  <button onclick=\"$('#panneau_recherche').toggle()\" \n  class=\"w3-bar-item w3-button w3-dark-grey w3-right\">\n  <i class=\"material-icons\">search</i>\n  </button>\n  </div>\n</div>\n";
},"useData":true});

},{"hbsfy/runtime":23}],29:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=container.lambda, alias2=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return " <a href=\""
    + alias2(alias1((depth0 != null ? lookupProperty(depth0,"lien") : depth0), depth0))
    + "\" \n    data-navigo \n    class=\"w3-bar-item w3-button \n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(data && lookupProperty(data,"first")),{"name":"if","hash":{},"fn":container.program(2, data, 0),"inverse":container.program(4, data, 0),"data":data,"loc":{"start":{"line":27,"column":4},"end":{"line":36,"column":11}}})) != null ? stack1 : "")
    + "    ><i class=\"material-icons\">"
    + alias2(alias1((depth0 != null ? lookupProperty(depth0,"icone") : depth0), depth0))
    + "</i> "
    + alias2(alias1((depth0 != null ? lookupProperty(depth0,"legende") : depth0), depth0))
    + "</a>\n";
},"2":function(container,depth0,helpers,partials,data) {
    return "      w3-teal\"\n";
},"4":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"droite") : depth0),{"name":"if","hash":{},"fn":container.program(5, data, 0),"inverse":container.program(7, data, 0),"data":data,"loc":{"start":{"line":31,"column":6},"end":{"line":35,"column":13}}})) != null ? stack1 : "");
},"5":function(container,depth0,helpers,partials,data) {
    return "        w3-right\"\n";
},"7":function(container,depth0,helpers,partials,data) {
    return "        \"\n";
},"9":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=container.lambda, alias2=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return " <a href=\""
    + alias2(alias1((depth0 != null ? lookupProperty(depth0,"lien") : depth0), depth0))
    + "\" \n    data-navigo \n    class=\"w3-bar-item w3-button w3-mobile \n"
    + ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(data && lookupProperty(data,"first")),{"name":"if","hash":{},"fn":container.program(2, data, 0),"inverse":container.program(10, data, 0),"data":data,"loc":{"start":{"line":72,"column":4},"end":{"line":83,"column":11}}})) != null ? stack1 : "")
    + "    ><i class=\"material-icons\">"
    + alias2(alias1((depth0 != null ? lookupProperty(depth0,"icone") : depth0), depth0))
    + "</i> "
    + alias2(alias1((depth0 != null ? lookupProperty(depth0,"legende") : depth0), depth0))
    + "</a>\n";
},"10":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"droite") : depth0),{"name":"if","hash":{},"fn":container.program(5, data, 0),"inverse":container.program(7, data, 0),"data":data,"loc":{"start":{"line":76,"column":6},"end":{"line":80,"column":13}}})) != null ? stack1 : "")
    + "      onclick=\"$('#menu_principal_mobile').hide()\"\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=depth0 != null ? depth0 : (container.nullContext || {}), lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<!-- ==================================\n *            e j D i c t o             *\n * ==================================== *\n * (c)2012-2020 - Patrick Cardona       *\n * Licence GPL version 3 ou ultérieure  *\n * VOIR la licence complète à la racine *\n * ==================================== -->\n\n <!-- Navigation : Menu : menuTemplate.hbs -->\n\n<!-- ============================================ -->\n\n<!-- Menu bureau : medium et large -->\n\n<!-- Barre de menu gris clair -->\n <div class=\"top\">\n <div class=\"w3-hide-small w3-bar w3-light-grey w3-text-teal\" id=\"menu_principal\">\n\n <!-- Gestion du lot de boutons du menu -->\n"
    + ((stack1 = lookupProperty(helpers,"each").call(alias1,(depth0 != null ? lookupProperty(depth0,"item") : depth0),{"name":"each","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":20,"column":1},"end":{"line":38,"column":10}}})) != null ? stack1 : "")
    + " </div>\n</div>\n\n<!-- =================================================== -->\n<!-- Menu mobile -->\n\n<div class=\"w3-hide-large w3-hide-medium w3-top w3-display-container w3-dark-grey\">\n <div class=\"display-topleft\">\n  <button onclick=\"$('#menu_principal_mobile').show()\" class=\"w3-button w3-bar-item\">\n    <i class=\"material-icons\">menu</i>\n  </button>\n </div>\n <div class=\"w3-wide w3-large w3-xlarge w3-display-topmiddle\">&nbsp;ejDicto</div>\n</div>\n\n<!-- Barre de menu gris foncé \n      Cachée par défaut -->\n <div class=\"w3-hide-large w3-hide-medium w3-bar w3-top w3-dark-grey\" id=\"menu_principal_mobile\"\n style=\"display: none\">\n\n<!-- Bouton de fermeture à droite : seulement sur mobile -->\n <a class=\"w3-button w3-bar-item w3-right\" onclick=\"$('#menu_principal_mobile').hide()\">\n <i class=\"material-icons\">close</i>\n </a>\n \n <!-- Gestion du lot de boutons du menu -->\n"
    + ((stack1 = lookupProperty(helpers,"each").call(alias1,(depth0 != null ? lookupProperty(depth0,"item") : depth0),{"name":"each","hash":{},"fn":container.program(9, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":65,"column":1},"end":{"line":85,"column":10}}})) != null ? stack1 : "")
    + "</div>\n";
},"useData":true});

},{"hbsfy/runtime":23}],30:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<!-- ==================================\n *            e j D i c t o             *\n * ==================================== *\n * (c)2012-2020 - Patrick Cardona       *\n * Licence GPL version 3 ou ultérieure  *\n * VOIR la licence complète à la racine *\n * ==================================== -->\n \n <!-- accueilTemplate.hbs -->\n\n <div class=\"w3-container\" id=\"page_accueil\">\n <div class=\"w3-display-container\">\n   <img src=\"./static/images/encrier.jpg\" class=\"w3-image w3-opacity-max\">\n   <h1 class=\"w3-wide w3-display-middle w3-text-teal w3-opacity\" >"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"bienvenue") || (depth0 != null ? lookupProperty(depth0,"bienvenue") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"bienvenue","hash":{},"data":data,"loc":{"start":{"line":14,"column":66},"end":{"line":14,"column":81}}}) : helper)))
    + "</h1>\n </div>\n </div>\n\n";
},"useData":true});

},{"hbsfy/runtime":23}],31:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<!-- ==================================\n *            e j D i c t o             *\n * ==================================== *\n * (c)2012-2020 - Patrick Cardona       *\n * Licence GPL version 3 ou ultérieure  *\n * VOIR la licence complète à la racine *\n * ==================================== -->\n \n <!-- Template : aideTemplate.hbs -->\n\n\n<div class=\"w3-container w3-padding-32\">\n\n	<h3 class=\"w3-text-teal\">Boutons en version mobile</h3>\n\n<div class=\"w3-container w3-padding\">\n	<ul class=\"w3-ul\">\n    <li><span class=\"w3-green w3-padding\"><i class=\"material-icons\">add</i></span> \n    affiche la barre des caractères spéciaux.</li>\n    <li><span class=\"w3-orange w3-padding\"><i class=\"material-icons\">delete_forever</i></span> \n    remet le texte initial.</li>\n    <li><span class=\"w3-green w3-padding\"><i class=\"material-icons\">announcement</i></span> \n    soumet la réécriture au correcteur <sup>(1)</sup></li>\n    <li><span class=\"w3-red w3-padding\"><i class=\"material-icons\">assignment_turned_in</i></span> \n    termine la réécriture et affiche la correction finale</li>\n	</ul>\n<p><sup>(1)</sup> Si le correcteur détecte des erreurs, il affiche un message \ninvitant à améliorer la réécriture saisie.</p>\n  <p>\n	<a class=\"w3-button w3-green\" \" href=\"#!saisirr/"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"did") || (depth0 != null ? lookupProperty(depth0,"did") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"did","hash":{},"data":data,"loc":{"start":{"line":30,"column":49},"end":{"line":30,"column":56}}}) : helper)))
    + "\">\n	<i class=\"material-icons\">arrow_back_ios</i> Reprendre ma saisie</a>\n  </p>\n</div>\n";
},"useData":true});

},{"hbsfy/runtime":23}],32:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<!-- ==================================\n *            e j D i c t o             *\n * ==================================== *\n * (c)2012-2020 - Patrick Cardona       *\n * Licence GPL version 3 ou ultérieure  *\n * VOIR la licence complète à la racine *\n * ==================================== -->\n \n <!-- Template : aideTemplate.hbs -->\n\n\n<div class=\"w3-container w3-padding-32\">\n\n	<h3 class=\"w3-text-teal\">Boutons en version mobile</h3>\n\n<div class=\"w3-container w3-padding\">\n	<ul class=\"w3-ul\">\n    <li><span class=\"w3-green w3-padding\"><i class=\"material-icons\">add</i></span> affiche la barre des caractères spéciaux.</li>\n    <li><span class=\"w3-orange w3-padding\"><i class=\"material-icons\">delete_forever</i></span> efface la saisie commencée.</li>\n    <li><span class=\"w3-green w3-padding\"><i class=\"material-icons\">announcement</i></span> soumet la dictée au correcteur <sup>(1)</sup></li>\n    <li><span class=\"w3-red w3-padding\"><i class=\"material-icons\">assignment_turned_in</i></span> termine la dictée et affiche la correction finale</li>\n	</ul>\n<p><sup>(1)</sup> Si le correcteur détecte des erreurs, il affiche un message invitant à améliorer la dictée saisie.</p>\n  <p>\n	<a class=\"w3-button w3-green\" \" href=\"#!saisir/"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"did") || (depth0 != null ? lookupProperty(depth0,"did") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"did","hash":{},"data":data,"loc":{"start":{"line":25,"column":48},"end":{"line":25,"column":55}}}) : helper)))
    + "\"><i class=\"material-icons\">arrow_back_ios</i> Reprendre ma saisie</a>\n  </p>\n</div>\n";
},"useData":true});

},{"hbsfy/runtime":23}],33:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<!-- ==================================\n *            e j D i c t o             *\n * ==================================== *\n * (c)2012-2020 - Patrick Cardona       *\n * Licence GPL version 3 ou ultérieure  *\n * VOIR la licence complète à la racine *\n * ==================================== -->\n \n <!-- Template : aideRTemplate.hbs -->\n\n\n<div class=\"w3-container w3-padding-32\">\n\n	<h3 class=\"w3-text-teal\">Aide</h3>\n\n<div class=\"w3-container w3-padding\">\n	<ul class=\"w3-ul\">\n		<li class=\"w3-green\">\n			<h3>Sommaire</h3>\n        <li><a href=\"#!boutonsr/"
    + alias4(((helper = (helper = lookupProperty(helpers,"did") || (depth0 != null ? lookupProperty(depth0,"did") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"did","hash":{},"data":data,"loc":{"start":{"line":20,"column":32},"end":{"line":20,"column":39}}}) : helper)))
    + "\" data-navigo class=\"w3-button w3-text-green\">\n        Boutons de la version mobile</a>\n		</li>\n		<li><a href=\"#!conseilsr/"
    + alias4(((helper = (helper = lookupProperty(helpers,"did") || (depth0 != null ? lookupProperty(depth0,"did") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"did","hash":{},"data":data,"loc":{"start":{"line":23,"column":27},"end":{"line":23,"column":34}}}) : helper)))
    + "\" data-navigo class=\"w3-button w3-text-green\">\n		Améliorer ma saisie\n		</li>\n	</ul>\n	\n  <p>\n	<a class=\"w3-button w3-green\" href=\"#!saisirr/"
    + alias4(((helper = (helper = lookupProperty(helpers,"did") || (depth0 != null ? lookupProperty(depth0,"did") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"did","hash":{},"data":data,"loc":{"start":{"line":29,"column":47},"end":{"line":29,"column":54}}}) : helper)))
    + "\">\n	<i class=\"material-icons\">arrow_back_ios</i> Reprendre ma saisie\n	</a>\n  </p>\n</div>\n";
},"useData":true});

},{"hbsfy/runtime":23}],34:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<!-- ==================================\n *            e j D i c t o             *\n * ==================================== *\n * (c)2012-2020 - Patrick Cardona       *\n * Licence GPL version 3 ou ultérieure  *\n * VOIR la licence complète à la racine *\n * ==================================== -->\n \n <!-- Template : aideTemplate.hbs -->\n\n\n<div class=\"w3-container w3-padding-32\">\n\n	<h3 class=\"w3-text-teal\">Aide</h3>\n\n<div class=\"w3-container w3-padding\">\n	<ul class=\"w3-ul\">\n		<li class=\"w3-green\">\n			<h3>Sommaire</h3>\n        <li><a href=\"#!boutons/"
    + alias4(((helper = (helper = lookupProperty(helpers,"did") || (depth0 != null ? lookupProperty(depth0,"did") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"did","hash":{},"data":data,"loc":{"start":{"line":20,"column":31},"end":{"line":20,"column":38}}}) : helper)))
    + "\" data-navigo class=\"w3-button w3-text-green\">Boutons de la version mobile</a>\n		</li>\n		<li><a href=\"#!conseils/"
    + alias4(((helper = (helper = lookupProperty(helpers,"did") || (depth0 != null ? lookupProperty(depth0,"did") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"did","hash":{},"data":data,"loc":{"start":{"line":22,"column":26},"end":{"line":22,"column":33}}}) : helper)))
    + "\" data-navigo class=\"w3-button w3-text-green\">Améliorer ma saisie\n		</li>\n	</ul>\n	\n  <p>\n	<a class=\"w3-button w3-green\" \" href=\"#!saisir/"
    + alias4(((helper = (helper = lookupProperty(helpers,"did") || (depth0 != null ? lookupProperty(depth0,"did") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"did","hash":{},"data":data,"loc":{"start":{"line":27,"column":48},"end":{"line":27,"column":55}}}) : helper)))
    + "\"><i class=\"material-icons\">arrow_back_ios</i> Reprendre ma saisie</a>\n  </p>\n</div>\n";
},"useData":true});

},{"hbsfy/runtime":23}],35:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=container.lambda, alias2=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "	    <li><a class=\"w3-text-teal\" style=\"text-decoration: none\" href=\""
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"module") : depth0)) != null ? lookupProperty(stack1,"site") : stack1), depth0))
    + "\" target=\"_blank\">"
    + alias2(alias1((depth0 != null ? lookupProperty(depth0,"appname") : depth0), depth0))
    + "</a> de "
    + alias2(alias1((depth0 != null ? lookupProperty(depth0,"auteur") : depth0), depth0))
    + ". Licence "
    + alias2(alias1((depth0 != null ? lookupProperty(depth0,"licence") : depth0), depth0))
    + ". <a href=\""
    + alias2(alias1((depth0 != null ? lookupProperty(depth0,"code") : depth0), depth0))
    + "\" target=\"_blank\" class=\"w3-text-teal\" style=\"text-decoration: none\"><i class=\"fa fa-link\"></i> Code source</a></li>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<!-- ==================================\n *            e j D i c t o             *\n * ==================================== *\n * (c)2012-2020 - Patrick Cardona       *\n * Licence GPL version 3 ou ultérieure  *\n * VOIR la licence complète à la racine *\n * ==================================== -->\n\n<!-- Template : aproposTemplate.hbs -->\n\n<div class=\"w3-container\">\n    <h3 class=\"w3-text-teal\">À propos de "
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"app_name") || (depth0 != null ? lookupProperty(depth0,"app_name") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(alias1,{"name":"app_name","hash":{},"data":data,"loc":{"start":{"line":12,"column":41},"end":{"line":12,"column":55}}}) : helper)))
    + "</h3>\n\n    <p>Cette application Web permet de s'exercer en orthographe de manière autonome en proposant des exercices variés : dictées, réécritures...</p>\n    <p>C'est un <a href=\"#!licence/1\" class=\"w3-text-teal\" style=\"text-decoration: none\">logiciel libre</a> réalisé grâce aux modules ou outils suivants :</p>\n\n    <ul style=\"list-style: none\">\n"
    + ((stack1 = lookupProperty(helpers,"each").call(alias1,(depth0 != null ? lookupProperty(depth0,"module") : depth0),{"name":"each","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":18,"column":5},"end":{"line":20,"column":14}}})) != null ? stack1 : "")
    + "    </ul>\n\n    <h3>Crédit photo</h3>\n    <p>Le dessin de l'encrier en page d'accueil est l'œuvre de Rawpixel : <a class=\"w3-text-teal\" style=\"text-decoration: none\" target=\"_blank\" href=\"http://www.freepik.com\">designed by rawpixel.com / Freepik</a></p>\n</div>\n\n";
},"useData":true});

},{"hbsfy/runtime":23}],36:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<!-- ==================================\n *            e j D i c t o             *\n * ==================================== *\n * (c)2012-2020 - Patrick Cardona       *\n * Licence GPL version 3 ou ultérieure  *\n * VOIR la licence complète à la racine *\n * ==================================== -->\n \n <!-- Template : conseilsTemplate.hbs -->\n\n\n<div class=\"w3-container w3-padding-32\">\n\n	<h3 class=\"w3-text-teal\">Comment améliorer mon texte ?</h3>\n\n<div class=\"w3-container w3-padding\">\n	<ul class=\"w3-ul\">\n		<li class=\"w3-green\">\n			<h3>Je vérifie...</h3>\n        <li>Les homophones : <b>a</b> ou <b>à</b> ? <b>et</b> ou <b>est</b> ? etc.\n		</li>\n		<li>Les accords au sein du groupe nominal.\n		</li>\n		<li>\n			Les accords du verbe avec son sujet :\n			 attention au sujet parfois inversé ou composé de plusieurs noms&nbsp;.\n			 Attention à la présence de pronoms sournois, placés entre le sujet et le verbe.\n		</li>\n		<li>\n			Je fais attention aux accords plus subtils : mots éloignés ou détachés, participe passé...\n		</li>\n	</ul>\n	\n  <p>\n	<a class=\"w3-button w3-green\" \" href=\"#!saisirr/"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"did") || (depth0 != null ? lookupProperty(depth0,"did") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"did","hash":{},"data":data,"loc":{"start":{"line":35,"column":49},"end":{"line":35,"column":56}}}) : helper)))
    + "\">\n	<i class=\"material-icons\">arrow_back_ios</i> Reprendre ma saisie</a>\n  </p>\n    </div>\n";
},"useData":true});

},{"hbsfy/runtime":23}],37:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<!-- ==================================\n *            e j D i c t o             *\n * ==================================== *\n * (c)2012-2020 - Patrick Cardona       *\n * Licence GPL version 3 ou ultérieure  *\n * VOIR la licence complète à la racine *\n * ==================================== -->\n \n <!-- Template : conseilsTemplate.hbs -->\n\n\n<div class=\"w3-container w3-padding-32\">\n\n	<h3 class=\"w3-text-teal\">Comment améliorer mon texte ?</h3>\n\n<div class=\"w3-container w3-padding\">\n	<ul class=\"w3-ul\">\n		<li class=\"w3-green\">\n			<h3>Je vérifie...</h3>\n        <li>Les homophones : <b>a</b> ou <b>à</b> ? <b>et</b> ou <b>est</b> ? etc.\n		</li>\n		<li>Les accords au sein du groupe nominal.\n		</li>\n		<li>\n			Les accords du verbe avec son sujet :\n			 attention au sujet parfois inversé ou composé de plusieurs noms&nbsp;.\n			 Attention à la présence de pronoms sournois, placés entre le sujet et le verbe.\n		</li>\n		<li>\n			Je fais attention aux accords plus subtils : mots éloignés ou détachés, participe passé...\n		</li>\n		<li>\n		    Pour les mots que je ne reconnais pas, je peux les chercher dans un<a href=\"https://www.dictionnaire-academie.fr\" \n		    target=\"_blank\" class=\"w3-button w3-text-green\" style=\"text-decoration: none\">dictionnaire</a>...\n        </li>\n	</ul>\n	\n  <p>\n	<a class=\"w3-button w3-green\" \" href=\"#!saisir/"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"did") || (depth0 != null ? lookupProperty(depth0,"did") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"did","hash":{},"data":data,"loc":{"start":{"line":39,"column":48},"end":{"line":39,"column":55}}}) : helper)))
    + "\"><i class=\"material-icons\">arrow_back_ios</i> Reprendre ma saisie</a>\n  </p>\n    </div>\n";
},"useData":true});

},{"hbsfy/runtime":23}],38:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<!-- ==================================\n *            e j D i c t o             *\n * ==================================== *\n * (c)2012-2020 - Patrick Cardona       *\n * Licence GPL version 3 ou ultérieure  *\n * VOIR la licence complète à la racine *\n * ==================================== -->\n \n <!-- Template : consigneReecritureTemplate.hbs -->\n\n\n<div class=\"w3-container\">\n\n	<h3 class=\"w3-text-teal w3-padding-32\">Consigne de la réécriture "
    + alias4(((helper = (helper = lookupProperty(helpers,"did") || (depth0 != null ? lookupProperty(depth0,"did") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"did","hash":{},"data":data,"loc":{"start":{"line":14,"column":66},"end":{"line":14,"column":73}}}) : helper)))
    + "</h3>\n\n  <p>"
    + alias4(((helper = (helper = lookupProperty(helpers,"consigne") || (depth0 != null ? lookupProperty(depth0,"consigne") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"consigne","hash":{},"data":data,"loc":{"start":{"line":16,"column":5},"end":{"line":16,"column":17}}}) : helper)))
    + "</p>\n\n  <div class=\"w3-card-4\">\n    <div class=\"container w3-green w3-padding\">\n      <h3>Texte initial</h3>\n    </div>\n    <div class=\"container w3-padding\">\n      <p>"
    + alias4(((helper = (helper = lookupProperty(helpers,"texte") || (depth0 != null ? lookupProperty(depth0,"texte") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"texte","hash":{},"data":data,"loc":{"start":{"line":23,"column":9},"end":{"line":23,"column":18}}}) : helper)))
    + "</p>\n    </div>\n  </div>\n  <p>\n	Passez maintenant à la <a class=\"w3-button w3-text-green\" \n	style=\"text-decoration: none\" href=\"#!saisirr/"
    + alias4(((helper = (helper = lookupProperty(helpers,"did") || (depth0 != null ? lookupProperty(depth0,"did") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"did","hash":{},"data":data,"loc":{"start":{"line":28,"column":47},"end":{"line":28,"column":54}}}) : helper)))
    + "\">\n	saisie</a> de cette réécriture...\n  </p>\n</div>\n";
},"useData":true});

},{"hbsfy/runtime":23}],39:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<!-- ==================================\n *            e j D i c t o             *\n * ==================================== *\n * (c)2012-2020 - Patrick Cardona       *\n * Licence GPL version 3 ou ultérieure  *\n * VOIR la licence complète à la racine *\n * ==================================== -->\n\n<!-- Template : dicteeTemplate -->\n\n<div class=\"w3-container w3-padding-32\">\n\n  <h3 class=\"w3-text-teal\">Dictée "
    + alias4(((helper = (helper = lookupProperty(helpers,"did") || (depth0 != null ? lookupProperty(depth0,"did") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"did","hash":{},"data":data,"loc":{"start":{"line":13,"column":34},"end":{"line":13,"column":41}}}) : helper)))
    + "</h3>\n\n  <div class=\"w3-container\">\n\n	<ul class=\"w3-ul\">\n		<li class=\"w3-green\">\n			<h3>Mode d'emploi</h3>\n		</li>	\n		<li><span class=\"w3-badge w3-green\">1</span> D'abord, écoutez la dictée et notez-la au brouillon.\n		</li>\n		<li>\n			<span class=\"w3-badge w3-green\">2</span> Saisissez-la ensuite et obtenez un bilan. \n			Si des erreurs persistent, tentez d'améliorer cette saisie.\n		</li>\n		<li>\n			<span class=\"w3-badge w3-green\">3</span> Quand vous aurez effectué toutes les corrections possibles, \n			terminez la saisie pour voir la correction.\n		</li>\n	</ul>\n\n  <p>\n	Passez maintenant à la première \n	<a class=\"w3-button w3-text-teal\" style=\"text-decoration: none\" href=\"#!ecouter/"
    + alias4(((helper = (helper = lookupProperty(helpers,"did") || (depth0 != null ? lookupProperty(depth0,"did") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"did","hash":{},"data":data,"loc":{"start":{"line":35,"column":81},"end":{"line":35,"column":88}}}) : helper)))
    + "\">écoute</a> de la dictée...\n  </p>\n\n  </div>\n\n</div>";
},"useData":true});

},{"hbsfy/runtime":23}],40:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<!-- ==================================\n *            e j D i c t o             *\n * ==================================== *\n * (c)2012-2020 - Patrick Cardona       *\n * Licence GPL version 3 ou ultérieure  *\n * VOIR la licence complète à la racine *\n * ==================================== -->\n \n <!-- Template : ecouterTemplate.hbs -->\n\n\n<div class=\"w3-container\">\n\n	<h3 class=\"w3-text-teal w3-padding-32\">Écouter la dictée "
    + alias4(((helper = (helper = lookupProperty(helpers,"did") || (depth0 != null ? lookupProperty(depth0,"did") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"did","hash":{},"data":data,"loc":{"start":{"line":14,"column":58},"end":{"line":14,"column":65}}}) : helper)))
    + "</h3>\n\n    <audio controls=\"controls\">\n      <source src=\"./static/audio/dictee"
    + alias4(((helper = (helper = lookupProperty(helpers,"did") || (depth0 != null ? lookupProperty(depth0,"did") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"did","hash":{},"data":data,"loc":{"start":{"line":17,"column":40},"end":{"line":17,"column":47}}}) : helper)))
    + ".ogg\" type=\"audio/ogg\">\n      <source src=\"./static/audio/dictee"
    + alias4(((helper = (helper = lookupProperty(helpers,"did") || (depth0 != null ? lookupProperty(depth0,"did") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"did","hash":{},"data":data,"loc":{"start":{"line":18,"column":40},"end":{"line":18,"column":47}}}) : helper)))
    + ".mp3\" type=\"audio/mpeg\">\n      <p>Erreur de chargement du fichier audio...</p>\n    </audio>\n</div>\n\n<div class=\"w3-container w3-padding\">\n	<ul class=\"w3-ul\">\n		<li class=\"w3-green\">\n			<h3>Conseils</h3>\n		</li>	\n		<li>D'abord, écoutez une première fois la dictée, sans chercher à l'écrire. Efforcez-vous d'en saisir le sens.\n		</li>\n		<li>\n			Puis écoutez-la de nouveau, en la notant sur votre cahier de brouillon. Au besoin, mettez en pause le lecteur audio.\n		</li>\n		<li>\n			Relisez-vous en écoutant une dernière fois la dictée.\n		</li>\n	</ul>\n	\n  <p>\n	Passez maintenant à la <a class=\"w3-button w3-text-green\" style=\"text-decoration: none\" href=\"#!saisir/"
    + alias4(((helper = (helper = lookupProperty(helpers,"did") || (depth0 != null ? lookupProperty(depth0,"did") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"did","hash":{},"data":data,"loc":{"start":{"line":39,"column":104},"end":{"line":39,"column":111}}}) : helper)))
    + "\">saisie</a> de cette dictée...\n  </p>\n    </div>\n";
},"useData":true});

},{"hbsfy/runtime":23}],41:[function(require,module,exports){
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

},{"hbsfy/runtime":23}],42:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<!-- ==================================\n *            e j D i c t o             *\n * ==================================== *\n * (c)2012-2020 - Patrick Cardona       *\n * Licence GPL version 3 ou ultérieure  *\n * VOIR la licence complète à la racine *\n * ==================================== -->\n\n<!-- Template : licence : page 1 \n  licence1Template.hbs\n-->\n\n<div class=\"w3-container\">\n	<h3 class=\"w3-text-teal\">Licence</h3>\n\n <!-- Pagination -->\n <div class=\"w3-center\">\n	 <div class=\"w3-bar w3-border w3-round\">\n		 <a href=\"#!licence/1\" class=\"w3-bar-item w3-button w3-teal\">1</a>\n   		 <a href=\"#!licence/2\" class=\"w3-bar-item w3-button\">2</a>\n  	</div>\n </div>\n\n <!-- Page 1 -->\n  <div style=\"max-width: 400px\">\n    <p style=\"text-align: justify\">\nCopyright &copy; "
    + alias4(((helper = (helper = lookupProperty(helpers,"debut") || (depth0 != null ? lookupProperty(depth0,"debut") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"debut","hash":{},"data":data,"loc":{"start":{"line":27,"column":17},"end":{"line":27,"column":28}}}) : helper)))
    + "-"
    + alias4(((helper = (helper = lookupProperty(helpers,"fin") || (depth0 != null ? lookupProperty(depth0,"fin") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"fin","hash":{},"data":data,"loc":{"start":{"line":27,"column":29},"end":{"line":27,"column":38}}}) : helper)))
    + " Patrick CARDONA<br /><br />\n      Le code JavaScript de cette page est un logiciel libre : vous \n      pouvez le redistribuer et/ou le modifier selon les termes de la \n      licence GNU General Public License (GNU GPL) telle que publiée \n      par la Free  Software Foundation, en version 3 de la licence, ou \n      (à votre discrétion) toute version ultérieure. Le code est distribué \n      SANS AUCUNE GARANTIE ; sans même la garantie implicite de \n      MARCHANDABILITÉ ou d'ADÉQUATION À UN BUT PARTICULIER. Consultez \nla GNU GPL pour plus de détails.</p>\n  </div>\n\n</div>\n\n";
},"useData":true});

},{"hbsfy/runtime":23}],43:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    return "<!-- ==================================\n *            e j D i c t o             *\n * ==================================== *\n * (c)2012-2020 - Patrick Cardona       *\n * Licence GPL version 3 ou ultérieure  *\n * VOIR la licence complète à la racine *\n * ==================================== -->\n\n<!-- Template : licence page 2 \n  licence2Template.hbs\n-->\n\n\n<div class=\"w3-container\">\n	<h3 class=\"w3-text-teal\">Licence</h3>\n\n <!-- Pagination -->\n <div class=\"w3-center\">\n	 <div class=\"w3-bar w3-border w3-round\">\n		 <a href=\"#!licence/1\" class=\"w3-bar-item w3-button\">1</a>\n   		 <a href=\"#!licence/2\" class=\"w3-bar-item w3-button w3-teal\">2</a>\n  	</div>\n </div>\n\n <div style=\"max-width: 400px\">\n    <p style=\"text-align: justify\">\n      En tant que permission supplémentaire selon les termes de la GNU \n      GPL version 3 section 7, vous pouvez distribuer des formes \n      « non-source » (par ex., minimisées ou compactées) de ce code\n      sans la copie de la GNU GPL normalement requise section 4, à \n      condition d'inclure cette notice de licence et une URL par laquelle \n      les destinataires peuvent accéder au code source correspondant.\n      <br /><br />\n      Consultez la licence GNU GPL pour plus de détails:\n      <br /><a href=\"http://www.gnu.org/licenses/\" target=\"_blank\">\n      http://www.gnu.org/licenses/</a>\n      </p>\n </div>\n\n</div>\n";
},"useData":true});

},{"hbsfy/runtime":23}],44:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(container,depth0,helpers,partials,data) {
    var alias1=container.lambda, alias2=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "	    <li><a href=\"#!reecriture/"
    + alias2(alias1((depth0 != null ? lookupProperty(depth0,"id") : depth0), depth0))
    + "\" class=\"w3-bar-item w3-button\">\n			    "
    + alias2(alias1((depth0 != null ? lookupProperty(depth0,"id") : depth0), depth0))
    + " : "
    + alias2(alias1((depth0 != null ? lookupProperty(depth0,"titre") : depth0), depth0))
    + " </a>\n	    </li>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<!-- ==================================\n *            e j D i c t o             *\n * ==================================== *\n * (c)2012-2020 - Patrick Cardona       *\n * Licence GPL version 3 ou ultérieure  *\n * VOIR la licence complète à la racine *\n * ==================================== -->\n\n<!-- Liste filtrée des réécritures\n  listeReecrituresTemplate.hbs\n  -->\n\n\n<div class=\"w3-container\">\n \n</div>\n<div class=\"w3-container w3-padding-32\">\n<div class=\"w3-card-4 w3-light-gray\" id=\"panneau_recherche\" style=\"display: none\">\n	<div class=\"w3-container w3-green\">\n		  <h3>Chercher une réécriture</h3>\n	</div>\n	<div class=\"w3-container w3-padding-16\">\n	<form>\n		<label class=\"w3-center w3-text-green\">\n		<i class=\"material-icons\">search</i> Filtre :</label>\n		<input class=\"w3-input w3-border w3-padding\" type=\"text\" \n		placeholder=\"Titre ou numéro...\" \n	oninput=\"w3.filterHTML('#liste_des_reecritures', 'li', this.value)\">\n	</form>\n	</div>\n</div>\n\n<div class=\"w3-container\">\n	<h3 class=\"w3-text-teal\">Liste des réécritures</h3>\n    <ul id=\"liste_des_reecritures\" class=\"w3-bar-block w3-border w3-light-gray\" \n    style=\"list-style-type: none; margin: 0; padding: 0\">\n"
    + ((stack1 = lookupProperty(helpers,"each").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"inforeecriture") : depth0),{"name":"each","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":37,"column":5},"end":{"line":41,"column":14}}})) != null ? stack1 : "")
    + "    </ul>\n</div>\n</div>\n";
},"useData":true});

},{"hbsfy/runtime":23}],45:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(container,depth0,helpers,partials,data) {
    var alias1=container.lambda, alias2=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "	    <li><a href=\"#!dictee/"
    + alias2(alias1((depth0 != null ? lookupProperty(depth0,"id") : depth0), depth0))
    + "\" class=\"w3-bar-item w3-button\">\n			    "
    + alias2(alias1((depth0 != null ? lookupProperty(depth0,"id") : depth0), depth0))
    + " : "
    + alias2(alias1((depth0 != null ? lookupProperty(depth0,"titre") : depth0), depth0))
    + " </a>\n	    </li>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<!-- ==================================\n *            e j D i c t o             *\n * ==================================== *\n * (c)2012-2020 - Patrick Cardona       *\n * Licence GPL version 3 ou ultérieure  *\n * VOIR la licence complète à la racine *\n * ==================================== -->\n\n<!-- Liste filtrée des dictées\n  listeTemplate.hbs\n  -->\n\n\n<div class=\"w3-container\">\n \n</div>\n<div class=\"w3-container w3-padding-32\">\n<div class=\"w3-card-4 w3-light-gray\" id=\"panneau_recherche\" style=\"display: none\">\n	<div class=\"w3-container w3-green\">\n		  <h3>Chercher une dictée</h3>\n	</div>\n	<div class=\"w3-container w3-padding-16\">\n	<form>\n		<label class=\"w3-center w3-text-green\"><i class=\"material-icons\">search</i> Filtre :</label>\n		<input class=\"w3-input w3-border w3-padding\" type=\"text\" placeholder=\"Titre ou numéro...\" \n	oninput=\"w3.filterHTML('#liste_des_dictees', 'li', this.value)\">\n	</form>\n	</div>\n</div>\n\n<div class=\"w3-container\">\n	<h3 class=\"w3-text-teal\">Liste des dictées</h3>\n    <ul id=\"liste_des_dictees\" class=\"w3-bar-block w3-border w3-light-gray\" style=\"list-style-type: none; margin: 0; padding: 0\">\n"
    + ((stack1 = lookupProperty(helpers,"each").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"infodictee") : depth0),{"name":"each","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":34,"column":5},"end":{"line":38,"column":14}}})) != null ? stack1 : "")
    + "    </ul>\n</div>\n</div>\n";
},"useData":true});

},{"hbsfy/runtime":23}],46:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<!-- ==================================\n *            e j D i c t o             *\n * ==================================== *\n * (c)2012-2020 - Patrick Cardona       *\n * Licence GPL version 3 ou ultérieure  *\n * VOIR la licence complète à la racine *\n * ==================================== -->\n\n<!-- Template : mentions légales\n  mentionsReecritureTemplate.hbs\n -->\n\n   <div class=\"w3-container w3-padding-48\">\n		<div class=\"w3-card\">\n			   <header class=\"w3-green w3-padding\"><h3>Mentions légales</h3></header>\n			   <div class=\"w3-container\">\n			   		 <h3>"
    + alias4(((helper = (helper = lookupProperty(helpers,"titre") || (depth0 != null ? lookupProperty(depth0,"titre") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"titre","hash":{},"data":data,"loc":{"start":{"line":17,"column":13},"end":{"line":17,"column":24}}}) : helper)))
    + "</h3>\n				      <p><span class=\"w3-text-green\">Référence :</span>\n				       <span class=\"auteur\">"
    + alias4(((helper = (helper = lookupProperty(helpers,"auteur") || (depth0 != null ? lookupProperty(depth0,"auteur") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"auteur","hash":{},"data":data,"loc":{"start":{"line":19,"column":32},"end":{"line":19,"column":44}}}) : helper)))
    + "</span>,\n                        <span class=\"ouvrage\"><em>"
    + alias4(((helper = (helper = lookupProperty(helpers,"ouvrage") || (depth0 != null ? lookupProperty(depth0,"ouvrage") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"ouvrage","hash":{},"data":data,"loc":{"start":{"line":20,"column":50},"end":{"line":20,"column":63}}}) : helper)))
    + "</em></span>\n	 			      </p>\n  	 			      <p><span class=\"w3-text-green\">Réécriture proposée par \n  	 			      </span>"
    + alias4(((helper = (helper = lookupProperty(helpers,"prof") || (depth0 != null ? lookupProperty(depth0,"prof") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"prof","hash":{},"data":data,"loc":{"start":{"line":23,"column":20},"end":{"line":23,"column":30}}}) : helper)))
    + "</p>\n			  </div>\n		</div>\n   </div>\n";
},"useData":true});

},{"hbsfy/runtime":23}],47:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<!-- ==================================\n *            e j D i c t o             *\n * ==================================== *\n * (c)2012-2020 - Patrick Cardona       *\n * Licence GPL version 3 ou ultérieure  *\n * VOIR la licence complète à la racine *\n * ==================================== -->\n\n<!-- Template : mentions légales\n  mentionsTemplate.hbs\n -->\n\n   <div class=\"w3-container w3-padding-48\">\n		<div class=\"w3-card\">\n			   <header class=\"w3-green w3-padding\"><h3>Mentions légales</h3></header>\n			   <div class=\"w3-container\">\n			   		 <h3>"
    + alias4(((helper = (helper = lookupProperty(helpers,"titre") || (depth0 != null ? lookupProperty(depth0,"titre") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"titre","hash":{},"data":data,"loc":{"start":{"line":17,"column":13},"end":{"line":17,"column":24}}}) : helper)))
    + "</h3>\n				      <p><span class=\"w3-text-green\">Référence :</span>\n				       <span class=\"auteur\">"
    + alias4(((helper = (helper = lookupProperty(helpers,"auteur") || (depth0 != null ? lookupProperty(depth0,"auteur") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"auteur","hash":{},"data":data,"loc":{"start":{"line":19,"column":32},"end":{"line":19,"column":44}}}) : helper)))
    + "</span>,\n                        <span class=\"ouvrage\"><em>"
    + alias4(((helper = (helper = lookupProperty(helpers,"ouvrage") || (depth0 != null ? lookupProperty(depth0,"ouvrage") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"ouvrage","hash":{},"data":data,"loc":{"start":{"line":20,"column":50},"end":{"line":20,"column":63}}}) : helper)))
    + "</em></span>\n	 			      </p>\n  	 			      <p><span class=\"w3-text-green\">Dictée proposée par </span>"
    + alias4(((helper = (helper = lookupProperty(helpers,"prof") || (depth0 != null ? lookupProperty(depth0,"prof") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"prof","hash":{},"data":data,"loc":{"start":{"line":22,"column":71},"end":{"line":22,"column":81}}}) : helper)))
    + "</p>\n			  </div>\n		</div>\n   </div>\n";
},"useData":true});

},{"hbsfy/runtime":23}],48:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<!-- ==================================\n *            e j D i c t o             *\n * ==================================== *\n * (c)2012-2020 - Patrick Cardona       *\n * Licence GPL version 3 ou ultérieure  *\n * VOIR la licence complète à la racine *\n * ==================================== -->\n\n<!-- Template de message popup (fenêtre modale) \n  à afficher dans saisirTemplate.hbs :\n  popupTemplate\n-->\n\n    <h3 class=\"w3-text-green\">"
    + alias4(((helper = (helper = lookupProperty(helpers,"titre") || (depth0 != null ? lookupProperty(depth0,"titre") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"titre","hash":{},"data":data,"loc":{"start":{"line":14,"column":30},"end":{"line":14,"column":39}}}) : helper)))
    + "</h3>\n\n    <p>"
    + alias4(((helper = (helper = lookupProperty(helpers,"message") || (depth0 != null ? lookupProperty(depth0,"message") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"message","hash":{},"data":data,"loc":{"start":{"line":16,"column":7},"end":{"line":16,"column":18}}}) : helper)))
    + "</p>\n\n\n";
},"useData":true});

},{"hbsfy/runtime":23}],49:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<!-- ==================================\n *            e j D i c t o             *\n * ==================================== *\n * (c)2012-2020 - Patrick Cardona       *\n * Licence GPL version 3 ou ultérieure  *\n * VOIR la licence complète à la racine *\n * ==================================== -->\n\n<!-- Template : reecritureTemplate -->\n\n<div class=\"w3-container w3-padding-32\">\n\n  <h3 class=\"w3-text-teal\">Réécriture "
    + alias4(((helper = (helper = lookupProperty(helpers,"did") || (depth0 != null ? lookupProperty(depth0,"did") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"did","hash":{},"data":data,"loc":{"start":{"line":13,"column":38},"end":{"line":13,"column":45}}}) : helper)))
    + "</h3>\n\n  <div class=\"w3-container\">\n\n	<ul class=\"w3-ul\">\n		<li class=\"w3-green\">\n			<h3>Mode d'emploi</h3>\n		</li>	\n		<li><span class=\"w3-badge w3-green\">1</span> D'abord, lisez la consigne.\n		</li>\n		<li>\n			<span class=\"w3-badge w3-green\">2</span> Saisissez ensuite \n			le texte transformé. Tentez d'améliorer cette saisie.\n		</li>\n		<li>\n			<span class=\"w3-badge w3-green\">3</span> Quand vous aurez effectué \n			toutes les corrections possibles, terminez la saisie pour \n			voir la correction.\n		</li>\n	</ul>\n\n  <p>\n	Passez maintenant à la découverte de la \n	<a class=\"w3-button w3-text-teal\" style=\"text-decoration: none\" \n	href=\"#!consigne/"
    + alias4(((helper = (helper = lookupProperty(helpers,"did") || (depth0 != null ? lookupProperty(depth0,"did") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"did","hash":{},"data":data,"loc":{"start":{"line":37,"column":18},"end":{"line":37,"column":25}}}) : helper)))
    + "\">consigne</a> de la réécriture.\n  </p>\n\n  </div>\n\n</div>";
},"useData":true});

},{"hbsfy/runtime":23}],50:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = container.invokePartial(lookupProperty(partials,"barre"),depth0,{"name":"barre","data":data,"indent":"\t\t\t    ","helpers":helpers,"partials":partials,"decorators":container.decorators})) != null ? stack1 : "");
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<!-- ==================================\n *            e j D i c t o             *\n * ==================================== *\n * (c)2012-2020 - Patrick Cardona       *\n * Licence GPL version 3 ou ultérieure  *\n * VOIR la licence complète à la racine *\n * ==================================== -->\n \n <!-- Template de saisie, correction et affichage de la correction \n    saisirReecritureTemplate.hbs\n -->\n\n<div class=\"w3-container w3-padding-32\">\n<div id=\"zone_saisie\">\n\n	<h3 class=\"w3-text-teal\">Saisie de la réécriture "
    + alias4(((helper = (helper = lookupProperty(helpers,"did") || (depth0 != null ? lookupProperty(depth0,"did") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"did","hash":{},"data":data,"loc":{"start":{"line":16,"column":50},"end":{"line":16,"column":57}}}) : helper)))
    + " \n		<a href=\"#!boutonsr/"
    + alias4(((helper = (helper = lookupProperty(helpers,"did") || (depth0 != null ? lookupProperty(depth0,"did") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"did","hash":{},"data":data,"loc":{"start":{"line":17,"column":22},"end":{"line":17,"column":29}}}) : helper)))
    + "\" data-navigo \n		class=\"w3-badge w3-dark-grey w3-hide-large w3-hide-medium\"\n		style=\"text-decoration: none\"\n		>?</a>\n	</h3>\n\n<!-- Zone de notification modale -->\n\n<div id=\"notification\" class=\"w3-modal\">\n  <div class=\"w3-modal-content\">\n    <div class=\"w3-container\">\n      <span onclick=\"document.getElementById('notification').style.display='none'\"\n      class=\"w3-button w3-display-topright\"><i class=\"material-icons\">close</i></span>\n      <h4 id=\"titre_notification\">Notification</h4>\n      <p id=\"message_notification\">Mon message...</p>\n    </div>\n  </div>\n</div>\n\n	<!-- zone de boutons : actions sur la saisie : version bureau -->\n<div class=\"w3-hide-small w3-container w3-padding\">\n	<nav class=\"w3-row\">\n	    <button onclick=\"$('#barre_car_spec').toggle()\" class=\"w3-button w3-green\">\n    		<i class=\"material-icons\">add</i>\n	    </button>\n    	<button class=\"w3-button w3-orange\" onclick=\"reecriture.recommencerSaisie()\">Recommencer</button>\n		<button class=\"w3-button w3-green\" onclick=\"reecriture.corriger()\">Corriger</button>\n		<button class=\"w3-button w3-red\" onclick=\"reecriture.terminer()\">Terminer</button>\n	</nav>\n</div> <!-- fin zone de boutons -->\n\n	<!-- zone de boutons : actions sur la saisie : version mobile -->\n<div class=\"w3-hide-large w3-hide-medium w3-container w3-padding\">\n	<nav class=\"w3-row\">\n	    <button onclick=\"$('#barre_car_spec').toggle()\" class=\"w3-button w3-green\">\n    		<i class=\"material-icons\">add</i>\n	    </button>\n    	<button class=\"w3-button w3-orange\" onclick=\"reecriture.recommencerSaisie()\">\n    	<i class=\"material-icons\">delete_forever</i>\n    	</button>\n		<button class=\"w3-button w3-green\" onclick=\"reecriture.corriger()\">\n		<i class=\"material-icons\">announcement</i>\n		</button>\n		<button class=\"w3-button w3-red\" onclick=\"reecriture.terminer()\">\n		<i class=\"material-icons\">assignment_turned_in</i>\n		</button>\n\n	</nav>\n</div> <!-- fin zone de boutons -->\n\n\n\n	<!-- Barre de caractères spéciaux et zone de saisie -->\n	<div class=\"w3-container\"> \n		<div id=\"conteneur_barre\" class=\"w3-bar\">\n		    <div id=\"barre_car_spec\" style=\"display: none\">\n"
    + ((stack1 = lookupProperty(helpers,"each").call(alias1,(depth0 != null ? lookupProperty(depth0,"caracteres") : depth0),{"name":"each","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":73,"column":3},"end":{"line":75,"column":12}}})) != null ? stack1 : "")
    + "		    </div>\n		</div>\n	</div>\n\n	<!-- Zone de saisie du texte de la réécriture -->\n	<textarea id=\"ma_saisie\" spellcheck=\"false\" class=\"w3-block w3-sand\" rows=\"15\" \n	style=\"max-width: 600px\"\n	placeholder=\"Saisissez ici le texte de votre dictée notée au brouillon...\" \n	onblur=\"sessionStorage.setItem('reecriture', this.value)\">"
    + alias4(((helper = (helper = lookupProperty(helpers,"saisie") || (depth0 != null ? lookupProperty(depth0,"saisie") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"saisie","hash":{},"data":data,"loc":{"start":{"line":84,"column":59},"end":{"line":84,"column":69}}}) : helper)))
    + "</textarea>\n\n</div>  <!-- Fin de la zone de saisie -->\n\n	<!-- ============================================== -->\n\n<div id=\"zone_correction\" class=\"w3-container\" style=\"display: none\">\n<div class=\"w3-display-container\">\n  <a href=\"#!\" class=\"w3-button w3-display-topright \"><i class=\"material-icons\">close</i></a>\n</div>\n <h3 class=\"w3-text-teal\">Correction</h3>\n\n <p id=\"corrige\" class=\"correction\"></p>\n\n</div> <!-- Fin div zone_correction -->\n\n</div> <!-- fin de la zone englobante des zones de la page -->\n\n<!-- ================================================== -->\n\n<!-- BLOC MASQUE: MAIS NECESSAIRE POUR LA CORRECTION\n    Son contenu est utilisé par la méthode corriger() de l'objet Reecriture -->\n\n<!-- Texte attendu après la transformation -->\n<div id=\"attendu\" style=\"visibility: hidden\">"
    + alias4(((helper = (helper = lookupProperty(helpers,"attendu") || (depth0 != null ? lookupProperty(depth0,"attendu") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"attendu","hash":{},"data":data,"loc":{"start":{"line":108,"column":45},"end":{"line":108,"column":56}}}) : helper)))
    + "</div>\n<!-- Texte initial, c-à-d avant la transformation -->\n<div id=\"initial\" style=\"visibility: hidden\">"
    + alias4(((helper = (helper = lookupProperty(helpers,"initial") || (depth0 != null ? lookupProperty(depth0,"initial") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"initial","hash":{},"data":data,"loc":{"start":{"line":110,"column":45},"end":{"line":110,"column":56}}}) : helper)))
    + "</div>\n";
},"usePartial":true,"useData":true});

},{"hbsfy/runtime":23}],51:[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = container.invokePartial(lookupProperty(partials,"barre"),depth0,{"name":"barre","data":data,"indent":"\t\t\t    ","helpers":helpers,"partials":partials,"decorators":container.decorators})) != null ? stack1 : "");
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<!-- ==================================\n *            e j D i c t o             *\n * ==================================== *\n * (c)2012-2020 - Patrick Cardona       *\n * Licence GPL version 3 ou ultérieure  *\n * VOIR la licence complète à la racine *\n * ==================================== -->\n \n <!-- Template de saisie, correction et affichage de la correction \n    saisirTemplate.hbs\n -->\n\n<div class=\"w3-container w3-padding-32\">\n<div id=\"zone_saisie\">\n\n	<h3 class=\"w3-text-teal\">Saisie de la dictée "
    + alias4(((helper = (helper = lookupProperty(helpers,"did") || (depth0 != null ? lookupProperty(depth0,"did") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"did","hash":{},"data":data,"loc":{"start":{"line":16,"column":46},"end":{"line":16,"column":53}}}) : helper)))
    + " \n		<a href=\"#!boutons/"
    + alias4(((helper = (helper = lookupProperty(helpers,"did") || (depth0 != null ? lookupProperty(depth0,"did") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"did","hash":{},"data":data,"loc":{"start":{"line":17,"column":21},"end":{"line":17,"column":28}}}) : helper)))
    + "\" data-navigo class=\"w3-badge w3-dark-grey w3-hide-large w3-hide-medium\"\n		style=\"text-decoration: none\"\n		>?</a>\n	</h3>\n\n<!-- Zone de notification modale -->\n\n<div id=\"notification\" class=\"w3-modal\">\n  <div class=\"w3-modal-content\">\n    <div class=\"w3-container\">\n      <span onclick=\"document.getElementById('notification').style.display='none'\"\n      class=\"w3-button w3-display-topright\"><i class=\"material-icons\">close</i></span>\n      <h4 id=\"titre_notification\">Notification</h4>\n      <p id=\"message_notification\">Mon message...</p>\n    </div>\n  </div>\n</div>\n\n	<!-- zone de boutons : actions sur la saisie : version bureau -->\n<div class=\"w3-hide-small w3-container w3-padding\">\n	<nav class=\"w3-row\">\n	    <button onclick=\"$('#barre_car_spec').toggle()\" class=\"w3-button w3-green\">\n    		<i class=\"material-icons\">add</i>\n	    </button>\n    	<button class=\"w3-button w3-orange\" onclick=\"dictee.recommencerSaisie()\">Effacer</button>\n		<button class=\"w3-button w3-green\" onclick=\"dictee.corriger()\">Corriger</button>\n		<button class=\"w3-button w3-red\" onclick=\"dictee.terminer()\">Terminer</button>\n	</nav>\n</div> <!-- fin zone de boutons -->\n\n	<!-- zone de boutons : actions sur la saisie : version mobile -->\n<div class=\"w3-hide-large w3-hide-medium w3-container w3-padding\">\n	<nav class=\"w3-row\">\n	    <button onclick=\"$('#barre_car_spec').toggle()\" class=\"w3-button w3-green\">\n    		<i class=\"material-icons\">add</i>\n	    </button>\n    	<button class=\"w3-button w3-orange\" onclick=\"dictee.recommencerSaisie()\">\n    	<i class=\"material-icons\">delete_forever</i>\n    	</button>\n		<button class=\"w3-button w3-green\" onclick=\"dictee.corriger()\">\n		<i class=\"material-icons\">announcement</i>\n		</button>\n		<button class=\"w3-button w3-red\" onclick=\"dictee.terminer()\">\n		<i class=\"material-icons\">assignment_turned_in</i>\n		</button>\n\n	</nav>\n</div> <!-- fin zone de boutons -->\n\n\n\n	<!-- Barre de caractères spéciaux et zone de saisie -->\n	<div class=\"w3-container\"> \n		<div id=\"conteneur_barre\" class=\"w3-bar\">\n		    <div id=\"barre_car_spec\" style=\"display: none\">\n"
    + ((stack1 = lookupProperty(helpers,"each").call(alias1,(depth0 != null ? lookupProperty(depth0,"caracteres") : depth0),{"name":"each","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":72,"column":3},"end":{"line":74,"column":12}}})) != null ? stack1 : "")
    + "		    </div>\n		</div>\n	</div>\n\n	<!-- Zone de saisie du texte de la dictée -->\n	<textarea id=\"ma_saisie\" spellcheck=\"false\" class=\"w3-block w3-sand\" rows=\"15\" \n	style=\"max-width: 600px\"\n	placeholder=\"Saisissez ici le texte de votre dictée notée au brouillon...\" \n	onblur=\"sessionStorage.setItem('dictee', this.value)\">"
    + alias4(((helper = (helper = lookupProperty(helpers,"saisie") || (depth0 != null ? lookupProperty(depth0,"saisie") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"saisie","hash":{},"data":data,"loc":{"start":{"line":83,"column":55},"end":{"line":83,"column":65}}}) : helper)))
    + "</textarea>\n\n</div>  <!-- Fin de la zone de saisie -->\n\n	<!-- ============================================== -->\n\n<div id=\"zone_correction\" class=\"w3-container\" style=\"display: none\">\n<div class=\"w3-display-container\">\n  <a href=\"#!\" class=\"w3-button w3-display-topright \"><i class=\"material-icons\">close</i></a>\n</div>\n <h3 class=\"w3-text-teal\">Correction</h3>\n\n <p id=\"corrige\" class=\"correction\"></p>\n\n</div> <!-- Fin div zone_correction -->\n\n</div> <!-- fin de la zone englobante des zones de la page -->\n\n<!-- ================================================== -->\n\n<!-- BLOC MASQUE: MAIS NECESSAIRE POUR LA CORRECTION\n    Son contenu est utilisé par la méthode corriger() de l'objet Dictee -->\n\n<div id=\"texte\" style=\"visibility: hidden\">"
    + alias4(((helper = (helper = lookupProperty(helpers,"texte") || (depth0 != null ? lookupProperty(depth0,"texte") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"texte","hash":{},"data":data,"loc":{"start":{"line":106,"column":43},"end":{"line":106,"column":52}}}) : helper)))
    + "</div>\n\n";
},"usePartial":true,"useData":true});

},{"hbsfy/runtime":23}],52:[function(require,module,exports){
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
		"appname": "Icones : Material Icons",
		"auteur": "Google inc.",
		"site": "https://material.io/resources/icons/?style=baseline",
		"licence": "Apache License version 2",
		"code": "http://github.com/google/material-design-icons/"
	},
	{
		"appname": "Routage : Navigo",
		"auteur": "Krasimir Tsonev",
		"site": "https://github.com/krasimir/navigo",
		"licence": "MIT",
		"code": "https://github.com/krasimir/navigo"
	},
	{
		"appname": "Style et scripts : W3.css et W3.js",
		"auteur": "W3schools",
		"site": "https://www.w3schools.com/w3css/default.asp",
		"licence": "Usage libre",
		"code": "https://github.com/JaniRefsnes/w3css"
	}

]

},{}],53:[function(require,module,exports){
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
	"niveau": "5e"
    },
    {
	"id": "52",
	"titre": "Un comportement étrange",
	"niveau": "5e"
    },
    {
	"id": "53",
	"titre": "Un château inquiétant",
	"niveau": "5e"
    },
    {
	"id": "54",
	"titre": "Les maximes de Scapin",
	"niveau" : "5e"
    },
    {
	"id": "55",
	"titre": "Le chagrin de Charlemagne",
	"niveau" : "5e"
    },
    {
	"id": "31",
	"titre": "Le cerf",
	"niveau": "3e"
    },    {
	"id": "32",
	"titre": "Le tourisme",
	"niveau": "3e"
    },
    {
	"id": "33",
	"titre": "La villa Aurore (1)",
	"niveau": "3e"
    },
    {
	"id": "34",
	"titre": "La villa Aurore (2)",
	"niveau": "3e"
    },
    {
	"id": "35",
	"titre": "Ma mère et la maladie",
	"niveau": "3e"
    }
]


},{}],54:[function(require,module,exports){
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


},{}]},{},[26]);
