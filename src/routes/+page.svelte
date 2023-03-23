<script lang="ts" strictEvents>
    import SubmitForm, { type SubmitFormEvent } from '$lib/SubmitForm.svelte'
    import type { JSONSchema } from '$lib/types/schema'
    import 'svelte-schema-form/css/basic-skin.scss'
    import 'svelte-schema-form/css/layout.scss'

    let schema: JSONSchema = {
        type: 'object',
        properties: {
            something: { type: 'string', maxLength: 5, description: 'description for something' },
            amount: { type: 'number' },
            choose: { type: 'string', enum: ['a', 'b', 'c'] },
            checkThis: { type: 'boolean' },
            things: {
                type: 'array',
                items: {
                    type: 'string',
                },
            },
            complicatedThings: {
                type: 'array',
                editor: 'blocks',
                effectiveUrl: '/abc',
                items: {
                    type: 'object',
                    properties: {
                        name: { type: 'string' },
                        thumbnail: { type: 'string', editor: 'upload' },
                    },
                },
            },
            obj: {
                type: 'object',
                properties: {
                    xyz: {
                        type: 'string',
                    },
                },
            },
            aFile: {
                type: 'string',
                editor: 'upload',
            },
        },
        required: ['amount'],
        pathPattern: 'item_${amount}',
    }
    let storedSchema: string | null = null
    if (typeof window !== 'undefined') {
        storedSchema = window.localStorage.getItem('schema')
        if (storedSchema) schema = JSON.parse(storedSchema) as JSONSchema
    }
    let jsonInvalid = false

    const value = {}
    let valueJson = ''
    let collapsible = false

    const schemaUpdate = (
        ev: KeyboardEvent & {
            currentTarget: EventTarget & HTMLTextAreaElement
        },
    ) => {
        const newSchema = ev.currentTarget.value
        try {
            schema = JSON.parse(newSchema) as JSONSchema
            jsonInvalid = false
            if (typeof window !== 'undefined') {
                window.localStorage.setItem('schema', newSchema)
            }
        } catch {
            jsonInvalid = true
        }
    }

    const submit = (e: CustomEvent<SubmitFormEvent>) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- https://github.com/ota-meshi/eslint-plugin-svelte/issues/390#issuecomment-1455456830
        valueJson = JSON.stringify(e.detail.value, undefined, 2).trim()
    }

    const componentContext = { currencySymbol: '£' }
</script>

<div class="container">
    <div class="schema" class:jsonInvalid>
        <div class="control">
            <input id="collapsible" type="checkbox" bind:checked={collapsible} />
            <label for="collapsible">Collapsible</label>
        </div>
        <textarea id="schema" on:keyup={schemaUpdate}
            >{JSON.stringify(schema, undefined, 2)}</textarea
        >
    </div>
    <div class="form">
        <SubmitForm
            {collapsible}
            {componentContext}
            {schema}
            uploadBaseUrl="https://restspace.local:3131/files"
            {value}
            on:submit={submit}
        />
    </div>
    <div class="output">
        <pre>
			{valueJson}
		</pre>
    </div>
</div>

<style>
    * {
        box-sizing: border-box;
    }

    .container {
        display: flex;
        position: relative;
    }
    .schema,
    .form,
    .output {
        width: 32%;
        border: solid 1px black;
        height: 99vh;
        position: relative;
    }
    .schema {
        border: none;
        display: flex;
        flex-direction: column;
    }
    .form,
    .output {
        margin-left: 1%;
        padding: 1em;
    }
    #schema {
        width: 100%;
        height: 100%;
        gap: 1em;
    }
    .schema.jsonInvalid #schema {
        color: darkred;
    }

    #collapsible {
        margin-bottom: 6px;
    }

    .control {
        margin-bottom: 6px;
    }
</style>
