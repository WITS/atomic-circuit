/*
 * Negative.js - defines the Negative prototype
 * Copyright (c) 2016 Ian Jones
 */

Negative = function(json) {
	var json = json || {};
	if (json.x) this.x = json.x;
	if (json.y) this.y = json.y;
	if (json.r) this.r = json.r;
}

Negative.prototype.x = 0;
Negative.prototype.y = 0;
Negative.prototype.r = 0;

Negative.prototype.render = function() {
	ctx.globalCompositeOperation = "destination-out";
	ctx.strokeStyle = "rgba(0, 0, 0, 0.2)";
	ctx.fillStyle = "black";
	ctx.beginPath();
	// var a_max = Math.max(20, this.r * 0.5);
	// var a_ratio = 2 / a_max;
	// for (var a = 0; a < a_max; ++ a) {
	// 	var a_pi = a * a_ratio * Math.PI;
	// 	var r = this.r + (a % 2 ? -3 : 1);
	// 	// console.log("a: " + a + "\nr: " + r);
	// 	var x = this.x + r * Math.cos(a_pi);
	// 	var y = this.y + r * Math.sin(a_pi);
	// 	ctx[(a ? "line" : "move") + "To"](x * scale, y * scale);
	// }
	ctx.arc(this.x * scale, this.y * scale, this.r * scale,
		0, Math.PI * 2);
	ctx.closePath();
	ctx.fill();
	// ctx.shadowColor = "black";
	// ctx.shadowBlur = 16 * scale;
	ctx.globalCompositeOperation = "source-atop";
	ctx.lineWidth = scale * 16;
	ctx.stroke();
	ctx.lineWidth = scale * 8;
	ctx.strokeStyle = "rgba(0, 0, 0, 0.4)";
	ctx.stroke();
	ctx.lineWidth = scale * 4;
	ctx.stroke();
	// ctx.shadowColor = "transparent";
	// ctx.shadowBlur = 0;
	ctx.globalCompositeOperation = "source-over";
}