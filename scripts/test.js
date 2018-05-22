/**
 * Copyright (c) 2015-2017 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License.
 * Please see the LICENSE included with this distribution for details.
 */
'use strict';

const path = require('path'),
	fs = require('fs'),
	async = require('async'),
	wrench = require('wrench'),
	colors = require('colors'), // eslint-disable-line no-unused-vars
	ejs = require('ejs'),
	StreamSplitter = require('stream-splitter'),
	spawn = require('child_process').spawn, // eslint-disable-line security/detect-child-process
	exec = require('child_process').exec, // eslint-disable-line security/detect-child-process
	titanium = require.resolve('titanium'),
	SOURCE_DIR = path.join(__dirname, '..'),
	PROJECT_NAME = 'mocha',
	PROJECT_DIR = path.join(__dirname, PROJECT_NAME),
	JUNIT_TEMPLATE = path.join(__dirname, 'junit.xml.ejs');

function clearPreviousApp(next) {
	// If the project already exists, wipe it
	if (fs.existsSync(PROJECT_DIR)) {
		wrench.rmdirSyncRecursive(PROJECT_DIR);
	}
	next();
}

function installSDK(sdkVersion, next) {
	const args = [ titanium, 'sdk', 'install' ];
	if (sdkVersion.indexOf('.') === -1) { // no period, probably mean a branch
		args.push('-b');
	}
	args.push(sdkVersion);
	args.push('-d'); // make default
	console.log('Installing SDK with args: ' + args);
	const prc = spawn('node', args);
	prc.stdout.on('data', function (data) {
		console.log(data.toString());
	});
	prc.stderr.on('data', function (data) {
		console.log(data.toString());
	});
	prc.on('exit', function (code) {
		if (code !== 0) {
			next('Failed to install SDK');
		} else {
			next();
		}
	});
}

/**
 * Look up the full path to the SDK we just installed (the SDK we'll be hacking
 * to add our locally built Windows SDK into).
 *
 * @param {Function} next callback function
 **/
function getSDKInstallDir(next) {
	// TODO Use fork since we're spawning off another node process
	exec('node "' + titanium + '" info -o json -t titanium', function (error, stdout) {
		if (error !== null) {
			return next('Failed to get SDK install dir: ' + error);
		}

		const out = JSON.parse(stdout);
		const selectedSDK = out.titaniumCLI.selectedSDK; // may be null!
		if (selectedSDK) {
			next(null, out.titanium[selectedSDK].path);
		} else {
			// Hope first sdk listed is the one we want
			next(null, out.titanium[Object.keys(out.titanium)[0]].path);
		}
	});
}

/**
 * Runs `titanium create` to generate a project for the specific platforms.
 * @param  {string[]} platforms array of platform ids to create a project targeted for
 * @param  {Function} next  callback function
 */
function generateProject(platforms, next) {
	// TODO Use fork since we're spawning off another node process
	const prc = spawn('node', [ titanium, 'create', '--force',
		'--type', 'app',
		'--platforms', platforms.join(','),
		'--name', PROJECT_NAME,
		'--id', 'com.appcelerator.testApp.testing',
		'--url', 'http://www.appcelerator.com',
		'--workspace-dir', __dirname,
		'--no-prompt' ]);
	prc.stdout.on('data', function (data) {
		console.log(data.toString());
	});
	prc.stderr.on('data', function (data) {
		console.log(data.toString());
	});
	prc.on('exit', function (code) {
		if (code !== 0) {
			next('Failed to create project');
		} else {
			next();
		}
	});
}

