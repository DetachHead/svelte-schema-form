import type { CommonComponentParameters } from './types/CommonComponentParameters'
import { type JSONSchema, emptyValue } from './types/schema'
import type { Json } from '@exodus/schemasafe'
import { throwIfUndefined } from 'throw-expression'

export const arrayAdd =
    (
        schema: JSONSchema & { items?: JSONSchema },
        params: CommonComponentParameters,
        value: Json[],
    ) =>
    () => {
        params.pathChanged(params.path, [...value, emptyValue(schema.items)])
    }

export const arrayDelete =
    (idx: number, params: CommonComponentParameters, value: Json[]) => () => {
        params.pathChanged(params.path, [...value.slice(0, idx), ...value.slice(idx + 1)], 'delete')
    }

export const arrayDuplicate =
    (idx: number, params: CommonComponentParameters, value: unknown[]) => () => {
        params.pathChanged(
            params.path,
            [
                ...value.slice(0, idx),
                value[idx],
                JSON.parse(JSON.stringify(value[idx])),
                ...value.slice(idx + 1),
            ],
            'duplicate',
        )
    }

export const arrayUp = (idx: number, params: CommonComponentParameters, value: Json[]) => () => {
    if (idx > 0) {
        params.pathChanged(
            params.path,
            [
                ...value.slice(0, idx - 1),
                throwIfUndefined(value[idx]),
                throwIfUndefined(value[idx - 1]),
                ...value.slice(idx + 1),
            ],
            'up',
        )
    }
}

export const arrayDown = (idx: number, params: CommonComponentParameters, value: Json[]) => () => {
    if (idx < value.length - 1) {
        params.pathChanged(
            params.path,
            [
                ...value.slice(0, idx),
                throwIfUndefined(value[idx + 1]),
                throwIfUndefined(value[idx]),
                ...value.slice(idx + 2),
            ],
            'down',
        )
    }
}
