/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

var should = require('./utilities/assertions'),
	utilities = require('./utilities/utilities'),
	didFocus = false;

describe('Titanium.UI.WebView', function () {
	this.slow(2000);
	this.timeout(10000);

	var win;

	beforeEach(function() {
		didFocus = false;
	});

	afterEach(function() {
		if (win != null) {
			win.close();
		}
		win = null;
	});

	// FIXME: iOS errors on should(webView.loading).be.eql(true); in the beforeLoad
	(utilities.isAndroid() || utilities.isIOS() ? it.skip : it)('loading', function (finish) {
		this.slow(5000);
		this.timeout(10000);

		win = Ti.UI.createWindow();
		var webView = Ti.UI.createWebView({
			url: 'https://google.com'
		});

		should(webView.loading).be.a.Boolean;
		should(webView.loading).be.eql(false);

		webView.addEventListener('beforeload', function() {
			should(webView.loading).be.a.Boolean;
			should(webView.loading).be.eql(true);
		});

		webView.addEventListener('load', function() {
			should(webView.loading).be.a.Boolean;
			should(webView.loading).be.eql(false);

			finish();
		});

		win.add(webView);
		win.open();
	});

	it('url', function (finish) {
		win = Ti.UI.createWindow({
			backgroundColor: 'blue'
		});
		var webview = Ti.UI.createWebView();

		win.addEventListener('focus', function () {
			if (didFocus) return;
			didFocus = true;

			try {
				webview.url = 'http://www.appcelerator.com/';

				finish();
			} catch (err) {
				finish(err);
			}
		});

		win.add(webview);
		win.open();
	});

	(!utilities.isIOS() ? it.skip : it)('keyboardDisplayRequiresUserAction', function (finish) {
		win = Ti.UI.createWindow();
		var webView = Ti.UI.createWebView();

		win.addEventListener('focus', function () {
			if (didFocus) return;
			didFocus = true;

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
	(utilities.isAndroid() ? it.skip : it)('url(local)', function (finish) {
		win = Ti.UI.createWindow({
			backgroundColor: 'blue'
		});
		var webview = Ti.UI.createWebView();

		win.addEventListener('focus', function () {
			if (didFocus) return;
			didFocus = true;

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
	it('data', function(finish) {
		win = Ti.UI.createWindow({
			backgroundColor: 'blue'
		});
		var blob = Ti.Filesystem.getFile('app.js').read();
		var webview = Ti.UI.createWebView({
			data: blob
		});

		webview.addEventListener('load', function() {
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
	((utilities.isAndroid() || utilities.isIOS()) ? it.skip : it)('evalJS', function (finish) {
		win = Ti.UI.createWindow({
			backgroundColor: 'blue'
		});

		var webview = Ti.UI.createWebView(),
			hadError = false;

		webview.addEventListener('load', function () {
			if (hadError) return;

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
				var result = webview.evalJS('Ti.API.info("Hello, World!");"WebView.evalJS.TEST";');
				try {
					should(result).be.eql('WebView.evalJS.TEST'); // Android reports null

					finish();
				} catch (err) {
					finish(err);
				}
			}
		});
		win.addEventListener('focus', function () {
			if (didFocus) return;
			didFocus = true;

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

	(utilities.isWindows() ? it : it.skip)('url (ms-appx)', function (finish) {
	    this.timeout(10000);
	    var w = Ti.UI.createWindow({
	        backgroundColor: 'blue'
	    });
	    var webview = Ti.UI.createWebView();

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

	(utilities.isWindows() ? it : it.skip)('url (ms-appx-web)', function (finish) {
	    this.timeout(10000);
	    var w = Ti.UI.createWindow({
	        backgroundColor: 'blue'
	    });
	    var webview = Ti.UI.createWebView();

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

	(utilities.isWindows() ? it : it.skip)('url (ms-appx-data)', function (finish) {
	    this.timeout(10000);
	    function prepare(files) {
	        var webroot = Ti.Filesystem.applicationDataDirectory + 'webroot';
	        var webroot_file = Ti.Filesystem.getFile(webroot);
	        if (!webroot_file.exists()) {
	            webroot_file.createDirectory();
	        }
	        for (var i = 0; i < files.length; i++) {
	            var file = files[i];
	            var from = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, file);
	            var to = webroot + Ti.Filesystem.separator + file;
	            from.copy(to)
	        }
	    }
	    var w = Ti.UI.createWindow({
	        backgroundColor: 'blue'
	    });
	    var webview = Ti.UI.createWebView();
	    webview.addEventListener('load', function () {
	        w.close();
	        finish();
	    });
	    w.addEventListener('open', function () {
	        prepare(['ti.ui.webview.test.html'])
	        should(function () {
	            webview.url = 'ms-appdata:///local/webroot/ti.ui.webview.test.html';
	        }).not.throw();
	    });

	    w.add(webview);
	    w.open();
	});

});
