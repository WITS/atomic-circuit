/*
 * Atom.js - defines the Atom prototype
 * Copyright (c) 2016 Ian Jones
 */

Atom = function(json) {
	var json = json || {};
	this.id = NEXT_ATOM_ID ++;
	if (json.type) this.type = json.type;
	if (json.value) this.value = json.value;
	if (json.x) this.x = json.x;
	if (json.y) this.y = json.y;
	if (json.r) this.r = json.r;
	this.intersections = new Array();
}

Atom.prototype.type = "default";
Atom.prototype.value = 1;
Atom.prototype.id = 0;
Atom.prototype.x = 0;
Atom.prototype.y = 0;
Atom.prototype.r = 0;

Atom.prototype.findIntersections = function() {
	// Find all intersections with other atoms
	for (var i = Game.atoms.length; i --; ) {
		var other = Game.atoms[i];
		if (other == this) continue;

		var r0 = this.r;
		var r1 = other.r;
		var d = Math.sqrt(Math.pow(this.x - other.x, 2) +
			Math.pow(this.y - other.y, 2));

		// No intersection?
		if (d > 2 + r0 + r1 || d < Math.abs(r0 - r1)) continue;

		var angle = Math.atan2(other.y - this.y, other.x - this.x);

		// One intersection?
		if (Math.abs(r0 + r1 - d) <= 2) {
			this.intersections.push(
				{ id: other.id, type: other.type, a: angle });
			continue;
		}

		// Two intersections
		var a = (Math.pow(r0, 2) - Math.pow(r1, 2) + Math.pow(d, 2)
			) * 0.5 / d;
		var h = Math.sqrt(Math.pow(r0, 2) - Math.pow(a, 2));
		var angle_offset = Math.asin(h / r0);
		this.intersections.push(
			{ id: other.id, type: other.type, a: angle + angle_offset });
		this.intersections.push(
			{ id: other.id, type: other.type, a: angle - angle_offset });
	}
	for (var i = this.intersections.length; i --; ) {
		var intersection = this.intersections[i];
		var ix = this.x + this.r * Math.cos(intersection.a);
		var iy = this.y + this.r * Math.sin(intersection.a);
		// Remove intersections that don't really exist
		for (var j = Game.negative.length; j --; ) {
			var neg = Game.negative[j];
			var d = Math.sqrt(Math.pow(ix - neg.x, 2) +
				Math.pow(iy - neg.y, 2));
			if (d <= neg.r) {
				this.intersections.splice(i, 1);
				break;
			}
		}
	}
}

Atom.prototype.render = function() {
	if (this.type == "eye") {
		ctx.fillStyle = "#C7C7C7";
		ctx.beginPath();
		ctx.arc(this.x * scale, this.y * scale, 8 * scale,
			0, Math.PI * 2);
		ctx.fill();
		return;
	}
	ctx.lineWidth = scale * 2;
	ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
	ctx.beginPath();
	ctx.arc(this.x * scale, this.y * scale, this.r * scale,
		0, Math.PI * 2);
	ctx.stroke();
	// Draw type-specific icons
	if (this.type == "die") {
		ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
		var w = Math.floor(12 * scale);
		var h = Math.floor(12 * scale);
		switch (this.value) {
			case 2:
				ctx.fillRect(Math.floor((this.x - 13) * scale),
					Math.floor((this.y - 13) * scale), w, h);
				ctx.fillRect(Math.floor((this.x + 1) * scale),
					Math.floor((this.y + 1) * scale), w, h);
				break;
			case 3:
				ctx.fillRect(Math.floor((this.x - 13) * scale),
					Math.floor((this.y - 13) * scale), w, h);
				ctx.fillRect(Math.floor((this.x + 1) * scale),
					Math.floor((this.y - 13) * scale), w, h);
				ctx.fillRect(Math.floor((this.x - 6) * scale),
					Math.floor((this.y + 1) * scale), w, h);
				break;
			case 4:
				ctx.fillRect(Math.floor((this.x - 13) * scale),
					Math.floor((this.y - 13) * scale), w, h);
				ctx.fillRect(Math.floor((this.x + 1) * scale),
					Math.floor((this.y - 13) * scale), w, h);
				ctx.fillRect(Math.floor((this.x - 13) * scale),
					Math.floor((this.y + 1) * scale), w, h);
				ctx.fillRect(Math.floor((this.x + 1) * scale),
					Math.floor((this.y + 1) * scale), w, h);
				break;
			default:
				ctx.fillRect(Math.floor((this.x - 6) * scale),
					Math.floor((this.y - 6) * scale), w, h);
				break;
		}
	}
	// Draw intersections
	if (false && Game.debug) {
		ctx.fillStyle = "red";
		for (var i = this.intersections.length; i --; ) {
			var intersection = this.intersections[i];
			ctx.fillRect(scale * (this.x + this.r * Math.cos(
				intersection.a) - 1), scale * (this.y + this.r * Math.sin(
				intersection.a) - 1), scale * 3, scale * 3);
		}
	}
}