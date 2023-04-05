<svelte:options accessors />

<script lang="ts" strictEvents>
    import SubSchemaForm from './SubSchemaForm.svelte'
    import Array from './editors/Array.svelte'
    import ArrayBlocks from './editors/ArrayBlocks.svelte'
    import Autocomplete from './editors/Autocomplete.svelte'
    import Boolean from './editors/Boolean.svelte'
    import Currency from './editors/Currency.svelte'
    import Enum from './editors/Enum.svelte'
    import FieldWrapper from './editors/FieldWrapper.svelte'
    import Hidden from './editors/Hidden.svelte'
    import ListDetail from './editors/ListDetail.svelte'
    import Number from './editors/Number.svelte'
    import ObjectEditor from './editors/Object.svelte'
    import Radio from './editors/Radio.svelte'
    import String from './editors/String.svelte'
    import TextArea from './editors/TextArea.svelte'
    import Upload from './editors/Upload.svelte'
    import { errorMapper } from './errorMapper'
    import {
        type CommonComponentParameters,
        type Components,
        FileNone,
        type PathChangedValue,
        type SchemaFormEvent,
        type ValidationErrors,
    } from './types/CommonComponentParameters'
    import type { JSONSchema } from './types/schema'
    import { incr, nullOptionalsAllowed } from './utilities.js'
    import { lengthGreaterThan } from '@detachhead/ts-helpers/dist/functions/Array'
    import { subtract } from '@detachhead/ts-helpers/dist/functions/Number'
    import { type Json, validator } from '@exodus/schemasafe'
    import { cloneDeep } from 'lodash-es'
    import get from 'lodash-es/get'
    import set from 'lodash-es/set'
    import { createEventDispatcher, onMount } from 'svelte'

    export let schema: JSONSchema
    export let value: Json
    export let uploadFiles: Record<string, FileList> = {}
    export let dirty: boolean = false
    export let showErrors: boolean = true
    export let collapsible: boolean = false
    export let components: Components = {}
    export let componentContext: Record<string, unknown> = {}

    const dispatch = createEventDispatcher<{
        value: SchemaFormEvent
    }>()

    export let validationErrors = {} as ValidationErrors

    const revalidate = (newValue?: Json) => {
        const validate = validator(nullOptionalsAllowed(schema), {
            includeErrors: true,
            allErrors: true,
            allowUnusedKeywords: true,
        })
        validate(newValue ?? value)
        validationErrors = Object.fromEntries(
            (validate.errors ?? []).map((ve) =>
                errorMapper(ve.keywordLocation, ve.instanceLocation),
            ),
        )
    }

    onMount(() => {
        revalidate()
        if (Object.keys(validationErrors).length > 0) {
            // set initial errors
            dispatch('value', {
                path: [],
                value,
                errors: validationErrors,
            })
        }
    })

    let params: CommonComponentParameters
    $: params = {
        value,
        files: uploadFiles,
        path: [],
        components: Object.assign(
            {
                string: String,
                password: String,
                email: String,
                time: String,
                'date-time': String,
                date: String,
                number: Number,
                integer: Number,
                boolean: Boolean,
                fieldWrapper: FieldWrapper,
                object: ObjectEditor,
                array: Array,
                enum: Enum,
                upload: Upload,
                textarea: TextArea,
                hidden: Hidden,
                blocks: ArrayBlocks,
                autocomplete: Autocomplete,
                'list-detail': ListDetail,
                currency: Currency,
                radio: Radio,
            },
            components,
        ),
        componentContext,
        pathChanged,
        validationErrors,
        containerParent: 'none',
        containerReadOnly: 'readonly' in schema && (schema['readOnly'] ?? false),
        showErrors,
        collapsible,
        idx: incr(),
    }

    const pathChanged = (
        path: string[],
        val: PathChangedValue,
        op?: string,
    ): PathChangedValue | boolean => {
        if (val instanceof FileList) {
            uploadFiles[path.join('.')] = val
            dirty = true
            return val
        } else if (val === FileNone) {
            delete uploadFiles[path.join('.')]
            dirty = true
            return val
        }

        const curr = path.length === 0 ? params.value : (get(params.value, path) as unknown)
        if (val === curr) return

        if (val === undefined && lengthGreaterThan(path, 0)) {
            const pathFront = path.slice(0, -1)
            const parent = pathFront.length
                ? (get(params.value, path.slice(0, -1)) as unknown)
                : params.value
            // @ts-expect-error TODO: figure out what this is doing
            delete parent[path[subtract(path.length, 1)]]
        } else {
            if (path.length === 0) {
                // TODO: i think these conditions can be rewritten so this narrows properly
                params.value = val as Json
            } else {
                params.value = set<Json>(cloneDeep(params.value) as object, path, val)
            }
        }

        revalidate(params.value)

        const succeeded = dispatch(
            'value',
            {
                path,
                pathValue: val,
                value: params.value,
                errors: validationErrors,
                op,
            },
            { cancelable: true },
        )

        console.log(
            `dispatch value path: ${path.join('.')} val: ${JSON.stringify(
                val,
            )}, errors: ${JSON.stringify(validationErrors)}, succeeded: ${succeeded.toString()}`,
        )

        // update if value event not cancelled.
        if (succeeded) {
            value = params.value
            dirty = true
        } else {
            revalidate(value)
        }
        return val
    }
</script>

<SubSchemaForm {params} {value} bind:schema />
