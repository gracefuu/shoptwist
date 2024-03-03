let http = require("http");
let pathlib = require("path");
let fs = require("fs");

module.exports = function createFileServer(webroot) {
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
