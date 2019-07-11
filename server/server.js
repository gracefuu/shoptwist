let WebSocket = require("ws");
let createFileServer = require("./filesrv");
let fs = require("fs");

let datafile = "db.json";
let scratchfile = ".db.scratch";

let key = process.env.KEY;
if (!key) {
	console.log("Environmnt variable 'KEY' not set.");
	process.exit(1);
}
console.log("Using key:", key);

let server = createFileServer("../client/public");
let wss = new WebSocket.Server({ server });

function deserialize(defaults) {
	try {
		let json = fs.readFileSync(datafile);
		return JSON.parse(json);
	} catch (err) {
		return defaults;
	}
}

function serialize(data) {
	fs.writeFileSync(scratchfile, JSON.stringify(data));
	fs.renameSync(scratchfile, datafile);
}

let data = deserialize({
	items: { "0": "foo", "2": "bar" },
	words: {},
	nextIdx: 3,
});

let conns = [];
let connID = 0;

function ack(conn, msg, reply = {}) {
	reply.type = "ack";
	reply.ackID = msg.ackID;

	conn.sock.send(JSON.stringify(reply));
}

function broadcast(from, obj) {
	for (let conn of conns) {
		if (!conn) continue;
		if (conn != from)
			conn.sock.send(JSON.stringify(obj));
	}
}

function onMessage(conn, msg) {
	if (msg.type == "init") {
		if (!msg.key || msg.key != key)
			return ack(conn, msg, { error: "Invalid key." });

		ack(conn, msg, { data });
		conn.ready = true;
		conns[conn.id] = conn;
		return;
	}

	if (!conn.ready)
		return ack(conn, msg, { error: "Not initialized." });

	switch (msg.type) {
	case "item-add":
		if (typeof msg.content != "string")
			return ack(conn, msg, { error: "Missing content." });

		let content = msg.content.toLowerCase();
		let index = data.nextIdx.toString();
		data.nextIdx = (data.nextIdx + 1) % 2048;

		data.items[index] = content;

		if (data.words[content] == null)
			data.words[content] = 0;
		data.words[content] += 1;

		ack(conn, msg, { index });
		broadcast(conn, { type: "item-add", content, index });
		serialize(data);
		break;

	case "item-del":
		if (typeof msg.index != "string")
			return ack(conn, msg, { error: "Missing index." });

		delete data.items[msg.index];
		ack(conn, msg);
		broadcast(conn, { type: "item-del", index: msg.index });
		serialize(data);
		break;
	}
}

wss.on("connection", sock => {
	let conn = {
		sock,
		ready: false,
		id: connID,
	};
	connID = (connID + 1) % 2048;

	sock.on("close", () => {
		delete conns[conn.id];
	});

	sock.on("message", msg => {
		let obj;
		try {
			obj = JSON.parse(msg);
		} catch (err) {
			console.error("Client message has invalid JSON:", err);
			console.error(err);
			return;
		}

		onMessage(conn, obj);
	});
});

let port = process.env.PORT ? parseInt(process.env.PORT) : 8080;
server.listen(port);
console.log(`Listening on port ${port}.`);
