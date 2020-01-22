#!groovy
library 'pipeline-library'

// Keep logs/reports/etc of last 30 builds, only keep build artifacts of last 3 builds
properties([buildDiscarder(logRotator(numToKeepStr: '30', artifactNumToKeepStr: '3'))])

// Variables we can change
def nodeVersion = '10.17.0' // NOTE that changing this requires we set up the desired version on jenkins master first!
def npmVersion = 'latest' // We can change this without any changes to Jenkins. 5.7.1 is minimum to use 'npm ci'

// Some branch flags to alter behavior
def isPR = env.CHANGE_ID || false // CHANGE_ID is set if this is a PR. (We used to look whether branch name started with PR-, which would not be true for a branch from origin filed as PR)
def isGreenKeeper = env.BRANCH_NAME.startsWith('greenkeeper/') || 'greenkeeper[bot]'.equals(env.CHANGE_AUTHOR) // greenkeeper needs special handling to avoid using npm ci, and to use greenkeeper-lockfile
def targetBranch = isGreenKeeper ? 'master' : (isPR ? env.CHANGE_TARGET : (env.BRANCH_NAME ?: 'master'))

def unitTests(os, scm, nodeVersion, npmVersion, testSuiteBranch, target = '') {
	try {
		checkout scm // we could stash/unstash, but I think checking out on each node is actually quicker!

		nodejs(nodeJSInstallationName: "node ${nodeVersion}") {
			ensureNPM(npmVersion)
			command('npm ci')
			dir('scripts') {
				try {
					timeout(20) {
						// We know we wont need to use the target here for iOS/Android
						sh "node test.js -p ${os} -b ${testSuiteBranch}"
					} // timeout
				} catch (e) {
					// Move crash collection to pipeline library?
					if ('ios'.equals(os)) {
						// Gather the crash report(s)
						def home = sh(returnStdout: true, script: 'printenv HOME').trim()
						// wait 1 minute, sometimes it's delayed in writing out crash reports to disk...
						sleep time: 1, unit: 'MINUTES'
						def crashFiles = sh(returnStdout: true, script: "ls -1 ${home}/Library/Logs/DiagnosticReports/").trim().readLines()
						for (int i = 0; i < crashFiles.size(); i++) {
							def crashFile = crashFiles[i]
							if (crashFile =~ /^mocha_.*\.crash$/) {
								sh "mv ${home}/Library/Logs/DiagnosticReports/${crashFile} ."
							}
						}
						archiveArtifacts 'mocha_*.crash'
						sh 'rm -f mocha_*.crash'
					} else if ('android'.equals(os)) {
						// gather crash reports/tombstones for Android
						sh label: 'gather crash reports/tombstones for Android', returnStatus: true, script: './adb-all.sh pull /data/tombstones'
						archiveArtifacts allowEmptyArchive: true, artifacts: 'tombstones/'
						sh 'rm -f tombstones/'
						sh returnStatus: true, script: 'rm -rf tombstones/'
						// wipe tombstones and re-build dir with proper permissions/ownership on emulator
						sh returnStatus: true, script: './adb-all.sh shell rm -rf /data/tombstones'
						sh returnStatus: true, script: './adb-all.sh shell mkdir -m 771 /data/tombstones'
						sh returnStatus: true, script: './adb-all.sh shell chown system:system /data/tombstones'
					}
					throw e
				} finally {
					// Kill the emulators!
					// pipeline-library?
					if ('android'.equals(os)) {
						sh returnStatus: true, script: 'adb shell am force-stop com.appcelerator.testApp.testing'
						sh returnStatus: true, script: 'adb uninstall com.appcelerator.testApp.testing'
						killAndroidEmulators()
					}
					// if
				} // finally
				junit 'junit.*.xml'
				// save the junit reports as artifacts explicitly so danger.js can use them later
				stash includes: 'junit.*.xml', name: "test-report-${os}-${target}"
			} // dir('scripts')
		} // nodejs
	} finally {
		deleteDir()
	}
}

// Wrap in timestamper
timestamps {
	try {
		node('osx || linux') {
			stage('Lint') {
				checkout scm

				nodejs(nodeJSInstallationName: "node ${nodeVersion}") {
					ensureNPM(npmVersion)
					// Install dependencies
					timeout(5) {
						sh 'npm ci'
					}
					sh 'npm test'
				} // nodejs
			} // stage('Lint')
		} // node

		stage('Test') {
			parallel(
				'Android': {
					node('osx && android-emulator && android-sdk') {
						unitTests('android', scm, nodeVersion, npmVersion, targetBranch)
					}
				},
				'iOS': {
					node('osx && xcode-10') {
						unitTests('ios', scm, nodeVersion, npmVersion, targetBranch)
					}
				}
			)
		} // stage('Test')
	} finally {
		// always try to run Danger-js, even if linting or tests fail
		stage('Danger') {
			node('osx || linux') {
				try {
					checkout scm
					nodejs(nodeJSInstallationName: "node ${nodeVersion}") {
						ensureNPM(npmVersion)
						// Install dependencies
						timeout(5) {
							sh 'npm ci'
						}
						['ios-', 'android-'].each { combo ->
							try {
								unstash "test-report-${combo}"
							} catch (e) {}
						}
						withEnv(["DANGER_JS_APP_INSTALL_ID=''"]) {
							sh returnStatus: true, script: 'npx danger ci --verbose' // Don't fail build if danger fails. We want to retain existing build status.
						} // withEnv
					}
				} finally {
					deleteDir()
				}
			}
		}
	}
} // timestamps
