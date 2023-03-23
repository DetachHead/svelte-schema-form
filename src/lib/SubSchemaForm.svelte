<script lang="ts" strictEvents>
    import type { CommonComponentParameters } from './types/CommonComponentParameters'
    import { type JSONSchema, editorForSchema } from './types/schema'
    import type { Json } from '@exodus/schemasafe'
    import { resolveRefs } from 'json-refs'

    export let params: CommonComponentParameters
    export let schema: JSONSchema
    export let value: Json | undefined

    const { components } = params

    const getComponent = (resolvedSchema: JSONSchema) => components[editorForSchema(resolvedSchema)]
</script>

{#await resolveRefs(schema)}
    <p>loading...</p>
{:then result}
    <svelte:component
        this={getComponent(result.resolved)}
        {params}
        schema={result.resolved}
        {value}
    />
{/await}
