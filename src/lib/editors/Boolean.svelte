<script lang="ts" strictEvents>
    import type { JSONSchema } from '$lib/types/schema'
    import type { CommonComponentParameters } from '../types/CommonComponentParameters'

    export let params: CommonComponentParameters
    export let schema: JSONSchema
    export let value: boolean
</script>

<!-- event which calls pathChanged should be after all bindings so 'value' will have been updated -->
<svelte:component this={params.components['fieldWrapper']} {params} {schema}>
    <input
        id={params.path.join('.')}
        name={params.path.join('.')}
        checked={value || false}
        disabled={schema.readOnly ?? params.containerReadOnly}
        type="checkbox"
        on:change={(ev) =>
            params.pathChanged(
                params.path,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- https://github.com/ota-meshi/eslint-plugin-svelte/issues/390
                ev.currentTarget.checked,
            )}
    />
</svelte:component>
