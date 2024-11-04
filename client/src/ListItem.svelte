<script>
	import { createEventDispatcher } from 'svelte';
	export let toDisplayed;
	export let item, inited;

	let dispatch = createEventDispatcher();
	let emitRemove = () => dispatch("remove", item);

  $: toDisplayed(item.displayedContent) === toDisplayed(item.content) || dispatch("edit", item);

	let showDates;
	$: showDates = item.displayedContent.match(/(due|do)\s+$/) !== null && document.activeElement === item.target;

  let onBlur = (evt) => { item.displayedContent = toDisplayed(item.content); dispatch("editdone", item); };
  let onKeyDown = (evt) => evt.which !== 13 || item.target.blur();

	function addDate(evt) {
		const today = new Date();
		const add = (n) => today.setDate(today.getDate() + n);
		const addToDay = (targetDay) => {
			const startDay = today.getDay();
			const daysToAdd = (targetDay + 14 - startDay - 1) % 7 + 1;
			add(daysToAdd);
		};
		switch (evt.target.textContent) {
			case '0d': add(0); break;
			case '1d': add(1); break;
			case '2d': add(2); break;
			case '1w': add(7); break;
			case '2w': add(14); break;
			case 'Sun': addToDay(0); break;
			case 'Mon': addToDay(1); break;
			case 'Tue': addToDay(2); break;
			case 'Wed': addToDay(3); break;
			case 'Thu': addToDay(4); break;
			case 'Fri': addToDay(5); break;
			case 'Sat': addToDay(6); break;
		}
		item.displayedContent += ' ';
		item.displayedContent += String(today.getFullYear()).padStart(4, 0);
		item.displayedContent += String(today.getMonth() + 1).padStart(2, 0);
		item.displayedContent += String(today.getDate()).padStart(2, 0);

		item.target.focus();
		setTimeout(() => {
	    const range = document.createRange();//Create a range (a range is a like the selection but invisible)
	    range.selectNodeContents(item.target);//Select the entire contents of the element with the range
	    range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
	    const selection = window.getSelection();//get the selection object (allows you to change selection)
	    selection.removeAllRanges();//remove any selections already made
	    selection.addRange(range);//make the range you have just created the visible selection
    }, 0);
	}

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

	.add-dates {
		margin-top: calc(12px - 16px);
		margin-bottom: 0;
		padding: 0 12px;
		width: calc(100% - 76px);
		display: flex;
		flex-wrap: wrap;
		max-height: 100px;
		gap: 12px;
	  transition: all 0.2s ease-out;
	}
	.add-dates.hide {
		visibility: collapse;
		margin-top: 0;
		margin-bottom: 0;
		min-height: 0;
		gap: 0 12px;
		opacity: 0;
		max-height: 0;
	}
	.add-dates ~ .add-dates {
		margin-top: 12px;
		margin-bottom: 12px;
	}
	.add-dates ~ .add-dates.hide {
		margin-top: 0;
		margin-bottom: 0;
	}

	.add-dates .date {
		flex-basis: 0;
		flex-grow: 1;
		height: 44px;
		min-width: 50px;
		padding: 0;
	  transition: all 0.2s ease-out;

		background: #eee;
		color: #000;
		border: 0;
		border-radius: 88px;
		font-family: sans-serif;
		font-size: 0.85rem;
	}
	.add-dates .date:hover {
		background: #ddd;
	}

	.add-dates .dates-satsun {
		flex-basis: 20px;
		flex-grow: 2;
		height: 44px;
		min-width: 112px;
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
	}
	.add-dates .dates-satsun .date {
		flex-basis: 0;
		flex-grow: 2;
		height: 44px;
		min-width: 50px;
	}
</style>

<div in:transIn out:transOut class={`item ${item.pending.size > 0 ? 'pending' : ''}`}>
	<form>
	<p class="name" bind:this={item.target} bind:textContent={item.displayedContent} on:blur={onBlur} on:keydown={onKeyDown} contenteditable></p>
	<div class={`add-dates ${showDates ? '' : 'hide'}`}>
		<button class="date" type="button" on:click={addDate}>0d</button>
		<button class="date" type="button" on:click={addDate}>1d</button>
		<button class="date" type="button" on:click={addDate}>2d</button>
		<button class="date" type="button" on:click={addDate}>1w</button>
		<button class="date" type="button" on:click={addDate}>2w</button>
	</div>
	<div class={`add-dates ${showDates ? '' : 'hide'}`}>
		<button class="date" type="button" on:click={addDate}>Mon</button>
		<button class="date" type="button" on:click={addDate}>Tue</button>
		<button class="date" type="button" on:click={addDate}>Wed</button>
		<button class="date" type="button" on:click={addDate}>Thu</button>
		<button class="date" type="button" on:click={addDate}>Fri</button>
		<div class="dates-satsun">
			<button class="date" type="button" on:click={addDate}>Sat</button>
			<button class="date" type="button" on:click={addDate}>Sun</button>
		</div>
	</div>
	</form>

	{#if item.pending.size === 0}
		<span class="ok" on:click={emitRemove}></span>
	{/if}
</div>
