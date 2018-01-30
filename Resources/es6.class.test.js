/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2018 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
import Test from './es6.class.js';

const SUCCESS = 'SUCCESS!';

var should = require('./utilities/assertions'),
	utilities = require('./utilities/utilities');

describe('ES6 Class', function () {

	it('imported class', function () {
		
		let test = new Test();

		should(test.testGetterSetter).equal('GETTER');
		test.testGetterSetter = 'SETTER'; // setter always sets SUCCESS
		should(test.testGetterSetter).equal(SUCCESS);

		should(test.testProperty).equal(SUCCESS);

		should(Test.testStaticConstant).equal(SUCCESS);

		should(test.testMethod).be.a.Function;
		should(test.testMethod()).equal(SUCCESS);

		should(Test.testStaticMethod).be.a.Function;
		should(Test.testStaticMethod()).equal(SUCCESS);
	});
});