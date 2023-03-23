<script lang="ts" strictEvents>
    import type { CommonComponentParameters } from '../types/CommonComponentParameters'
    import type { JSONSchema } from '../types/schema'

    export let params: CommonComponentParameters
    export let schema: JSONSchema
    export let value: number | undefined

    const type = 'text'
    const context = params.componentContext
    const currencySymbol = (context && (context['currencySymbol'] as string)) || '$'
    let formatCurrency: (value?: number) => string
    if (context && context['formatCurrency']) {
        formatCurrency = context['formatCurrency'] as (value?: number) => string
    } else {
        formatCurrency = (amount?: number) => {
            if (!amount && amount !== 0) return ''
            return amount === Math.round(amount)
                ? `${currencySymbol}${amount}`
                : `${currencySymbol}${amount.toFixed(2)}`
        }
    }
    let holdString = ''

    const onInput = (ev: Event & { currentTarget: EventTarget & HTMLInputElement }) => {
        const str = ev.currentTarget.value
        if (str === '' || str === currencySymbol) {
            holdString = ''
            params.pathChanged(params.path, null)
        } else {
            const numStr = str.replace(currencySymbol, '')
            const num = parseFloat(numStr)
            const fmt = formatCurrency(num)
            const fmtNoSymbol = fmt.replace(currencySymbol, '')
            holdString = fmt === str || fmtNoSymbol === str ? '' : str
            if (!isNaN(num)) {
                params.pathChanged(params.path, num)
            }
        }
    }

    $: formattedString = holdString ? holdString : formatCurrency(value)
</script>

<!-- event which calls pathChanged should be after all bindings so 'value' will have been updated -->
<svelte:component this={params.components['fieldWrapper']} {params} {schema}>
    <input
        id={params.path.join('.')}
        name={params.path.join('.')}
        class="currency"
        disabled={schema.readOnly ?? params.containerReadOnly}
        {type}
        value={formattedString}
        on:input={onInput}
    />
</svelte:component>
