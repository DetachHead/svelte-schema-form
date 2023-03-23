<script lang="ts" strictEvents>
    import type { CommonComponentParameters } from '../types/CommonComponentParameters'
    import type { Json } from '@exodus/schemasafe'

    export let params: CommonComponentParameters
    export let value: Json
</script>

<!-- event which calls pathChanged should be after all bindings so 'value' will have been updated -->
<input id={params.path.join('.')} name={params.path.join('.')} type="hidden" value={value ?? ''} />
