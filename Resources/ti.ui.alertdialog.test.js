/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
var should = require('./should');

describe('Titanium.UI.AlertDialog', function () {
    it('apiName', function (finish) {
        // See https://jira.appcelerator.org/browse/TIMOB-23346
        if (Ti.Platform.osname === 'windowsstore' || Ti.Platform.osname === 'windowsphone') {
            should(Ti.UI.AlertDialog.apiName).be.eql('Titanium.UI.AlertDialog');
        } else {
            should(Ti.UI.AlertDialog.apiName).be.eql('Ti.UI.AlertDialog');
        }
        finish();
    });

    it('title', function (finish) {
        var bar = Ti.UI.createAlertDialog({
            title: 'this is some text'
        });
        should(bar.title).be.a.String;
        should(bar.getTitle).be.a.Function;
        should(bar.title).eql('this is some text');
        should(bar.getTitle()).eql('this is some text');
        bar.title = 'other text';
        should(bar.title).eql('other text');
        should(bar.getTitle()).eql('other text');
        finish();
    });

    it('message', function (finish) {
        var bar = Ti.UI.createAlertDialog({
            message: 'this is some text'
        });
        should(bar.message).be.a.String;
        should(bar.getMessage).be.a.Function;
        should(bar.message).eql('this is some text');
        should(bar.getMessage()).eql('this is some text');
        bar.message = 'other text';
        should(bar.message).eql('other text');
        should(bar.getMessage()).eql('other text');
        finish();
    });

    it('buttonNames', function (finish) {
        var bar = Ti.UI.createAlertDialog({
        });
        should(bar.buttonNames).be.an.Array;
        should(bar.getButtonNames).be.a.Function;
        should(bar.buttonNames).be.empty;
        should(bar.getButtonNames()).be.empty;
        bar.buttonNames = ['this','other'];
        should(bar.buttonNames.length).eql(2);
        should(bar.getButtonNames().length).eql(2);
        finish();
    });

    it('cancel', function (finish) {
        var bar = Ti.UI.createAlertDialog({
        });
        should(bar.cancel).be.a.Number;
        should(bar.getCancel).be.a.Function;
        bar.cancel = 1;
        should(bar.cancel).eql(1);
        should(bar.getCancel()).eql(1);
        finish();
    });

});
