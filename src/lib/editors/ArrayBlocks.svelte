<script lang="ts" strictEvents>
    import SubSchemaForm from '../SubSchemaForm.svelte'
    import type { CommonComponentParameters } from '../types/CommonComponentParameters'
    import { type JSONSchema, emptyValue } from '../types/schema'
    import { pathCombine } from '../utilities.js'
    import type { Json } from '@exodus/schemasafe'
    import _, { last } from 'lodash-es'
    import { throwIfNull, throwIfUndefined } from 'throw-expression'

    export let params: CommonComponentParameters
    export let schema: JSONSchema & { items: JSONSchema }
    export let value:
        | {
              [id: string]: Json
          }[]
        | undefined

    $: actualValue = value ?? []

    // check schema
    if (schema.type !== 'array' || schema.items.type !== 'object') {
        throw new Error('ArrayBlocks editor can only be used on an array with items of type=object')
    }

    let adding = false
    let hovering: number | boolean = false

    const onAdd = () => {
        params.pathChanged(params.path, [...actualValue, emptyValue(schema.items)])
        adding = true
    }

    const onAddUpdate = async () => {
        const idx = actualValue.length - 1
        const newPath = [...params.path, idx.toString()]
        // upload any files on the add form
        const doUploads = params.componentContext?.['doUploads'] as
            | ((pathPrefix: string) => Promise<void>)
            | undefined
        if (doUploads) {
            await doUploads(newPath.join('.'))
        }

        params.pathChanged(newPath, actualValue[idx])
        adding = false
    }

    const onDelete = (idx: number) => () => {
        params.pathChanged(params.path, [
            ...actualValue.slice(0, idx),
            ...actualValue.slice(idx + 1),
        ])
    }

    const onDuplicate = (idx: number) => () => {
        params.pathChanged(params.path, [
            ...actualValue.slice(0, idx),
            actualValue[idx],
            JSON.parse(JSON.stringify(actualValue[idx])),
            ...actualValue.slice(idx + 1),
        ])
    }

    const onDragstart = (i: number) => (ev: DragEvent) => {
        const dataTransfer = throwIfNull(ev.dataTransfer)
        dataTransfer.effectAllowed = 'move'
        dataTransfer.dropEffect = 'move'
        dataTransfer.setData('text/plain', i.toString())
    }

    const onDrop = (i: number) => (ev: DragEvent) => {
        const dataTransfer = throwIfNull(ev.dataTransfer)
        dataTransfer.dropEffect = 'move'
        const start = parseInt(dataTransfer.getData('text/plain'))

        const startValue = throwIfUndefined(
            actualValue[start],
            `ArrayBlocks - onDrop failed to get startValue. start=${start}`,
        )
        if (start < i) {
            params.pathChanged(params.path, [
                ...actualValue.slice(0, start),
                ...actualValue.slice(start + 1, i),
                startValue,
                ...actualValue.slice(i),
            ])
        } else if (i < start) {
            params.pathChanged(params.path, [
                ...actualValue.slice(0, i),
                startValue,
                ...actualValue.slice(i, start),
                ...actualValue.slice(start + 1),
            ])
        }

        hovering = false
    }

    let currentUrl = schema.effectiveUrl ?? location.href
    currentUrl = throwIfUndefined(currentUrl.split('#')[0], 'ArrayBlocks - split fail moment (#)')
    currentUrl = throwIfUndefined(currentUrl.split('?')[0], 'ArrayBlocks - split fail moment (?)')

    // TODO: figure out if _idx is needed, its unused but could effect when the function gets rerun
    const getUrl = (item: Json, _idx: number) => {
        let pathEl = ''
        if (schema.itemPathPattern) {
            const itemPathPattern = schema.itemPathPattern
            pathEl = itemPathPattern.replace(/\$\{([^}]*)\}/giu, (_substring, p1: string) =>
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- TODO: figure out what this does
                encodeURIComponent((p1 === '' ? item : _.get(item, p1.split('.'))) || ''),
            )
        }
        if (!pathEl) {
            item = throwIfNull(item) as Record<string, Json>
            pathEl = encodeURIComponent(getName(item))
        }
        return pathCombine(currentUrl, pathEl)
    }

    const getName = (item: Record<string, Json>) =>
        ((item['name'] ?? item['title']) as string) || ''
    const getArrayBlockClasses = (item: Json) => {
        const name = getName(item as Record<string, Json>)
        const nameParts = name.split(' ')
        const maxWidth = nameParts.reduce(
            (currMax, word) => (word.length > currMax ? word.length : currMax),
            0,
        )
        const maxHeight = nameParts.length
        if (maxWidth > 18 || maxHeight > 13) {
            return 'array-block xlarge'
        }
        if (maxWidth > 14 || maxHeight > 9) {
            return 'array-block large'
        }
        if (maxWidth > 10 || maxHeight > 6) {
            return 'array-block medium'
        }
        return 'array-block small'
    }

    let addItemSchema: JSONSchema
    $: {
        const nonArrayProperties = Object.fromEntries(
            Object.entries(
                throwIfUndefined(
                    schema.items.properties,
                    'ArrayBlocks - no properties in schema.items',
                ),
            ).filter(([_propName, subschema]) => (subschema as { type: string }).type !== 'array'),
        )
        addItemSchema = {
            ...(schema.items as JSONSchema),
            type: 'object',
            properties: nonArrayProperties,
            required:
                (schema.items.required as string[] | undefined)?.filter((prop) =>
                    Object.keys(nonArrayProperties).includes(prop),
                ) ?? [],
        } satisfies JSONSchema
    }
    $: lastIdx = actualValue.length
