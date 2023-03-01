import type { JSONSchema } from './types/schema'
import { lengthGreaterThan } from '@detachhead/ts-helpers/dist/functions/Array'
import { subtract } from '@detachhead/ts-helpers/dist/functions/Number'
import { cloneDeep, get } from 'lodash-es'
import { throwIfUndefined } from 'throw-expression'

export const upTo = (str: string, match: string, start?: number) => {
    const pos = str.indexOf(match, start)
    return pos < 0 ? str.substring(start ?? 0) : str.substring(start ?? 0, pos)
}

export const upToLast = (str: string, match: string, end?: number) => {
    const pos = str.lastIndexOf(match, end)
    return pos < 0 ? str.substring(0, end ?? str.length) : str.substring(0, pos)
}

export const after = (str: string, match: string, start?: number) => {
    const pos = str.indexOf(match, start)
    return pos < 0 ? '' : str.substring(pos + match.length)
}

export const afterLast = (str: string, match: string, end?: number) => {
    const pos = str.lastIndexOf(match, end)
    return pos < 0 ? '' : str.substring(pos + match.length, end ?? str.length)
}

export const camelToWords = (camel: string): string => {
    camel = camel.trim()
    const words: string[] = []
    let start = 0
    for (let end = 1; end < camel.length; end++) {
        const value = throwIfUndefined(camel[end])
        if ('A' <= value && value <= 'Z') {
            words.push(camel.substring(start, end).toLowerCase())
            start = end
        }
    }
    words.push(camel.substring(start, camel.length).toLowerCase())

    return words.join(' ')
}

export const camelToTitle = (camel: string): string =>
    camelToWords(camel).replace(/[a-z]/iu, (ltr) => ltr.toUpperCase())

/**
 * manipulate the schema to allow any optional property to have a null value
 * which is appropriate for form input
 */
export const nullOptionalsAllowed = (schema: JSONSchema): object => {
    const newSchema = cloneDeep(schema)
    nullOptionalsAllowedApply(newSchema as Record<string, unknown>)
    return newSchema
}

const nullOptionalsAllowedApply = (schema: JSONSchema) => {
    const req = (schema['required'] ?? []) as Array<string>
    if (schema['$ref']) return
    switch (schema.type) {
        case 'object': {
            const properties = schema['properties'] ?? {}
            for (const prop in properties) {
                if (req.indexOf(prop) < 0) {
                    nullOptionalsAllowedApply(properties[prop] as Record<string, unknown>)
                }
            }
            break
        }
        case 'array': {
            const items = (schema['items'] ?? {}) as JSONSchema
            nullOptionalsAllowedApply(items)
            if (
                items['oneOf'] &&
                !(items['oneOf'] as JSONSchema[]).some((subschema) => subschema['type'] === 'null')
            ) {
                ;(items['oneOf'] as JSONSchema[]).push({ type: 'null' })
            }
            break
        }
        default:
            if (Array.isArray(schema['type'])) {
                if (schema['type'].indexOf('null') < 0) {
                    schema['type'].push('null')
                }
            } else if (schema['type'] !== 'null') {
                if (schema['type'] !== undefined) {
                    schema['type'] = [schema['type'], 'null']
                }
            }
            break
    }
    const defns = schema['definitions']
    if (defns) {
        for (const defn in defns) {
            nullOptionalsAllowedApply(defns[defn] as Record<string, unknown>)
        }
    }
}

let incrVal = 0
export const incr = () => incrVal++

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO: figure out what this function does
export const substituteProperties = (subsPattern: string, value: any) => {
    if (!subsPattern || !value) return subsPattern
    const parts = subsPattern.split('${')
    const partsOut: string[] = []
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- see todo above
    partsOut.push(parts.shift()!)
    for (const part of parts) {
        if (part.includes('}')) {
            const path = upTo(part, '}')
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- see todo above
            const subsVal = (path === '' ? value : get(value, path)) || ''
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions -- see todo above
            partsOut.push(`${subsVal}${after(part, '}')}`)
        }
    }
    return partsOut.join('')
}

export const slashTrim = (s: string): string => {
    let start = 0
    let end = s.length
    if (s[start] === '/') start++
    if (s[end - 1] === '/') end--
    if (end <= start) return ''
    return s.substring(start, end)
}

export const slashTrimLeft = (s: string): string => (s.startsWith('/') ? s.substr(1) : s)

export const pathToArray = (path: string) =>
    slashTrim(path)
        .split('/')
        .filter((s) => !!s)

export const getExtension = (s: string): string => {
    const extStart = s.lastIndexOf('.')
    return extStart < 0 ? '' : s.substr(extStart + 1)
}

export const getFirstLine = (s: string): string => {
    let lineEnd = s.indexOf('\n')
    if (lineEnd < 0) return s
    if (lineEnd > 0 && s[lineEnd - 1] === '\r') lineEnd--
    return s.substring(0, lineEnd)
}

export const getTailLines = (s: string): string => s.substring(s.indexOf('\n') + 1)

export const pathCombine = (...args: string[]): string => {
    const stripped = args.filter((a) => !!a)
    if (!lengthGreaterThan(stripped, 0)) return ''
    const startSlash = stripped[0].startsWith('/')
    const endSlash = stripped[subtract(stripped.length, 1)].endsWith('/')
    let joined = stripped
        .map((a) => slashTrim(a))
        .filter((a) => !!a)
        .join('/')
    if (startSlash) joined = '/' + joined
    if (endSlash && joined !== '/') joined += '/'
    return joined
}

export const stringToHtml = (s: string) => (s || '').replace('\n', '<br/>')
