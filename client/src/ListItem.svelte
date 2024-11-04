<script>
	import { createEventDispatcher } from 'svelte';
	export let toDisplayed;
	export let item, inited;

	let dateEl;
	let date;
	let editing = false;
	let pickerOpen = false;
	let wasOpen = false;

	let selected;

	function formatDate(date) {
		return String(date.getFullYear()).padStart(4, 0) + '-' + String(date.getMonth() + 1).padStart(2, 0) + '-' + String(date.getDate()).padStart(2, 0);
	}

	function selectAndCursorToEnd(el) {
		el.focus();
		setTimeout(() => {
	    const range = document.createRange();//Create a range (a range is a like the selection but invisible)
	    range.selectNodeContents(el);//Select the entire contents of the element with the range
	    range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
	    const selection = window.getSelection();//get the selection object (allows you to change selection)
	    selection.removeAllRanges();//remove any selections already made
	    selection.addRange(range);//make the range you have just created the visible selection
    }, 0);
	}

	let dispatch = createEventDispatcher();
	let emitRemove = () => dispatch("remove", item);

  $: toDisplayed(item.displayedContent) === toDisplayed(item.content) || dispatch("edit", item);

	let showDates;
	$: showDates = item.displayedContent.match(/(due|do)\s+$/) !== null && (document.activeElement === item.target || document.activeElement === dateEl || pickerOpen);
	$: showDates && setTimeout(() => dateEl.focus(), 10);

  let onBlur = (evt) => { item.displayedContent = toDisplayed(item.content); dispatch("editdone", item); };
  $: (editing + pickerOpen === 0) && wasOpen && (wasOpen = false, item.displayedContent = toDisplayed(item.content), dispatch("editdone", item));
  $: !wasOpen && (editing + pickerOpen > 0) && (wasOpen = true);
  let onKeyDown = (evt) => evt.which !== 13 || item.target.blur();

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
		font-size: 1rem;
		max-width: calc(100% - 76px);
		margin-top: 16px;
		margin-bottom: 16px;
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

	  transition: all 0.1s ease-out;
	}

	.item .ok:hover {
		background-color: #ddd;
	}

	.date-input {
		position: absolute;
		opacity: 0;
		height: 44px;
	}
</style>

<div in:transIn out:transOut class={`item ${item.pending.size > 0 ? 'pending' : ''}`}>
	<p class="name" bind:this={item.target} bind:textContent={item.displayedContent} on:focus={() => editing = true} on:blur={() => editing = false} on:keydown={onKeyDown} contenteditable></p>
	{#if showDates}
		<input class="date-input" name="date-input" type="date" bind:value={date} bind:this={dateEl} on:focus={() => { pickerOpen = true; date = formatDate(new Date()); try { dateEl.showPicker(); } catch (e) {} } } on:blur={() => pickerOpen = false} on:change={() => { item.displayedContent += date; selectAndCursorToEnd(item.target); }}>
	{/if}
	{#if item.pending.size === 0}
		<span class="ok" on:click={emitRemove}></span>
	{/if}
</div>
