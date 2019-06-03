const baseConfig = require('./karma.base.config');

module.exports = config => {
	config.set(baseConfig);
	config.set({
		customLaunchers: {
			android: {
				base: 'Titanium',
				platform: 'android',
				browserName: 'Android Emulator'
			},
			ios: {
				base: 'Titanium',
				platform: 'ios',
				browserName: 'iOS Simulator'
			},
			windowsLocal: {
				base: 'Titanium',
				platform: 'windows',
				browserName: 'Windows Local',
				flags: [
					'-T', 'ws-local'
				]
			},
			windowsEmulator: {
				base: 'Titanium',
				platform: 'ios',
				browserName: 'Windows Emulator',
				flags: [
					'-T', 'wp-emulator',
					'-C', '10-0-1'
				]
			}
		},
		browsers: [ 'android', 'ios' ],
		logLevel: config.LOG_DEBUG
	});
};
