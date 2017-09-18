(function activate() {
	var sh = new ActiveXObject('WScript.Shell');
	var x = WScript.arguments(0);
	WScript.echo(x);
	if (sh.AppActivate(x)) {
		WScript.echo('activated app ' + x);
	} else {
		WScript.echo('unable to activate app: ' + x);
	}
}());
