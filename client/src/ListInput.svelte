<script>
	import { createEventDispatcher } from 'svelte';
	import { fade } from 'svelte/transition';

	let dispatch = createEventDispatcher();
	let inputEl;
	let input = '';

	let showDates;
	$: showDates = input.match(/(due|do)\s+$/) !== null;

	function onSubmit(evt) {
		if (!input)
			return;

		dispatch("add", input);
		input = "";
	}

	function addDate(evt) {
		if (!showDates) return;
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
		input += String(today.getFullYear()).padStart(4, 0);
		input += String(today.getMonth() + 1).padStart(2, 0);
		input += String(today.getDate()).padStart(2, 0);

		inputEl.focus();
	}
</script>

<style>
	.add {
		display: flex;
		flex-wrap: wrap;
		padding-top: 12px;
		padding-left: 12px;
		padding-right: 12px;
		row-gap: 12px;
	}
	.add .content,
	.add .submit {
		box-sizing: content-box;
		-webkit-appearance: none;
		font-size: 1rem;
		border: 1px solid #aaa;
		border-radius: 5px;
		background-color: #fff;
		height: 22px;
		padding: 10px;
		line-height: 0px;
	}
	.add .content {
		width: 16ch;
		flex-grow: 10000;
		border-top-right-radius: 0px;
		border-bottom-right-radius: 0px;
		margin-right: -1px;
	}
	.add .submit {
		width: 50px;
		flex-grow: 1;
		color: #000;
		font-family: sans-serif;
		font-size: 1rem;
		font-weight: bold;
		background-color: #fff;
		border-top-left-radius: 0px;
		border-bottom-left-radius: 0px;
		background-image: url(/favicon.png);
		background-size: 24px 24px;
		background-repeat: no-repeat;
		background-position: center;
		cursor: pointer;
	  transition: all 0.1s ease-out;
	}
	.add .submit:hover {
		background-color: #ddd;
	}
	.add .suggestions {
		z-index: 2;
		background: white;
		box-shadow: 0px 0px 10px 1px #ccc;
		position: absolute;
		width: 90%;
		margin: auto;
		left: 0px;
		right: 0px;
		margin-top: 15px;
		padding-top: 6px;
		padding-bottom: 6px;

		max-height: 70%;
		overflow-y: auto;
		overflow-x: hidden;
	}
	.add .suggestions .suggestion:last-child {
		border-bottom: none;
	}
	.add .suggestions .suggestion {
		padding: 12px;
		cursor: pointer;
		border-bottom: 1px solid #ccc;
		text-overflow: ellipsis;
		max-width: 100%;
		overflow: hidden;
	}

	.add-dates {
		margin-top: 12px;
		padding: 0 12px;
		width: 100%;
		display: flex;
		flex-wrap: wrap;
		min-height: 44px;
		gap: 12px;
	  transition: all 0.2s ease-out;
	}
	.add-dates.hide {
		visibility: collapse;
		margin-top: 0;
		min-height: 0;
		gap: 0 12px;
		opacity: 0;
		height: 0;
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

<form on:submit|preventDefault={onSubmit} class="add">
	<input class="content" name="content" autocomplete="off" bind:value={input} bind:this={inputEl}>
	<button class="submit" type="submit">+</button>
</form>

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
