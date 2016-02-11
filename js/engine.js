/*
 * Engine.js - handles puzzle loading, updating, rendering, and input
 * Copyright (c) 2016 Ian Jones
 */

Game = function() {
	this.atoms = new Array();
	this.negative = new Array();
	this.path = new Array();
}

Game.prototype.debug = true;
Game.prototype.scale = 1;
Game.prototype.v = null;
Game.prototype.c0 = null;
Game.prototype.c1 = null;
Game.prototype.inputHeld = false;
Game.prototype.rawInputX = 0;
Game.prototype.rawInputY = 0;
Game.prototype.inputX = 0;
Game.prototype.inputY = 0;
Game.prototype.inputAtom = null;
Game.prototype.glowInc = 0;
Game.prototype.isSolved = false;

// Initialize the DOM elements
Game.prototype.init = function() {
	this.v = document.querySelector("#viewport");
	this.c0 = document.querySelector("#outlines");
	this.c1 = document.querySelector("#userpath");
	// Correct viewport size
	handle_resize();
	this.generate();
	window.requestAnimationFrame(this.render);
}

// Generate a puzzle (or, occasionally, load a premade one)
Game.prototype.generate = function() {
	// Clear the previous puzzle's data
	Game.v.removeAttribute("data-solved");
	Game.isSolved = false;
	Game.atoms.splice(0);
	Game.negative.splice(0);
	Game.path.splice(0);
	// Create the atoms
	window.NEXT_ATOM_ID = 0;
	this.atoms.push(new Atom({
		type: "eye",
		x: 50,
		y: 300
	}));
	this.atoms.push(new Atom({
		x: 150,
		y: 300,
		r: 100
	}));
	this.atoms.push(new Atom({
		x: 300,
		y: 300,
		r: 130
	}));
	this.atoms.push(new Atom({
		x: 300,
		y: 300,
		r: 100
	}));
	this.atoms.push(new Atom({
		x: 450,
		y: 300,
		r: 100
	}));
	this.atoms.push(new Atom({
		type: "eye",
		x: 550,
		y: 300
	}));
	// Find points of intersection
	for (var i = Game.atoms.length; i --; ) {
		Game.atoms[i].findIntersections();
	}
	// Clear the previous pixel data
	window.ctx = Game.c0.getContext("2d");
	ctx.clearRect(0, 0, Game.c0.width, Game.c0.height);
	Game.renderPuzzle();
}

// Render the atoms / puzzle background
Game.prototype.renderPuzzle = function() {
	// Clear the previous pixel data
	window.ctx = Game.c0.getContext("2d");
	ctx.clearRect(0, 0, Game.c0.width, Game.c0.height);
	// Render the dust
	ctx.globalAlpha = IS_MOBILE ? "0.03" : "0.02";
	ctx.globalCompositeOperation = "multiply";
	for (var i = 25; i --; ) {
		ctx.beginPath();
		ctx.fillStyle = "hsl(" + irandom(360) + ", 75%, 50%)";
		for (var j = 30; j --; ) {
			var x = irandom(600) * scale;
			var y = irandom(600) * scale;
			ctx.moveTo(x, y);
			ctx.arc(x, y, random_range(2, 40) * scale, 0, Math.PI * 2);
		}
		ctx.fill();
	}
	ctx.globalAlpha = "1";
	ctx.globalCompositeOperation = "source-over";
	// Render the atoms
	for (var i = Game.atoms.length; i --; ) {
		Game.atoms[i].render();
	}
	// Prepare for rendering in realtime
	window.ctx = Game.c1.getContext("2d");
}

