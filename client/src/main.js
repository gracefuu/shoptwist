import App from './App.svelte';
import WSockMan from './ws.js';

window.addEventListener("unhandledrejection", evt => {
	alert(evt.reason);
});

let wsock = new WSockMan(
	`${location.protocol == "http:" ? "ws:" : "wss:"}//${location.host}/`);

let app = new App({ target: document.body, props: { wsock }});

let key = null;

function auth(key) {
	if (!key)
		key = prompt("Key?");

	wsock.send({ type: "init", key })
		.then(res => {
			localStorage.setItem("key", key);
			app.onInitialData(res.data);
		})
		.catch(err => {
			console.trace(err);
			let k = prompt(err);
			if (k != null)
				auth(k);
		});
};

wsock.ondisconnect = () => {
	app.onDisconnect();
	auth(localStorage.getItem("key"));
};

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

auth(localStorage.getItem("key"));

export default app;
