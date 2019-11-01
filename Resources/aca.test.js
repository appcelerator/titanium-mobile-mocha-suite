/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2017 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';

const aca = require('com.appcelerator.aca');
const should = require('./utilities/assertions'); // eslint-disable-line no-unused-vars

describe('Axway Analytics', function () {

	it('crash event', function () {
		aca.setUsername('Titanium_mobile_mocha_suite');
		aca.setMetadata('meta_key', 'meta_value');
		aca.leaveBreadcrumb('breadcrumb.withoutData');
		aca.logHandledException(new Error('Handled Exception'));
	});
});
