<svelte:options accessors />

<script lang="ts" context="module">
    export interface SubmitFormEvent {
        value: SchemaFormEvent
        submit: { value: Json }
    }
</script>

<script lang="ts">
    import SchemaForm from './SchemaForm.svelte'
    import {
        type Components,
        ProgressContext,
        type SchemaFormEvent,
        type ValidationErrors,
    } from './types/CommonComponentParameters'
    import type { JSONSchema } from './types/schema'
    import { substituteProperties } from './utilities.js'
    import type { Json } from '@exodus/schemasafe'
    import set from 'lodash-es/set'
    import { createEventDispatcher, setContext } from 'svelte'
    import { writable } from 'svelte/store'

    export let schema: JSONSchema
    export let value: Json
    export let uploadFiles: Record<string, FileList> = {}
    export let uploadBaseUrl: string = ''
    export let uploadNamePattern: string = ''
    export let dirty: boolean = false
    export let action: string = ''
    export let components: Components = {}
    export let collapsible: boolean = false
    export let submitText = 'Submit'
    export let submitRequiresDirty = true
    export let componentContext = {} as Record<string, unknown>

    const dispatch = createEventDispatcher<SubmitFormEvent>()
    const pathProgress = writable({} as Record<string, Record<string, number>>)
    setContext(ProgressContext, pathProgress)

    let currentErrors = {} as ValidationErrors
    let showErrors = false

    const change = (e: CustomEvent<SchemaFormEvent>) => {
        currentErrors = e.detail.errors
        dispatch('value', e.detail)
        value = e.detail.value
    }

    const progress = (path: string, name: string, percent: number) => {
        let newVal: Record<string, number>
        if (percent === -1) {
            delete ($pathProgress[path] ?? {})[name]
            newVal = { ...$pathProgress[path] }
        } else {
            newVal = { ...($pathProgress[path] ?? {}), [name]: percent }
        }
        $pathProgress = { ...$pathProgress, [path]: newVal }
    }

    const doUploads = async (pathPrefix: string = '') => {
        if (Object.keys(uploadFiles).length > 0 && uploadBaseUrl) {
            const itemNamePattern = uploadNamePattern || schema.pathPattern
            if (!itemNamePattern) {
                alert(
                    'No uploadNamePattern given or pathPattern property on schema to determine file save url base',
                )
                return
            }
            const itemName = substituteProperties(itemNamePattern, value)

            const uploadPromises = Object.entries(uploadFiles)
                .filter(([path]) => path.startsWith(pathPrefix))
                .flatMap(([path, files]) => {
                    const pathPromises = [] as Promise<void>[]
                    for (const file of files) {
                        const destinationUrl =
                            uploadBaseUrl +
                            (uploadBaseUrl.endsWith('/') ? '' : '/') +
                            itemName +
                            '/' +
                            path +
                            '/' +
                            file.name
                        console.log(`Uploading to ${destinationUrl}`)

                        const itemPromise = new Promise<[string, string]>((resolve, reject) => {
                            try {
                                const xhr = new XMLHttpRequest()
                                xhr.upload.onprogress = (ev: ProgressEvent) =>
                                    progress(path, file.name, (ev.loaded / ev.total) * 100.0)
                                xhr.upload.onloadend = () => {
                                    progress(
                                        path,
                                        file.name,
                                        xhr.status === 200 || xhr.status === 0 ? -1 : -xhr.status,
                                    )
                                    resolve([path, destinationUrl])
                                }
                                xhr.withCredentials = true
                                xhr.open('PUT', destinationUrl)
                                xhr.send(file)
                            } catch (err) {
                                reject(err)
                            }
                        }).then(([path_, destinationUrl_]) => {
                            // update the state to remove the upload file
                            if (path_ === '') {
                                value = destinationUrl_
                            } else {
                                // TODO: handling for if value isn't an object
                                set(value as object, path_.split('.'), destinationUrl_)
                            }
                            // eslint-disable-next-line no-self-assign -- temp solution, inefficient
                            value = value
                            delete uploadFiles[path_]
                        })
                        pathPromises.push(itemPromise)
                    }
                    return pathPromises
                })

            await Promise.all(uploadPromises)
        }
    }

    const submit = async () => {
        if ((dirty || !submitRequiresDirty) && Object.keys(currentErrors).length === 0) {
            await doUploads()
            dispatch('submit', { value })
            dirty = false
        }
        showErrors = true
    }

    componentContext['doUploads'] = doUploads
</script>

<form class="svelte-schema-form" {action} class:dirty>
    <SchemaForm
        bind:schema
        {value}
        on:value={change}
        bind:dirty
        bind:uploadFiles
        {showErrors}
        {components}
        {collapsible}
        {componentContext}
    />
    <div class="button-container">
        <button
            type={action ? 'submit' : 'button'}
            class="submit-button"
            on:click={submit}
            class:dirty>{submitText}</button
        >
    </div>
</form>
