export default {
	entry: './index.js',
	exports: 'named',
	targets: [
		{format: 'cjs', dest: 'dist/css-snippets-resolver.cjs.js'},
		{format: 'es',  dest: 'dist/css-snippets-resolver.es.js'}
	]
};
