<script>
	import ListItem from './ListItem.svelte';
	import ListInput from './ListInput.svelte';
	import LoadingIcon from './LoadingIcon.svelte';
	import { fade } from 'svelte/transition';
	export let wsock;

	let items = {};
	let pendingItems = [];
	let sortedItems = [];
	let connected = false;
	let inited = false;

  let toDisplayed = (content) => content === '' ? '<empty>' : content

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
		let item = { pending: new Set(['add']), content, displayedContent: toDisplayed(content), index: pendingItems.length };
		pendingItems.push(item);
		sortItems();

	  console.log('add', item, content);
		wsock.send({ type: "item-add", content }).then(({ index }) => {
		  console.log('add done', item, content);
			delete pendingItems[item.index];

			item.index = index;
			items[index] = item;

			sortItems();
			setTimeout(() => { item.pending.delete('add'); sortedItems = sortedItems; }, 50);
		});
	}

	function onRemove(evt) {
		let item = evt.detail;
		if (item.pending.has('del'))
			return;

		item.pending.add('del');
		sortedItems = sortedItems;

	  console.log('del', item);
		wsock.send({ type: "item-del", index: item.index }).then(() => {
		  console.log('del done', item);
			delete items[item.index];
			sortItems();
			sortedItems = sortedItems;
		});
	}

	function onEdit(evt) {
		let item = evt.detail;
		if (item.pending.has('del'))
			return;
		if (item.pending.has('edit')) {
			item.pendingEdit = item.content = item.displayedContent;
			return;
		}
		item.pending.add('edit');
		const content = item.content = item.displayedContent;
		const expectedUpdates = item.updates + 1;

	  console.log('edit', item, item.displayedContent);
		wsock.send({ type: "item-edit", index: item.index, content: item.content }).then(({ updates }) => {
		  console.log('edit done', item);
			item.pending.delete('edit');
			if (item.updates < updates) {
				if (updates === expectedUpdates) {
					item.updates = updates;
				} else {
					onEditFromServer(item.index, content, updates);
				}
				if (item.pendingEdit !== undefined) {
					item.displayedContent = item.pendingEdit;
					delete item.pendingEdit;
					onEdit({ detail: item });
				}
			}
			sortedItems = sortedItems;
		});
	}

	export function onInitialData(data) {
		for (let i in items) {
			if (!data.items[i])
				delete items[i];
		}

		for (let i in data.items) {
			if (items[i] === undefined) items[i] = {};
			items[i].content = data.items[i];
			items[i].displayedContent = toDisplayed(data.items[i]);
			items[i].index = i;
			items[i].updates = data.updates[i] === undefined ? 0 : data.updates[i];
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
		let item = { pending: new Set(['add']), content, displayedContent: toDisplayed(content), index };
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

	export function onEditFromServer(index, content, updates) {
	  console.log('incoming edit', index, content, updates);
		if (items[index] === undefined) {
			window.location.replace('');
		}
    let item = items[index];
		if (item.updates < updates) {
			item.updates = updates;
			item.content = content;
			item.displayedContent = toDisplayed(content);
			item.target.removeAttribute('contenteditable');
			setTimeout(() => item.target.setAttribute('contenteditable', ''), 10);
			sortItems();
		}
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
	<ListInput on:add={onAdd} />

	<div class="items">
		{#each sortedItems as item (item)}
			<ListItem {toDisplayed} {inited} {item} on:remove={onRemove} on:edit={onEdit} />
		{/each}
	</div>

	{#if !connected}
		<div out:fade={{duration: 100}} class="loading"><LoadingIcon /></div>
	{/if}
</div>
