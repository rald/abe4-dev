function Ball(letter, x, y, d) {
    this.letter = letter.toUpperCase();
    this.x = x;
    this.y = y;
    this.d = d;
}

Ball.prototype.draw = function() {
	ctx.beginPath();
	ctx.fillStyle = palette[10];
	ctx.arc(this.x, this.y, this.d/2, 0, 2 * Math.PI);
	ctx.fill();
	ctx.closePath();

	ctx.beginPath();
	ctx.strokeStyle = palette[12];
	ctx.arc(this.x, this.y, this.d/2, 0, 2 * Math.PI);
	ctx.stroke();
	ctx.closePath();

	ctx.fillStyle = palette[12];
	ctx.font = Math.trunc(this.d/2)+"px sans";
	ctx.textAlign = "center";
	ctx.textBaseline="middle";
	ctx.fillText(this.letter, this.x, this.y);
}





