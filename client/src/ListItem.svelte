<script>
	import { createEventDispatcher } from 'svelte';
	export let item;

	let dispatch = createEventDispatcher();
	let emitRemove = () => dispatch("remove", item);

	function transIn(node) {
		if (!item.pending) return { delay: 0, duration: 0 };

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
		transition: background-color 0.3s;
		padding-left: 12px;
		padding-top: 42px;
		position: relative;
		margin: auto;
		text-align: left;
		width: 100%;
		height: 70px;
		overflow: hidden;
		border-bottom: 1px solid #ccc;
	}

	.item.pending {
		background-color: #eee;
	}

	.item .name {
		position: relative;
		display: inline-block;
		max-width: calc(100% - 60px);
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.item .ok {
		position: relative;
		display: inline-block;
		float: right;
		margin-right: 6px;
		height: 50px;
		width: 50px;
		bottom: 33px;

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

<div in:transIn out:transOut class={`item ${item.pending ? 'pending' : ''}`}>
	<div class="name">{capitalize(item.content)}</div>
	{#if !item.pending}
		<span class="ok" on:click={emitRemove}></span>
	{/if}
</div>
