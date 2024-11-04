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
	let inited = false;

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
		let item = { pending: new Set(['add']), content, index: pendingItems.length };
		pendingItems.push(item);
		sortItems();

	  console.log('add', item, content);
		wsock.send({ type: "item-add", content }).then(({ index }) => {
		  console.log('add done', item, content);
			delete pendingItems[item.index];

			item.index = index;
			items[index] = item;

			if (words[content] === undefined)
				words[content] = 0;
			words[content] += 1;

			sortItems();
			setTimeout(() => { item.pending.delete('add'); sortedItems = sortedItems; }, 50);
		});
	}

	function onRemove(evt) {
		let item = evt.detail;
		if (item.pending.has('del'))
			return;

		item.pending.add('del');

	  console.log('del', item);
		wsock.send({ type: "item-del", index: item.index }).then(() => {
		  console.log('del done', item);
			delete items[item.index];
			sortItems();
			sortedItems = sortedItems; 
		});
	}

	function onEdit(evt) {
		let id = [];
		let item = evt.detail;
		if (item.pending.has('del'))
			return;
		console.log(JSON.stringify(item.target.innerText));
		let newContent = item.target.innerText.trim();
		newContent = newContent === '' ? '<empty>' : newContent;
		item.content = newContent;
		item.pending.add(id);

	  console.log('edit', item, newContent);
		wsock.send({ type: "item-edit", index: item.index, content: newContent }).then(() => {
		  console.log('edit done', item);
			item.pending.delete(id);
			sortedItems = sortedItems;
		});
	}

	function refresh(item) {
		if (item.target !== undefined) {
			console.log('refreshing', item);
			item.target.setAttribute('contenteditable', false);
			item.target.setHTMLUnsafe('');
			// item.target.appendChild(new Text(item.content));
			delete item.target;
			const index = item.index;
			delete items[index];
			sortItems();
			setTimeout(() => { items[index] = item; sortItems(); }, 10);
		}
	}

	export function onRefresh(evt) {
		refresh(evt.detail);
	}

	export function onInitialData(data) {
		words = data.words;

		for (let i in items) {
			if (!data.items[i])
				delete items[i];
		}

		for (let i in data.items) {
			if (items[i] === undefined) items[i] = {};
			items[i].content = data.items[i];
			items[i].index = i;
			items[i].pending = new Set();
		}

		sortItems();
		connected = true;

		if (!inited) {
			setTimeout(() => inited = true, 200);
		}
	}

	export function onDisconnect() {
		connected = false;
	}

	export function onAddFromServer(index, content) {
	  console.log('incoming add', index, content);
		let item = { pending: new Set(['add']), content, index };
		items[index] = item;
		sortItems();
		setTimeout(() => { item.pending.delete('add'); sortedItems = sortedItems; }, 10);
	}

	export function onRemoveFromServer(index) {
	  console.log('incoming remove', index);
		if (items[index] === undefined) {
			window.location.replace('');
		}
	  items[index].pending.add('del')
		delete items[index];
		sortItems();
	}

	export function onEditFromServer(index, content) {
	  console.log('incoming edit', index, content);
		if (items[index] === undefined) {
			window.location.replace('');
		}
    let item = items[index];
		item.content = content;
		refresh(item);
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
		margin-top: 32px;
	}

	.loading {
		position: fixed;
		bottom: 12px;
		left: 0px;
		right: 0px;
	}
</style>

<div class="container">
	<ListInput {words} on:add={onAdd} />

	<div class="items">
		{#each sortedItems as item (item)}
			<ListItem {inited} {item} on:remove={onRemove} on:edit={onEdit} on:refresh={onRefresh} />
		{/each}
	</div>

	{#if !connected}
		<div out:fade={{duration: 100}} class="loading"><LoadingIcon /></div>
	{/if}
</div>