</script>

<div id={params.path.join('.')} class="subset array-blocks depth-{params.path.length}">
    <ol>
        {#each actualValue as item, idx (item)}
            <li
                style:background-image={throwIfNull(item)['thumbnail']
                    ? `url('${String(item['thumbnail'])}')`
                    : ''}
                class={getArrayBlockClasses(item)}
                class:drag-over={hovering === idx}
                draggable={true}
                on:dragstart={onDragstart(idx)}
                on:drop|preventDefault={onDrop(idx)}
                on:dragover|preventDefault={() => false}
                on:dragenter|preventDefault={() => (hovering = idx)}
                on:dragleave={() => (hovering = false)}
            >
                <a href={getUrl(item, idx)}>
                    <h2>
                        {getName(item)}
                    </h2>
                </a>
                <div class="actions">
                    <!-- TODO
                    svelte-ignore a11y-click-events-have-key-events -->
                    <span class="duplicate" title="Duplicate this" on:click={onDuplicate(idx)} />
                    <!-- TODO
                    svelte-ignore a11y-click-events-have-key-events -->
                    <span class="delete" title="Delete this" on:click={onDelete(idx)} />
                </div>
            </li>
        {/each}

        {#if !adding}
            <!-- TODO
            svelte-ignore a11y-click-events-have-key-events -->
            <li
                class="array-block add"
                class:drag-over={hovering === lastIdx}
                on:click={onAdd}
                on:drop|preventDefault={onDrop(lastIdx)}
                on:dragover|preventDefault={() => false}
                on:dragenter|preventDefault={() => (hovering = lastIdx)}
                on:dragleave={() => (hovering = false)}
            />
        {/if}
    </ol>
    {#if adding}
        <SubSchemaForm
            params={{
                ...params,
                path: [...params.path, (actualValue.length - 1).toString()],
                containerParent: 'array',
            }}
            value={throwIfUndefined(last(actualValue), 'ArrayBlocks - actuanValue was empty')}
            bind:schema={addItemSchema}
        />
        <button class="submit-button new-item-submit" type="button" on:click={onAddUpdate}
            >Add</button
        >
    {/if}
</div>
