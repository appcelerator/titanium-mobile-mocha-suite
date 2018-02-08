/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2017 Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* global Ti */
/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions');

describe('Titanium.Media', function () {

	it('apiName', function () {
		var media = Ti.Media;
		should(media).have.readOnlyProperty('apiName').which.is.a.String;
		should(media.apiName).be.eql('Ti.Media');
	});

	it.windowsMissing('takeScreenshot', function (finish) {
		should(Ti.Media.takeScreenshot).not.be.undefined;
		should(Ti.Media.takeScreenshot).be.a.Function;

		// take a screenshot
		Ti.Media.takeScreenshot(function (image) {
			if (image && image.media) {
				finish();
			} else {
				finish(new Error('failed to obtain screenshot'));
			}
		});
	});

	it.android('previewImage', function () {
		should(Ti.Media.previewImage).not.be.undefined;
		should(Ti.Media.previewImage).be.a.Function;
	});

	// FIXME: java.lang.ClassCastException: byte[] cannot be cast to org.appcelerator.titanium.io.TiBaseFile
	// This assumes the TiBlob is from a file, but in this case it's not.
	// MediaModule.java needs to be updated to write to a temp file in this case,
	// like we do for EmailDialogProxy
	// it.android('preview image from screenshot', function (finish) {
	it.allBroken('preview image from screenshot', function (finish) {
		// take a screenshot
		Ti.Media.takeScreenshot(function (image) {
			if (image && image.media) {
				Ti.Media.previewImage({
					success: function () {
						finish();
					},
					error: function (e) {
						finish(e);
					},
					image: image
				});
			} else {
				finish(new Error('failed to obtain screenshot'));
			}
		});
	});

	// FIXME: Fails to write to file on CI machine
	// Presumably it's because we need to ask for storage permissions, which we can't do in a headless way
	// it.android('preview image read/write external storage', function (finish) {
	it.allBroken('preview image read/write external storage', function (finish) {
		// take a screenshot
		Ti.Media.takeScreenshot(function (image) {
			var tmp;
			if (image && image.media) {
				tmp = Ti.Filesystem.getFile(Ti.Filesystem.externalStorageDirectory, 'temp.png');

				// write to external storage
				tmp.write(image.media);

				// preview image from external storage
				Ti.Media.previewImage({
					success: function () {
						finish();
					},
					error: function (e) {
						finish(e);
					},
					image: tmp.read()
				});
			} else {
				finish(new Error('failed to obtain screenshot'));
			}
		});
	});
});
