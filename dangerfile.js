/* global process, fail */

// requires
const eslint = require('@seadub/danger-plugin-eslint').default;

async function main() {
	await eslint();
}
main()
	.then(() => process.exit(0))
	.catch(err => {
		fail(err.toString());
		process.exit(1);
	});
// TODO Pass along any warnings/errors from eslint in a readable way? Right now we don't have any way to get at the output of the eslint step of npm test
// May need to edit Jenkinsfile to do a try/catch to spit out the npm test output to some file this dangerfile can consume?
// Or port https://github.com/leonhartX/danger-eslint/blob/master/lib/eslint/plugin.rb to JS - have it run on any edited/added JS files?
