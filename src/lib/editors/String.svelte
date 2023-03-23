<script lang="ts" strictEvents>
    import type { CommonComponentParameters } from '../types/CommonComponentParameters'
    import { type JSONSchema, editorForSchema } from '../types/schema'
    import type { Json } from '@exodus/schemasafe'

    export let params: CommonComponentParameters
    export let schema: JSONSchema
    export let value: Json

    let type = 'text'
    $: {
        const editor = editorForSchema(schema)
        type =
            editor === 'password'
                ? 'password'
                : editor === 'email'
                ? 'email'
                : editor === 'time'
                ? 'time'
                : editor === 'date-time'
                ? 'datetime-local'
                : editor === 'date'
                ? 'date'
                : 'text'
    }
</script>

<!-- event which calls pathChanged should be after all bindings so 'value' will have been updated -->
<svelte:component this={params.components['fieldWrapper']} {params} {schema}>
    <input
        id={params.path.join('.')}
        name={params.path.join('.')}
        disabled={schema.readOnly ?? params.containerReadOnly}
        {type}
        value={value ?? ''}
        on:input={(ev) =>
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- https://github.com/ota-meshi/eslint-plugin-svelte/issues/390
            params.pathChanged(params.path, ev.currentTarget.value || undefined)}
    />
</svelte:component>
