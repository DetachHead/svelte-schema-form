<script lang="ts">
    import SubSchemaForm from '../SubSchemaForm.svelte'
    import { arrayAdd, arrayDelete, arrayDown, arrayDuplicate, arrayUp } from '../arrayOps'
    import type { CommonComponentParameters } from '../types/CommonComponentParameters'
    import { emptyValue, schemaLabel } from '../types/schema'
    import { stringToHtml } from '../utilities.js'
    import { values } from 'lodash-es'
    import { tick } from 'svelte'
    import { throwIfUndefined } from 'throw-expression'

    export let params: CommonComponentParameters
    export let schema: any
    export let value: any[]

    interface SortSpec {
        field: string
        direction: 'asc' | 'desc'
    }

    $: value = value || []
    $: itemSchema = schema.items || {}
    $: listProps = ((Array.isArray(itemSchema.headings) &&
        typeof itemSchema.headings[0] === 'string' &&
        itemSchema.headings) ||
        Object.keys(itemSchema.properties)) as string[]
    $: listFields = listProps.map((prop) =>
        schemaLabel(itemSchema.properties[prop] as object, [...params.path, '0', prop]),
    )
    $: sort = itemSchema.defaultSort || (null as SortSpec | null)

    let collapserOpenState: 'open' | 'closed' =
        params.path.length === 0 || !params.collapsible ? 'open' : 'closed'
    let selectedIdx = -1
    let mode: 'list' | 'detail' = 'list'
    let rowView: any[] = []
    let toListButton: HTMLButtonElement | null
    let ignoreKeyUp = false
    let selectedValue: any = null

    // check schema
    if (schema.type !== 'array' || schema.items.type !== 'object') {
        throw new Error('ListDetail editor can only be used on an array with items of type=object')
    }

    const toggle = () => {
        collapserOpenState = collapserOpenState === 'open' ? 'closed' : 'open'
    }

    const onSelect = (idx: number) => async () => {
        mode = 'detail'
        selectedIdx = value.findIndex((v) => v === rowView[idx])
        selectedValue = value[selectedIdx]
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
            const targ = ev.target as HTMLDivElement
            console.log(`key ${ev.key} selectedIdx ${selectedIdx} len ${value.length}`)
            if (ev.key === 'ArrowDown' && selectedIdx + 1 < value.length) {
                selectedIdx += 1
                await tick()
            } else if (ev.key === 'ArrowUp' && selectedIdx > 0) {
                selectedIdx -= 1
            } else if (ev.key === 'Enter') {
                onSelect(selectedIdx)()
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

    const sortFunc = (sort: SortSpec) => (a: any, b: any) => {
        if (a[sort.field] < b[sort.field]) return sort.direction === 'asc' ? -1 : 1
        if (a[sort.field] > b[sort.field]) return sort.direction === 'desc' ? -1 : 1
        return 0
    }

    const headingClass = (idx: number, sort: SortSpec | null) => {
        const sortClass = listProps[idx] !== sort?.field ? '' : sort?.direction
        return 'heading ' + sortClass
    }

    $: legendText = schemaLabel(schema, params.path)
    $: showWrapper = (value && value.length > 0) || schema.emptyDisplay !== false
    $: emptyText =
        (!value || value.length === 0) &&
        typeof schema.emptyDisplay === 'string' &&
        schema.emptyDisplay
    $: readOnly = params.containerReadOnly || schema.readOnly || false
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
                <span class="subset-label-title object-label-title"
                    >{@html stringToHtml(legendText)}</span
                >
                {#if schema.description}
                    <span class="subset-label-description object-label-description"
                        >{@html stringToHtml(schema.description)}</span
                    >
                {/if}
            </legend>
        {/if}

        {#if collapserOpenState === 'open'}
            {#if !emptyText}
                <!-- TODO: a11y stuff -->
                <!-- eslint-disable-next-line svelte/no-unused-svelte-ignore -- https://github.com/ota-meshi/eslint-plugin-svelte/issues/386 -->
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
                                on:keyup|stopPropagation={onSortKey(throwIfUndefined(listProps[idx]))}
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
                                        {item[propName] === undefined ? '\u00A0' : item[propName]}
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
                                        {#if controls.includes('reorder') && sort === null && idx < (value || []).length - 1}
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
                                        params.containerReadOnly || schema.readOnly || false,
                                }}
                                value={selectedValue}
                                bind:schema={schema.items}
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
