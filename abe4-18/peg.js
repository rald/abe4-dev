function Peg(x, y, d) {
    this.x = x;
    this.y = y;
    this.d = d;
    this.ball=null;
}

Peg.prototype.draw = function(ctx) {
	Graphics.fillCircle(ctx,this.x,this.y,this.d/2,palette[5]);
	Graphics.fillCircle(ctx,this.x,this.y,this.d/2,palette[12]);
}
