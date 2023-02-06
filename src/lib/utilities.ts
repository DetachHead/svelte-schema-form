import { get, cloneDeep } from "lodash-es";
import { resolveReference } from "@exodus/schemasafe/src/pointer";
 
export const upTo = (str: string, match: string, start?: number) => {
    const pos = str.indexOf(match, start);
    return pos < 0 ? str.substring(start || 0) : str.substring(start || 0, pos);
}

export const upToLast = (str: string, match: string, end?: number) => {
    const pos = str.lastIndexOf(match, end);
    return pos < 0 ? str.substring(0, end || str.length) : str.substring(0, pos);
}

export const after = (str: string, match: string, start?: number) => {
    const pos = str.indexOf(match, start);
    return pos < 0 ? '' : str.substring(pos + match.length);
}

export const afterLast = (str: string, match: string, end?: number) => {
    const pos = str.lastIndexOf(match, end);
    return pos < 0 ? '' : str.substring(pos + match.length, end || str.length);
}

export function camelToWords(camel: string): string {
    camel = camel.trim();
    const words: string[] = [];
    let start = 0;
    for (let end = 1; end < camel.length; end++) {
        if ('A' <= camel[end] && camel[end] <= 'Z') {
            words.push(camel.substring(start, end).toLowerCase());
            start = end;
        }
    }
    words.push(camel.substring(start, camel.length).toLowerCase());

    return words.join(' ');
}

export function camelToTitle(camel: string): string {
    return camelToWords(camel).replace(/[a-z]/i, (ltr) => ltr.toUpperCase())
}

export function resolveRefs(root: Record<string, unknown>, schema: Record<string, unknown>): Record<string, unknown> {
    return schema['$ref']
        ? resolveReference(root, new Set(Object.keys(root.definitions as Record<string, unknown>[])), schema['$ref'] as string)[0][0]
        : cloneDeep(schema)
}

/** manipulate the schema to allow any optional property to have a null value
 * which is appropriate for form input */
 export function nullOptionalsAllowed(schema: Record<string, unknown>): object {
    if (schema === null || schema === undefined) schema = {};
    return nullOptionalsAllowedApply(schema, schema);
}

function nullOptionalsAllowedApply(root: Record<string, unknown>, unresolvedSchema: Record<string, unknown>): Record<string, unknown> {
    const schema = resolveRefs(root, unresolvedSchema)
    let req = (schema['required'] || []) as Array<string>;
    switch (schema['type']) {
        case 'object':
            const properties = (schema['properties'] || {}) as Record<string, unknown>;
            for (let prop in properties) {
                if (req.indexOf(prop) < 0) {
                    properties[prop] = nullOptionalsAllowedApply(root, properties[prop] as Record<string, unknown>);
                }
            }
            break;
        case 'array':
            const items = (schema['items'] || {}) as Record<string, unknown>;
            schema['items'] = nullOptionalsAllowedApply(root, items);
            if (items['oneOf'] && !(items['oneOf'] as any[]).some(subschema => subschema["type"] == "null")) {
                (items['oneOf'] as any[]).push({ type: 'null' });
            }
            break;
        default:
            if (Array.isArray(schema['type'])) {
                if (schema['type'].indexOf('null') < 0) {
                    schema['type'].push('null');
                }
            } else if (schema['type'] != 'null') {
                schema['type'] = [schema['type'], 'null'];
            }
            break;
    }
    const defns = schema['definitions'] as Record<string, unknown>;
    if (defns) {
        for (let defn in defns) {
            defns[defn] = nullOptionalsAllowedApply(root, defns[defn] as Record<string, unknown>);
        }
    }
    return schema;
}

let incrVal = 0;
export const incr = () => incrVal++;

export const substituteProperties = (subsPattern: string, value: any) => {
    if (!subsPattern || !value) return subsPattern;
    const parts = subsPattern.split('${');
    const partsOut: string[] = [];
    partsOut.push(parts.shift()!);
    for (let part of parts) {
        if (part.includes('}')) {
            const path = upTo(part, '}');
            const subsVal = (path === '' ? value : get(value, path)) || '';
            partsOut.push(`${subsVal}${after(part, '}')}`);
        }
    }
    return partsOut.join('');
}

export function slashTrim(s: string): string {
    let start = 0;
    let end = s.length;
    if (s[start] === '/') start++;
    if (s[end - 1] === '/') end--;
    if (end <= start) return '';
    return s.substring(start, end);
}

export function slashTrimLeft(s: string): string {
    return s.startsWith('/') ? s.substr(1) : s;
}

export function pathToArray(path: string) {
    return slashTrim(path).split('/').filter(s => !!s);
}

export function getExtension(s: string): string {
    let extStart = s.lastIndexOf('.');
    return extStart < 0 ? '' : s.substr(extStart + 1);
}

export function getFirstLine(s: string): string {
    let lineEnd = s.indexOf('\n');
    if (lineEnd < 0) return s;
    if (lineEnd > 0 && s[lineEnd - 1] === '\r') lineEnd--;
    return s.substring(0, lineEnd);
}

export function getTailLines(s: string): string {
    return s.substring(s.indexOf('\n') + 1);
}

export function pathCombine(...args: string[]): string {
    const stripped = args.filter(a => !!a);
    if (stripped.length === 0) return '';
    const startSlash = stripped[0].startsWith('/');
    const endSlash = stripped[stripped.length - 1].endsWith('/');
    let joined = stripped.map(a => slashTrim(a)).filter(a => !!a).join('/');
    if (startSlash) joined = '/' + joined;
    if (endSlash && joined !== '/') joined += '/';
    return joined;
}

export function stringToHtml(s: string) {
    return (s || '').replace("\n", "<br/>");
}