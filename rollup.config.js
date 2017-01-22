import buble from 'rollup-plugin-buble';

export default {
	entry: './lib/score.js',
	plugins: [ buble() ],
	targets: [
		{format: 'cjs', dest: 'dist/css-snippets-resolver.cjs.js'},
		{format: 'es',  dest: 'dist/css-snippets-resolver.es.js'}
	]
};
