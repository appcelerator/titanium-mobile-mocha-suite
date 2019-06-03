/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2019 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

const util = require('utilities/utilities');

let CloudPush;
if (util.isAndroid()) {
	CloudPush = require('ti.cloudpush');
}

// @fixme: these tests seem to be unused and do not work.
// Error: could not retreive device token
//   at Cloudpush.error (eval at <anonymous> (/titanium-karma-client.js:467:11), <anonymous>:22:12)

describe.skip('ti.cloudpush', () => {
	it('retrieveDeviceToken()', (finish) => {
		CloudPush.retrieveDeviceToken({
			success: () => {
				finish();
			},
			error: (e) => {
				finish(new Error(`could not retreive device token. ${e.error}`));
			}
		});
	});
});
