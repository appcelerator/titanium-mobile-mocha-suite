/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* global Ti, global */

'use strict';

describe('global', function () {
	it('exists at top-level', function () {
		should(global).be.an.Object;
	});
});
