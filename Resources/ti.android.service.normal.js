/*
 * Axway Appcelerator Titanium Mobile
 * Copyright (c) 2011-2018 by Axway Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* global Ti */
/* eslint no-unused-expressions: "off" */
'use strict';

// --------------------------------------------------------------------------------
// This Android "service" script only executes once.
// --------------------------------------------------------------------------------

// Fetch a reference to this service.
var service = Ti.Android.currentService;

// Log that this script has been executed.
Ti.API.info('Executing service script: "ti.android.service.normal.js"');

// Notify owner that this service has been executed.
Ti.App.fireEvent('service.normal:executed', {});

// Have this service stop itself if requested via intent.
if (service.intent.getBooleanExtra('doSelfStop', false)) {
	setTimeout(function () {
		service.stop();
		Ti.App.fireEvent('service.normal:stopped', {});
	}, 1000);
} else if (service.intent.getBooleanExtra('doStopWithIntent', false)) {
	setTimeout(function () {
		Ti.Android.stopService(service.intent);
		Ti.App.fireEvent('service.normal:stopped', {});
	}, 1000);
}
