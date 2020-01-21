/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
const should = require('./utilities/assertions');
const utilities = require('./utilities/utilities');

describe('Titanium.UI.Window', function () {
	var win;

	this.timeout(5000);

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

	it('.title', function () {
		win = Ti.UI.createWindow({
			title: 'this is some text'
		});
		should(win.title).be.a.String;
		should(win.getTitle).be.a.Function;
		should(win.title).eql('this is some text');
		should(win.getTitle()).eql('this is some text');
		win.title = 'other text';
		should(win.title).eql('other text');
		should(win.getTitle()).eql('other text');
	});

	it('.titleid', function () {
		win = Ti.UI.createWindow({
			titleid: 'this_is_my_key'
		});
		should(win.titleid).be.a.String;
		should(win.getTitleid).be.a.Function;
		should(win.titleid).eql('this_is_my_key');
		should(win.getTitleid()).eql('this_is_my_key');
		should(win.title).eql('this is my value');
		win.titleid = 'other text';
		should(win.titleid).eql('other text');
		should(win.getTitleid()).eql('other text');
		should(win.title).eql('this is my value'); // FIXME Windows: https://jira.appcelerator.org/browse/TIMOB-23498
	});

	// TODO Why not run this on iOS? Seems to fail, though
	describe.android('.orientationModes', function () {
		this.slow(5000);
		this.timeout(20000);

		function doOrientationModeTest(orientation, finish) {
			win = Ti.UI.createWindow({
				orientationModes: [ orientation ]
			});
			win.addEventListener('open', function () {
				try {
					win.orientationModes.should.have.length(1);
					win.orientationModes[0].should.eql(orientation);
					win.orientation.should.eql(orientation); // FIXME Fails on LANDSCAPE_RIGHT
					finish();
				} catch (e) {
					finish(e);
				}
			});
			win.open();
		}

		it('PORTRAIT', function (finish) {
			doOrientationModeTest(Ti.UI.PORTRAIT, finish);
		});

		it.androidBroken('LANDSCAPE_LEFT', function (finish) {
			doOrientationModeTest(Ti.UI.LANDSCAPE_LEFT, finish);
		});

		it.androidBroken('LANDSCAPE_RIGHT', function (finish) {
			doOrientationModeTest(Ti.UI.LANDSCAPE_RIGHT, finish);
		});
	});

	// FIXME Move these rect/size tests into Ti.UI.View!
	it.windowsBroken('.size is read-only', function (finish) {
		win = Ti.UI.createWindow({
			backgroundColor: 'blue',
			width: 100,
			height: 100
		});
		win.addEventListener('postlayout', function listener () {
			win.removeEventListener('postlayout', listener);

			try {
				win.size.width.should.eql(100);
				win.size.height.should.eql(100);
				// size just returns 0 for x/y
				win.size.x.should.eql(0);
				win.size.y.should.eql(0);

				// try to change the size
				win.size.width = 120;
				win.size.height = 120;

				// shouldn't actually change
				win.size.width.should.eql(100);
				win.size.height.should.eql(100);
				win.size.x.should.eql(0);
				win.size.y.should.eql(0);

				finish();
			} catch (err) {
				finish(err);
			}
		});
		win.open();
	});

	it.androidAndWindowsBroken('.rect is read-only', function (finish) {
		win = Ti.UI.createWindow({
			backgroundColor: 'green',
			left: 100,
			right: 100
		});
		win.addEventListener('postlayout', function listener () {
			win.removeEventListener('postlayout', listener);

			let width,
				height;
			try {
				win.rect.x.should.eql(100); // get 0 on Android
				win.rect.y.should.eql(0);
				width = win.rect.width;
				height = win.rect.height;

				// try to change the rect
				win.rect.x = 120;
				win.rect.y = 5;
				win.rect.width = 10;
				win.rect.height = 5;

				// shouldn't actually change
				win.rect.x.should.eql(100);
				win.rect.y.should.eql(0);
				win.rect.width.should.eql(width);
				win.rect.height.should.eql(height);

				finish();
			} catch (err) {
				finish(err);
			}
		});
		win.open();
	});

	it('#remove(View)', function (finish) {
		var view;
		this.slow(1000);
		this.timeout(20000);

		win = Ti.UI.createWindow({
			backgroundColor: 'gray'
		});
		view = Ti.UI.createView();
		win.addEventListener('focus', function listener () {
			win.removeEventListener('focus', listener);

			try {
				should(win.children.length).be.eql(1);
				win.remove(win.children[0]);
				should(win.children.length).be.eql(0);

				finish();
			} catch (err) {
				finish(err);
			}
		});
		win.add(view);
		win.open();
	});

	describe('events', function () {
		this.timeout(20000);

		// FIXME https://jira.appcelerator.org/browse/TIMOB-23640
		it.windowsDesktopBroken('postlayout event gets fired', function (finish) {
			win = Ti.UI.createWindow({ backgroundColor: 'yellow' });

			// Confirms that Ti.UI.Window fires postlayout event
			win.addEventListener('postlayout', function listener () {
				win.removeEventListener('postlayout', listener);

				finish();
			});
			win.open();
		});

		it('blur event is fired when closed', function (finish) {
			this.slow(5000);

			win = Ti.UI.createWindow({
				backgroundColor: 'pink'
			});

			win.addEventListener('blur', function () {
				finish();
			});
			win.addEventListener('open', function () {
				setTimeout(function () {
					win.close();
				}, 500);
			});
			win.open();
		});

		it('focus event is fired when opened', function (finish) {
			this.slow(2000);

			win = Ti.UI.createWindow({
				backgroundColor: 'pink'
			});

			win.addEventListener('focus', function () {
				finish();
			});
			win.open();
		});

		it('open event is fired', function (finish) {
			this.slow(2000);

			win = Ti.UI.createWindow({
				backgroundColor: 'pink'
			});

			win.addEventListener('open', function () {
				finish();
			});
			win.open();
		});

		it('close event is fired', function (finish) {
			this.slow(5000);

			win = Ti.UI.createWindow({
				backgroundColor: 'pink'
			});
			win.addEventListener('close', function listener () {
				if (win) {
					win.removeEventListener('close', listener);
				}
				finish();
			});
			win.addEventListener('open', function listener () {
				win.close();
			});
			win.open();
		});
	});

	// For this test, you should see errors in the console, it is expected.
	// What you should not see is a crash
	it('should_not_crash', function (finish) {
		var win1,
			win2;
		this.slow(5000);
		this.timeout(20000);

		win1 = Ti.UI.createWindow();
		win1.open();
		win1.close();
		win2 = Ti.UI.createWindow();
		win2.close();
		win1.open();
		win2.close();
		setTimeout(function () {
			win1.close();
			setTimeout(function () {
				win1.close();
				finish();
			}, 1000);
		}, 1000);
	});

	it('window_close_order_1', function (finish) {
		var win2,
			win3;
		this.slow(5000);
		this.timeout(30000);

		win = Ti.UI.createWindow({ backgroundColor: 'green' });
		win2 = Ti.UI.createWindow({ backgroundColor: 'blue' });
		win3 = Ti.UI.createWindow({ backgroundColor: 'gray' });

		function focus() {
			win.removeEventListener('focus', focus);
			win2.open();
			setTimeout(function () {
				win3.open();
				setTimeout(function () {
					win3.close();
					setTimeout(function () {
						win2.close();
						finish();
					}, 500);
				}, 500);
			}, 500);
		}
		win.addEventListener('focus', focus);

		win.open();
	});

	it('window_close_order_2', function (finish) {
		var win2,
			win3;
		this.slow(5000);
		this.timeout(20000);

		win = Ti.UI.createWindow({ backgroundColor: 'green' });
		win2 = Ti.UI.createWindow({ backgroundColor: 'blue' });
		win3 = Ti.UI.createWindow({ backgroundColor: 'gray' });

		function focus() {
			win.removeEventListener('focus', focus);
			win2.open();
			setTimeout(function () {
				win3.open();
				win2.close();
				setTimeout(function () {
					win3.close();
					finish();
				}, 500);
			}, 500);
		}

		win.addEventListener('focus', focus);

		win.open();
	});

	// TIMOB-20600
	it('TIMOB-20600', function (finish) {
		var win2,
			win3;
		this.slow(5000);
		this.timeout(30000);

		win = Ti.UI.createWindow({ backgroundColor: 'green' });
		win2 = Ti.UI.createWindow({ backgroundColor: 'blue' });
		win3 = Ti.UI.createWindow({ backgroundColor: 'gray' });

		function focus() {
			win.removeEventListener('focus', focus);
			win2.open();
			setTimeout(function () {
				win3.open();
				setTimeout(function () {
					win2.close();
					setTimeout(function () {
						win3.close();
						finish();
					}, 500);
				}, 500);
			}, 500);
		}
		win.addEventListener('focus', focus);

		win.open();
	});

	it.iosAndWindowsBroken('#toString()', function () {
		win = Ti.UI.createWindow();
		should(win.toString()).be.eql('[object Window]'); // Windows: '[object class TitaniumWindows::UI::Window]', iOS: '[object TiUIWindow]'
		should(win.apiName).be.a.String;
		should(win.apiName).be.eql('Ti.UI.Window');
	});

	it('Stringify unopened Window', function () {
		win = Ti.UI.createWindow();
		Ti.API.info(JSON.stringify(win));
	});

	// Times out on Android and Windows Desktop
	it.androidAndWindowsDesktopBroken('window_navigation', function (finish) {
		var rootWindowFocus = 0;
		var rootWindowBlur = 0;
		var rootWindowOpen = 0;
		var rootWindowClose = 0;
		var secondWindowFocus = 0;
		var secondWindowBlur = 0;
		var secondWindowOpen = 0;
		var secondWindowClose = 0;
		var thirdWindowFocus = 0;
		var thirdWindowBlur = 0;
		var thirdWindowOpen = 0;
		var thirdWindowClose = 0;

		var rootWindow = Ti.UI.createWindow({
			backgroundColor: 'navy'
		});

		rootWindow.addEventListener('focus', function () { rootWindowFocus++; }); // eslint-disable-line max-statements-per-line
		rootWindow.addEventListener('blur', function () { rootWindowBlur++; }); // eslint-disable-line max-statements-per-line
		rootWindow.addEventListener('open', function () { rootWindowOpen++; }); // eslint-disable-line max-statements-per-line
		rootWindow.addEventListener('close', function () { rootWindowClose++; }); // eslint-disable-line max-statements-per-line
		rootWindow.open();

		setTimeout(function () {
			var secondWindow = Ti.UI.createWindow({
				backgroundColor: 'pink'
			});
			secondWindow.addEventListener('focus', function () { secondWindowFocus++; }); // eslint-disable-line max-statements-per-line
			secondWindow.addEventListener('blur', function () { secondWindowBlur++; }); // eslint-disable-line max-statements-per-line
			secondWindow.addEventListener('open', function () { secondWindowOpen++; }); // eslint-disable-line max-statements-per-line
			secondWindow.addEventListener('close', function () { secondWindowClose++; }); // eslint-disable-line max-statements-per-line
			secondWindow.open();

			setTimeout(function () {
				var thirdWindow = Ti.UI.createWindow({
					backgroundColor: 'green'
				});
				thirdWindow.addEventListener('focus', function () { thirdWindowFocus++; }); // eslint-disable-line max-statements-per-line
				thirdWindow.addEventListener('blur', function () { thirdWindowBlur++; }); // eslint-disable-line max-statements-per-line
				thirdWindow.addEventListener('open', function () { thirdWindowOpen++; }); // eslint-disable-line max-statements-per-line
				thirdWindow.addEventListener('close', function () { thirdWindowClose++; }); // eslint-disable-line max-statements-per-line
				thirdWindow.open();

				setTimeout(function () {
					thirdWindow.close();
					setTimeout(function () {
						secondWindow.close();
						setTimeout(function () {
							rootWindow.close();
							try {
								should(rootWindowFocus).be.eql(2);
								should(rootWindowBlur).be.eql(2);
								should(rootWindowOpen).be.eql(1);
								should(rootWindowClose).be.eql(1);

								should(secondWindowFocus).be.eql(2);
								should(secondWindowBlur).be.eql(2);
								should(secondWindowOpen).be.eql(1);
								should(secondWindowClose).be.eql(1);

								should(thirdWindowFocus).be.eql(1);
								should(thirdWindowBlur).be.eql(1);
								should(thirdWindowOpen).be.eql(1);
								should(thirdWindowClose).be.eql(1);
								finish();
							} catch (err) {
								finish(err);
							}
						}, 500);
					}, 500);
				}, 500);
			}, 500);
		}, 500);
	});

	it('#applyProperties(Object)', function () {
		win = Ti.UI.createWindow();
		win.open();
		should(win.custom).not.exist;
		win.applyProperties({ custom: 1234 });
		should(win.custom).be.eql(1234);
	});

	it.ios('largeTitleEnabled', function () {
		win = Ti.UI.createWindow({
			title: 'this is some text',
			largeTitleEnabled: true
		});

		should(win.largeTitleEnabled).be.a.Boolean;
		should(win.getLargeTitleEnabled).be.a.Function;
		should(win.setLargeTitleEnabled).be.a.Function;

		should(win.largeTitleEnabled).eql(true);
		should(win.getLargeTitleEnabled()).eql(true);

		win.largeTitleEnabled = false;
		should(win.largeTitleEnabled).eql(false);
		should(win.getLargeTitleEnabled()).eql(false);

		win.setLargeTitleEnabled(true);
		should(win.largeTitleEnabled).eql(true);
		should(win.getLargeTitleEnabled()).eql(true);
	});

	it.ios('largeTitleDisplayMode', function () {
		win = Ti.UI.createWindow({
			title: 'this is some text',
			largeTitleDisplayMode: Ti.UI.iOS.LARGE_TITLE_DISPLAY_MODE_ALWAYS
		});

		should(win.largeTitleDisplayMode).be.a.Number;
		should(win.getLargeTitleDisplayMode).be.a.Function;
		should(win.setLargeTitleDisplayMode).be.a.Function;

		should(win.largeTitleDisplayMode).eql(Ti.UI.iOS.LARGE_TITLE_DISPLAY_MODE_ALWAYS);
		should(win.getLargeTitleDisplayMode()).eql(Ti.UI.iOS.LARGE_TITLE_DISPLAY_MODE_ALWAYS);

		win.largeTitleDisplayMode = Ti.UI.iOS.LARGE_TITLE_DISPLAY_MODE_AUTOMATIC;
		should(win.largeTitleDisplayMode).eql(Ti.UI.iOS.LARGE_TITLE_DISPLAY_MODE_AUTOMATIC);
		should(win.getLargeTitleDisplayMode()).eql(Ti.UI.iOS.LARGE_TITLE_DISPLAY_MODE_AUTOMATIC);

		win.setLargeTitleDisplayMode(Ti.UI.iOS.LARGE_TITLE_DISPLAY_MODE_NEVER);
		should(win.largeTitleDisplayMode).eql(Ti.UI.iOS.LARGE_TITLE_DISPLAY_MODE_NEVER);
		should(win.getLargeTitleDisplayMode()).eql(Ti.UI.iOS.LARGE_TITLE_DISPLAY_MODE_NEVER);
	});

	it.ios('.extendSafeArea', function (finish) {
		this.timeout(5000);
		// TODO: Add more unit tests related to top, bottom, left, right margins of win.safeAreaView.
		win = Ti.UI.createWindow({
			backgroundColor: 'gray',
			extendSafeArea: false
		});

		win.addEventListener('open', function () {
			try {
				should(win.safeAreaView).be.a.Object;
				finish();
			} catch (e) {
				finish(e);
			}
		});

		win.open();
	});

	it.ios('.homeIndicatorAutoHidden', function (finish) {
		win = Ti.UI.createWindow({
			title: 'this is some text'
		});

		win.addEventListener('open', function () {
			try {
				should(win.homeIndicatorAutoHidden).be.a.Boolean;
				should(win.homeIndicatorAutoHidden).be.false;
				win.setHomeIndicatorAutoHidden(true);
				should(win.homeIndicatorAutoHidden).be.true;
				finish();
			} catch (e) {
				finish(e);
			}
		});
		win.open();
	});

	it.ios('.hidesBackButton', function (finish) {
		var window1 = Ti.UI.createWindow({
			backgroundColor: 'red'
		});

		var window2 = Ti.UI.createWindow({
			hidesBackButton: true,
			backgroundColor: 'yellow'
		});

		window1.addEventListener('focus', function () {
			win.openWindow(window2, { animated: false });
		});
		window2.addEventListener('open', function () {
			try {
				should(window2.hidesBackButton).be.a.Boolean;

				should(window2.getHidesBackButton).be.a.Function;
				should(window2.setHidesBackButton).be.a.Function;

				should(window2.hidesBackButton).be.eql(true);
				should(window2.getHidesBackButton()).be.eql(true);

				window2.hidesBackButton = false;
				should(window2.hidesBackButton).be.eql(false);
				should(window2.getHidesBackButton()).be.eql(false);

				window2.setHidesBackButton(true);
				should(window2.hidesBackButton).be.eql(true);
				should(window2.getHidesBackButton()).be.eql(true);
				finish();
			} catch (err) {
				finish(err);
			}
		});
		win = Ti.UI.iOS.createNavigationWindow({
			window: window1
		});
		win.open({ modal: true, animated: false });
	});

	// As of Android 8.0, the OS will throw an exception if you apply a fixed orientation to a translucent window.
	// Verify that Titanium handles the issue and avoids a crash.
	it.android('TIMOB-26157', function (finish) {
		this.slow(1000);
		this.timeout(5000);

		win = Ti.UI.createWindow({
			backgroundColor: 'rgba(0,0,255,128)',
			opacity: 0.5,
			orientationModes: [ Ti.UI.PORTRAIT ]
		});
		win.addEventListener('open', function () {
			finish();
		});
		win.open();
	});

	it.ios('.statusBarStyle', function (finish) {
		win = Ti.UI.createWindow({
			title: 'This is status bar style test',
			statusBarStyle: Ti.UI.iOS.StatusBar.LIGHT_CONTENT
		});

		win.addEventListener('open', function () {
			try {
				should(win.statusBarStyle).be.a.Number;
				should(win.statusBarStyle).eql(Ti.UI.iOS.StatusBar.LIGHT_CONTENT);
				win.setStatusBarStyle(Ti.UI.iOS.StatusBar.GRAY);
				should(win.statusBarStyle).eql(Ti.UI.iOS.StatusBar.GRAY);
				finish();
			} catch (err) {
				finish(err);
			}
		});
		win.open();
	});

	it('.safeAreaPadding with extendSafeArea false', function (finish) {
		this.slow(5000);

		win = Ti.UI.createWindow({
			extendSafeArea: false,
		});
		win.addEventListener('postlayout', function listener () {
			win.removeEventListener('postlayout', listener);

			try {
				var padding = win.safeAreaPadding;
				should(padding).be.a.Object;
				should(padding.left).be.eql(0);
				should(padding.top).be.eql(0);
				should(padding.right).be.eql(0);
				should(padding.bottom).be.eql(0);
				finish();
			} catch (err) {
				finish(err);
			}
		});
		win.open();
	});

	// This test will only pass on Android 4.4 and higher since older versions do not support translucent bars.
	it.android('.safeAreaPadding with extendSafeArea true', function (finish) {
		this.slow(5000);

		win = Ti.UI.createWindow({
			extendSafeArea: true,
			theme: 'Theme.AppCompat.NoTitleBar',
			orientationModes: [ Ti.UI.PORTRAIT ],
			windowFlags: Ti.UI.Android.FLAG_TRANSLUCENT_STATUS | Ti.UI.Android.FLAG_TRANSLUCENT_NAVIGATION
		});
		win.addEventListener('postlayout', function listener () {
			win.removeEventListener('postlayout', listener);

			try {
				var padding = win.safeAreaPadding;
				should(padding).be.a.Object;
				should(padding.top).be.aboveOrEqual(0);
				should(padding.bottom).be.aboveOrEqual(0);
				should(padding.left).be.aboveOrEqual(0);
				should(padding.right).be.aboveOrEqual(0);
				finish();
			} catch (err) {
				finish(err);
			}
		});
		win.open();
	});

	function hasPhysicalHomeButton() {
		const model = Ti.Platform.model;
		const trimmed = model.replace(' (Simulator)', '').trim();
		const matches = trimmed.match(/(iPhone|iPad)(\d+),(\d+)/);
		const iPhoneOriPad = matches[1];
		const majorVersion = parseInt(matches[2], 10);
		if (iPhoneOriPad === 'iPhone') {
			const minorVersion = parseInt(matches[3], 10);
			// iPhones after iPhone X have no home button
			if (majorVersion > 10) {
				return false;
			}
			// iPhones before iPhone X have home button
			if (majorVersion < 10) {
				return true;
			}
			// iPhone X has no home button (but iPhone 8 does!)
			if (minorVersion === 3 || minorVersion === 6) {
				return false;
			}
			return true; // iPhone 8 models

		} else if (iPhoneOriPad === 'iPad') {
			// iPads version 8+ have no home button, before do
			return majorVersion < 8;
		}
		return true;
	}

	it.ios('.safeAreaPadding for window inside navigation window with extendSafeArea true', function (finish) {
		var window = Ti.UI.createWindow({
			extendSafeArea: true,
		});
		win = Ti.UI.createNavigationWindow({
			window: window
		});
		window.addEventListener('postlayout', function listener () {
			window.removeEventListener('postlayout', listener);

			try {
				var padding = window.safeAreaPadding;
				should(padding).be.a.Object;
				// top padding should always be 0 when inside a navigation window, notch or not
				should(padding.top).be.eql(0);
				should(padding.left).be.eql(0);
				should(padding.right).be.eql(0);

				if (hasPhysicalHomeButton()) {
					should(padding.bottom).be.eql(0);
				} else {
					let bottom;
					if (utilities.isIPad()) {
						// https://useyourloaf.com/blog/supporting-new-ipad-pro-models/
						// Top: 24 pts, bottom: 20 pts in Portrait *and* landscape
						bottom = 20;
						// https://stackoverflow.com/questions/46376860/what-is-the-safe-region-for-iphone-x-in-pixels-that-factors-the-top-notch-an/49174154
					} else if (Ti.Gesture.landscape) {
						// Bottom: 21 pt, left/right: 44 pt for iPhones in Landscape
						bottom = 21;
					} else {
						// Top: 44 pt, bottom: 34 pt for iPhones in Portrait
						bottom = 34;
					}
					should(padding.bottom).be.eql(bottom);
				}
				finish();
			} catch (err) {
				finish(err);
			}
		});
		win.open();
	});

	// Performs an Android shared-element transition animation between 2 windows.
	// Labels from parent window will move to child window's label positions during open animation.
	it.android('#addSharedElement()', function (finish) {
		this.slow(5000);
		this.timeout(10000);

		win = Ti.UI.createWindow({
			backgroundColor: 'blue'
		});
		const sourceLabel1 = Ti.UI.createLabel({
			text: 'Transition Label 1',
			top: '10dp',
			left: '10dp'
		});
		win.add(sourceLabel1);
		const sourceLabel2 = Ti.UI.createLabel({
			text: 'Transition Label 2',
			bottom: '10dp',
			right: '10dp'
		});
		win.add(sourceLabel2);
		win.addEventListener('postlayout', function eventHandler() {
			win.removeEventListener('postlayout', eventHandler);
			const childWindow = Ti.UI.createWindow({
				backgroundColor: 'purple'
			});
			const targetLabel1 = Ti.UI.createLabel({
				text: 'Transition Label 1',
				transitionName: 'label1Transition',
				bottom: '10dp',
				left: '10dp'
			});
			childWindow.add(targetLabel1);
			childWindow.addSharedElement(sourceLabel1, targetLabel1.transitionName);
			const targetLabel2 = Ti.UI.createLabel({
				text: 'Transition Label 2',
				transitionName: 'label2Transition',
				top: '10dp',
				right: '10dp'
			});
			childWindow.add(targetLabel2);
			childWindow.addSharedElement(sourceLabel2, targetLabel2.transitionName);
			childWindow.addEventListener('open', function () {
				// Wait for transition animation to end before closing. (We don't have an event for this.)
				setTimeout(function () {
					childWindow.close();
				}, 750);
			});
			childWindow.addEventListener('close', function () {
				// The exit animation has finished. We're done.
				finish();
			});
			childWindow.open();
		});
		win.open();
	});

	describe.android('activity transitions', function () {
		this.slow(5000);
		this.timeout(10000);

		function doTransitionTest(windowSettings, finish) {
			windowSettings.title = 'Child Window';
			windowSettings.backgroundColor = 'blue';
			win = Ti.UI.createWindow(windowSettings);
			win.addEventListener('open', function () {
				setTimeout(function () {
					win.close();
					win = null;
				}, 750);
			});
			win.addEventListener('close', function () {
				finish();
			});
			win.open();
		}

		it('TRANSITION_FADE_IN/TRANSITION_FADE_OUT', function (finish) {
			const windowSettings = {
				activityEnterTransition: Ti.UI.Android.TRANSITION_FADE_IN,
				activityReenterTransition: Ti.UI.Android.TRANSITION_FADE_IN,
				activitySharedElementEnterTransition: Ti.UI.Android.TRANSITION_NONE,
				activitySharedElementReenterTransition: Ti.UI.Android.TRANSITION_NONE,
				activityExitTransition: Ti.UI.Android.TRANSITION_FADE_OUT,
				activityReturnTransition: Ti.UI.Android.TRANSITION_FADE_OUT,
				activitySharedElementExitTransition: Ti.UI.Android.TRANSITION_NONE,
				activitySharedElementReturnTransition: Ti.UI.Android.TRANSITION_NONE
			};
			doTransitionTest(windowSettings, finish);
		});

		it('TRANSITION_SLIDE_RIGHT', function (finish) {
			doTransitionTest({ activityEnterTransition: Ti.UI.Android.TRANSITION_SLIDE_RIGHT }, finish);
		});

		it('TRANSITION_SLIDE_LEFT', function (finish) {
			doTransitionTest({ activityEnterTransition: Ti.UI.Android.TRANSITION_SLIDE_LEFT }, finish);
		});

		it('TRANSITION_SLIDE_TOP', function (finish) {
			doTransitionTest({ activityEnterTransition: Ti.UI.Android.TRANSITION_SLIDE_TOP }, finish);
		});

		it('TRANSITION_SLIDE_BOTTOM', function (finish) {
			doTransitionTest({ activityEnterTransition: Ti.UI.Android.TRANSITION_SLIDE_BOTTOM }, finish);
		});

		it('TRANSITION_EXPLODE', function (finish) {
			doTransitionTest({ activityEnterTransition: Ti.UI.Android.TRANSITION_EXPLODE }, finish);
		});

		it('TRANSITION_NONE', function (finish) {
			doTransitionTest({ activityEnterTransition: Ti.UI.Android.TRANSITION_NONE }, finish);
		});
	});

	it.android('.barColor with disabled ActionBar', function (finish) {
		win = Ti.UI.createWindow({
			barColor: 'blue',
			title: 'My Title',
			theme: 'Theme.AppCompat.NoTitleBar',
		});
		win.add(Ti.UI.createLabel({ text: 'Window Title Test' }));
		win.open();
		win.addEventListener('open', function () {
			finish();
		});
	});
});
