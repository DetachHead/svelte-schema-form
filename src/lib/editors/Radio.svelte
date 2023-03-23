<script lang="ts" strictEvents>
    import type { JSONSchema } from '$lib/types/schema'
    import type { CommonComponentParameters } from '../types/CommonComponentParameters'
    import type { Json } from '@exodus/schemasafe'

    export let params: CommonComponentParameters
    export let schema: JSONSchema & { enum: string[] }
    export let value: Json
    let enumVals: string[]
    let enumText: string[]
    const id = params.path.join('.')
    $: enumVals = schema.enum
    $: enumText = schema.enumText ?? schema.enum
    $: flexDirection = schema.direction ?? 'row'
</script>

<!-- event which calls pathChanged should be after all bindings so 'value' will have been updated -->
<svelte:component this={params.components['fieldWrapper']} {params} {schema}>
    <div
        id={`group-${id}`}
        style:flex-direction={flexDirection}
        class="group-container"
        aria-labelledby={`label-${id}`}
        role="radiogroup"
    >
        {#each enumVals as enumVal, idx}
            <input
                id={`${id}-${idx}`}
                name={id}
                class="sr-only"
                checked={enumVal === value}
                type="radio"
                value={enumVal}
                on:change={(ev) =>
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- https://github.com/ota-meshi/eslint-plugin-svelte/issues/390
                    params.pathChanged(params.path, ev.currentTarget.value || undefined)}
            />
            <label for={`${id}-${idx}`}> {enumText[idx]} </label>
        {/each}
    </div>
</svelte:component>
