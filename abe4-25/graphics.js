Graphics=function() {
}

Graphics.clrscr=function(ctx,clr) {
    ctx.fillStyle = clr;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

Graphics.drawRect=function(ctx,x,y,w,h,c) {
	ctx.strokeStyle=c;
	ctx.strokeRect(x,y,w,h);
}

Graphics.fillRect=function(ctx,x,y,w,h,c) {
	ctx.fillStyle=c;
	ctx.fillRect(x,y,w,h);
}

Graphics.drawCircle=function(ctx,x,y,r,c) {
	ctx.beginPath();
	ctx.strokeStyle=c;
	ctx.arc(x,y,r,0,2*Math.PI);
	ctx.stroke();
	ctx.closePath();
}

Graphics.fillCircle=function(ctx,x,y,r,c) {
	ctx.beginPath();
	ctx.fillStyle=c;
	ctx.arc(x,y,r,0,2*Math.PI);
	ctx.fill();
	ctx.closePath();
}
