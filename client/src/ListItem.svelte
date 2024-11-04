<script>
	import { createEventDispatcher } from 'svelte';
	export let toDisplayed;
	export let item, inited;

	let dispatch = createEventDispatcher();
	let emitRemove = () => dispatch("remove", item);
	let setTarget = (node) => {
		item.target = node;
	};

  $: toDisplayed(item.displayedContent) === toDisplayed(item.content) || dispatch("edit", item);

  let onBlur = (evt) => item.displayedContent = toDisplayed(item.content);
  let onKeyDown = (evt) => evt.which !== 13 || evt.target.blur();

	function transIn(node) {
		if (item.pending.size === 0) return { delay: 0, duration: 0 };

		let comp = getComputedStyle(node);
		let height = parseInt(comp.height);
		let paddingTop = parseInt(comp["padding-top"]);

		return {
			delay: 0,
			duration: 200,
			css: t => `
				overflow: hidden;
				min-height: ${t * height}px;
				max-height: ${t * height}px;
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
				min-height: ${part(t, 0.3, 1) * height}px;
				max-height: ${part(t, 0.3, 1) * height}px;
				padding-top: ${part(t, 0.3, 1) * paddingTop}px;
				transform: translateX(-${(1 - t) * 150}px);
				opacity: ${part(t, 0, 0.7) * opacity}`
		};
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
	<p class="name" use:setTarget bind:textContent={item.displayedContent} on:blur={onBlur} on:keydown={onKeyDown} contenteditable></p>
	{#if item.pending.size === 0}
		<span class="ok" on:click={emitRemove}></span>
	{/if}
</div>
