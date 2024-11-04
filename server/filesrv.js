let http = require("http");
let pathlib = require("path");
let fs = require("fs");

const escapeHtml = (unsafe) => {
	return unsafe.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

module.exports = function createFileServer(webroot, data) {
	let server = http.createServer((req, res) => {
		console.log(req.method+" "+req.url);
		if (req.method != "HEAD" && req.method != "GET") {
			res.writeHead(405);
			res.end(`Unexpected method: ${req.method}`);
			return;
		}

		let path = pathlib.normalize(pathlib.join(webroot, req.url));
		if (!path.startsWith(webroot)) {
			res.writeHead(404);
			res.end(`404 Not Found: ${req.url}`);
			return;
		}

		if (req.url === '/view-small') {
			res.writeHead(200, { "Content-Type": "text/html" });
			const itemsContent = Object.values(data.items).reverse();
			const formatted = `
<!DOCTYPE html>
<html>
<head>
<style>
p {
  width: 43%;
  font-size: 24pt;
  font-family: sans-serif;
  text-overflow: ellipsis;
  overflow: hidden;
  text-wrap: nowrap;
  margin: 0 auto;
  display: block;
}
</style>
</head>
<body>
${itemsContent.map(x => '<p>' + escapeHtml(x) + '</p>').join('\n')}
</body>
<script>
let cancelled = false;
setTimeout(() => cancelled || window.location.replace('/'), 1000);
window.onclick = () => cancelled = true;
window.ontouchstart = () => cancelled = true;
</script>
</html>
			`;
			res.end(formatted);
			return;
		}

		if (req.url === '/view-large') {
			res.writeHead(200, { "Content-Type": "text/html" });
			const itemsContent = Object.values(data.items).reverse();
			const formatted = `
<!DOCTYPE html>
<html>
<head>
<style>
p {
  width: 97%;
  font-size: 24pt;
  font-family: sans-serif;
  text-overflow: ellipsis;
  overflow: hidden;
  text-wrap: nowrap;
  margin: 0 auto;
  display: block;
}
</style>
</head>
<body>
${itemsContent.map(x => '<p>' + escapeHtml(x) + '</p>').join('\n')}
<script>
let cancelled = false;
setTimeout(() => cancelled || window.location.replace('/'), 1000);
window.onclick = () => cancelled = true;
window.ontouchstart = () => cancelled = true;
</script>
</body>
</html>
			`;
			res.end(formatted);
			return;
		}

		if (req.url === '/view-xlarge') {
			res.writeHead(200, { "Content-Type": "text/html" });
			const itemsContent = Object.values(data.items).reverse();
			const formatted = `
<!DOCTYPE html>
<html>
<head>
<style>
div {
  width: 97%;
  display: grid;
  grid-auto-flow: column;
  grid-gap: 0 20px;
  grid-template-rows: repeat(15, 22px);
}
p {
  width: 100%;
  font-size: 12pt;
  font-family: sans-serif;
  text-overflow: ellipsis;
  overflow: hidden;
  text-wrap: nowrap;
  margin: 0 auto;
  display: block;
}
</style>
</head>
<body>
<div>
${itemsContent.map(x => '<p>' + escapeHtml(x) + '</p>').join('\n')}
</div>
<script>
let cancelled = false;
setTimeout(() => cancelled || window.location.replace('/'), 1000);
window.onclick = () => cancelled = true;
window.ontouchstart = () => cancelled = true;
</script>
</body>
</html>
			`;
			res.end(formatted);
			return;
		}

		if (req.url === '/api.json') {
			res.writeHead(200, { "Content-Type": "application/json" });
			const itemsContent = Object.values(data.items).reverse();
			res.end(JSON.stringify([itemsContent.map(x => x.length > 12 ? x.slice(0, 12) + '...' : x).join("\n")]));
			return;
		}

		try {
			if (fs.lstatSync(path).isDirectory()) {
				path += "/index.html";
			}
		} catch {}

		(function read(path) {
			let rs = fs.createReadStream(path);
			let headersSent = false;

			rs.once("error", err => {
				console.error(req.method+" "+req.url+": "+err.toString());
				if (headersSent) {
					return;
				}
				headersSent = true;

				if (err.code == "ENOENT") {
					res.writeHead(404);
					res.end(`404 Not Found: ${req.url}`);
				} else if (err.code == "EISDIR") {
					if (!req.url.endsWith("/")) {
						res.writeHead(302, {
							location: `${req.url}/`,
						});
						res.end(`302 Found: ${req.url}/`);
					} else {
						read(path+"/index.html");
					}
				} else {
					console.warn(`Failed to open ${path}`);
					console.trace(err);
					res.writeHead(500);
					res.end("500 Internal Server Error");
				}
			});

			rs.once("open", () => {
				if (headersSent) {
					return;
				}

				let ctype = null;
				if (path.endsWith(".html"))
					ctype = "text/html";
				else if (path.endsWith(".js"))
					ctype = "application/javascript";
				else if (path.endsWith(".css"))
					ctype = "text/css";
				else if (path.endsWith(".svg"))
					ctype = "image/svg+xml";

				if (ctype)
					res.writeHead(200, { "Content-Type": ctype });
				else
					res.writeHead(200);
				headersSent = true;

				rs.pipe(res);
			});
		})(path);
	});

	return server;
}
