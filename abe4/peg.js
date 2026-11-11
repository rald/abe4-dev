function Peg(x, y, d) {
    this.x = x;
    this.y = y;
    this.d = d;
}

Peg.prototype.draw = function(ctx) {
	Graphics.fillCircle(ctx,this.x,this.y,this.d/2,palette[5]);
	Graphics.drawCircle(ctx,this.x,this.y,this.d/2,palette[12]);
}
