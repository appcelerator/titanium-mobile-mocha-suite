/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* global Ti */

'use strict';

describe('Titanium.Accelerometer', function () {
	it('apiName', function () {
		should(Ti.Accelerometer).have.readOnlyProperty('apiName').which.is.a.String;
		should(Ti.Accelerometer.apiName).be.eql('Ti.Accelerometer');
	});

	it('exists', function () {
		should(Ti.Accelerometer).exist;
		should(Ti.Accelerometer.addEventListener).be.a.Function;
		should(Ti.Accelerometer.removeEventListener).be.a.Function;
	});
});
