import { camelToTitle } from '../utilities.js'
import type { Json } from '@exodus/schemasafe'
import type { JSONSchema4, JSONSchema6, JSONSchema7 } from 'json-schema'
import { throwIfUndefined } from 'throw-expression'

export type Control = 'delete' | 'duplicate' | 'reorder' | 'add'

export type JSONSchema = (JSONSchema4 | JSONSchema6 | JSONSchema7) & {
    // TODO: what are these props? they arent documented
    pathPattern?: string | undefined
    itemPathPattern?: string | undefined
    effectiveUrl?: string | undefined
    thumbnail?: string | undefined
    direction?: string | undefined
    editor?: string | undefined
    hidden?: boolean | undefined

    /**
     * Custom property which determines how the array displays if it has no items. `false` means don't show a header or wrapper.
     * `true` means show the header and wrapper with no items. A string value means display this message in the wrapper.
     */
    emptyDisplay?: boolean | string

    /**
     * This property if present and set to `true` will disable the editor for this field, only using it for display.
     * All children of this field will also be read only
     */
    readOnly?: boolean | undefined

    /**
     * Custom property which is a comma separated list of controls including `delete,` `duplicate`, `reorder`, `add`.
     * Default is all these. A readOnly array has no controls.
     */
    controls?: Control[] | undefined

    /**
     * Custom property to supply display labels for the Select element as an array of strings, one for each enum value
     */
    enumText?: string[] | undefined
}

export const editorForSchema = (schema: JSONSchema): string => {
    let type = schema['type'] as string
    if (schema['enum']) type = 'enum'
    if (schema['format']) type += '-' + schema['format']
    if (schema['hidden']) type = 'hidden'
    if (schema['editor']) type = schema['editor']
    switch (type) {
        case 'string-date-time':
        case 'string-date':
        case 'string-time':
        case 'string-email':
        case 'string-password':
        case 'number-currency':
            return throwIfUndefined(schema['format'], `schema - no format for ${type}`)
        default:
            return type
    }
}

export const emptyValue = (schema: JSONSchema | undefined): Record<string, Json> | [] | null => {
    switch (schema?.['type'] ?? '') {
        case 'object':
            return {}
        case 'array':
            return []
        default:
            return null
    }
}

export const schemaLabel = (schema: JSONSchema, path: string[]): string => {
    return schema.title ?? camelToTitle(path.slice(-1)[0] ?? '')
}

export const jsonPointerToPath = (pointer: string) => {
    if (pointer.startsWith('/')) {
        pointer = pointer.substring(1)
    } else if (pointer.startsWith('#/')) {
        pointer = pointer.substring(2)
    } else if (pointer.startsWith('http')) {
        pointer = pointer.split('#/')[1] ?? ''
    }

    const pathEls = [] as string[]
    pointer.split('/').forEach((el) => {
        const int = parseInt(el)
        if (isNaN(int)) {
            pathEls.push(`.${el}`)
        } else {
            pathEls.push(`[${el}]`)
        }
    })
    let path = pathEls.join('')
    if (path.startsWith('.')) path = path.substring(1)
    return path
}
