import App from './App.svelte';
import WSockMan from './ws.js';

window.addEventListener("unhandledrejection", evt => {
	alert(evt.reason);
});

let wsock = new WSockMan(
	`${location.protocol == "http:" ? "ws:" : "wss:"}//${location.host}/`);

let app = new App({ target: document.body, props: { wsock }});

function auth() {
	wsock.send({ type: "init" })
		.then(res => {
			app.onInitialData(res.data);
		});
};

wsock.ondisconnect = () => {
	app.onDisconnect();
	auth();
};

wsock.onmessage = msg => {
	switch (msg.type) {
	case "item-del":
		app.onRemoveFromServer(msg.index);
		break;

	case "item-add":
		app.onAddFromServer(msg.index, msg.content);
		break;

	case "item-edit":
		app.onEditFromServer(msg.index, msg.content);
		break;

	default:
		console.warn("Unknown message type", msg.type);
	}
};

auth();

export default app;
