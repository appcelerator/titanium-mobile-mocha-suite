/* global module */
'use strict';

module.exports = function (grunt) {

	// Project configuration.
	grunt.initConfig({
		appcJs: {
			src: [
				'dangerfile.js',
				'Gruntfile.js',
				'Resources/**/*.js',
				'!Resources/node_modules/**/*.js',
				'!Resources/should.js',
				'!Resources/ti-mocha.js',
				'scripts/**/*.js',
				'!scripts/mocha/**'
			]
		}
	});

	// Load grunt plugins for modules
	grunt.loadNpmTasks('grunt-appc-js');

	// linting: run eslint against js, standard appc checks
	grunt.registerTask('lint', [ 'appcJs:src:lintOnly' ]);

	// Tasks for formatting the source code according to our eslint rules
	grunt.registerTask('format:js', [ 'appcJs:src:lint:fix' ]);
	grunt.registerTask('format', [ 'format:android', 'format:ios', 'format:js' ]);

	// By default, run linting
	grunt.registerTask('default', [ 'lint' ]);
};
