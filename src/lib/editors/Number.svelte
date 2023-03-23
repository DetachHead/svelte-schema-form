<script lang="ts" strictEvents>
    import type { JSONSchema } from '$lib/types/schema'
    import type { CommonComponentParameters } from '../types/CommonComponentParameters'
    import type { Json } from '@exodus/schemasafe'

    export let params: CommonComponentParameters
    export let schema: JSONSchema
    export let value: Json
</script>

<!-- event which calls pathChanged should be after all bindings so 'value' will have been updated -->
<svelte:component this={params.components['fieldWrapper']} {params} {schema}>
    <input
        id={params.path.join('.')}
        name={params.path.join('.')}
        disabled={schema.readOnly ?? params.containerReadOnly}
        type="number"
        value={value ?? ''}
        on:input={(ev) => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- https://github.com/ota-meshi/eslint-plugin-svelte/issues/390
            const val = parseFloat(ev.currentTarget.value)
            params.pathChanged(params.path, isNaN(val) ? undefined : val)
        }}
    />
</svelte:component>
