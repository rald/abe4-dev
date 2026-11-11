function Peg(x, y, d) {
    this.x = x;
    this.y = y;
    this.d = d;
}

Peg.prototype.draw = function() {
	ctx.beginPath();
	ctx.fillStyle = palette[5];
	ctx.arc(this.x, this.y, this.d/2, 0, 2 * Math.PI);
	ctx.fill();
	ctx.closePath();

	ctx.beginPath();
	ctx.strokeStyle = palette[12];
	ctx.arc(this.x, this.y, this.d/2, 0, 2 * Math.PI);
	ctx.stroke();
	ctx.closePath();
}
