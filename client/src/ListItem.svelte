<script>
	import { createEventDispatcher } from 'svelte';
	export let item, inited;

	let dispatch = createEventDispatcher();
	let emitRemove = () => dispatch("remove", item);
	let emitEdit = (evt) => dispatch("edit", item);

	let onClick = (evt) => {
		item.target = evt.target;
	  evt.target.setAttribute('contenteditable', true);
	  evt.target.focus();
  };

	let onKeyDown = (evt) => {
	  if (evt.key === 'Enter') {
	    evt.preventDefault();
	    dispatch("refresh", item);
	  }
  };

  let onFocusOut = (evt) => dispatch("refresh", item);

	function transIn(node) {
		console.log('trans in', item.pending.size);
		if (item.pending.size === 0) return { delay: 0, duration: 0 };

		let comp = getComputedStyle(node);
		let height = parseInt(comp.height);
		let paddingTop = parseInt(comp["padding-top"]);

		return {
			delay: 0,
			duration: 200,
			css: t => `
				overflow: hidden;
				height: ${t * height}px;
				padding-top: ${t * paddingTop}px;`
		};
	}

	function transOut(node) {
		console.log('trans out', item.pending.size);
		if (item.pending.size === 0) return { delay: 200, duration: 0 };

		let comp = getComputedStyle(node);
		let opacity = parseFloat(comp.opacity);
		let height = parseInt(comp.height);
		let paddingTop = parseInt(comp["padding-top"]);

		function part(t, from, to) {
			return Math.max((t - from), 0) / (to - from);
		}

		return {
			delay: 0,
			duration: 200,
			css: t => `
				overflow: hidden;
				height: ${part(t, 0.3, 1) * height}px;
				padding-top: ${part(t, 0.3, 1) * paddingTop}px;
				transform: translateX(-${(1 - t) * 150}px);
				opacity: ${part(t, 0, 0.7) * opacity}`
		};
	}

	function capitalize(str) {
		var first = str[0].toUpperCase();
		return first + str.substring(1);
	}
</script>

<style>
	.item {
		display: flex;
	  flex-direction: column;
	  justify-content: center;
		transition: background-color 0.3s;
		padding-left: 12px;
		position: relative;
		margin: auto;
		text-align: left;
		width: 100%;
		min-height: 70px;
		overflow: hidden;
		border-bottom: 1px solid #ccc;
	}

	.item.pending {
		background-color: #eee;
	}

	.item .name {
		font-family: sans-serif;
		max-width: calc(100% - 76px)
	}

	.item .ok {
		position: absolute;
		display: inline-block;
		right: 6px;
		height: 50px;
		width: 50px;
		top: 50%;
		transform: translateY(-50%);

		background-image: url(/icon-check.svg);
		background-size: 24px 24px;
		background-repeat: no-repeat;
		background-position: center;
		cursor: pointer;

		border-radius: 100px;
		background-color: #eee;
	}

	.item .ok:hover {
		background-color: #ddd;
	}
</style>

<div in:transIn out:transOut class={`item ${item.pending.size > 0 ? 'pending' : ''}`}>
	<p class="name" on:click={onClick} on:keydown={onKeyDown} on:input={emitEdit} on:focusout={onFocusOut}>{item.content}</p>
	{#if item.pending.size === 0}
		<span class="ok" on:click={emitRemove}></span>
	{/if}
</div>
