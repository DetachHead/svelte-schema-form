<script lang="ts">
	import type { CommonComponentParameters } from "./types/CommonComponentParameters";
	import { editorForSchema } from "./types/schema";
  	import { resolveRefs } from "./utilities";
	export let params: CommonComponentParameters;
	export let schema: any;
	export let root: any;
	export let value: any;
	let { components } = params;
	$: resolvedSchema = resolveRefs(root, schema);

	let typeComponent: any;
	
	let component: new (...args: any[]) => any;
	$: component = components[editorForSchema(resolvedSchema)];
</script>

<svelte:component this={component} {params} {value} {root} bind:schema={resolvedSchema} />



