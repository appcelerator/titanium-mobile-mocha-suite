/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2015-2017 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* global Ti */

'use strict';

describe.windowsMissing('Titanium.Calendar', function () {
	it('apiName', function () {
		should(Ti.Calendar.apiName).be.eql('Ti.Calendar');
		should(Ti.Calendar).have.a.readOnlyProperty('apiName').which.is.a.String;
	});
});
