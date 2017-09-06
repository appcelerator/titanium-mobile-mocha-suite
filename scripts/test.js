/**
 * Copyright (c) 2015-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License.
 * Please see the LICENSE included with this distribution for details.
 */

var path = require('path'),
	fs = require('fs'),
	async = require('async'),
	wrench = require('wrench'),
	colors = require('colors'),
	ejs = require('ejs'),
	StreamSplitter = require('stream-splitter'),
	spawn = require('child_process').spawn,
	exec = require('child_process').exec,
	titanium = path.join(__dirname, 'node_modules', 'titanium', 'bin', 'titanium'),
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
	var prc,
		args = [titanium, 'sdk', 'install'];
	if (sdkVersion.indexOf('.') == -1) { // no period, probably mean a branch
		args.push('-b');
	}
	args.push(sdkVersion);
	args.push('-d'); // make default
	console.log('Installing SDK with args: ' + args);
	prc = spawn('node', args);
	prc.stdout.on('data', function (data) {
		console.log(data.toString());
	});
	prc.on('exit', function (code) {
		if (code != 0) {
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
 * @param next {Function} callback function
 **/
function getSDKInstallDir(next) {
	var prc = exec('node "' + titanium + '" info -o json -t titanium', function (error, stdout, stderr) {
		var out,
			selectedSDK;
		if (error !== null) {
			return next('Failed to get SDK install dir: ' + error);
		}

		out = JSON.parse(stdout);
		selectedSDK = out.titaniumCLI.selectedSDK; // may be null!
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
 * @param  {Array[String]}   platforms
 * @param  {Function} next      [description]
 */
function generateProject(platforms, next) {
	var prc;
	prc = spawn('node', [titanium, 'create', '--force',
		'--type', 'app',
		'--platforms', platforms.join(','),
		'--name', PROJECT_NAME,
		'--id', 'com.appcelerator.testApp.testing',
		'--url', 'http://www.appcelerator.com',
		'--workspace-dir', __dirname,
		'--no-prompt']);
	prc.stdout.on('data', function (data) {
		console.log(data.toString());
	});
	prc.stderr.on('data', function (data) {
		console.log(data.toString());
	});
	prc.on('exit', function (code) {
		var setProcess;
		if (code != 0) {
			next('Failed to create project');
		} else {
			next();
		}
	});
}

// Add required properties for our unit tests!
function addTiAppProperties(next) {
	var tiapp_xml = path.join(PROJECT_DIR, 'tiapp.xml'),
		content = [];

	// Not so smart but this should work...
	fs.readFileSync(tiapp_xml).toString().split(/\r?\n/).forEach(function(line) {
		content.push(line);
		if (line.indexOf('<ios>') >= 0) {
			// Forse using the JScore on the emulator, not TiCore!
			content.push('		<use-jscore-framework>true</use-jscore-framework>');
		// app thinning breaks tests which expect image files to exist on filesystem normally!
		} else if (line.indexOf('<use-app-thinning>') >= 0) {
			content.pop();
			content.push('		<use-app-thinning>false</use-app-thinning>');
		}
		// Grab contents of modules/modules.xml to inject as moduel listing for tiapp.xml
		// This allows PR to override
		else if (line.indexOf('<modules>') >= 0) {
			// remove open tag
			content.pop();
			// now inject the overriden modules listing from xml file
			content.push(fs.readFileSync(path.join(SOURCE_DIR, 'modules', 'modules.xml')).toString());
		}
		// ignore end modules tag since injection above already wrote it!
		else if (line.indexOf('</modules>') >= 0) {
			content.pop();
		}
		// Inject some properties used by tests!
		// TODO Move this out to a separate file so PR could override
		else if (line.indexOf('<property name="ti.ui.defaultunit"') >= 0) {
			content.push('\t<property name="presetBool" type="bool">true</property>');
			content.push('\t<property name="presetDouble" type="double">1.23456</property>');
			content.push('\t<property name="presetInt" type="int">1337</property>');
			content.push('\t<property name="presetString" type="string">Hello!</property>');
		}
	});
	fs.writeFileSync(tiapp_xml, content.join('\n'));

	next();
}

function copyMochaAssets(next) {
	var src = path.join(SOURCE_DIR, 'Resources'),
		dest = path.join(PROJECT_DIR, 'Resources');
	wrench.copyDirSyncRecursive(src, dest, {
		forceDelete: true
	});

	// copy modules so we can test those too
	src = path.join(SOURCE_DIR, 'modules'),
	dest = path.join(PROJECT_DIR, 'modules');
	wrench.copyDirSyncRecursive(src, dest, {
		forceDelete: true
	});

	// copy plugins so we can test those too
	src = path.join(SOURCE_DIR, 'plugins'),
	dest = path.join(PROJECT_DIR, 'plugins');
	if (fs.existsSync(src)) {
		wrench.copyDirSyncRecursive(src, dest, {
			forceDelete: true
		});
	}

	// copy i18n so we can test those too
	src = path.join(SOURCE_DIR, 'i18n'),
	dest = path.join(PROJECT_DIR, 'i18n');
	if (fs.existsSync(src)) {
		wrench.copyDirSyncRecursive(src, dest, {
			forceDelete: true
		});
	}
	next();
}

function killiOSSimulator(next) {
	var prc = spawn('killall', ['Simulator']);
	prc.on('exit', function (code) {
		if (next) next();
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

	var args = [
			titanium, 'build',
			'--project-dir', PROJECT_DIR,
			'--platform', platform,
			'--target', target,
			'--log-level', 'info'
		],
		prc;
	if (platform === 'ios') {
		args.push('--hide-error-controller');
		killiOSSimulator();
	}

	if(deviceId) {
		args.push('--C')
		args.push(deviceId);
	}

	args.push('--no-prompt');
	args.push('--no-colors');
	prc = spawn('node', args);
	handleBuild(prc, next);
}

/**
 * Once a build has been spawned off this handles grabbing the test results from the output.
 * @param  {[type]}   prc  Handle of the running process from spawn
 * @param  {Function} next [description]
 */
function handleBuild(prc, next) {
	var results = [],
		output = '',
		stderr = '',
		splitter = prc.stdout.pipe(StreamSplitter('\n'));

	// Set encoding on the splitter Stream, so tokens come back as a String.
	splitter.encoding = 'utf8';

	splitter.on('token', function(token) {
		console.log(token);

		var str = token,
			index = -1,
			result;

		if ((index = str.indexOf('!TEST_START: ')) != -1) {
			// grab out the JSON and add to our result set
			str = str.slice(index + 13).trim();
			output = '';
			stderr = '';
		} else if ((index = str.indexOf('!TEST_END: ')) != -1) {
			str = str.slice(index + 11).trim();
			//  grab out the JSON and add to our result set
			result = JSON.parse(massageJSONString(str));
			result.stdout = output; // record what we saw in output during the test
			result.stderr = stderr; // record what we saw in output during the test
			results.push(result);
			output = ''; // reset output
			stderr = ''; // reset stderr
			result = null; // reset test result object
		} else if ((index = str.indexOf('!TEST_RESULTS_STOP!')) != -1) {
			prc.kill();
			return next(null, {date: (new Date).toISOString(), results: results});
		// Handle when app crashes and we haven't finished tests yet!
	} else if (((index = str.indexOf('-- End application log ----')) != -1) ||
				((index = str.indexOf('-- End simulator log ---')) != -1)) {
			prc.kill(); // quit this build...
			return next('Failed to finish test suite before app crashed and logs ended!'); // failed too many times
		} else {
			// append output
			output += str + '\n';
		}
	});
	splitter.on('error', function(err) {
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
	testResults = testResults.replace(/\\n/g, "\\n")
			   .replace(/\\'/g, "\\'")
			   .replace(/\\"/g, '\\"')
			   .replace(/\\&/g, "\\&")
			   .replace(/\\r/g, "\\r")
			   .replace(/\\t/g, "\\t")
			   .replace(/\\b/g, "\\b")
			   .replace(/\\f/g, "\\f");
	// remove non-printable and other non-valid JSON chars
	return testResults.replace(/[\u0000-\u0019]+/g,'');
}

/**
 * Converts JSON results of unit tests into a JUnit test result XML formatted file.
 *
 * @param jsonResults {Object} JSON containing results of the unit test output
 * @param prefix {String} prefix for test names to identify them uniquely
 * @param next {Function} callback function
 */
function outputJUnitXML(jsonResults, prefix, next) {
	// We need to go through the results and separate them out into suites!
	var suites = {},
		keys = [],
		values = [],
		r = '';
	jsonResults.results.forEach(function(item) {
		var s = suites[item.suite] || {tests: [], suite: item.suite, duration: 0, passes: 0, failures: 0, start:''}; // suite name to group by
		s.tests.unshift(item);
		s.duration += item.duration;
		if (item.state == 'failed') {
			s.failures += 1;
		} else if (item.state == 'passed') {
			s.passes += 1;
		}
		suites[item.suite] = s;
	});
	keys = Object.keys(suites);
	values = keys.map(function(v) { return suites[v]; });
	r = ejs.render('' + fs.readFileSync(JUNIT_TEMPLATE),  { 'suites': values, 'prefix': prefix });

	// Write the JUnit XML to a file
	fs.writeFileSync(path.join(__dirname, 'junit.' + prefix + '.xml'), r);
	next();
}

/**
 * Remove all CI SDKs installed. Skip GA releases, and skip the passed in SDK path we just installed.
 * @param  {String} sdkPath The SDK we just installed for testing. Keep this one in case next run can use it.
 * @param {Function} next
 */
function cleanNonGaSDKs(sdkPath, next) {
	var prc = exec('node "' + titanium + '" sdk list -o json', function (error, stdout, stderr) {
		var out,
			installedSDKs;
		if (error !== null) {
			return next('Failed to get list of SDKs: ' + error);
		}

		out = JSON.parse(stdout);
		installedSDKs = out.installed;
		// Loop over the SDKs and remove any where the key doesn't end in GA, or the value isn't sdkPath
		async.each(Object.keys(installedSDKs), function (item, callback) {
			var thisSDKPath = installedSDKs[item];
			if (item.slice(-2) === 'GA') { // skip GA releases
				return callback(null);
			}
			if (thisSDKPath === sdkPath) { // skip SDK we just installed
				return callback(null);
			}
			console.log('Removing ' + thisSDKPath);
			wrench.rmdirRecursive(thisSDKPath, callback);
		}, function(err) {
			next(err);
		});
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
 * @param	{Function} 			callback  	[description]
 */
function test(branch, platforms, target, deviceId, skipSdkInstall, cleanup, callback) {
	var sdkPath,
		tasks = [],
		results = {};
	if (!skipSdkInstall) {
		tasks.push(function (next) {
			// install new SDK and delete old test app in parallel
			async.parallel([
				function (cb) {
					if (branch) {
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
	}

	tasks.push(function (next) {
		console.log('Generating project');
		generateProject(platforms, next);
	});

	tasks.push(copyMochaAssets);
	tasks.push(addTiAppProperties);

	// run build for each platform, and spit out JUnit report
	platforms.forEach(function (platform) {
		tasks.push(function (next) {
			runBuild(platform, target, deviceId, function (err, result) {
				if (err) {
					return next(err);
				}
				var prefix;
				if (target) {
					prefix = platform + '.' + target;
				} else {
					prefix = platform;
				}
				results[platform] = result;
				outputJUnitXML(result, prefix, next);
			});
		});
	});

	async.series(tasks, function (err) {
		if (!skipSdkInstall || cleanup) {
			cleanNonGaSDKs(sdkPath, function (cleanupErr) {
				callback(err || cleanupErr, results);
			});
		} else {
			callback(err, results)
		}
	});
}

function outputResults(results, next) {
	var indents = 0,
		n = 0,
		suites = {},
		passes = 0,
		failures = 0,
		skipped = 0,
		keys = [];

	function indent() {
		return Array(indents).join('  ')
	}

	// start
	console.log();

	results.forEach(function(item) {
		var s = suites[item.suite] || {tests: [], suite: item.suite, duration: 0, passes: 0, failures: 0, start:''}; // suite name to group by
		s.tests.unshift(item);
		s.duration += item.duration;
		if (item.state == 'failed') {
			s.failures += 1;
		} else if (item.state == 'passed') {
			s.passes += 1;
		}
		suites[item.suite] = s;
	});
	keys = Object.keys(suites);

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
		if (1 == indents) console.log();
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
		var program = require('commander'),
			packageJson = require('./package'),
			platforms = [];

		program
			.version(packageJson.version)
			// TODO Allow choosing a URL or zipfile as SDK to install!
			.option('-b, --branch [branchName]', 'Install a specific branch of the SDK to test with', 'master')
			.option('-p, --platforms <platform1,platform2>', 'Run unit tests on the given platforms', /^(android(,ios|,windows)?)|(ios(,android)?)|(windows(,android)?)$/, 'android,ios')
			.option('-T, --target [target]', 'Titanium platform target to run the unit tests on. Only valid when there is a single platform provided')
			.option('-C, --device-id [id]', 'Titanium device id to run the unit tests on. Only valid when there is a target provided')
			.option('-s, --skip-sdk-install', 'Skip the SDK installation step')
			.option('-c --cleanup', 'Cleanup SDKs')
			.parse(process.argv);

		platforms = program.platforms.split(',');

		if (platforms.length > 1 && program.target !== undefined) {
			console.error('--target can only be used when there is a single platform provided');
			process.exit(1);
		}

		if (program.deviceId && !program.target) {
			console.error('--device-id can only be used when there is a target provided');
			process.exit(1);
		}

		test(program.branch, platforms, program.target, program.deviceId, program.skipSdkInstall, program.cleanup, function(err, results) {
			if (err) {
				console.error(err.toString());
				process.exit(1);
				return;
			}

			async.eachSeries(platforms, function (platform, next) {
				console.log();
				console.log('=====================================');
				console.log(platform.toUpperCase());
				console.log('-------------------------------------');
				outputResults(results[platform].results, next);
			}, function (err) {
				if (err) {
					console.error(err.toString());
					process.exit(1);
					return;
				}

				process.exit(0);
			});
		});
	})();
}
