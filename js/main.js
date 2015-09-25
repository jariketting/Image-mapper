/*
 * Slider for projects
 * © 2014 Vera Lobacheva
 * http://summerstyle.ru
 */

'use strict';

;(function() {
	var utils = {
		dom : {
			matches : (function() {
				var el = document.createElement('div'),
					matches = el.matches || el.mozMatchesSelector || el.webkitMatchesSelector || el.oMatchesSelector || el.msMatchesSelector;
				
				return function(selector, el) {
					if (!matches) {
						return false;
					}
					
					return matches.call(el, selector);
				}
			})(),
			closest : function(el, selector) {
				var parent = el,
					result = false;
				
				while (parent && parent !== document) {
					if (this.matches(selector, parent)) {
						result = parent;
						break;
					}
					
					parent = parent.parentNode;
				}
				
				return result;
			}
		}	
	};

	var app = (function() {
		var slider = document.getElementById('slider'),
			prev_button = slider.querySelector('.prev'),
			next_button = slider.querySelector('.next'),
			hist = window.history,
			current_touch,
			touch_started = false,
			KEYS = {
				LEFT : 37,
				RIGHT : 39,
				PAGE_UP : 33,
				PAGE_DOWN : 34
			};
			
		function init() {
			var temp_arr = document.location.pathname.split('/'),
				arr = [];
			
			temp_arr.filter(function(item) {
				if (item) {
					arr.push(item);
				}
			});
			
			if (arr.length === 1) {
				var	name = arr[0];
				
				if (pages.isset_name(name)) {
					pages.show_by_name(name);
				} else {
					pages.show_by_id(0);
				}
				
			} else {
				pages.show_by_id(0);
			}
		}
		
		window.onpopstate = function(e) {
			if (e.state) {
				var state = e.state;
				
				pages.show_by_name(state.name);
			}
		};
		
		document.addEventListener('keyup', function(e) {
			e.preventDefault();
			
			switch (e.keyCode) {
				case KEYS.LEFT:
				case KEYS.PAGE_UP:
					prev();
					break;
				
				case KEYS.RIGHT:
				case KEYS.PAGE_DOWN:
					next();
					break;
			}
		}, false);
		
		prev_button.addEventListener('click', function(e) {
			e.preventDefault();
			
			prev();
		});
		
		next_button.addEventListener('click', function(e) {
			e.preventDefault();
			
			next();
		}, false);
		
		function prev() {
			pages.show_prev();
		}
		
		function next() {
			pages.show_next();
		}
		
		document.addEventListener('mousedown', function(e) {
			e.preventDefault();
		}, false);
		
		
		function ontouchend_handler(e) {
			if (e.changedTouches[0].identifier === current_touch.identifier) {
				touch_started = false;
				
				var touch = e.changedTouches[0],
					deltaX = touch.pageX - current_touch.pageX,
					deltaY = touch.pageY - current_touch.pageY;
			
				slider.removeEventListener('touchend', ontouchend_handler, false);
				slider.removeEventListener('touchcancel', ontouchend_handler, false);
		
				if (Math.abs(deltaX) > 20 && Math.abs(deltaX) > Math.abs(deltaY)) {

					if (deltaX > 0) {
						pages.show_prev();
					} else {
						pages.show_next();
					}
					
				}
			}
		}
		
		if ('ontouchend' in document) {
			slider.addEventListener('touchstart', function(e) {
				if (e.touches.length === 1 && !touch_started) {
					// e.preventDefault();
					
					touch_started = true;
					
					current_touch = e.changedTouches[0];
					
					slider.addEventListener('touchend', ontouchend_handler, false);
					slider.addEventListener('touchcancel', ontouchend_handler, false);
				};
			}, false);
		}
		
		// setInterval(next, 5000);
		
		return {
			init : init,
			set_url : function(page) {
				hist.pushState({
						name : page.name,
						id   : page.id
					},
					page.title,
					'/' + page.name + '/');
				
				document.title = page.title;
			}
		};
	})();
	
	var nav = (function() {
		var el = document.getElementById('nav'),
			links = el.querySelectorAll('li'),
			arr = {};
			
		for (var i = 0, c = links.length; i < c; i++) {
			var link = links[i];
			
			arr[link.dataset.page] = link;
		}
		
		function deselect_all() {
			for (var i = 0, c = links.length; i < c; i++) {
				links[i].classList.remove('selected');
			}
		}
		
		el.addEventListener('click', function(e) {
			e.preventDefault();
			
			var link = utils.dom.closest(e.target, 'li'),
				name = link.dataset.page;
			
			if (link) {
				pages.show_by_name(name);
			}
		
		}, false);
		
		return {
			select : function(name) {
				deselect_all();
				
				var link = arr[name];
				
				if (link) {
					link.classList.add('selected');
				}
			}
		};
	})();
	
	function Page(el, i) {
		this.id = i;
		this.el = el;
		this.name = el.id;
		this.title = el.querySelector('.description').innerHTML;
		this.module = null;
	}
	
	Page.prototype.set_module = function(module) {
		this.module = module.call(this);
	}
	
	var pages = (function() {
		var slider = document.getElementById('slider'),
			list = slider.querySelector('ul'),
			items = list.children,
			count = items.length,
			current_id,
			arr = [],
			arr_names = {};
			
		for (var i = 0, c = items.length; i < c; i++) {
			var item = items[i],
				name = item.id,
				page = new Page(item, i);
			
			arr.push(page);
			
			arr_names[name] = page; 
		};
		
		function show(page) {
			current_id = page.id;
			
			list.style.marginLeft = -page.id * 100 + '%';
			
			app.set_url(page);
			
			nav.select(page.name);
		}
		
		return {
			isset_name : function(name) {
				return Boolean(arr_names[name]);
			},
			show_by_name : function(name) {
				var page = arr_names[name];
				
				if (!page) {
					return;
				};
				
				show(page);
			},
			show_by_id : function(id) {
				var page = arr[id];
				
				if (!page) {
					return;
				}
				
				show(page);
			},
			show_prev : function() {
				current_id--;
				
				if (current_id < 0) {
					current_id = count - 1;
				};
			
				this.show_by_id(current_id);
			},
			show_next : function() {
				current_id++;
				
				if (current_id >= count) {
					current_id = 0;
				}
				
				this.show_by_id(current_id);
			},
			add_module : function(name, module) {
				if (!this.isset_name(name)) {
					return;
				}
				
				var page = arr_names[name];
				
				page.set_module(module);
				
				return this;
			}
		};
	})();
	
	app.init();
	
	/* module JSON TREE */
	pages.add_module('jsontree', function(page) {
		var tree = document.getElementById("tree");
		
		tree.addEventListener('click', function(e) {
			var button = utils.dom.closest(e.target, '.name_wrapper');
		
			if (button) {
				var parent = button.parentNode;
				
				if (parent.classList.contains('object') ||
					parent.classList.contains('array')) {
					parent.classList.toggle('expanded');
				}
			}
		}, false);
		
		/* module KEYS CONFIG */
	}).add_module('keysconfig', function(page) {
		var el = document.getElementById('keys'),
			keys_els = el.getElementsByClassName('key'),
			show_codes = document.getElementById('show_codes'),
			keys = {};
			
		show_codes.checked = false;
		show_codes.addEventListener('change', function(e) {
			if (show_codes.checked) {
				el.classList.add('with_codes');
			} else {
				el.classList.remove('with_codes');
			};
		}, false);
			
		function Key(el) {
			var code = parseInt(el.dataset['keycode']),
				key = keys[code];
			
			if (key) {
				key.add_el(el);
				return {};
			};
			
			this.els = [el];
			this.code = code;
			this.name = el.dataset['name'];
			this.group = el.dataset['group'];
			
			keys[code] = this;
		}
	
		Key.prototype = {
			constructor : Key,
			select : function(without_selected_keys) {
				for (var i = 0, c = this.els.length; i < c; i++) {
					this.els[i].classList.add('selected');
				};
			},
			deselect : function(without_selected_keys) {
				for (var i = 0, c = this.els.length; i < c; i++) {
					this.els[i].classList.remove('selected');
				};
			},
			toggle : function(without_selected_keys) {
				if (this.els[0].classList.contains('selected')) {
					this.deselect(without_selected_keys);
				} else {
					this.select(without_selected_keys);
				};
			},
			add_el : function(el) {
				this.els.push(el);
			}
		};
		
		for(var i = 0, len = keys_els.length; i < len; i++) {
			new Key(keys_els[i]);
		};
		
		el.addEventListener('click', function(e) {
			var key = utils.dom.closest(e.target, '.key');
	
			if (key) {
				keys[key.dataset['keycode']].toggle();
			}
		}, false);
		
		/* module MAP CREATOR */
	}).add_module('mapcreator', function(page) {
		var svg = document.getElementById("svg"),
			polygon = svg.getElementsByTagName("polygon")[0],
			points = Array.prototype.slice.call(svg.getElementsByTagName("rect")),
			coords = polygon.getAttribute("points").split(" "),
			temp_coords = [],
			start;
			
		coords = coords.map(function(item) {
			return Number(item);
		});
			
		for (var i = 0, c = points.length; i < c; i++) {
			points[i].n = i;
		}
		
		function move_polygon(e) {
			var x = e.pageX - start.x,
				y = e.pageY - start.y;
				
			coords.forEach(function(item, i) {
				if (i % 2) {
					temp_coords[i] = item + y;
				} else {
					temp_coords[i] = item + x;
				}
			});
			polygon.setAttribute('points', temp_coords.join(' '));
			
			points.forEach(function(item, i) {
				item.setAttribute('x', item.old_x + x);
				item.setAttribute('y', item.old_y + y);
			});
			
			if (e.type === 'mouseup') {
				coords = temp_coords;
				svg.removeEventListener('mousemove', move_polygon, false);
				svg.removeEventListener('mouseup', move_polygon, false);
			}
			
		}
		
		/* Add mousedown event for svg */
		function onSvgMousedown(e) {
			if (e.target.parentNode.tagName === 'g') {
				var selected_area = e.target.parentNode.obj;
				
				temp_coords = coords.slice();
				
				start = {
					'x' : e.pageX,
					'y' : e.pageY
				};

				if (e.target.tagName === 'polygon') {
					svg.addEventListener('mousemove', move_polygon, false);
					svg.addEventListener('mouseup', move_polygon, false);
				};
				
				points.forEach(function(item, i) {
					item.old_x = Number(item.getAttribute('x'));
					item.old_y = Number(item.getAttribute('y'));
				});
			} 

		}
		
		container.addEventListener('mousedown', onSvgMousedown, false);
		
	});
	
})();
