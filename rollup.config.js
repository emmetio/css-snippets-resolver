export default {
	input: './index.js',
	output: [{
		format: 'cjs',
		exports: 'named',
		sourcemap: true,
		file: 'dist/css-snippets-resolver.cjs.js'
	}, {
		format: 'es',
		sourcemap: true,
		file: 'dist/css-snippets-resolver.es.js'
	}]
};
