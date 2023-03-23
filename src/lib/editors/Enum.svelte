<script lang="ts" strictEvents>
    import type { JSONSchema } from '$lib/types/schema'
    import type { CommonComponentParameters } from '../types/CommonComponentParameters'
    import type { Json } from '@exodus/schemasafe'
    import { throwIfUndefined } from 'throw-expression'

    export let params: CommonComponentParameters
    export let schema: JSONSchema
    export let value: Json
    let enumText: string[]
    $: enumVals = throwIfUndefined(schema.enum, 'Enum - schema.enum was undefiend')
    // TODO: fix types
    $: enumText = (schema.enumText ?? schema.enum ?? []) as string[]
</script>

<!-- event which calls pathChanged should be after all bindings so 'value' will have been updated -->
<svelte:component this={params.components['fieldWrapper']} {params} {schema}>
    <select
        id={params.path.join('.')}
        name={params.path.join('.')}
        disabled={schema.readOnly ?? params.containerReadOnly}
        {value}
        on:change={(ev) =>
            params.pathChanged(
                params.path,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- https://github.com/ota-meshi/eslint-plugin-svelte/issues/390
                ev.currentTarget.value || undefined,
            )}
    >
        <option />
        {#each enumVals as enumVal, idx}
            <option value={enumVal}>{enumText[idx]}</option>
        {/each}
    </select>
</svelte:component>
