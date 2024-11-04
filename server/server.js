let WebSocket = require("ws");
let createFileServer = require("./filesrv");
let fs = require("fs");

let datafile = "db.json";
let scratchfile = ".db.scratch";

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

let oldData = deserialize({
	items: { "0": "foo", "1": "bar" },
	nextIdx: 2,
});
let data = { items: {}, updates: {}, nextIdx: 0 };
for (const index in oldData.items) {
	if (typeof oldData.items[index] !== "string") continue;
	const idx = data.nextIdx++;
	data.items[idx] = oldData.items[index];
	data.updates[idx] = 0;
}

let server = createFileServer("../client/public", data);
let wss = new WebSocket.Server({ server });

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
		if (conn !== from)
			conn.sock.send(JSON.stringify(obj));
	}
}

function onMessage(conn, msg) {
	const delayMs = 0;
	if (delayMs > 0) {
		let stop = new Date().getTime();
	  while (new Date().getTime() < stop + delayMs) {}
  }
	if (msg.type === "init") {
		ack(conn, msg, { data });
		conn.ready = true;
		conns[conn.id] = conn;
		return;
	}

	if (!conn.ready)
		return ack(conn, msg, { error: "Not initialized." });

	switch (msg.type) {
	case "item-add":
		if (typeof msg.content !== "string")
			return ack(conn, msg, { error: "Missing content." });

		let content = msg.content;
		let index = data.nextIdx.toString();
		data.nextIdx = (data.nextIdx + 1) % 2048;

		data.items[index] = content;
		data.updates[index] = 0;

		ack(conn, msg, { index });
		broadcast(conn, { type: "item-add", content, index });
		serialize(data);
		break;

	case "item-del":
		if (typeof msg.index !== "string")
			return ack(conn, msg, { error: "Missing index." });

		delete data.items[msg.index];
		delete data.updates[msg.index];
		ack(conn, msg);
		broadcast(conn, { type: "item-del", index: msg.index });
		serialize(data);
		break;

	case "item-edit":
		if (typeof msg.index !== "string")
			return ack(conn, msg, { error: "Missing index." });
		if (typeof msg.content !== "string")
			return ack(conn, msg, { error: "Missing content." });

		data.items[msg.index] = msg.content;
		const updates = data.updates[msg.index]++;
		ack(conn, msg, { updates });
		broadcast(conn, { type: "item-edit", index: msg.index, content: msg.content, updates });
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
