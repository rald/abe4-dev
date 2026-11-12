function rnd(x) {
    return Math.floor(Math.random()*x);
}

function inrect(x, y, rx, ry, rw, rh) {
    return x >= rx && x <= rx + rw && y >= ry && y <= ry + rh;
}

function incirc(x, y, cx, cy, cr) {
    var dx = x - cx;
    var dy = y - cy;
    return (dx * dx + dy * dy) <= (cr * cr);
}

function shuffleString(str) {
	const arr = str.split('');
	for (let i = arr.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}
	return arr.join('');
}

function chr(code) {
	return String.fromCodePoint(code);
}

function ord(char) {
	return char.codePointAt(0);
}

