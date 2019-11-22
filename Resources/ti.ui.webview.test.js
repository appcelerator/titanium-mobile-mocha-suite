/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions'),
	utilities = require('./utilities/utilities');

describe('Titanium.UI.WebView', function () {
	var win;
	this.slow(3000);
	this.timeout(30000);

	afterEach(function (done) {
		if (win) {
			// If `win` is already closed, we're done.
			let t = setTimeout(function () {
				if (win) {
					win = null;
					done();
				}
			}, 3000);

			win.addEventListener('close', function listener () {
				clearTimeout(t);

				if (win) {
					win.removeEventListener('close', listener);
				}
				win = null;
				done();
			});
			win.close();
		} else {
			win = null;
			done();
		}
	});

	// FIXME: I think we need to tweak the test here. Set URL property after adding the listeners!
	// iOS works most of the time, but also has some odd failures sometimes. SDK 8+ is reworking this.
	it.allBroken('loading', function (finish) {
		var webView,
			beforeLoaded = false;

		this.slow(5000);
		this.timeout(10000);

		win = Ti.UI.createWindow();
		webView = Ti.UI.createWebView({
			url: 'https://www.google.com'
		});

		should(webView.loading).be.a.Boolean;
		should(webView.loading).be.eql(false); // Windows Desktop gives true here

		webView.addEventListener('beforeload', function () {
			if (beforeLoaded === false) {
				should(webView.loading).be.a.Boolean;
				should(webView.loading).be.eql(false);

				// Use this flag for our test, because "beforeload" also fires for resources
				// inside the web-page (e.g. scripts), so this particular test may fail due
				// to recurring triggers of this event.
				beforeLoaded = true;
			}
		});

		webView.addEventListener('load', function () {
			should(webView.loading).be.a.Boolean;
			should(webView.loading).be.eql(false);

			finish();
		});

		win.add(webView);
		win.open();
	});

	// FIXME: This test fails intermittently on iOS. I'm changign the url to Google to see if that helps any
	it('url', function (finish) {
		var webview;
		win = Ti.UI.createWindow({
			backgroundColor: 'blue'
		});
		webview = Ti.UI.createWebView();

		win.addEventListener('focus', function () {
			try {
				webview.url = 'https://www.google.com';

				finish();
			} catch (err) {
				finish(err);
			}
		});

		win.add(webview);
		win.open();
	});

	it.ios('keyboardDisplayRequiresUserAction', function (finish) {
		var webView;
		win = Ti.UI.createWindow();
		webView = Ti.UI.createWebView();

		win.addEventListener('focus', function () {
			try {
				webView.keyboardDisplayRequiresUserAction = true;

				should(webView.keyboardDisplayRequiresUserAction).be.a.Boolean;
				should(webView.getKeyboardDisplayRequiresUserAction()).be.a.Boolean;
				should(webView.keyboardDisplayRequiresUserAction).be.eql(true);
				should(webView.getKeyboardDisplayRequiresUserAction()).be.eql(true);

				webView.setKeyboardDisplayRequiresUserAction(false);

				should(webView.keyboardDisplayRequiresUserAction).be.a.Boolean;
				should(webView.getKeyboardDisplayRequiresUserAction()).be.a.Boolean;
				should(webView.keyboardDisplayRequiresUserAction).be.eql(false);
				should(webView.getKeyboardDisplayRequiresUserAction()).be.eql(false);

				finish();
			} catch (err) {
				finish(err);
			}
		});

		win.add(webView);
		win.open();
	});

	// FIXME Times out on Android build machine. No idea why... Must be we never get focus event?
	it.androidBroken('url(local)', function (finish) {
		var webview;
		win = Ti.UI.createWindow({
			backgroundColor: 'blue'
		});
		webview = Ti.UI.createWebView();

		win.addEventListener('focus', function () {
			try {
				webview.url = 'ti.ui.webview.test.html';

				finish();
			} catch (err) {
				finish(err);
			}
		});

		win.add(webview);
		win.open();
	});

	// TIMOB-23542 webview data test
	it('data', function (finish) {
		var blob,
			webview;
		win = Ti.UI.createWindow({
			backgroundColor: 'blue'
		});
		blob = Ti.Filesystem.getFile('app.js').read();
		webview = Ti.UI.createWebView({
			data: blob
		});

		webview.addEventListener('load', function () {
			should(webview.data).be.an.object;
			finish();
		});
		win.add(webview);
		win.open();
	});

	// Skip this on desktop Windows apps because it crashes the app now. - Works fine locally, to investigate EH
	// FIXME Parity issue! Windows require second argument which is callback function. Other platforms return value sync!
	// FIXME Android returns null?
	// FIXME Sometimes times out on iOS. Not really sure why...
	(((utilities.isWindows10() && utilities.isWindowsDesktop()) || utilities.isAndroid() || utilities.isIOS()) ? it.skip : it)('evalJS', function (finish) {
		var webview,
			hadError = false,
			result;
		win = Ti.UI.createWindow({
			backgroundColor: 'blue'
		});

		webview = Ti.UI.createWebView();

		webview.addEventListener('load', function () {
			if (hadError) {
				return;
			}

			if (utilities.isWindows()) { // Windows requires an async callback function
				webview.evalJS('Ti.API.info("Hello, World!");"WebView.evalJS.TEST";', function (result) {
					try {
						should(result).be.eql('WebView.evalJS.TEST');

						finish();
					} catch (err) {
						finish(err);
					}
				});
			} else { // other platforms return the result as result of function call!
				result = webview.evalJS('Ti.API.info("Hello, World!");"WebView.evalJS.TEST";');
				try {
					should(result).be.eql('WebView.evalJS.TEST'); // Android reports null

					finish();
				} catch (err) {
					finish(err);
				}
			}
		});
		win.addEventListener('focus', function () {
			try {
				webview.url = 'ti.ui.webview.test.html';
			} catch (err) {
				hadError = true;
				finish(err);
			}
		});

		win.add(webview);
		win.open();
	});

	describe.windows('ms-appx* urls', function () {
		this.timeout(10000);

		it('ms-appx:', function (finish) {
			var w,
				webview;

			w = Ti.UI.createWindow({
				backgroundColor: 'blue'
			});
			webview = Ti.UI.createWebView();

			webview.addEventListener('load', function () {
				w.close();
				finish();
			});
			w.addEventListener('open', function () {
				should(function () {
					webview.url = 'ms-appx:///ti.ui.webview.test.html';
				}).not.throw();
			});

			w.add(webview);
			w.open();
		});

		it('ms-appx-web:', function (finish) {
			var w,
				webview;

			w = Ti.UI.createWindow({
				backgroundColor: 'blue'
			});
			webview = Ti.UI.createWebView();

			webview.addEventListener('load', function () {
				w.close();
				finish();
			});
			w.addEventListener('open', function () {
				should(function () {
					webview.url = 'ms-appx-web:///ti.ui.webview.test.html';
				}).not.throw();
			});

			w.add(webview);
			w.open();
		});

		it('ms-appx-data:', function (finish) {
			var w,
				webview;

			function prepare(files) {
				var webroot = Ti.Filesystem.applicationDataDirectory + 'webroot',
					webroot_file = Ti.Filesystem.getFile(webroot),
					i,
					file,
					from,
					to;

				if (!webroot_file.exists()) {
					webroot_file.createDirectory();
				}
				for (i = 0; i < files.length; i++) {
					file = files[i];
					from = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, file);
					to = webroot + Ti.Filesystem.separator + file;
					from.copy(to);
				}
			}

			w = Ti.UI.createWindow({
				backgroundColor: 'blue'
			});
			webview = Ti.UI.createWebView();
			webview.addEventListener('load', function () {
				w.close();
				finish();
			});
			w.addEventListener('open', function () {
				prepare([ 'ti.ui.webview.test.html' ]);
				should(function () {
					webview.url = 'ms-appdata:///local/webroot/ti.ui.webview.test.html';
				}).not.throw();
			});

			w.add(webview);
			w.open();
		});
	});

	it.windowsBroken('userAgent', function (finish) {
		var webView = Ti.UI.createWebView({
				userAgent: 'TEST AGENT'
			}),
			url = 'https://www.whoishostingthis.com/tools/user-agent/',
			retry = 3;

		win = Ti.UI.createWindow({ backgroundColor: 'gray' });

		webView.addEventListener('load', function (e) {
			var exp = /"info-box user-agent">(.*)<\/div>/g.exec(e.source.html),
				userAgent = exp && exp.length > 1 ? exp[1] : undefined;
			if (userAgent && userAgent === webView.userAgent) {
				finish();
			} else if (retry--) {
				Ti.API.warn('could not obtain userAgent, retrying...');
				setTimeout(function () {
					webView.url = url;
				}, 1000);
			} else {
				finish(new Error('invalid userAgent'));
			}
		});
		win.add(webView);
		webView.url = url;
		win.open();
	});

	// FIXME: temperamental on Android and broken on Windows
	it.androidAndWindowsBroken('.zoomLevel', function (finish) {
		var webView;

		this.slow(5000);
		this.timeout(10000);

		win = Ti.UI.createWindow();

		webView = Ti.UI.createWebView({
			html: '<!DOCTYPE html><html><body><p>HELLO WORLD</p></body></html>'
		});

		webView.addEventListener('load', function () {
			try {
				should(webView.zoomLevel).be.a.Number;
				should(webView.zoomLevel).eql(1.0);
				setTimeout(function () {
					try {
						webView.zoomLevel = 3.0;
						should(webView.zoomLevel).eql(3.0);
						setTimeout(function () {
							try {
								webView.zoomLevel = 1.0;
								should(webView.zoomLevel).eql(1.0);
								finish();
							} catch (e) {
								finish(e);
							}
						}, 500);
					} catch (e) {
						finish(e);
					}
				}, 500);
			} catch (e) {
				finish(e);
			}
		});

		win.add(webView);
		win.open();
	});

	it('#evalJS(string, function) - async variant', function (finish) {
		let webview = Ti.UI.createWebView();

		win = Ti.UI.createWindow({
			backgroundColor: 'blue'
		});

		webview.addEventListener('load', function () {

			// FIXME: Android is dumb and assumes no trailing semicolon!
			webview.evalJS('Ti.API.info("Hello, World!");"WebView.evalJS.TEST"', function (result) {
				try {
					if (utilities.isAndroid()) {
						should(result).be.eql('"WebView.evalJS.TEST"'); // FIXME: Why the double-quoting?
					} else {
						should(result).be.eql('WebView.evalJS.TEST');
					}

					finish();
				} catch (err) {
					finish(err);
				}
			});
		});

		win.add(webview);
		win.open();

		webview.url = 'ti.ui.webview.test.html';
	});

	// FIXME: This crashes on device with iOS 13
	it.iosBroken('should handle file URLs with spaces in path - TIMOB-18765', function (finish) {
		// Should handle paths with spaces!
		var URL = Ti.Filesystem.resourcesDirectory + '/folder with spaces/comingSoon.html',
			webView = Ti.UI.createWebView({
				top: 30
			});

		webView.addEventListener('error', function () {
			finish('Failed to load HTML file from URL with spaces in path');
		});

		webView.addEventListener('load', function (e) {
			if (utilities.isIOS()) {
				should(e.url).eql('file://' + Ti.Filesystem.resourcesDirectory + 'folder%20with%20spaces/comingSoon.html');
			}
			// TODO: Replace above iOS test with below once TIMOB-26848 PR is merged in.
			// if (utilities.isAndroid() || utilities.isIOS()) {
			// 	// Resulting WebView URL is expected to be a %-encoded "file://" URL.
			// 	// Note: File.nativePath returns unencoded path on Android and %-encoded path on iOS.
			// 	let expectedUrl = Ti.Filesystem.getFile(URL).nativePath;
			// 	if (utilities.isAndroid()) {
			// 		expectedUrl = encodeURI(expectedUrl);
			// 	}
			// 	should(e.url).eql(expectedUrl);
			// }
			finish();
		});

		win = Ti.UI.createWindow({
			backgroundColor: 'white'
		});

		win.add(webView);
		win.open();

		webView.url = URL;
	});

	it.ios('startListeningToProperties', function (finish) {
		var webView;

		win = Ti.UI.createWindow();
		webView = Ti.UI.createWebView({
			url: 'https://google.com'
		});

		webView.startListeningToProperties([ 'title' ]);
		webView.addEventListener('title', function () {
			finish();
		});
		win.add(webView);
		win.open();
	});

	it.iosAndWindowsBroken('sslerror', function (finish) {
		let webView;
		const url = 'https://expired.badssl.com/';

		win = Ti.UI.createWindow();
		webView = Ti.UI.createWebView({
			url: url
		});

		webView.addEventListener('sslerror', function () {
			finish();
		});

		webView.addEventListener('error', function () {
			setTimeout(() => {
				console.warn('failed to load url, retrying...');
				webView.url = url;
			}, 5000);
		});

		win.add(webView);
		win.open();
	});

	it.ios('blacklisturl', function (finish) {
		var webView;

		win = Ti.UI.createWindow();
		webView = Ti.UI.createWebView({
			url: 'https://google.com',
			blacklistedURLs: [ 'https://google.com' ]
		});

		webView.addEventListener('blacklisturl', function () {
			finish();
		});
		win.add(webView);
		win.open();
	});

	it.ios('basicAuthentication', function (finish) {
		let webView;
		const url = 'https://httpbin.org/basic-auth/user/password';

		win = Ti.UI.createWindow();
		webView = Ti.UI.createWebView({
			url: url,
			basicAuthentication: { username: 'user', password: 'password' }
		});

		webView.addEventListener('load', function () {
			finish();
		});

		webView.addEventListener('sslerror', function (e) {
			finish(e);
		});

		webView.addEventListener('error', function () {
			setTimeout(() => {
				console.warn('failed to load url, retrying...');
				webView.url = url;
			}, 5000);
		});

		win.add(webView);
		win.open();
	});

	it.iosAndWindowsBroken('ignoreSslError', function (finish) {
		let webView;
		const url = 'https://expired.badssl.com/';

		win = Ti.UI.createWindow();
		webView = Ti.UI.createWebView({
			url: url,
			ignoreSslError: true
		});

		webView.addEventListener('load', function () {
			finish();
		});

		webView.addEventListener('error', function () {
			setTimeout(() => {
				console.warn('failed to load url, retrying...');
				webView.url = url;
			}, 5000);
		});

		win.add(webView);
		win.open();
	});

	// Verifies local HTML file can access local JS file and invoke an HTML "onload" callback.
	it.windowsMissing('html-script-tag', function (finish) {
		this.slow(3000);
		this.timeout(10000);

		Ti.App.addEventListener('ti.ui.webview.script.tag:onPageLoaded', function () {
			finish();
		});

		win = Ti.UI.createWindow();
		win.add(Ti.UI.createWebView({
			url: 'ti.ui.webview.script.tag.html'
		}));
		win.open();
	});

	it.ios('beforeload', (finish) => {
		let webView;
		const url = 'https://www.appcelerator.com/';
		var beforeLoaded = false;

		win = Ti.UI.createWindow();
		webView = Ti.UI.createWebView({
			url: url
		});

		webView.addEventListener('beforeload', (e) => {
			if (beforeLoaded === true) {
				if (e.url !== url) {
					webView.stopLoading();
					finish();
				}
			}
			beforeLoaded = true;
		});

		win.add(webView);
		win.open();
	});

	it('baseURL should be accessible via window.location', (done) => {
		const win = Ti.UI.createWindow();
		const baseURL = 'https://www.google.com/';
		const webView = Ti.UI.createWebView();
		webView.setHtml(
			'<html><body></body></html>',
			{
				baseURL
			}
		);
		webView.addEventListener('load', () => {
			webView.evalJS('window.location.href', result => {
				try {
					should(result.replace(/"/g, '')).be.eql(baseURL); // Android encloses the URL in quotes, not sure why.
				} catch (err) {
					return done(err);
				} finally {
					win.close();
				}
				done();
			});
		});
		win.add(webView);
		win.open();
	});

	it.windowsBroken('basic authentication should work properly', (done) => {
		const win = Ti.UI.createWindow();
		const webView = Ti.UI.createWebView({
			url: 'https://jigsaw.w3.org/HTTP/Basic/'
		});
		webView.setBasicAuthentication('guest', 'guest');
		webView.addEventListener('load', () => {
			win.close();
			done();
		});
		win.add(webView);
		win.open();
	});
});
