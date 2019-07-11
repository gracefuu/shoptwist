export default class WSockMan {
	constructor(url) {
		this.ready = false;
		this.sock = null;
		this.url = url;
		this.sendQ = [];
		this.ackQ = [];
		this.ackID = 0;

		this.ondisconnect = () => {};
		this.onconnect = () => {};
		this.onmessage = () => {};

		this.createWS();
	}

	send(obj, cb) {
		return new Promise((resolve, reject) => {
			if (this.ready) {
				return this.reallySend(obj, resolve, reject);
			} else {
				this.sendQ.push([obj, resolve, reject]);
			}
		});
	}

	createWS() {
		if (this.sock)
			this.sock.close();
		this.sock = new WebSocket(this.url);

		this.sock.onopen = () => {
			this.ready = true;
			this.ackID = 0;

			for (let i = 0; i < this.sendQ.length; ++i)
				this.reallySend(...this.sendQ[i]);
			this.sendQ = [];

			this.onconnect();
		};

		this.sock.onclose = () => {
			console.error("Connection closed.");
			this.ready = false;
			this.sock = null;

			for (let i = 0; i < this.ackQ.length; ++i) {
				let [ resolve, reject ] = this.ackQ[i];
				reject("Lost connection.");
			}
			this.ackQ = [];

			this.ondisconnect();

			setTimeout(() => this.createWS(), 1000);
		};

		this.sock.onerror = evt => {
			console.error("WebSocket error:", evt);
		};

		this.sock.onmessage = evt => {
			let obj = JSON.parse(evt.data);
			if (obj.type == "ack") {
				let [ resolve, reject ] = this.ackQ[obj.ackID];
				if (obj.error)
					reject(obj.error);
				else
					resolve(obj);
			} else {
				this.onmessage(obj);
			}
		};
	}

	reallySend(obj, resolve, reject) {
		let ackID = this.ackID++;
		this.ackQ[ackID] = [ resolve, reject ];
		obj.ackID = ackID;
		this.sock.send(JSON.stringify(obj));
	}
}
