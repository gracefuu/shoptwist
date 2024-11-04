<script>
	import { createEventDispatcher } from 'svelte';
	import { fade } from 'svelte/transition';

	let dispatch = createEventDispatcher();
	let inputEl;

	function onSubmit(evt) {
		let val = inputEl.value;
		if (!val)
			return;

		inputEl.value = "";
		dispatch("add", val);
	}

	function add(content) {
		inputEl.value = "";
		dispatch("add", content);
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
		font-size: 16px;
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
		font-weight: bold;
		background-color: #fff;
		border-top-left-radius: 0px;
		border-bottom-left-radius: 0px;
		background-image: url(/favicon.png);
		background-size: 24px 24px;
		background-repeat: no-repeat;
		background-position: center;
		cursor: pointer;
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
</style>

<form on:submit|preventDefault={onSubmit} class="add">
	<input class="content" name="content" bind:this={inputEl}>
	<button class="submit" type="submit">+</button>
</form>
