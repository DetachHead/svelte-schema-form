<script lang="ts" strictEvents>
    import type { JSONSchema } from '$lib/types/schema'
    import type { CommonComponentParameters } from '../types/CommonComponentParameters'
    import type { Json } from '@exodus/schemasafe'
    import { tick } from 'svelte/internal'

    interface OptionVal {
        id: string
        text: string
        image: string
    }

    export let params: CommonComponentParameters
    export let schema: JSONSchema & {
        type: 'string'
        editor: 'autocomplete'
        url?: string
    }
    export let value: Json

    let inputState: 'showing-value' | 'searching' = 'showing-value'
    let match = ''
    let dropdownState: 'open' | 'closed' = 'closed'
    let selected: OptionVal | undefined = undefined
    let options = [] as OptionVal[]
    let url: string
    let timerHandle: number | null = null

    $: url = schema['url'] ?? ''
    $: readOnly = (params.containerReadOnly || schema.readOnly) ?? false

    let input: HTMLInputElement

    const searchRequest = (match_: string) => {
        if (url) {
            if (timerHandle) {
                clearTimeout(timerHandle)
            }
            const urlWithMatch = new URL(url, location.href)
            if (match_) urlWithMatch.searchParams.append('match', match_)
            // @ts-expect-error https://github.com/sveltejs/kit/issues/9348
            timerHandle = setTimeout(
                () =>
                    void fetch(urlWithMatch.toString(), { credentials: 'include' })
                        .then((resp) => resp.json())
                        .then((items: string[] | OptionVal[]) => {
                            if (items.length > 0 && !(typeof items[0] === 'object')) {
                                options = (items as string[]).map((s) => ({
                                    id: s,
                                    text: s,
                                    image: '',
                                }))
                            } else {
                                options = items as OptionVal[]
                            }
                            dropdownState = 'open'
                        }),
                100,
            )
        }
    }

    const toggleDropDown = async () => {
        dropdownState = dropdownState === 'open' ? 'closed' : 'open'
        if (dropdownState === 'open') {
            inputState = 'searching'
            await tick()
            input.focus()
        }
    }

    const handleSelect = (item: OptionVal) => () => {
        if (readOnly) return
        value = item.id
        params.pathChanged(params.path, item.id)
        inputState = 'showing-value'
        dropdownState = 'closed'
    }

    const keyup = (ev: KeyboardEvent) => {
        searchRequest((ev.currentTarget as HTMLInputElement).value)
    }

    $: selected = options.find((opt) => opt.id === value)
    $: inputState = selected ? inputState : 'searching'
</script>

<!-- event which calls pathChanged should be after all bindings so 'value' will have been updated -->
<svelte:component this={params.components['fieldWrapper']} {params} {schema}>
    <div class="sf-autocomplete" class:readonly={readOnly}>
        <!-- TODO
        svelte-ignore a11y-click-events-have-key-events -->
        <div class="sf-selected-item input" on:click={toggleDropDown}>
            {#if inputState === 'searching'}
                <input bind:this={input} type="text" bind:value={match} on:keyup={keyup} />
            {:else}
                {#if selected?.image}
                    <img alt={selected.text} src={selected.image} />
                {/if}
                {selected?.text ?? ''}
            {/if}
        </div>

        <div style:display={dropdownState === 'open' ? 'block' : 'none'} class="sf-items">
            {#each options as item (item.id)}
                <!-- TODO
                svelte-ignore a11y-click-events-have-key-events -->
                <div class:selected={value === item.text} on:click={handleSelect(item)}>
                    {#if item.image}
                        <img alt={item.text} src={item.image} />
                    {/if}
                    {item.text}
                </div>
            {/each}
        </div>
    </div>
</svelte:component>
