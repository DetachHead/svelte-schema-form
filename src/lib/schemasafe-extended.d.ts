declare module "@exodus/schemasafe/src/pointer" {
  export let get: (obj: any, pointer: string, objpath?: string) => any;
  export function resolveReference(
    root: Record<string, unknown>,
    schemas: Set<string>,
    ref: string,
    base?: string
  ): [
    schema: Record<string, unknown>,
    root: Record<string, unknown>,
    basePath: string
  ][];
}
