let http = require("http");
let pathlib = require("path");
let fs = require("fs");

module.exports = function createFileServer(webroot) {
	let server = http.createServer((req, res) => {
		console.log(req.method+" "+req.url);
		if (req.method != "HEAD" && req.method != "GET") {
			reqswriteHead(405);
			reqsend(`Unexpected method: ${req.method}`);
			return;
		}

		let path = pathlib.normalize(pathlib.join(webroot, req.url));
		if (!path.startsWith(webroot)) {
			res.writeHead(404);
			res.end(`404 Not Found: ${req.url}`);
			return;
		}

		(function read(path) {
			let rs = fs.createReadStream(path);

			rs.once("error", err => {
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
				let ctype = null;
				if (path.endsWith(".html"))
					ctype = "text/html";
				else if (path.endsWith(".js"))
					ctype = "application/javascript";
				else if (path.endsWith(".css"))
					ctype = "text/css";

				if (ctype)
					res.writeHead(200, { "Content-Type": ctype });
				else
					res.writeHead(200);

				rs.pipe(res);
			});
		})(path);
	});

	return server;
}
