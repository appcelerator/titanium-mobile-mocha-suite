/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

var should = require('./utilities/assertions'),
	utilities = require('./utilities/utilities'),
	assert = require('./utilities/assertions');

describe('Titanium.UI', function () {

	// TIMOB-23542 test previewContext
	(utilities.isIOS() ? it : it.skip)('previewContext', function () {
		should(Ti.UI.iOS.createPreviewContext).not.be.undefined;
		should(Ti.UI.iOS.createPreviewContext).be.a.Function;
		var previewContext = Ti.UI.iOS.createPreviewContext({
			preview: Ti.UI.createView({
				backgroundColor: "red"
			}),
			contentHeight: 300
		});
		should(previewContext.preview).be.an.Object;
		should(previewContext.contentHeight).be.eql(300);
	});

	// TIMOB-23542 test livePhotoBadge
	(utilities.isIOS() ? it : it.skip)('livePhotoBadge', function () {
		should(Ti.UI.iOS.createLivePhotoBadge).not.be.undefined;
		should(Ti.UI.iOS.createLivePhotoBadge).be.a.Function;
		var livePhotoBadge = Ti.UI.iOS.createLivePhotoBadge(Ti.UI.iOS.LIVEPHOTO_BADGE_OPTIONS_OVER_CONTENT);
		should(livePhotoBadge).be.an.Object;
	});
});
