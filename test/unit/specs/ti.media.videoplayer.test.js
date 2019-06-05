/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* global Ti */

'use strict';

var utilities = require('./utilities/utilities');

describe('Titanium.Media', function () {
	it('#createVideoPlayer()', function () {
		should(Ti.Media.createVideoPlayer).be.a.Function;
	});
});

describe('Titanium.Media.VideoPlayer', function () {
	var win;

	afterEach(function (done) {
		if (win) {
			win.addEventListener('close', function () {
				done();
			});
			win.close();
		} else {
			done();
		}
		win = null;
	});

	it.windowsMissing('VIDEO_PLAYBACK_* constants', function () {
		should(Ti.Media.VIDEO_PLAYBACK_STATE_STOPPED).eql(0);
		should(Ti.Media.VIDEO_PLAYBACK_STATE_PLAYING).eql(1);
		should(Ti.Media.VIDEO_PLAYBACK_STATE_PAUSED).eql(2);
		should(Ti.Media.VIDEO_PLAYBACK_STATE_INTERRUPTED).eql(3);

		if (utilities.isAndroid()) {
			should(Ti.Media.VIDEO_PLAYBACK_STATE_SEEKING_FORWARD).eql(4);
			should(Ti.Media.VIDEO_PLAYBACK_STATE_SEEKING_BACKWARD).eql(5);
		}
	});

	it('apiName', function () {
		var player = Ti.Media.createVideoPlayer();
		should(player).have.readOnlyProperty('apiName').which.is.a.String;
		// FIXME player.should syntax doesn't work on iOS!
		player.apiName.should.be.eql('Ti.Media.VideoPlayer');
	});

	it('playing', function () {
		var player = Ti.Media.createVideoPlayer();
		should(player).have.a.readOnlyProperty('playing').which.is.a.Boolean;
	});

	it('scalingMode', function () {
		var player = Ti.Media.createVideoPlayer();
		if (utilities.isIOS()) { // FIXME: Parity issue!
			should(player.scalingMode).be.a.String;
		} else {
			should(player.scalingMode).be.a.Number;
		}
	});

	it.ios('allowsAirPlay', function () {
		var player = Ti.Media.createVideoPlayer();
		should(player).have.a.property('allowsAirPlay').which.is.a.Boolean;
	});

	it('autoplay', function () {
		var player = Ti.Media.createVideoPlayer();
		should(player).have.a.property('autoplay').which.is.a.Boolean;
		player.autoplay.should.be.true; // default
	});

	it('volume', function () {
		var player = Ti.Media.createVideoPlayer();
		should(player).have.a.property('volume').which.is.a.Number;
		player.volume.should.eql(1); // default
	});

	it.ios('pictureInPictureEnabled', function () {
		var player = Ti.Media.createVideoPlayer();
		should(player).have.a.property('pictureInPictureEnabled').which.is.a.Boolean;
	});

	it.windowsMissing('showsControls', function () {
		var player = Ti.Media.createVideoPlayer();
		should(player).have.a.property('showsControls').which.is.a.Boolean;
		player.showsControls.should.be.true; // default
	});

	it('playableDuration', function () {
		var player = Ti.Media.createVideoPlayer();
		// FIXME doesn't work on Android, because we don't have a way to denote read-only property attributes easily in Java kroll annotations
		// should(player).have.readOnlyProperty('playableDuration').which.is.a.Number;
		should(player).have.a.property('playableDuration').which.is.a.Number;
		player.playableDuration.should.eql(0); // default
	});

	it('duration', function () {
		var player = Ti.Media.createVideoPlayer();
		// FIXME More specific check below is broken on Android
		// should(player).have.readOnlyProperty('duration').which.is.a.Number;
		should(player).have.a.property('duration').which.is.a.Number;
		player.duration.should.eql(0); // default
	});

	it.ios('playableDuration in milliseconds', function (finish) {
		var videoPlayer = Ti.Media.createVideoPlayer({
			url: 'https://www.w3schools.com/html/mov_bbb.mp4',
			autoplay: true,
			showsControls: false,
			height: 200
		});

		this.timeout(10000);

		win = Ti.UI.createWindow();
		function durationavailable(e) {
			videoPlayer.removeEventListener('durationavailable', durationavailable);
			try {
				e.duration.should.be.above(1000);
				videoPlayer.duration.should.be.above(1000);
				videoPlayer.playableDuration.should.be.above(1000);
				finish();
			} catch (err) {
				finish(err);
			}
		}
		videoPlayer.addEventListener('durationavailable', durationavailable);

		win.add(videoPlayer);
		win.open();
	});

	it('currentPlaybackTime', function () {
		var player = Ti.Media.createVideoPlayer();
		should(player).have.a.property('currentPlaybackTime').which.is.a.Number;
	});

	it('endPlaybackTime', function () {
		var player = Ti.Media.createVideoPlayer();
		should(player).have.a.property('endPlaybackTime').which.is.a.Number;
		player.endPlaybackTime.should.eql(0); // default
	});

	it.ios('moviePlayerStatus', function () {
		var player = Ti.Media.createVideoPlayer();
		should(player).have.readOnlyProperty('moviePlayerStatus').which.is.a.Number;
	});

	it.ios('playbackState', function () {
		var player = Ti.Media.createVideoPlayer();
		should(player).have.readOnlyProperty('playbackState').which.is.a.Number;
	});

	// FIXME: Skipping until TIMOB-26299 is fixed
	it.allBroken('Close window containing a video player (TIMOB-25574)', function (finish) {
		var nav;
		this.timeout(15000);

		win = Ti.UI.createWindow({
			backgroundColor: 'white'
		});
		nav = Ti.UI.iOS.createNavigationWindow({
			window: win
		});

		win.addEventListener('focus', openWindow);

		nav.open();

		function openWindow() {
			var detailWindow,
				videoPlayer;
			win.removeEventListener('focus', openWindow);
			detailWindow = Ti.UI.createWindow({
				backgroundColor: 'black'
			});

			videoPlayer = Ti.Media.createVideoPlayer({
				url: 'https://www.w3schools.com/html/mov_bbb.mp4',
				autoplay: true,
				backgroundColor: 'blue',
				height: 300,
				width: 300,
				mediaControlStyle: Ti.Media.VIDEO_CONTROL_NONE,
				scalingMode: Ti.Media.VIDEO_SCALING_ASPECT_FILL,
				repeatMode: Ti.Media.VIDEO_REPEAT_MODE_ONE,
				showsControls: false
			});

			detailWindow.addEventListener('open', function () {
				setTimeout(function () {
					detailWindow.close();
				}, 2000);
			});

			detailWindow.addEventListener('close', function () {
				setTimeout(function () {
					nav.close();
					finish(); // We are done!
				}, 2000);
			});

			detailWindow.add(videoPlayer);
			nav.openWindow(detailWindow);
		}
	});

	// FIXME: Skipping until TIMOB-26299 is fixed.
	it.allBroken('Release video player and close window (TIMOB-26033)', function (finish) {
		var videoWindow = Ti.UI.createWindow();
		var videoPlayer = Ti.Media.createVideoPlayer({
			url: 'https://www.w3schools.com/html/mov_bbb.mp4',
			top: 2,
			autoplay: true,
			backgroundColor: 'blue',
			height: 300,
			width: 300,
			mediaControlStyle: Ti.Media.VIDEO_CONTROL_DEFAULT,
			scalingMode: Ti.Media.VIDEO_SCALING_ASPECT_FIT
		});

		this.timeout(10000);

		win = Ti.UI.createWindow();
		win.addEventListener('open', function () {
			setTimeout(function () {
				videoWindow.open();
			}, 2000);
		});

		videoWindow.addEventListener('open', function () {
			setTimeout(function () {
				videoPlayer.release();
				videoWindow.remove(videoPlayer);
				videoPlayer = null;
				videoWindow.close();
			}, 2000);
		});

		videoWindow.addEventListener('close', function () {
			finish();
		});

		videoWindow.add(videoPlayer);
		win.open();
	});
});