// Add required properties for our unit tests!
function addTiAppProperties(next) {
	const tiapp_xml = path.join(PROJECT_DIR, 'tiapp.xml');
	const content = [];
	// Not so smart but this should work...
	fs.readFileSync(tiapp_xml).toString().split(/\r?\n/).forEach(function (line) {
		content.push(line);
		if (line.indexOf('<ios>') >= 0) {
			// Forse using the JScore on the emulator, not TiCore!
			content.push('\t\t<use-jscore-framework>true</use-jscore-framework>');
		// app thinning breaks tests which expect image files to exist on filesystem normally!
		} else if (line.indexOf('<use-app-thinning>') >= 0) {
			content.pop();
			content.push('\t\t<use-app-thinning>false</use-app-thinning>');
		// Grab contents of modules/modules.xml to inject as moduel listing for tiapp.xml
		// This allows PR to override
		} else if (line.indexOf('<modules>') >= 0) {
			// remove open tag
			content.pop();
			// now inject the overridden modules listing from xml file
			content.push(fs.readFileSync(path.join(SOURCE_DIR, 'modules', 'modules.xml')).toString());
		// ignore end modules tag since injection above already wrote it!
		} else if (line.indexOf('</modules>') >= 0) {
			content.pop();
		// Inject some properties used by tests!
		// TODO Move this out to a separate file so PR could override
		} else if (line.indexOf('<property name="ti.ui.defaultunit"') >= 0) {
			content.push('\t<property name="presetBool" type="bool">true</property>');
			content.push('\t<property name="presetDouble" type="double">1.23456</property>');
			content.push('\t<property name="presetInt" type="int">1337</property>');
			content.push('\t<property name="presetString" type="string">Hello!</property>');
			content.push('\t<transpile>true</transpile>');
		} else if (line.indexOf('<android xmlns:android') >= 0) {
			// Inject the google maps api key
			content.push('\t\t<manifest>');
			content.push('\t\t\t<application>');
			content.push('\t\t\t\t<meta-data android:name="com.google.android.geo.API_KEY" android:value="AIzaSyCN_aC6RMaynan8YzsO1HNHbhsr9ZADDlY"/>');
			content.push('\t\t\t</application>');
			content.push('\t\t</manifest>');
		}
	});
	fs.writeFileSync(tiapp_xml, content.join('\n'));

	next();
}

function copyDir(src, dest) {
	wrench.copyDirSyncRecursive(src, dest, {
		forceDelete: true
	});
}

function copyMochaAssets(next) {
	copyDir(path.join(SOURCE_DIR, 'Resources'), path.join(PROJECT_DIR, 'Resources'));
	// copy modules so we can test those too
	copyDir(path.join(SOURCE_DIR, 'modules'), path.join(PROJECT_DIR, 'modules'));
	// copy plugins so we can test those too
	copyDir(path.join(SOURCE_DIR, 'plugins'), path.join(PROJECT_DIR, 'plugins'));
	// copy i18n so we can test those too
	copyDir(path.join(SOURCE_DIR, 'i18n'), path.join(PROJECT_DIR, 'i18n'));
	next();
}

function killiOSSimulator(next) {
	spawn('killall', [ 'Simulator' ]).on('exit', function () {
		if (next) {
			next();
		}
	});
}

function runBuild(platform, target, deviceId, next) {

	if (target === undefined) {
		switch (platform) {
			case 'android':
				target = 'emulator';
				break;
			case 'ios':
				target = 'simulator';
				break;
			case 'windows':
				target = 'wp-emulator';
				break;
		}
	}

	const args = [
		titanium, 'build',
		'--project-dir', PROJECT_DIR,
		'--platform', platform,
		'--target', target,
		'--log-level', 'info'
	];
	if (platform === 'ios') {
		args.push('--hide-error-controller');
		killiOSSimulator();
	}

	if (deviceId) {
		args.push('--C');
		args.push(deviceId);
	}

	if (platform === 'windows' && target !== 'wp-emulator') {
		args.push('--forceUnInstall');
	}

	args.push('--no-prompt');
	args.push('--no-colors');
	// TODO Use fork since we're spawning off another node process
	const prc = spawn('node', args);
	handleBuild(prc, next);
}

/**
 * Once a build has been spawned off this handles grabbing the test results from the output.
 * @param  {child_process}   prc  Handle of the running process from spawn
 * @param  {Function} next [description]
 */
