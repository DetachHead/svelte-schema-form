<script lang="ts" strictEvents>
    import SubSchemaForm from '../SubSchemaForm.svelte'
    import { arrayAdd, arrayDelete, arrayDown, arrayDuplicate, arrayUp } from '../arrayOps'
    import type { CommonComponentParameters } from '../types/CommonComponentParameters'
    import { type Control, type JSONSchema, schemaLabel } from '../types/schema'
    import { stringToHtml } from '../utilities.js'
    import type { Json } from '@exodus/schemasafe'

    export let params: CommonComponentParameters
    export let schema: JSONSchema & { items: JSONSchema }
    export let value: Json[] = []

    let collapserOpenState: 'open' | 'closed' =
        params.path.length === 0 || !params.collapsible ? 'open' : 'closed'

    const toggle = () => {
        collapserOpenState = collapserOpenState === 'open' ? 'closed' : 'open'
    }

    $: legendText = schemaLabel(schema, params.path)
    $: showWrapper = value.length > 0 || schema.emptyDisplay !== false
    $: emptyText =
        value.length === 0 && typeof schema.emptyDisplay === 'string' && schema.emptyDisplay
    $: readOnly = (params.containerReadOnly || schema.readOnly) ?? false
    $: controls = (
        schema.controls === undefined
            ? readOnly
                ? []
                : ['add', 'reorder', 'delete', 'duplicate']
            : schema.controls
    ) satisfies Control[]
</script>

{#if showWrapper}
    <fieldset name={params.path.join('.')} class="subset array depth-{params.path.length}">
        {#if params.collapsible || legendText}
            <legend class="subset-label array-label">
                {#if params.collapsible}
                    <!-- TODO
                    svelte-ignore a11y-click-events-have-key-events -->
                    <span class="collapser {collapserOpenState}" on:click={toggle} />
                {/if}

                <span class="subset-label-title object-label-title">
                    <!-- eslint-disable-next-line svelte/no-at-html-tags -- this has been independently verified for safety 🚀 -->
                    {@html stringToHtml(legendText)}</span
                >
                {#if schema.description}
                    <span class="subset-label-description object-label-description">
                        <!-- eslint-disable-next-line svelte/no-at-html-tags -- this has been independently verified for safety 🚀 -->
                        {@html stringToHtml(schema.description)}</span
                    >
                {/if}
            </legend>
        {/if}

        {#if collapserOpenState === 'open'}
            {#if !emptyText}
                {#each value as item, idx (idx)}
                    <svelte:component
                        this={SubSchemaForm}
                        params={{
                            ...params,
                            path: [...params.path, idx.toString()],
                            containerParent: 'array',
                            containerReadOnly:
                                (params.containerReadOnly || schema.readOnly) ?? false,
                        }}
                        value={item}
                        bind:schema={schema.items}
                    />
                    <div class="list-controls">
                        {#if controls.includes('delete')}
                            <button
                                class="list-control delete"
                                title="delete"
                                type="button"
                                on:click={arrayDelete(idx, params, value)}
                            />
                        {/if}
                        {#if controls.includes('duplicate')}
                            <button
                                class="list-control duplicate"
                                title="duplicate"
                                type="button"
                                on:click={arrayDuplicate(idx, params, value)}
                            />
                        {/if}
                        {#if controls.includes('reorder') && idx > 0}
                            <button
                                class="list-control up"
                                title="move up"
                                type="button"
                                on:click={arrayUp(idx, params, value)}
                            />
                        {/if}
                        {#if controls.includes('reorder') && idx < value.length - 1}
                            <button
                                class="list-control down"
                                title="move down"
                                type="button"
                                on:click={arrayDown(idx, params, value)}
                            />
                        {/if}
                    </div>
                {/each}
            {:else}
                <div class="emptyText">{emptyText}</div>
            {/if}
            {#if controls.includes('add')}
                <button
                    class="list-control add"
                    title="add item"
                    type="button"
                    on:click={arrayAdd(schema, params, value)}
                />
            {/if}
        {/if}
    </fieldset>
{/if}
