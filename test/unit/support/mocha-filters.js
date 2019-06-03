/**
 * The following code is for adding mocha filters, these filters
 * will add a clean way to skip tests based on a predefined scenario.
 *
 * Add commonly used filters to the checks variable below, and any other
 * test-specific filters should be defined in the applicable test using
 * the addFilter() method.
 */

const Utility = require('utilities/utilities');

/**
* Add mutliple filters at once
*
* @param {Object} filters Object containing the filters to add
*/
function addFilters(filters) {
	var functionsToExtend = [ describe, it, before, after, beforeEach, afterEach ];

	Object.keys(filters).forEach(filterName => {
		const filterFunction = filters[filterName];
		functionsToExtend.forEach(targetFunction => {
			if (targetFunction[filterName]) {
				return;
			}

			targetFunction[filterName] = function () {
				const shouldUseTest = filterFunction();
				if (shouldUseTest) {
					targetFunction.apply(null, arguments);
				} else {
					targetFunction.skip.apply(null, arguments);
				}
			};
		});
	});
}

// Use custom mocha filters for platform-specific tests
// Return false if the filter function should cause the test to be skipped, true if not.
const filters = {
	android: function () {
		return Utility.isAndroid();
	},
	ios: function () {
		return Utility.isIOS();
	},
	windows: function () {
		return Utility.isWindows();
	},
	// To mark APIs meant to be cross-platform but missing from a given platform
	androidMissing: function () {
		if (Utility.isAndroid()) {
			return false;
		}
		return true;
	},
	iosMissing: function () {
		if (Utility.isIOS()) {
			return false;
		}
		return true;
	},
	windowsMissing: function () {
		if (Utility.isWindows()) {
			return false;
		}
		return true;
	},
	androidIosAndWindowsPhoneBroken: function () {
		if (Utility.isAndroid() || Utility.isIOS() || Utility.isWindowsPhone()) {
			return false;
		}
		return true;
	},
	androidIosAndWindowsDesktopBroken: function () {
		if (Utility.isAndroid() || Utility.isIOS() || Utility.isWindowsDesktop()) {
			return false;
		}
		return true;
	},
	// to mark when there's a bug in both iOS and Android impl
	androidAndIosBroken: function () {
		if (Utility.isAndroid() || Utility.isIOS()) {
			return false;
		}
		return true;
	},
	// to mark when there's a bug in both Android and Windows Desktop impl
	androidAndWindowsDesktopBroken: function () {
		if (Utility.isAndroid() || Utility.isWindowsDesktop()) {
			return false;
		}
		return true;
	},
	// to mark when there's a bug in both Android and Windows Phone impl
	androidAndWindowsPhoneBroken: function () {
		if (Utility.isAndroid() || Utility.isWindowsPhone()) {
			return false;
		}
		return true;
	},
	// to mark when there's a bug in both Android and Windows impl
	androidAndWindowsBroken: function () {
		if (Utility.isAndroid() || Utility.isWindows()) {
			return false;
		}
		return true;
	},
	// to mark when there's a bug in both iOS and Windows impl
	iosAndWindowsBroken: function () {
		if (Utility.isWindows() || Utility.isIOS()) {
			return false;
		}
		return true;
	},
	iosAndWindowsPhoneBroken: function () {
		if (Utility.isIOS() || Utility.isWindowsPhone()) {
			return false;
		}
		return true;
	},
	iosAndWindowsDesktopBroken: function () {
		if (Utility.isWindowsDesktop() || Utility.isIOS()) {
			return false;
		}
		return true;
	},
	// mark bugs specific to Windows 8.1 Desktop/Store
	windowsDesktop81Broken: function () {
		if (Utility.isWindows8_1() || Utility.isWindowsDesktop()) {
			return false;
		}
		return true;
	},
	// mark bugs specific to Windows 8.1 Phone
	windowsPhone81Broken: function () {
		if (Utility.isWindows8_1() || Utility.isWindowsPhone()) {
			return false;
		}
		return true;
	},
	// mark bugs specific to Windows Emulator
	windowsEmulatorBroken: function () {
		if (Utility.isWindowsEmulator()) {
			return false;
		}
		return true;
	},
	// mark bugs specific to Windows Store
	windowsDesktopBroken: function () {
		if (Utility.isWindowsDesktop()) {
			return false;
		}
		return true;
	},
	// mark bugs specific to Windows Phone
	windowsPhoneBroken: function () {
		if (Utility.isWindowsPhone()) {
			return false;
		}
		return true;
	},
	// mark bugs specific to Windows 8.1
	windows81Broken: function () {
		if (Utility.isWindows8_1()) {
			return false;
		}
		return true;
	},
	allBroken: function () {
		return false;
	}
};

// Alias broken tests on a given platform to "missing" filter for that platform.
// This is just handy to try and label where we have gaps in our APIs versus
// where we have bugs in our impl for a given platform
filters.androidBroken = filters.androidMissing;
filters.iosBroken = filters.iosMissing;
filters.windowsBroken = filters.windowsMissing;
filters.androidAndWindowsMissing = filters.androidAndWindowsBroken;
filters.androidBrokenAndIosMissing = filters.androidAndIosBroken;
filters.androidMissingAndIosBroken = filters.androidAndIosBroken;
filters.androidMissingAndWindowsBroken = filters.androidAndWindowsMissing;
filters.androidMissingAndWindowsDesktopBroken = filters.androidAndWindowsDesktopBroken;
filters.iosMissingAndWindowsDesktopBroken = filters.iosAndWindowsDesktopBroken;

addFilters(filters);
