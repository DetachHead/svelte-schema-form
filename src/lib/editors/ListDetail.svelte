<script lang="ts">
    import SubSchemaForm from '../SubSchemaForm.svelte'
    import { arrayAdd, arrayDelete, arrayDown, arrayDuplicate, arrayUp } from '../arrayOps'
    import type { CommonComponentParameters } from '../types/CommonComponentParameters'
    import { type JSONSchema, schemaLabel } from '../types/schema'
    import { stringToHtml } from '../utilities.js'
    import type { Json } from '@exodus/schemasafe'
    import { tick } from 'svelte'
    import { throwIfUndefined } from 'throw-expression'

    /**
     * Setting `editor="list-detail"` on a `type="array"` subschema whose items are `type="object"` shows the
     * list of objects in a listing grid which when a row is selected, switches to the normal editor for the
     * object selected. It also provides heading-click view ordering (without mutating the order of the underlying
     * data list). It responds to the `emptyDisplay` and controls custom properties defined for an array.
     */
    type ListDetailJSONSchema = JSONSchema & {
        type: 'array'
        items?: JSONSchema & {
            /** an array of property names which are included as columns in the list. Defaults to all columns. */
            headings?: string[]

            /**
             * an object with properties `field` which specifies the default heading field to sort on, and `direction`
             * which can be `"asc"` or `"desc"` to specify the direction of the default sort.
             */
            defaultSort?: {
                field: string
                direction: 'asc' | 'desc'
            }
        }
    }

    export let params: CommonComponentParameters
    export let schema: ListDetailJSONSchema
    export let value: Json[]

    interface SortSpec {
        field: string
        direction: 'asc' | 'desc'
    }

    $: itemSchema = schema.items ?? {}
    $: listProps = itemSchema.headings ?? Object.keys(throwIfUndefined(itemSchema.properties))
    $: listFields = listProps.map((prop) =>
        schemaLabel(throwIfUndefined(itemSchema.properties)[prop] as object, [
            ...params.path,
            '0',
            prop,
        ]),
    )
    $: sort = itemSchema.defaultSort ?? (null as SortSpec | null)

    let collapserOpenState: 'open' | 'closed' =
        params.path.length === 0 || !params.collapsible ? 'open' : 'closed'
    let selectedIdx = -1
    let mode: 'list' | 'detail' = 'list'
    let rowView: Json[] = []
    let toListButton: HTMLButtonElement | null
    let ignoreKeyUp = false
    let selectedValue: Json = null

    // check schema
    if (schema.type !== 'array' || schema.items?.type !== 'object') {
        throw new Error('ListDetail editor can only be used on an array with items of type=object')
    }

    const toggle = () => {
        collapserOpenState = collapserOpenState === 'open' ? 'closed' : 'open'
    }

    const onSelect = (idx: number) => async () => {
        mode = 'detail'
        selectedIdx = value.findIndex((v) => v === rowView[idx])
        selectedValue = throwIfUndefined(value[selectedIdx])
        await tick()
        toListButton?.focus()
    }

    const onSort = (fieldName: string) => () => {
        if (sort?.field === fieldName && sort.direction === 'desc') {
            sort = null
        } else {
            sort = {
                field: fieldName,
                direction: sort?.field === fieldName ? 'desc' : 'asc',
            }
        }
    }
    const onSortKey = (fieldName: string) => (ev: KeyboardEvent) => {
        if (ev.key === 'Enter') {
            if (sort?.field === fieldName && sort.direction === 'desc') {
                sort = null
            } else {
                sort = {
                    field: fieldName,
                    direction: sort?.field === fieldName ? 'desc' : 'asc',
                }
            }
        }
    }

    const onKey = async (ev: KeyboardEvent) => {
        if (mode === 'list' && !ignoreKeyUp) {
            console.log(`key ${ev.key} selectedIdx ${selectedIdx} len ${value.length}`)
            if (ev.key === 'ArrowDown' && selectedIdx + 1 < value.length) {
                selectedIdx += 1
                await tick()
            } else if (ev.key === 'ArrowUp' && selectedIdx > 0) {
                selectedIdx -= 1
            } else if (ev.key === 'Enter') {
                void onSelect(selectedIdx)()
            }
        }
        ignoreKeyUp = false
    }

    const onClick = (ev: MouseEvent) => {
        if (mode === 'list') {
            ;(ev.currentTarget as HTMLElement).focus()
        }
    }

    const onModeList = async () => {
        mode = 'list'
        ignoreKeyUp = true
        await tick()
        selectedIdx = rowView.findIndex((v) => v === selectedValue)
    }

    const sortFunc = (sortSpec: SortSpec) => (a: Json, b: Json) => {
        // @ts-expect-error TODO
        if (a[sortSpec.field] < b[sortSpec.field]) {
            return sortSpec.direction === 'asc' ? -1 : 1
        }
        // @ts-expect-error TODO
        if (a[sortSpec.field] > b[sortSpec.field]) {
            return sortSpec.direction === 'desc' ? -1 : 1
        }
        return 0
    }

    const headingClass = (idx: number, sortSpec: SortSpec | null) => {
        const sortClass = listProps[idx] !== sortSpec?.field ? '' : sortSpec?.direction
        return 'heading ' + (sortClass ?? '')
    }

    $: legendText = schemaLabel(schema, params.path)
    $: showWrapper = value.length > 0 || schema.emptyDisplay !== false
    $: emptyText =
        value.length === 0 && typeof schema.emptyDisplay === 'string' && schema.emptyDisplay
    $: readOnly = (params.containerReadOnly || schema.readOnly) ?? false
    $: controls =
        schema.controls === undefined
            ? readOnly
                ? ''
                : 'add, reorder, delete, duplicate'
            : schema.controls
    $: gridTemplateColumns = mode === 'list' ? `repeat(${listFields.length}, auto) 50px` : null
    $: {
        rowView = [...value]
        if (sort) {
            rowView.sort(sortFunc(sort))
        }
    }
