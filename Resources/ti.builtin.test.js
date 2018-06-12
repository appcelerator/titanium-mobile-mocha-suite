/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* global Ti, global */
/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions');

//
// Unit test for Titanium events and some other global functions
//
describe('Global', function () {
	// make sure we have require
	it('require', function () {
		should(require).be.a.Function;
	});

	// make sure we have setTimeout
	it('setTimeout', function () {
		should(setTimeout).be.a.Function;
	});

	// make sure we have setInterval
	it('setInterval', function () {
		should(setInterval).be.a.Function;
	});

	// make sure we have clearTimeout
	it('clearTimeout', function () {
		should(clearTimeout).be.a.Function;
	});

	// make sure we have clearInterval
	it('clearInterval', function () {
		should(clearInterval).be.a.Function;
	});

	// make sure we have global
	it('global', function () {
		should(global).be.an.Object;
	});
});