// Update / render user path
Game.prototype.render = function(skipRender) {
	var skipRender = skipRender === true;
	// Update the path
	if (Game.inputHeld) {
		// CSS Transforms?
		if (IS_SMALL) {
			if (IS_WEBKIT) {
				Game.v.style.webkitTransform = "scale(1.5)";
				Game.v.style.webkitTransformOriginX = Game.rawInputX + "px";
				Game.v.style.webkitTransformOriginY = Game.rawInputY + "px";
			} else if (IS_FIREFOX) {
				Game.v.style.mozTransform = "scale(1.5)";
				Game.v.style.mozTransformOriginX = Game.rawInputX + "px";
				Game.v.style.mozTransformOriginY = Game.rawInputY + "px";
			} else {
				Game.v.style.transform = "scale(1.5)";
				Game.v.style.transformOriginX = Game.rawInputX + "px";
				Game.v.style.transformOriginY = Game.rawInputY + "px";
			}
		}
		var i_x = Game.inputX;
		var i_y = Game.inputY;
		// Find the atom they're tracing
		var cur_atom;
		var nearest_d = Infinity;
		var prev_d = Infinity;
		for (var i = Game.atoms.length; i --; ) {
			var atom = Game.atoms[i];
			var r = atom.type == "eye" ? 8 : atom.r;
			var d = Math.abs(Math.sqrt(Math.pow(i_x - atom.x, 2) +
				Math.pow(i_y - atom.y, 2)) - r);
			if (Game.path.length >= 2 && Game.path[1] == atom) {
				prev_d = d;
			}
			if (d < nearest_d) {
				nearest_d = d;
				cur_atom = atom;
			}
		}
		if (nearest_d > 40) {
			// Faaaar oooout
		} else if (Game.inputAtom == null && cur_atom.type == "eye") {
			// Getting started?
			Game.inputAtom = cur_atom;
			Game.path.push({ atom: cur_atom, a0: 0, a1: 0, a2: 0 });
		} else if (Game.inputAtom == cur_atom) {
			if (cur_atom.type != "eye") {
				// Tracing the same atom more?
				var path_obj = Game.path[Game.path.length - 1];
				var a1 = Math.atan2(i_y - cur_atom.y, i_x - cur_atom.x);
				if (arcLength(path_obj.a0, path_obj.a1, path_obj.cc) >
					3 + arcLength(path_obj.a0, a1, path_obj.cc)) {
					console.log("Whoa nelly v1");
				} else {
					// Allow for switching cc more easily
					if ((path_obj.cc && arcLength(path_obj.a0, path_obj.a1, true
						) < 0.25) || (!path_obj.cc && arcLength(path_obj.a0,
						path_obj.a1, false) < 0.25)) {
						path_obj.cc = signedAngleDiff(path_obj.a0, a1) < 0;
						if ((path_obj.cc && arcLength(path_obj.a0, path_obj.a1, true
							) > 3) || (!path_obj.cc && arcLength(path_obj.a0,
							path_obj.a1, false) > 3)) {
							path_obj.a2 = path_obj.a0;
						}
					}
					path_obj.a1 = a1;
				}
			}
		} else if (Game.inputAtom == null) {
			// Starting, maybe...
			var a1 = Math.atan2(i_y - cur_atom.y, i_x - cur_atom.x);
			var nearest_a = Infinity;
			var join_via;
			for (var i = cur_atom.intersections.length; i --; ) {
				var intersection = cur_atom.intersections[i];
				if (intersection.type == "eye") {
					var a = angleDiff(intersection.a, a1);
					if (a < nearest_a) {
						nearest_a = a;
						join_via = intersection.id;
					}
				}
			}
			if (join_via != null) {
				var prev_atom;
				for (var i = Game.atoms.length; i --; ) {
					if (Game.atoms[i].id == join_via) {
						prev_atom = Game.atoms[i];
						break;
					}
				}
				Game.path.push({ atom: prev_atom, a0: 0, a1: 0, a2: 0 });
				var a0 = Math.atan2(prev_atom.y - cur_atom.y,
					prev_atom.x - cur_atom.x);
				Game.inputAtom = cur_atom;
				var cc = signedAngleDiff(a0, a1) < 0;
				Game.path.push(
					{ atom: cur_atom, a0: a0, a1: a1, a2: a0, cc: cc });
			} else if (Game.debug) {
				console.log("Join via failed v1");
			}
		} else if (Game.path.length) {
			// Retracing your steps?
			var prev2_path_obj, prev2_atom;
			if (Game.path.length >= 2) {
				prev2_path_obj = Game.path[Game.path.length - 2];
				prev2_atom = prev2_path_obj.atom;
			}
			// Switching atoms?
			var a1 = Math.atan2(i_y - cur_atom.y, i_x - cur_atom.x);
			var prev_path_obj = Game.path[Game.path.length - 1];
			var prev_atom = prev_path_obj.atom;
			var nearest_a = Infinity;
			var join_via;
			for (var i = prev_atom.intersections.length; i --; ) {
				var intersection = prev_atom.intersections[i];
				if (intersection.id == cur_atom.id) {
					var a = angleDiff(intersection.a, prev_path_obj.a1);
					// console.log("Intersection // a = " + a);
					// console.log(intersection);
					if (a < nearest_a) {
						nearest_a = a;
						join_via = intersection.a;
					}
				}
			}
			if (false && prev2_atom) {
				console.log("Prev2 id: " + prev2_atom.id + "\nisCur: " +
					(prev2_atom.id == cur_atom.id) + "\nprevA0: " +
					prev_path_obj.a0 + "\njoinVia: " + join_via +
					"\nangleDiff: " + angleDiff(join_via, prev_path_obj.a0));
			}
			if (prev2_atom && prev2_atom.id == cur_atom.id &&
				angleDiff(join_via, prev_path_obj.a0) < 0.2) {
				if (prev2_atom.type != "eye") {
					var path_obj = prev_path_obj;
					var a1 = Math.atan2(i_y - prev_atom.y, i_x - prev_atom.x);
					if (arcLength(path_obj.a0, path_obj.a1, path_obj.cc) >
						3 + arcLength(path_obj.a0, a1, path_obj.cc)) {
						console.log("Join via failed v3");
						console.log("Whoa nelly v3");
					} else {
						var a1 = Math.atan2(i_y - cur_atom.y, i_x - cur_atom.x);
						Game.path.splice(Game.path.length - 1);
						prev2_path_obj.a1 = a1;
						Game.inputAtom = prev2_atom;
					}
				} else if (arcLength(prev_path_obj.a0, prev_path_obj.a1,
						prev_path_obj.cc) > 5) {
					// You won? Maybe?
					Game.path.push({ atom: cur_atom, a0: 0, a1: 0, a2: 0, cc: false });
					prev_path_obj.a1 = prev_path_obj.a0 + Math.PI * 2 +
						(prev_path_obj.cc ? 1 : -1) * 2e-4;
					if (Game.inputHeld &&
						angleDiff(prev_path_obj.a1, prev_path_obj.a2) < 0.2) {
						Game.inputHeld = false;
						Game.inputAtom = null;
						// alert("We've got a winner folks");
					}
				}
			} else if (join_via != null && (!prev2_atom ||
				(prev2_path_obj.a2 == prev2_path_obj.a1 ||
				prev2_path_obj.atom.type == "eye"))) {
				prev_path_obj.a1 = join_via;
				var a0x = prev_atom.x + prev_atom.r * Math.cos(join_via);
				var a0y = prev_atom.y + prev_atom.r * Math.sin(join_via);
				var a0 = Math.atan2(a0y - cur_atom.y, a0x - cur_atom.x);
				Game.inputAtom = cur_atom;
				var cc = signedAngleDiff(a0, a1) < 0;
				Game.path.push(
					{ atom: cur_atom, a0: a0, a1: a1, a2: a0, cc: cc });
			} else {
				if (Game.debug) console.log("Join via failed v2");
				var path_obj = prev_path_obj;
				var a1 = Math.atan2(i_y - prev_atom.y, i_x - prev_atom.x);
				var d = Math.abs(Math.sqrt(Math.pow(i_y - prev_atom.y, 2) +
					Math.pow(i_x - prev_atom.x, 2)) - prev_atom.r);
				if (arcLength(path_obj.a0, path_obj.a1, path_obj.cc) >
					3 + arcLength(path_obj.a0, a1, path_obj.cc) || d > 40) {
					console.log("Whoa nelly v2");
				} else {
					// Allow for switching cc more easily
					if ((path_obj.cc && arcLength(path_obj.a0, path_obj.a1, true
						) < 0.25) || (!path_obj.cc && arcLength(path_obj.a0,
						path_obj.a1, false) < 0.25)) {
						path_obj.cc = signedAngleDiff(path_obj.a0, a1) < 0;
						if ((path_obj.cc && arcLength(path_obj.a0, path_obj.a1, true
							) > 3) || (!path_obj.cc && arcLength(path_obj.a0,
							path_obj.a1, false) > 3)) {
							path_obj.a2 = path_obj.a0;
						}
					}
					// if (angleDiff(path_obj.a1, a1) <= 0.25) path_obj.a1 = a1;
					if (prev_d <= 15) path_obj.a1 = a1;
				}
			}
		}
	} else {
		Game.v.style.webkitTransform = "";
	}
	// Prevent overlap / animate path
	if (Game.path.length) {
		var cur_path, cur_index;
		for (var x = 0, y = Game.path.length; x < y; ++ x) {
			var x_path = Game.path[x];
			if (x_path.atom.type == "eye" && !x) continue;
			if (x_path.atom.type == "eye" && x) {
				if (Game.inputHeld) {
					Game.inputHeld = false;
					// alert("We've got a winner folks");
				}
				if (!Game.isSolved) {
					// TODO: Actually test the game and make sure
					// this solution is valid
					Game.isSolved = true;
					Game.v.setAttribute("data-solved", "true");
					// alert("We've got a winner folks");
				}
				break;
			}
			if (x_path.a2 == x_path.a1) continue;
			cur_path = x_path;
			cur_index = x;
			break;
		}
		if (cur_path) {
			var max = 3.5 / cur_path.atom.r;
			var diff;
			var skipCollisions = false;
			if (angleDiff(cur_path.a2, cur_path.a1) < 0.6 * max) {
				diff = cur_path.a1 - cur_path.a2;
				cur_path.a2 = cur_path.a1;
			} else {
				if (cur_path.cc && arcLength(cur_path.a0, cur_path.a1, true) <
					arcLength(cur_path.a0, cur_path.a2, true)) {
					diff = 2 * max;
					skipCollisions = true;
				} else if (!cur_path.cc && arcLength(cur_path.a0,
					cur_path.a1, false) > arcLength(
					cur_path.a0, cur_path.a2, false)) {
					diff = max;
				} else if (cur_path.cc && arcLength(cur_path.a0, cur_path.a1, true) >=
					arcLength(cur_path.a0, cur_path.a2, true)) {
					diff = -max;
				} else {
					diff = -2 * max;
					skipCollisions = true;
				}
				cur_path.a2 += 2 * diff;
				// One last eye detector
				var cur_atom = cur_path.atom;
				if (cur_index >= 2) {
					for (var i = cur_atom.intersections.length; i --; ) {
						var intersection = cur_atom.intersections[i];
						if (intersection.type != "eye") continue;
						var a = intersection.a;
						if ((cur_path.cc && arcLength(cur_path.a0, cur_path.a1, true)
							+ 0.1 > arcLength(cur_path.a0, a, true)) || (!cur_path.cc &&
							arcLength(cur_path.a0, cur_path.a1, false) + 0.1 > arcLength(
							cur_path.a0, a, false))) {
							console.log("This should probly be a win.");
							var eye = Game.getAtom(intersection.id);
							cur_path.a1 = a;
							if (Game.path.length - 1 == cur_index) {
								Game.path.push({ atom: eye, a0: 0, a1: 0, a2: 0, cc: false });
							} else if (Game.path[cur_index + 1].atom == eye) {
								console.log("Seriously.");
								if (angleDiff(cur_path.a1, cur_path.a2) < 0.15) {
									cur_path.a2 = cur_path.a1;
									diff = 0;
								}
							}
							if (Game.inputHeld) {
								Game.inputHeld = false;
								Game.inputAtom = null;
								// alert("We've got a winner folks");
							}
						}
					}
				}
				// Collision detection
				var px = cur_atom.x + cur_atom.r * Math.cos(cur_path.a2);
				var py = cur_atom.y + cur_atom.r * Math.sin(cur_path.a2);
				for (var i = cur_index; i --; ) {
					var i_path = Game.path[i];
					var i_atom = i_path.atom;
					// No hair, don't care
					if (i_atom.type == "eye") continue;
					var d = Math.sqrt(Math.pow(i_atom.x - px, 2) +
						Math.pow(i_atom.y - py, 2));
					// Not on this atom
					if (Math.abs(i_atom.r - d) > 5) continue;
					// Does it fall on this path?
					var a = Math.atan2(py - i_atom.y, px - i_atom.x);
					if ((i_path.cc && arcLength(i_path.a0, i_path.a1, true) >
						arcLength(i_path.a0, a, true)) || (!i_path.cc &&
						arcLength(i_path.a0, i_path.a1, false) > arcLength(
							i_path.a0, a, false))) {
						console.log("Recall // a: " + a + " for i_path#" + i);
						if (i == 1 && cur_atom == i_atom) {
							console.log("This should probably be a win");
							var eye = Game.path[0].atom;
							cur_path.a1 = i_path.a0;
							Game.path.push({ atom: eye, a0: 0, a1: 0, a2: 0, cc: false });
							if (Game.inputHeld) {
								Game.inputHeld = false;
								Game.inputAtom = null;
								// alert("We've got a winner folks");
							}
							break;
						}
						cur_path.a2 -= diff;
						cur_path.a1 = cur_path.a2 - diff;
						Game.path.splice(cur_index + 1);
						if (Game.inputHeld) Game.inputAtom = cur_atom;
						break;
					}
				}
				cur_path.a2 -= diff;
			}
		}
	}
	if (skipRender) return;
	// Clear the previous pixel data
	ctx.clearRect(0, 0, Game.c1.width, Game.c1.height);
	// Render the user path
	var glow = l_glow = 0;
	if (!IS_MOBILE) {
		glow = (12 + 4 * Math.sin(Game.glowInc * 0.08)) * scale;
		l_glow = 0.75 * glow;
		++ Game.glowInc;
	}
	ctx.fillStyle = "white";
	ctx.strokeStyle = "white";
	ctx.lineWidth = 3 * scale;
	ctx.lineCap = "round";
	if (!IS_MOBILE) {
		ctx.shadowColor = "white";
	}
	ctx.shadowBlur = glow;
	var pi = Math.PI;
	for (var i = Game.path.length; i --; ) {
		var p = Game.path[i];
		ctx.beginPath();
		ctx.shadowBlur = glow;
		if (p.atom.type == "eye") {
			if (!i || Game.path[i - 1].a1 == Game.path[i - 1].a2) {
				if (!IS_MOBILE) ctx.shadowBlur = l_glow;
				ctx.arc(p.atom.x * scale, p.atom.y * scale,
					8 * scale, 0, Math.PI * 2);
				ctx.fill();
				if (!IS_MOBILE) ctx.shadowBlur = glow;
			}
			continue;
		}
		ctx.arc(p.atom.x * scale, p.atom.y * scale,
			p.atom.r * scale, (pi*2 + p.a0) % (pi*2),
			(pi*2 + p.a2) % (pi*2), p.cc);
		ctx.stroke();
	}
	if (!IS_MOBILE) {
		ctx.shadowColor = "transparent";
		ctx.shadowBlur = 0;
	}
	ctx.lineCap = "butt";
	// if (IS_MOBILE) {
		setTimeout(function() {
			Game.render(true);
		}, 2);
	// }
	window.requestAnimationFrame(Game.render);
}

