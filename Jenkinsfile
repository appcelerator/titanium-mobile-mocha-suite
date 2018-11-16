#!groovy
library 'pipeline-library'

// Keep logs/reports/etc of last 30 builds, only keep build artifacts of last 3 builds
properties([buildDiscarder(logRotator(numToKeepStr: '30', artifactNumToKeepStr: '3'))])

// Variables we can change
def nodeVersion = '8.9.1' // NOTE that changing this requires we set up the desired version on jenkins master first!
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
			isUnix() ? sh('npm ci') : bat('npm ci')
			dir('scripts') {
				try {
					timeout(20) {
						if (isUnix()) {
							// We know we wont need to use the target here for iOS/Android
							sh "node test.js -p ${os} -b ${testSuiteBranch}"
						} else {
							if ('ws-local'.equals(target)) {
								bat "node test.js -p ${os} -b ${testSuiteBranch} -T ${target}"
							} else if ('wp-emulator'.equals(target)) {
								bat "node test.js -p ${os} -b ${testSuiteBranch} -T ${target} -C 10-0-1"
							}
						}
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
						sh 'adb pull /data/tombstones'
						archiveArtifacts 'tombstones/'
						sh 'rm -f tombstones/'
						// wipe tombstones and re-build dir with proper permissions/ownership on emulator
						sh 'adb shell rm -rf /data/tombstones'
						sh 'adb shell mkdir -m 771 /data/tombstones'
						sh 'adb shell chown system:system /data/tombstones'
					} else if ('windows'.equals(os)) {
						bat 'mkdir crash_reports'
						dir ('crash_reports') {
							// move command doesn't grok wildcards, so we hack it: https://serverfault.com/questions/374997/move-directory-in-dos-batch-file-without-knowing-full-directory-name
							bat "FOR /d %i IN (C:\\ProgramData\\Microsoft\\Windows\\WER\\ReportArchive\\AppCrash_com.appcelerator_*) DO move %i ."
						}
						archiveArtifacts 'crash_reports/**/*'
						bat 'rmdir crash_reports /Q /S'
						throw e
					}
					throw e
				} finally {
					// Kill the emulators!
					// pipeline-library?
					if ('android'.equals(os)) {
						sh 'adb shell am force-stop com.appcelerator.testApp.testing'
						sh 'adb uninstall com.appcelerator.testApp.testing'
						killAndroidEmulators()
					} else if ('ws-local'.equals(target)) {
							bat 'taskkill /IM mocha.exe /F 2> nul'
					} else if ('wp-emulator'.equals(target)) {
						bat 'taskkill /IM xde.exe /F 2> nul'
					}
					// if
				} // finally
				junit 'junit.*.xml'
			} // dir('scripts')
		} // nodejs
	} finally {
		deleteDir()
	}
}

// Wrap in timestamper
timestamps {
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
			},
			'ws-local': {
				node('msbuild-14 && vs2015 && windows-sdk-10 && cmake') {
					unitTests('windows', scm, nodeVersion, npmVersion, targetBranch, 'ws-local')
				}
			},
			'Windows emulator': {
				node('msbuild-14 && vs2015 && hyper-v && windows-sdk-10 && cmake') {
					unitTests('windows', scm, nodeVersion, npmVersion, targetBranch, 'wp-emulator')
				}
			}
		)
	} // stage('Test')
} // timestamps
