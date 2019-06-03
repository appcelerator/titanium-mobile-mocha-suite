const utilities = require('utilities/utilities');

if (utilities.isWindows()) {
	if (Ti.App.Windows.requestExtendedExecution) {
		Ti.App.Windows.requestExtendedExecution();
	}
}