Game.prototype.getAtom = function(id) {
	for (var i = Game.atoms.length; i --; ) {
		if (Game.atoms[i].id != id) continue;
		return Game.atoms[i];
	}
	return null;
}

Game = new Game();

window.addEventListener("load", function() {
	Game.init();
	if (IS_MOBILE) document.body.className += "mobile";
	if (IS_TOUCH_DEVICE) {
		document.body.addEventListener("touchmove", function(event) {
			event.preventDefault();
		});
	}
});

function handle_resize() {
	// Make sure the game has been initialized
	var v = Game.v;
	var c0 = Game.c0;
	var c1 = Game.c1;
	if (!v) return;
	var l = Math.min(window.innerWidth, window.innerHeight);
	IS_SMALL = l < 400;
	v.style.width = c0.style.width = c1.style.width = l + "px";
	v.style.height = c0.style.height = c1.style.height = l + "px";
	// Update base font size
	document.body.style.fontSize = (l * 0.02) + "px";
	// Get the devicePixelRatio
	window.pixelRatio = window.devicePixelRatio || 1;
	l *= pixelRatio;
	c0.width = c1.width = l;
	c0.height = c1.height = l;
	window.scale = Game.scale = l / 600;
	// Update offset
	var bodyRect = document.body.getBoundingClientRect(),
		elemRect = v.getBoundingClientRect();
	Game.xOffset = elemRect.left - bodyRect.left;
	Game.yOffset = elemRect.top - bodyRect.top;
	// Redraw puzzle
	Game.renderPuzzle();
}

