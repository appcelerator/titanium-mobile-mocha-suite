const baseConfig = require('./karma.base.config');

module.exports = config => {
	config.set(baseConfig);
	config.set({
		customLaunchers: {
			android: {
				base: 'Titanium',
				platform: 'android',
				browserName: 'Android Emulator',
				displayName: 'android',
				flags: [
					'-C', 'android-28-playstore-x86'
				]
			},
			ios: {
				base: 'Titanium',
				platform: 'ios',
				browserName: 'iOS Simulator',
				displayName: 'ios'
			}
		},
		browsers: [ 'android', 'ios' ]
	});
};
