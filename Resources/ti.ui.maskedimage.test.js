/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2015-Present by Axway Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* global Ti */
/* eslint no-unused-expressions: "off" */
'use strict';

var should = require('./utilities/assertions');

describe.windowsMissing('Titanium.UI.MaskedImage', function () {
	var win;

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

	it('Ti.UI.MaskedImage', function () {
		should(Ti.UI.MaskedImage).not.be.undefined;
	});

	it('apiName', function () {
		var view = Ti.UI.createMaskedImage();
		should(view).be.a.Object;
		should(view).have.readOnlyProperty('apiName').which.is.a.String;
		should(view.apiName).be.eql('Ti.UI.MaskedImage');
	});

	it('createMaskedImage', function () {
		var view = Ti.UI.createMaskedImage();
		should(view.mode).be.eql(Ti.UI.BLEND_MODE_SOURCE_IN);
		view.mode = Ti.UI.BLEND_MODE_DESTINATION_IN;
		should(view.mode).be.eql(Ti.UI.BLEND_MODE_DESTINATION_IN);
	});

	it('mask-tint', function (finish) {
		this.timeout(5000);
		win = Ti.UI.createWindow();
		win.add(Ti.UI.createMaskedImage({
			mask: '/Logo.png',
			tint: 'red',
			mode: Ti.UI.BLEND_MODE_SOURCE_IN,
			width: Ti.UI.FILL,
			height: Ti.UI.FILL,
		}));
		win.addEventListener('postlayout', function listener () {
			win.removeEventListener('postlayout', listener);
			// Assume MaskedImage has rendered successfully by this point.
			finish();
		});
		win.open();
	});

	it('mask-image', function (finish) {
		this.timeout(5000);
		win = Ti.UI.createWindow();
		win.add(Ti.UI.createMaskedImage({
			mask: '/Logo.png',
			image: '/SplashScreen.png',
			mode: Ti.UI.BLEND_MODE_SOURCE_IN,
			width: Ti.UI.FILL,
			height: Ti.UI.FILL,
		}));
		win.addEventListener('postlayout', function listener () {
			win.removeEventListener('postlayout', listener);
			// Assume MaskedImage has rendered successfully by this point.
			finish();
		});
		win.open();
	});
});
