import type { Json } from '@exodus/schemasafe'
import type { SvelteComponentTyped } from 'svelte'

export type ValidationErrors = Record<string, string>

export const FileNone = Symbol()
export const ProgressContext = Symbol()

export type Components = Record<string, new (...args: unknown[]) => SvelteComponentTyped>

export type PathChangedValue = Json | typeof FileNone | undefined | FileList

export interface CommonComponentParameters {
    path: string[]
    pathChanged: (path: string[], val: PathChangedValue, op?: string) => boolean | PathChangedValue
    components: Components
    componentContext?: Record<string, unknown>
    value: Json
    validationErrors: ValidationErrors
    required?: boolean
    containerParent: 'none' | 'array' | 'object'
    containerReadOnly: boolean
    showErrors: boolean
    collapsible: boolean
    idx: number
}

export interface SchemaFormEvent {
    path: string[]
    value: Json
    errors: ValidationErrors
    pathValue?: unknown | undefined
    op?: string | undefined
}

export const childComponentParameters = (params: CommonComponentParameters, propName: string) => {
    return {
        ...params,
        path: [...params.path, propName],
    }
}

/*
export const valuePath = (value: any, path: string[]) => {
	if (path.length === 0) {
		return value;
	} else {
		return valuePath(value[path[0]], path.slice(1));
	}
}

export const schemaPath = (schema: any, path: string[]) => {
	if (path.length === 0 && schema.type === "array") {
		return schema.items;
	} else if (path.length === 0) {
		return schema;
	} else if (schema.type === "array") {
		return schemaPath(schema.items, path);
	} else if (schema.type === "object") {
		return schemaPath(schema.properties[path[0]], path.slice(1));
	} else {
		throw new Error('path not present in schema');
	}
}
*/
