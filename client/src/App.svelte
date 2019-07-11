<script>
	import ListItem from './ListItem.svelte';
	import ListInput from './ListInput.svelte';
	import LoadingIcon from './LoadingIcon.svelte';
	import { fade } from 'svelte/transition';
	export let wsock;

	let words = {};
	let items = {};
	let pendingItems = [];
	let sortedItems = [];
	let connected = false;

	function sortItems() {
		let pending = [];
		for (let i in pendingItems)
			pending.push(pendingItems[i]);
		pending.sort((a, b) => b.index - a.index);

		let rest = [];
		for (let i in items)
			rest.push(items[i]);
		rest.sort((a, b) => b.index - a.index);

		sortedItems = [];
		for (let item of pending)
			sortedItems.push(item);
		for (let item of rest)
			sortedItems.push(item);
	}

	function onAdd(evt) {
		let content = evt.detail;
		let item = { pending: true, content, index: -pendingItems.length };
		pendingItems.push(item);
		sortItems();

		wsock.send({ type: "item-add", content }).then(({ index }) => {
			delete pendingItems[-item.index];

			item.index = index;
			items[index] = item;

			if (words[content] == null)
				words[content] = 0;
			words[content] += 1;

			sortItems();
			setTimeout(() => { item.pending = false; sortedItems = sortedItems; }, 50);
		});
	}

	function onRemove(evt) {
		let item = evt.detail;
		if (item.pending)
			return;

		item.pending = true;
		sortedItems = sortedItems;

		wsock.send({ type: "item-del", index: item.index }).then(() => {
			delete items[item.index];
			sortItems();
		});
	}

	export function onInitialData(data) {
		connected = true;
		words = data.words;

		items = {};
		for (let i in data.items)
			items[i] = { pending: false, content: data.items[i], index: i };
		sortItems();
	}

	export function onDisconnect() {
		connected = false;
	}

	export function onAddFromServer(index, content) {
		let item = { pending: true, content, index };
		items[index] = item;
		sortItems();
		setTimeout(() => { item.pending = false; sortedItems = sortedItems; }, 10);
	}

	export function onRemoveFromServer(index) {
		delete items[index];
		sortItems();
	}
</script>

<style>
	.container {
		position: relative;
		margin: auto;
		text-align: center;
		width: 100%;
		max-width: 500px;
		height: 100%;
	}

	.items {
		margin-top: 24px;
	}

	.loading {
		position: absolute;
		bottom: 0px;
		left: 0px;
		right: 0px;
	}
</style>

<div class="container">
	<ListInput {words} on:add={onAdd} />

	<div class="items">
		{#each sortedItems as item (item.index)}
			<ListItem {item} on:remove={onRemove} />
		{/each}
	</div>

	{#if !connected}
		<div out:fade={{duration: 100}} class="loading"><LoadingIcon /></div>
	{/if}
</div>
