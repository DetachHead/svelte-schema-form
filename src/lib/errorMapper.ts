import { type JSONSchema, jsonPointerToPath } from './types/schema'
import { afterLast } from './utilities.js'
import type { Json } from '@exodus/schemasafe'
import { throwIfUndefined } from 'throw-expression'

export const errorMapper = (
    schema: JSONSchema,
    value: Json,
    keywordLocation: string,
    instanceLocation: string,
): [string, string] => {
    const location = jsonPointerToPath(instanceLocation)
    const keyword = afterLast(keywordLocation, '/')
    const keyValue = jsonPointerToPath(keywordLocation)
    switch (keyword) {
        case 'required':
            return [location, 'Please enter a value for this item']
        case 'minimum':
            return [location, `Please enter a number at least ${keyValue}`]
        case 'maximum':
            return [location, `Please enter a number at most ${keyValue}`]
        case 'minLength':
            return [location, `Please enter text of at least ${keyValue} characters`]
        case 'maxLength':
            return [location, `Please enter text no longer than ${keyValue} characters`]
        case 'pattern':
            return [location, 'Please enter properly formatted value']
        case 'format': {
            const valMap = {
                'date-time': 'date and time',
                time: 'time',
                date: 'date',
                email: 'email address',
            } as Record<string, string>
            return [
                location,
                `Please enter a properly formatted ${throwIfUndefined(
                    valMap[keyValue],
                    `errorMapper - failed to find '${keyValue}' in valMap`,
                )}`,
            ]
        }
    }
    return [location, `Fails to satisfy schema at ${jsonPointerToPath(keywordLocation)}`]
}