window.addEventListener("resize", handle_resize);

// Input
function updateMousePosition(e) {
	Game.rawInputX = e.clientX - Game.xOffset;
	Game.rawInputY = e.clientY - Game.yOffset;
	Game.inputX = Game.rawInputX * pixelRatio / Game.scale;
	Game.inputY = Game.rawInputY * pixelRatio / Game.scale;
}

window.addEventListener("mousedown", function(event) {
	if (Game.isSolved) return;
	Game.inputHeld = true;
	updateMousePosition(event);
	// Clear the path?
	if (Game.debug) Game.path.splice(0);
});

window.addEventListener("mousemove", function(event) {
	if (Game.isSolved) return;
	if (Game.inputHeld) updateMousePosition(event);
});

window.addEventListener("mouseup", function(event) {
	Game.inputHeld = false;
	Game.inputAtom = null;
	// Clear the path?
	if (!Game.debug) Game.path.splice(0);
});

function updateTouchPosition(e) {
	if (!e.touches.length) return;
	var t = e.touches[0];
	Game.rawInputX = t.clientX - Game.xOffset;
	Game.rawInputY = t.clientY - Game.yOffset;
	Game.inputX = Game.rawInputX * pixelRatio / Game.scale;
	Game.inputY = Game.rawInputY * pixelRatio / Game.scale;
}

