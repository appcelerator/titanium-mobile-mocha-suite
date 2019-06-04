/**
 * Copyright (c) 2015-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License.
 * Please see the LICENSE included with this distribution for details.
 */
'use strict';

const path = require('path');
const fs = require('fs-extra');
const async = require('async');
const spawn = require('child_process').spawn; // eslint-disable-line security/detect-child-process
const exec = require('child_process').exec; // eslint-disable-line security/detect-child-process
const fork = require('child_process').fork; // eslint-disable-line security/detect-child-process
const titanium = require.resolve('titanium');

function installSDK(sdkVersion, next) {
	sdkDir().then(sdkDir => {
		const args = [ titanium, 'sdk', 'install' ];
		if (sdkVersion.indexOf('.') === -1) { // no period, probably mean a branch
			args.push('-b');
		}
		args.push(sdkVersion);
		args.push('-d'); // make default
		// Add force flag if we find that the modules dir is blown away!
		if (!fs.existsSync(path.join(sdkDir, 'modules'))) {
			args.push('--force'); // make default
		}

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
 * Remove all CI SDKs installed. Skip GA releases, and skip the passed in SDK path we just installed.
 * @param  {String} sdkPath The SDK we just installed for testing. Keep this one in case next run can use it.
 * @param {Function} next callback function
 */
function cleanNonGaSDKs(sdkPath, next) {
	// FIXME Use fork since we're spawning off another node process!
	exec(`node "${titanium}" sdk list -o json`, function (error, stdout) {
		if (error !== null) {
			return next(`Failed to get list of SDKs: ${error}`);
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
			console.log(`Removing ${thisSDKPath}`);
			fs.remove(thisSDKPath, callback);
		}, function (err) {
			next(err);
		});
	});
}

/**
 * @return {Promise<string>} path to Titanium SDK root dir
 */
function sdkDir() {
	return new Promise((resolve) => {
		exec(`node "${titanium}" config sdk.defaultInstallLocation -o json`, function (error, stdout) {
			if (error) {
				const osName = require('os').platform();
				if (osName === 'win32') {
					return resolve(path.join(process.env.ProgramData, 'Titanium'));
				} else if (osName === 'darwin') {
					return resolve(path.join(process.env.HOME, 'Library', 'Application Support', 'Titanium'));
				} else if (osName === 'linux') {
					return resolve(path.join(process.env.HOME, '.titanium'));
				}
			}
			return resolve(JSON.parse(stdout.trim()));
		});
	});
}

function cleanupModules(next) {
	sdkDir().then(sdkDir => {
		const moduleDir = path.join(sdkDir, 'modules');
		const pluginDir = path.join(sdkDir, 'plugins');
		try {
			if (fs.existsSync(moduleDir)) {
				console.log(`Removing ${moduleDir}`);
				fs.removeSync(moduleDir);
			} else {
				console.log(`${moduleDir} doesnt exist`);
			}

			if (fs.existsSync(pluginDir)) {
				console.log(`Removing ${pluginDir}`);
				fs.removeSync(pluginDir);
			} else {
				console.log(`${pluginDir} doesnt exist`);
			}

			return next();
		} catch (e) {
			console.log(e);
			return next(e);
		}
	});
}

/**
 * Installs a Titanium SDK to test against, then runs Karma.
 *
 * @param	{String} branch branch/zip/url of SDK to install. If null/undefined, no SDK will be installed
 * @param	{String} karmaConfigPath Path to the Karma config file
 * @param	{Array<String>} browsers List of browsers (custom launchers) to start
 * @param	{Boolean} skipSdkInstall Don't try to install an SDK from `branch`
 * @param	{Boolean} cleanup	Delete all the non-GA SDKs when done? Defaults to true if we installed an SDK
 * @param	{Function} callback Function to call after the test suite finished
 */
function test(branch, karmaConfigPath, browsers, skipSdkInstall, cleanup, callback) {
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
		if (!skipSdkInstall && branch) {
			console.log('Installing SDK');
			installSDK(branch, next);
		} else {
			next();
		}
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

	// @todo invoke Karma
	tasks.push(function (next) {
		const sdkVersion = path.basename(sdkPath);
		const args = [ 'start', karmaConfigPath, '--titanium.sdkVersion', sdkVersion ];
		if (browsers) {
			args.push('--browsers', browsers);
		}
		const child = fork(path.resolve(__dirname, '..', 'node_modules', '.bin', 'karma'), args);
		child.on('exit', code => {
			if (code !== 0) {
				return next(new Error(`Karma exited with non-zero exit code ${code}.`));
			}

			next();
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
		callback(err);
	});
}

// public API
exports.test = test;

// When run as single script.
if (module.id === '.') {
	(function () {
		const program = require('commander'),
			packageJson = require('../package');

		program
			.version(packageJson.version)
			.option('-b, --branch [branchName]', 'Install a specific branch of the SDK to test with', 'master')
			.option('-k, --karma-config [configPath]', 'Karma configuration file', path.resolve(__dirname, '..', 'test', 'unit', 'karma.ci.master.config.js'))
			.option('-B, --browsers <browser1,browser2>', 'Select individual browsers from the Karma config to launch')
			.option('-s, --skip-sdk-install', 'Skip the SDK installation step')
			.option('-c, --cleanup', 'Cleanup non-GA SDKs. Default is true if we install an SDK')
			.parse(process.argv);

		test(program.branch, program.karmaConfig, program.browsers, program.skipSdkInstall, program.cleanup, function (err) {
			if (err) {
				console.error(err);
				process.exit(-1);
			}
		});
	}());
}
