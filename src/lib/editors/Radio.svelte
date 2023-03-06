<script lang="ts">
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
        role="radiogroup"
        class="group-container"
        aria-labelledby={`label-${id}`}
        style="flex-direction:{flexDirection}"
        id={`group-${id}`}
    >
        {#each enumVals as enumVal, idx}
            <input
                class="sr-only"
                type="radio"
                id={`${id}-${idx}`}
                on:change={(ev) =>
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- https://github.com/ota-meshi/eslint-plugin-svelte/issues/390
                    params.pathChanged(params.path, ev.currentTarget.value || undefined)}
                value={enumVal}
                name={id}
                checked={enumVal === value}
            />
            <label for={`${id}-${idx}`}> {enumText[idx]} </label>
        {/each}
    </div>
</svelte:component>
