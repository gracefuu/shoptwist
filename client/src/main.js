import App from './App.svelte';
import WSockMan from './ws.js';

let wsock = new WSockMan(
	`${location.protocol == "http:" ? "ws:" : "wss:"}//${location.host}/`);

let app = new App({ target: document.body, props: { wsock }});

let key = localStorage.getItem("key");
if (!key)
	key = prompt("Key?");

function auth(k) {
	wsock.send({ type: "init", key: k })
		.then(res => {
			localStorage.setItem("key", key);
			key = k;
			app.onInitialData(res.data);
		})
		.catch(err => {
			console.trace(err);
			let k = prompt(err);
			if (k != null)
				auth(k);
		});
};

wsock.onconnect = () => auth(key);
wsock.ondisconnect = app.onDisconnect.bind(app);

wsock.onmessage = msg => {
	switch (msg.type) {
	case "item-del":
		app.onRemoveFromServer(msg.index);
		break;

	case "item-add":
		app.onAddFromServer(msg.index, msg.content);
		break;

	default:
		console.warn("Unknown message type", msg.type);
	}
};

export default app;
