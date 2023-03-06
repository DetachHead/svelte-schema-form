<script lang="ts">
    import SubSchemaForm from '../SubSchemaForm.svelte'
    import type { CommonComponentParameters } from '../types/CommonComponentParameters'
    import { type JSONSchema, schemaLabel } from '../types/schema'
    import { stringToHtml } from '../utilities.js'
    import type { Json } from '@exodus/schemasafe'
    import { throwIfUndefined } from 'throw-expression'

    export let params: CommonComponentParameters
    export let schema: (JSONSchema & { required?: string[] }) & { properties: JSONSchema }
    export let value: { [id: string]: Json }

    let propNames: string[]
    $: propNames = Object.keys(schema.properties)
    let collapserOpenState: 'open' | 'closed' =
        params.path.length === 0 || params.containerParent === 'array' || !params.collapsible
            ? 'open'
            : 'closed'

    const toggle = () => {
        collapserOpenState = collapserOpenState === 'open' ? 'closed' : 'open'
    }

    $: legendText = schemaLabel(schema, params.path)
    $: showLegend = params.collapsible || (params.containerParent !== 'array' && !!legendText)
</script>

<fieldset name={params.path.join('.')} class="subset object depth-{params.path.length}">
    {#if showLegend}
        <legend class="subset-label object-label">
            {#if params.collapsible}
                <!-- TODO
                svelte-ignore a11y-click-events-have-key-events -->
                <span class="collapser {collapserOpenState}" on:click={toggle} />
            {/if}
            {#if params.containerParent !== 'array' || schema.title}
                <span class="subset-label-title object-label-title">
                    <!-- eslint-disable-next-line svelte/no-at-html-tags -- this has been independently verified for safety 🚀 -->
                    {@html stringToHtml(schemaLabel(schema, params.path))}</span
                >
                {#if schema.description}
                    <span class="subset-label-description object-label-description">
                        <!-- eslint-disable-next-line svelte/no-at-html-tags -- this has been independently verified for safety 🚀 -->
                        {@html stringToHtml(schema.description)}</span
                    >
                {/if}
            {/if}
        </legend>
    {/if}

    {#if collapserOpenState === 'open'}
        {#each propNames as propName (propName)}
            <SubSchemaForm
                params={{
                    ...params,
                    path: [...params.path, propName],
                    required: (schema.required ?? []).includes(propName),
                    containerParent: 'object',
                    containerReadOnly: (params.containerReadOnly || schema.readOnly) ?? false,
                }}
                value={throwIfUndefined(value[propName])}
                bind:schema={schema.properties[propName]}
            />
        {/each}
    {/if}
</fieldset>
