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
Game.prototype.inputX = 0;
Game.prototype.inputY = 0;
Game.prototype.inputAtom = null;

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
	Game.atoms.splice(0);
	Game.negative.splice(0);
	Game.path.splice(0);
	// Create the atoms
	window.NEXT_ATOM_ID = 0;
	this.atoms.push(new Atom({
		type: "eye",
		x: 75,
		y: 300
	}));
	this.atoms.push(new Atom({
		x: 150,
		y: 300,
		r: 75
	}));
	this.atoms.push(new Atom({
		x: 250,
		y: 300,
		r: 75
	}));
	this.atoms.push(new Atom({
		x: 250,
		y: 300,
		r: 100
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
	// ctx.clearRect(0, 0, Game.c0.width, Game.c0.height);
	// Render the atoms
	for (var i = Game.atoms.length; i --; ) {
		Game.atoms[i].render();
	}
	// Prepare for rendering in realtime
	window.ctx = Game.c1.getContext("2d");
}

// Update / render user path
Game.prototype.render = function() {
	// Update the path
	if (Game.inputHeld) {
		var i_x = Game.inputX;
		var i_y = Game.inputY;
		// Find the atom they're tracing
		var cur_atom;
		for (var i = Game.atoms.length, nearest_d = Infinity; i --; ) {
			var atom = Game.atoms[i];
			var r = atom.type == "eye" ? 8 : atom.r;
			var d = Math.abs(Math.sqrt(Math.pow(i_x - atom.x, 2) +
				Math.pow(i_y - atom.y, 2)) - r);
			if (d < nearest_d) {
				nearest_d = d;
				cur_atom = atom;
			}
		}
		if (Game.inputAtom == null && cur_atom.type == "eye") {
			// Getting started?
			Game.inputAtom = cur_atom;
			Game.path.push({ atom: cur_atom, a0: 0, a1: 0, a2: 0 });
		} else if (Game.inputAtom == cur_atom) {
			if (cur_atom.type != "eye") {
				// Tracing the same atom more?
				var path_obj = Game.path[Game.path.length - 1];
				var a1 = Math.atan2(i_y - cur_atom.y, i_x - cur_atom.x);
				// Allow for switching cc more easily
				if ((path_obj.cc && arcLength(path_obj.a0, path_obj.a1, true
					) < 0.5) || (!path_obj.cc && arcLength(path_obj.a0,
					path_obj.a1, false) < 0.5)) {
					path_obj.cc = signedAngleDiff(path_obj.a0, a1) < 0;
					if ((path_obj.cc && arcLength(path_obj.a0, path_obj.a1, true
						) > 3) || (!path_obj.cc && arcLength(path_obj.a0,
						path_obj.a1, false) > 3)) {
						path_obj.a2 = path_obj.a0;
					}
				}
				path_obj.a1 = a1;
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
				console.log("Join via failed");
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
					console.log("Intersection // a = " + a);
					console.log(intersection);
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
				angleDiff(join_via, prev_path_obj.a0) < 0.1) {
				if (prev2_atom.type != "eye") {
					Game.path.splice(Game.path.length - 1);
					var a1 = Math.atan2(i_y - cur_atom.y, i_x - cur_atom.x);
					prev2_path_obj.a1 = a1;
					Game.inputAtom = prev2_atom;
				} else {
					// TODO: You won? Maybe?
				}
			} else if (join_via != null) {
				prev_path_obj.a1 = join_via;
				var a0x = prev_atom.x + prev_atom.r * Math.cos(join_via);
				var a0y = prev_atom.y + prev_atom.r * Math.sin(join_via);
				var a0 = Math.atan2(a0y - cur_atom.y, a0x - cur_atom.x);
				Game.inputAtom = cur_atom;
				var cc = signedAngleDiff(a0, a1) < 0;
				Game.path.push(
					{ atom: cur_atom, a0: a0, a1: a1, a2: a0, cc: cc });
			} else {
				if (Game.debug) console.log("Join via failed");
				var a1 = Math.atan2(i_y - prev_atom.y, i_x - prev_atom.x);
				// Allow for switching cc more easily
				var path_obj = prev_path_obj;
				if ((path_obj.cc && arcLength(path_obj.a0, path_obj.a1, true
					) < 0.5) || (!path_obj.cc && arcLength(path_obj.a0,
					path_obj.a1, false) < 0.5)) {
					path_obj.cc = signedAngleDiff(path_obj.a0, a1) < 0;
					if ((path_obj.cc && arcLength(path_obj.a0, path_obj.a1, true
						) > 3) || (!path_obj.cc && arcLength(path_obj.a0,
						path_obj.a1, false) > 3)) {
						path_obj.a2 = path_obj.a0;
					}
				}
				if (angleDiff(path_obj.a1, a1) <= 0.1) path_obj.a1 = a1;
			}
		}
	}
	// Prevent overlap / animate path
	if (Game.path.length) {
		var cur_path;
		for (var x = 0, y = Game.path.length; x < y; ++ x) {
			var x_path = Game.path[x];
			if (x_path.atom.type == "eye") continue;
			if (x_path.a2 == x_path.a1) continue;
			cur_path = x_path;
			break;
		}
		if (cur_path) {
			var max = 4 / cur_path.atom.r;
			var diff;
			if (angleDiff(cur_path.a2, cur_path.a1) <= max) {
				diff = cur_path.a1 - cur_path.a2;
				cur_path.a2 = cur_path.a1;
			} else {
				if ((cur_path.cc && arcLength(cur_path.a0, cur_path.a1, true) <
					arcLength(cur_path.a0, cur_path.a2, true)) || (!cur_path.cc &&
					arcLength(cur_path.a0, cur_path.a1, false) > arcLength(
						cur_path.a0, cur_path.a2, false))) {
					diff = max;
				} else {
					diff = -max;
				}
				// diff = angleDiff(
				// 	cur_path.a2, cur_path.a1) * 0.1;
				// var diff_sign = diff > 0 ? 1 : -1;
				// if (Math.abs(diff) > max) diff = diff_sign * max;
				cur_path.a2 += diff;
			}
		}
	}
	// Clear the previous pixel data
	ctx.clearRect(0, 0, Game.c1.width, Game.c1.height);
	// Render the user path
	ctx.fillStyle = "#00FFFF";
	ctx.strokeStyle = "#00FFFF";
	ctx.lineWidth = 3 * scale;
	for (var i = Game.path.length; i --; ) {
		var p = Game.path[i];
		ctx.beginPath();
		if (p.atom.type == "eye") {
			ctx.arc(p.atom.x * scale, p.atom.y * scale,
				8 * scale, 0, Math.PI * 2);
			ctx.fill();
			continue;
		}
		ctx.arc(p.atom.x * scale, p.atom.y * scale,
			p.atom.r * scale, p.a0, p.a2, p.cc);
		ctx.stroke();
	}
	window.requestAnimationFrame(Game.render);
}

Game = new Game();

window.addEventListener("load", function() {
	Game.init();
});

function handle_resize() {
	// Make sure the game has been initialized
	var v = Game.v;
	var c0 = Game.c0;
	var c1 = Game.c1;
	if (!v) return;
	var l = Math.min(window.innerWidth, window.innerHeight);
	v.style.width = c0.style.width = c1.style.width = l + "px";
	v.style.height = c0.style.height = c1.style.height = l + "px";
	l *= window.devicePixelRatio || 1;
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
	Game.inputX = (e.clientX - Game.xOffset) / Game.scale;
	Game.inputY = (e.clientY - Game.yOffset) / Game.scale;
}

window.addEventListener("mousedown", function(event) {
	Game.inputHeld = true;
	updateMousePosition(event);
	// Clear the path?
	if (Game.debug) Game.path.splice(0);
});

window.addEventListener("mousemove", function(event) {
	if (Game.inputHeld) updateMousePosition(event);
});

window.addEventListener("mouseup", function(event) {
	Game.inputHeld = false;
	Game.inputAtom = null;
	// Clear the path?
	if (!Game.debug) Game.path.splice(0);
})

// Helper functions
function irandom(n) {
	return Math.floor(n * Math.random());
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