function handleBuild(prc, next) {
	const results = [];
	let output = '',
		stderr = '',
		splitter = prc.stdout.pipe(StreamSplitter('\n'));

	// Set encoding on the splitter Stream, so tokens come back as a String.
	splitter.encoding = 'utf8';

	splitter.on('token', function (token) {
		console.log(token);

		let str = token,
			index = -1;

		if ((index = str.indexOf('!TEST_START: ')) !== -1) {
			// grab out the JSON and add to our result set
			str = str.slice(index + 13).trim();
			output = '';
			stderr = '';
		} else if ((index = str.indexOf('!TEST_END: ')) !== -1) {
			str = str.slice(index + 11).trim();
			//  grab out the JSON and add to our result set
			let result = JSON.parse(massageJSONString(str));
			result.stdout = output; // record what we saw in output during the test
			result.stderr = stderr; // record what we saw in output during the test
			results.push(result);
			output = ''; // reset output
			stderr = ''; // reset stderr
		} else if ((index = str.indexOf('!TEST_RESULTS_STOP!')) !== -1) {
			prc.kill();
			return next(null, { date: (new Date()).toISOString(), results: results });
		// Handle when app crashes and we haven't finished tests yet!
		} else if (((index = str.indexOf('-- End application log ----')) !== -1)
				|| ((index = str.indexOf('-- End simulator log ---')) !== -1)) {
			prc.kill(); // quit this build...
			return next('Failed to finish test suite before app crashed and logs ended!'); // failed too many times
		} else {
			// append output
			output += str + '\n';
		}
	});
	splitter.on('error', function (err) {
		// Any errors that occur on a source stream will be emitted on the
		// splitter Stream, if the source stream is piped into the splitter
		// Stream, and if the source stream doesn't have any other error
		// handlers registered.
		next(err);
	});
	prc.stderr.on('data', function (data) {
		console.log(data.toString().trim());
		stderr += data.toString().trim() + '\n';
	});
}

