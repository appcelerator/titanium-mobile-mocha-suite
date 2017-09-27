/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2016-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* global Ti */
/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions');

describe('Titanium.Network.Socket.TCP', function () {
	var socket;

	afterEach(function () {
		if (socket && socket.state == Ti.Network.Socket.CONNECTED) { // eslint-disable-line eqeqeq
			socket.close();
		}
		socket = null;
	});

	it('#connect()', function (finish) {
		socket = Ti.Network.Socket.createTCP({
			host: 'www.appcelerator.com', port: 80,
			connected: function () {
				finish();
			},
			error: function (e) {
				finish(e);
			}
		});
		should(socket.connect).not.be.null;
		should(socket.connect).be.a.Function;
		socket.connect();
	});

	it('#accept()', function () {
		socket = Ti.Network.Socket.createTCP();
		should(socket.accept).not.be.null;
		should(socket.accept).be.a.Function;
	});

	it('#listen()', function () {
		socket = Ti.Network.Socket.createTCP();
		should(socket.listen).not.be.null;
		should(socket.listen).be.a.Function;
	});

	it('#close()', function () {
		socket = Ti.Network.Socket.createTCP();
		should(socket.close).not.be.null;
		should(socket.close).be.a.Function;
	});

	// FIXME: Android chokes with : android.os.NetworkOnMainThreadException
	it('#connect() and send data', function (finish) {
		socket = Ti.Network.Socket.createTCP({
			host: 'www.appcelerator.com', port: 80,
			connected: function () {
				should(socket.write).not.be.null;
				should(socket.write).be.a.Function;
				socket.write(Ti.createBuffer({ value: 'GET / HTTP/1.1\r\nHost: www.appcelerator.com\r\nConnection: close\r\n\r\n' }));
				finish();
			},
			error: function (e) {
				finish(e);
			}
		});
		should(socket.connect).not.be.null;
		should(socket.connect).be.a.Function;
		socket.connect();
	});
	// FIXME Fails after this test on Windows Desktop if we skip Ti.Network.HTTPClient suite..
	// I'm guessing we need to do better cleanup of httpclients and sockets at test end?

	// FIXME: iOS fires the connected event twice
	// FIXME: Android chokes with : android.os.NetworkOnMainThreadException
	it.windowsBroken('#connect() and receive data', function (finish) {
		socket = Ti.Network.Socket.createTCP({
			host: 'pastebin.com', port: 80,
			connected: function (e) {
				// receive callback
				should(socket.read).not.be.null;
				should(socket.read).be.a.Function;
				Ti.Stream.pump(e.socket, function (e) {
					if (e.buffer.toString().indexOf('SUCCESS!') > 0) {
						finish();
					} else {
						finish(new Error('Did not get success')); // Failing here on Windows
					}
				}, 1024, true);

				// send GET request
				should(socket.write).not.be.null;
				should(socket.write).be.a.Function;
				socket.write(Ti.createBuffer({ value: 'GET /raw/eF5dK0xU HTTP/1.1\r\nHost: pastebin.com\r\nConnection: close\r\n\r\n' }));
			},
			error: function (e) {
				finish(e);
			}
		});
		should(socket.connect).not.be.null;
		should(socket.connect).be.a.Function;
		socket.connect();
	});
});