window.addEventListener("touchstart", function(event) {
	if (Game.isSolved) return;
	Game.inputHeld = true;
	if (IS_SMALL) Game.v.setAttribute("data-zoom", "true");
	updateTouchPosition(event);
	// Clear the path?
	if (Game.debug) Game.path.splice(0);
});

window.addEventListener("touchmove", function(event) {
	if (Game.isSolved) return;
	updateTouchPosition(event);
});

window.addEventListener("touchend", function(event) {
	if (event.touches.length) return;
	Game.inputHeld = false;
	Game.inputAtom = null;
	if (IS_SMALL) Game.v.setAttribute("data-zoom", "false");
	// Clear the path?
	if (!Game.debug) Game.path.splice(0);
});

function handle_next_click() {
	if (!Game.isSolved) return;
	Game.generate();
}

// User Agent Constants
IS_SMALL = false;
IS_TOUCH_DEVICE = !!(('ontouchstart' in window) ||
	window.DocumentTouch && document instanceof DocumentTouch);
var userAgent = navigator.userAgent;
IS_MOBILE = /(iPhone|iPod|iPad|Android|BlackBerry)/i.test(userAgent);
IS_FIREFOX = (/\bfirefox\//i.test(userAgent) &&
	!/\bseamonkey\//i.test(userAgent));
IS_CHROME = (/\bchrome\//i.test(userAgent) &&
	!/\b(?:chromium|edge)\//i.test(userAgent));
IS_SAFARI = (/\bsafari\//i.test(userAgent) &&
	!/\b(?:chrome|chromium)\//i.test(userAgent));
IS_OPERA = (/\b(?:opera|opr)\//i.test(userAgent));
IS_WEBKIT = (IS_CHROME || IS_SAFARI || IS_OPERA);
IS_MSIE = (/\b(?:MSIE|Trident)\b/i.test(userAgent));
IS_MSIE_9 = (userAgent.indexOf("MSIE 9") != -1);
IS_EDGE = (userAgent.indexOf("Edge") != -1);

// Helper functions
function irandom(n) {
	return Math.floor(n * Math.random());
}

function random_range(min, max) {
	return min + (max - min) * Math.random();
}

function angleDiff(a1, a2) {
	// Returns minimum difference between two angles
	var pi = Math.PI;
	while (a1 < 0) { a1 += pi * 2; }
	while (a2 < 0) { a2 += pi * 2; }
	a1 %= 2 * pi;
	a2 %= 2 * pi;
	var a = a2 - a1;
	return Math.abs((a + pi) % (2 * pi) - pi);
}

function signedAngleDiff(a1, a2) {
	// Returns minimum difference between two angles
	var pi = Math.PI;
	while (a1 < 0) { a1 += pi * 2; }
	while (a2 < 0) { a2 += pi * 2; }
	a1 %= 2 * pi;
	a2 %= 2 * pi;
	var a = a2 - a1;
	return (a + pi) % (2 * pi) - pi;
}

function arcLength(a1, a2, cc) {
	var pi = Math.PI;
	while (a1 < 0) { a1 += pi * 2; }
	while (a2 < 0) { a2 += pi * 2; }
	a1 %= 2 * pi;
	a2 %= 2 * pi;
	var a = !cc ? (a2 - a1) : (a1 - a2);
	return (2 * pi + a) % (2 * pi);
}