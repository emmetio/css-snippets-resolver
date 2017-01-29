export default {
	entry: './lib/score.js',
	targets: [
		{format: 'cjs', dest: 'dist/css-snippets-resolver.cjs.js'},
		{format: 'es',  dest: 'dist/css-snippets-resolver.es.js'}
	]
};
