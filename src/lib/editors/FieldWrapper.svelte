<script lang="ts" strictEvents>
    import type { CommonComponentParameters } from '../types/CommonComponentParameters'
    import { type JSONSchema, schemaLabel } from '../types/schema'
    import { stringToHtml } from '../utilities.js'

    interface $$Slots {
        default: Record<string, never>
    }

    export let params: CommonComponentParameters
    export let schema: JSONSchema

    const title = schemaLabel(schema, params.path)
    const id = params.path.join('.')
    $: error = params.validationErrors[params.path.join('.')]
</script>

{#if params.containerParent !== 'array'}
    <label
        id={`label-${id}`}
        class:readonly={schema.readOnly ?? params.containerReadOnly}
        class:required={params.required}
        for={id}
    >
        <!-- eslint-disable-next-line svelte/no-at-html-tags -- this has been independently verified for safety 🚀 -->
        {@html stringToHtml(title)}
        {#if schema.description}
            <span class="info" title={schema.description} />
        {/if}
    </label>
{/if}
<slot />
{#if error && params.showErrors}
    <div class="error">{error}</div>
{/if}