function massageJSONString(testResults) {
	// preserve newlines, etc - use valid JSON
	return testResults.replace(/\\n/g, '\\n')
		.replace(/\\'/g, '\\\'')
		.replace(/\\"/g, '\\"')
		.replace(/\\&/g, '\\&')
		.replace(/\\r/g, '\\r')
		.replace(/\\t/g, '\\t')
		.replace(/\\b/g, '\\b')
		.replace(/\\f/g, '\\f')
		// remove non-printable and other non-valid JSON chars
		.replace(/[\u0000-\u0019]+/g, '');
}

/**
 * Converts JSON results of unit tests into a JUnit test result XML formatted file.
 *
 * @param {Object} jsonResults JSON containing results of the unit test output
 * @param {String} prefix prefix for test names to identify them uniquely
 * @param {Function} next callback function
 */
function outputJUnitXML(jsonResults, prefix, next) {
	// We need to go through the results and separate them out into suites!
	const suites = {};
	jsonResults.results.forEach(function (item) {
		const s = suites[item.suite] || { tests: [], suite: item.suite, duration: 0, passes: 0, failures: 0, start:'' }; // suite name to group by
		s.tests.unshift(item);
		s.duration += item.duration;
		if (item.state === 'failed') {
			s.failures += 1;
		} else if (item.state === 'passed') {
			s.passes += 1;
		}
		suites[item.suite] = s;
	});
	const keys = Object.keys(suites);
	const values = keys.map(function (v) { return suites[v]; }); // eslint-disable-line max-statements-per-line
	const r = ejs.render('' + fs.readFileSync(JUNIT_TEMPLATE),  { 'suites': values, 'prefix': prefix });

	// Write the JUnit XML to a file
	fs.writeFileSync(path.join(__dirname, 'junit.' + prefix + '.xml'), r);
	next();
}

/**
 * Remove all CI SDKs installed. Skip GA releases, and skip the passed in SDK path we just installed.
 * @param  {String} sdkPath The SDK we just installed for testing. Keep this one in case next run can use it.
 * @param {Function} next callback function
 */
function cleanNonGaSDKs(sdkPath, next) {
	// FIXME Use fork since we're spawning off another node process!
	exec('node "' + titanium + '" sdk list -o json', function (error, stdout) {
		if (error !== null) {
			return next('Failed to get list of SDKs: ' + error);
		}

		const out = JSON.parse(stdout);
		const installedSDKs = out.installed;
		// Loop over the SDKs and remove any where the key doesn't end in GA, or the value isn't sdkPath
		async.each(Object.keys(installedSDKs), function (item, callback) {
			const thisSDKPath = installedSDKs[item];
			if (item.slice(-2) === 'GA') { // skip GA releases
				return callback(null);
			}
			if (thisSDKPath === sdkPath) { // skip SDK we just installed
				return callback(null);
			}
			console.log('Removing ' + thisSDKPath);
			wrench.rmdirRecursive(thisSDKPath, callback);
		}, function (err) {
			next(err);
		});
	});
}

function cleanupModules(next) {
	exec('node "' + titanium + '" config sdk.defaultInstallLocation -o json', function (error, stdout) {
		let sdkDir = '';
		if (error !== null) {
			const osName = require('os').platform();
			if (osName === 'win32') {
				sdkDir = path.join(process.env.ProgramData, 'Titanium');
			} else if (osName === 'darwin') {
				sdkDir = path.join(process.env.HOME, 'Library', 'Application Support', 'Titanium');
			} else if (osName === 'linux') {
				sdkDir = path.join(process.env.HOME, '.titanium');
			}
		} else {
			sdkDir = JSON.parse(stdout.trim());
		}
		const moduleDir = path.join(sdkDir, 'modules');
		const pluginDir = path.join(sdkDir, 'plugins');
		try {
			if (fs.existsSync(moduleDir)) {
				console.log('Removing ' + moduleDir);
				wrench.rmdirSyncRecursive(moduleDir);
			} else {
				console.log(moduleDir + ' doesnt exist');
			}

			if (fs.existsSync(pluginDir)) {
				console.log('Removing ' + pluginDir);
				wrench.rmdirSyncRecursive(pluginDir);
			} else {
				console.log(pluginDir + ' doesnt exist');
			}

			return next();
		} catch (e) {
			console.log(e);
			return next(e);
		}
	});
}

/**
 * Installs a Titanium SDK to test against, generates a test app, then runs the
 * app for each platform with our mocha test suite. Outputs the results in a JUnit
 * test report, and holds onto the results in memory as a JSON object.
 *
 * @param	{String}   			branch    	branch/zip/url of SDK to install. If null/undefined, no SDK will be installed
 * @param	{(String|String[])}	platforms 	[description]
 * @param	{String}   			target		Titanium target value to run the tests on
 * @param	{String}			deviceId	Titanium device id target to run the tests on
 * @param	{Boolean}			skipSdkInstall	Don't try to install an SDK from `branch`
 * @param	{Boolean}			cleanup	Delete all the non-GA SDKs when done? Defaults to true if we installed an SDK
 * @param	{Function} 			callback  	[description]
 */
function test(branch, platforms, target, deviceId, skipSdkInstall, cleanup, callback) {
	let sdkPath;
	// if we're not skipping sdk install and haven't specific whether to clean up or not, default to cleaning up non-GA SDKs
	if (!skipSdkInstall && cleanup === undefined) {
		cleanup = true;
	}

	const tasks = [];

	// Only ever do this in CI so unless someone changes this code,
	// or for some reason these are set on your machine it will never
	// remove when running locally. That way no way can be angry at me
	if (process.env.JENKINS || process.env.JENKINS_URL) {
		tasks.push(function (next) {
			cleanupModules(next);
		});
	}

	tasks.push(function (next) {
		// install new SDK and delete old test app in parallel
		async.parallel([
			function (cb) {
				if (!skipSdkInstall && branch) {
					console.log('Installing SDK');
					installSDK(branch, cb);
				} else {
					cb();
				}
			},
			clearPreviousApp
		], next);
	});
	// Record the SDK we just installed so we retain it when we clean up at end
	tasks.push(function (next) {
		getSDKInstallDir(function (err, installPath) {
			if (err) {
				return next(err);
			}
			sdkPath = installPath;
			next();
		});
	});

	tasks.push(function (next) {
		console.log('Generating project');
		generateProject(platforms, next);
	});

	tasks.push(copyMochaAssets);
	tasks.push(addTiAppProperties);

	// run build for each platform, and spit out JUnit report
	const results = {};
	platforms.forEach(function (platform) {
		tasks.push(function (next) {
			runBuild(platform, target, deviceId, function (err, result) {
				if (err) {
					return next(err);
				}
				let prefix;
				if (target) {
					prefix = platform + '.' + target;
				} else {
					prefix = platform;
				}
				results[prefix] = result;
				outputJUnitXML(result, prefix, next);
			});
		});
	});

	if (cleanup) {
		tasks.push(function (next) {
			cleanNonGaSDKs(sdkPath, next);
		});
	}

	// Only ever do this in CI so unless someone changes this code,
	// or for some reason these are set on your machine it will never
	// remove when running locally. That way no way can be angry at me
	if (process.env.JENKINS || process.env.JENKINS_URL) {
		tasks.push(function (next) {
			cleanupModules(next);
		});
	}

	async.series(tasks, function (err) {
		callback(err, results);
	});
}

function outputResults(results, next) {
	const suites = {};

	// start
	console.log();

	results.forEach(function (item) {
		const s = suites[item.suite] || { tests: [], suite: item.suite, duration: 0, passes: 0, failures: 0, start:'' }; // suite name to group by
		s.tests.unshift(item);
		s.duration += item.duration;
		if (item.state === 'failed') {
			s.failures += 1;
		} else if (item.state === 'passed') {
			s.passes += 1;
		}
		suites[item.suite] = s;
	});

	let indents = 0,
		n = 0,
		passes = 0,
		failures = 0,
		skipped = 0;
	function indent() {
		return Array(indents).join('  ');
	}
	const keys = Object.keys(suites);
	keys.forEach(function (v) {
		++indents;
		console.log('%s%s', indent(), v);
		// now loop through the tests
		suites[v].tests.forEach(function (test) {
			if (test.state === 'skipped') {
				skipped++;
				console.log(indent() + '  - %s'.cyan, test.title);
			} else if (test.state === 'failed') {
				failures++;
				console.log(indent() + '  %d) %s'.red, ++n, test.title);
				++indents;
				console.log(indent() + '  %s'.red, JSON.stringify(test));
				--indents;
			} else {
				passes++;
				console.log(indent() + '  ✓'.green + ' %s '.gray, test.title);
			}
		});
		--indents;
		if (indents === 1) {
			console.log();
		}
	});

	// Spit out overall stats: test count, failure count, pending count, pass count.
	console.log('%d Total Tests: %d passed, %d failed, %d skipped.', (skipped + failures + passes), passes, failures, skipped);
	next();
}

// public API
exports.test = test;
exports.outputResults = outputResults;

// When run as single script.
if (module.id === '.') {
	(function () {
		const program = require('commander'),
			packageJson = require('../package');

		program
			.version(packageJson.version)
			// TODO Allow choosing a URL or zipfile as SDK to install!
			.option('-b, --branch [branchName]', 'Install a specific branch of the SDK to test with', 'master')
			.option('-p, --platforms <platform1,platform2>', 'Run unit tests on the given platforms', /^(android(,ios|,windows)?)|(ios(,android)?)|(windows(,android)?)$/, 'android,ios')
			.option('-T, --target [target]', 'Titanium platform target to run the unit tests on. Only valid when there is a single platform provided')
			.option('-C, --device-id [id]', 'Titanium device id to run the unit tests on. Only valid when there is a target provided')
			.option('-s, --skip-sdk-install', 'Skip the SDK installation step')
			.option('-c, --cleanup', 'Cleanup non-GA SDKs. Default is true if we install an SDK')
			.parse(process.argv);

		const platforms = program.platforms.split(',');

		if (platforms.length > 1 && program.target !== undefined) {
			console.error('--target can only be used when there is a single platform provided');
			process.exit(1);
		}

		if (program.deviceId && !program.target) {
			console.error('--device-id can only be used when there is a target provided');
			process.exit(1);
		}

		test(program.branch, platforms, program.target, program.deviceId, program.skipSdkInstall, program.cleanup, function (err, results) {
			if (err) {
				console.error(err.toString());
				process.exit(1);
				return;
			}

			async.eachSeries(platforms, function (platform, next) {
				let prefix;
				if (program.target) {
					prefix = platform + '.' + program.target;
				} else {
					prefix = platform;
				}
				console.log();
				console.log('=====================================');
				console.log(prefix.toUpperCase());
				console.log('-------------------------------------');
				outputResults(results[prefix].results, next);
			}, function (err) {
				if (err) {
					console.error(err.toString());
					process.exit(1);
					return;
				}

				process.exit(0);
			});
		});
	}());
}