</script>

{#if showWrapper}
    <fieldset
        name={params.path.join('.')}
        class="subset array list-detail depth-{params.path.length}"
    >
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
                <!-- TODO: a11y stuff -->
                <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
                <div
                    class="table-container"
                    tabindex="0"
                    style:grid-template-columns={gridTemplateColumns}
                    on:keyup={onKey}
                    on:click={onClick}
                >
                    {#if mode === 'list'}
                        {#each listFields as fieldName, idx}
                            <div
                                class={headingClass(idx, sort)}
                                on:click|stopPropagation={onSort(throwIfUndefined(listProps[idx]))}
                                on:keyup|stopPropagation={onSortKey(
                                    throwIfUndefined(listProps[idx]),
                                )}
                                tabIndex="0"
                            >
                                {fieldName}
                            </div>
                        {/each}
                        {#if !readOnly}
                            <div class="buttons-header">&nbsp;</div>
                        {/if}
                        {#each rowView as item, idx (idx)}
                            <!-- TODO
                            svelte-ignore a11y-click-events-have-key-events -->
                            <div
                                class="row-wrapper"
                                class:selected={idx === selectedIdx}
                                on:click={onSelect(idx)}
                            >
                                {#each listProps as propName}
                                    <div class="item">
                                        {typeof item === 'object' &&
                                        item !== null &&
                                        propName in item &&
                                        !Array.isArray(item) &&
                                        item[propName] !== undefined
                                            ? item[propName]
                                            : '\u00A0'}
                                    </div>
                                {/each}
                            </div>
                            {#if !readOnly}
                                <div class="array-buttons">
                                    <div class="row-buttons">
                                        {#if controls.includes('delete')}
                                            <button
                                                type="button"
                                                class="list-control delete"
                                                title="delete"
                                                on:click|stopPropagation={arrayDelete(
                                                    idx,
                                                    params,
                                                    value,
                                                )}
                                                on:keyup|stopPropagation
                                            />
                                        {/if}
                                        {#if controls.includes('duplicate')}
                                            <button
                                                type="button"
                                                class="list-control duplicate"
                                                title="duplicate"
                                                on:click|stopPropagation={arrayDuplicate(
                                                    idx,
                                                    params,
                                                    value,
                                                )}
                                                on:keyup|stopPropagation
                                            />
                                        {/if}
                                        {#if controls.includes('reorder') && sort === null && idx > 0}
                                            <button
                                                type="button"
                                                class="list-control up"
                                                title="move up"
                                                on:click|stopPropagation={arrayUp(
                                                    idx,
                                                    params,
                                                    value,
                                                )}
                                                on:keyup|stopPropagation
                                            />
                                        {/if}
                                        {#if controls.includes('reorder') && sort === null && idx < value.length - 1}
                                            <button
                                                type="button"
                                                class="list-control down"
                                                title="move down"
                                                on:click|stopPropagation={arrayDown(
                                                    idx,
                                                    params,
                                                    value,
                                                )}
                                                on:keyup|stopPropagation
                                            />
                                        {/if}
                                    </div>
                                </div>
                            {/if}
                        {/each}
                    {:else}
                        <button
                            class="to-list"
                            type="button"
                            on:click={onModeList}
                            bind:this={toListButton}>List</button
                        >
                        <div class="element">
                            <SubSchemaForm
                                params={{
                                    ...params,
                                    path: [...params.path, selectedIdx.toString()],
                                    containerParent: 'array',
                                    containerReadOnly:
                                        (params.containerReadOnly || schema.readOnly) ?? false,
                                }}
                                value={selectedValue}
                                bind:schema={itemSchema}
                            />
                        </div>
                    {/if}
                </div>
            {:else}
                <div class="emptyText">{emptyText}</div>
            {/if}
            {#if controls.includes('add')}
                <button
                    type="button"
                    class="list-control add"
                    title="add item"
                    on:click={arrayAdd(schema, params, value)}
                />
            {/if}
        {/if}
    </fieldset>
{/if}
