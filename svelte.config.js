import adapter from '@sveltejs/adapter-auto'
import preprocess from 'svelte-preprocess'

/** @type {import('@sveltejs/kit').Config} */
const config = {
    compilerOptions: {
        enableSourcemap: true,
    },
    // Consult https://kit.svelte.dev/docs/integrations#preprocessors
    // for more information about preprocessors
    preprocess: preprocess({
        sourceMap: true,
        typescript: { tsconfigDirectory: './src' },
    }),

    kit: {
        adapter: adapter(),
    },
}

export default config
