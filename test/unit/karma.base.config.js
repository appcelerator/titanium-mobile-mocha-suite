module.exports = {
	basePath: '../..',
	frameworks: [ 'mocha', 'should' ],
	files: [
		// @todo move the support files to a plugin?
		'test/unit/support/mocha-filters.js',
		'test/unit/support/should-assertions.js',
		'test/unit/support/environment.js',
		'test/unit/specs/**/*test.js'
	],
	preprocessors: {
		'test/unit/**/es6.*.js': [ 'babel' ]
	},
	babelPreprocessor: {
		options: {
			presets: [
				[
					'@babel/preset-env',
					{
						targets: {
							ios: '9.0',
							chrome: '73'
						}
					}
				]
			]
		}
	},
	reporters: [ 'mocha', 'junit' ],
	singleRun: true,
	retryLimit: 0,
	browserNoActivityTimeout: 120000,
	captureTimeout: 1200000
};
