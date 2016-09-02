module.exports = function (grunt) {
    'use strict';

    require('load-grunt-tasks')(grunt);

    var testBuildNumber;
    
    if (process.env.TRAVIS_JOB_ID) {
        testBuildNumber = "travis-" + process.env.TRAVIS_JOB_ID;
    } else {
        var currentTime = new Date();
        testBuildNumber = "manual-" + currentTime.getTime();
    }
    
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        clean: [
            'dist/*'
        ],
        copy: {
            options: {
                nonull: true
            },
            dist: {
                src: 'src/js/scrollbox.js',
                dest: 'dist/js/<%= pkg.name %>.js'
            }
        },
        less: {
            dist: {
                files: {
                    'dist/css/<%= pkg.name %>.css': 'src/less/scrollbox.less'
                }
            }
        },
        postcss: {
            options: {
                failOnError: true,
                processors: [
                    require('postcss-will-change'),
                    require('postcss-opacity')({
                        legacy: true
                    }),
                    require('autoprefixer')({ browsers: [
                        'last 100 versions', // LOL
                        'ie >= 7'
                    ] })
                ]
            },
            dist: {
                src: 'dist/css/*.css'
            }
        },
        uglify: {
            options: {
                preserveComments: /^!/,
                sourceMap: true
            },
            dist: {
                files: {
                    'dist/js/<%= pkg.name %>.min.js': 'dist/js/<%= pkg.name %>.js'
                }
            }
        },
        cssmin: {
            options: {
                shorthandCompacting: false,
                roundingPrecision: -1,
                sourceMap: true,
                root: 'dist/css/'
            },
            dist: {
                files: {
                    'dist/css/<%= pkg.name %>.min.css': 'dist/css/<%= pkg.name %>.css'
                }
            }
        },
        modernizr: {
            tests: {
                crawl: false,
                customTests: [],
                dest: 'tests/vendor/modernizr/modernizr-output.js',
                tests: [
                    'touchevents'
                ],
                options: [],
                uglify: false
            }
        },
        qunit: {
            files: 'tests/index.html'
        },
        connect: {
            tests: {
                options: {
                    base: '.',
                    hostname: '127.0.0.1',
                    port: 9999
                }
            }
        },
        'saucelabs-qunit': {
            all: {
                options: {
                    build: testBuildNumber,
                    throttled: 5,
                    urls: ['http://localhost:9999/tests/index.html'],
                    testname: 'QUnit test for Scrollbox',
                    browsers: grunt.file.readYAML('tests/sauce_browsers.yml')
                }
            }
        }
    });

    grunt.registerTask('default', [
        'production'
    ]);

    grunt.registerTask('production', [
        'development',
        'uglify',
        'cssmin'
    ]);

    grunt.registerTask('development', [
        'clean',
        'copy',
        'less',
        'postcss',
        'modernizr',
        'qunit'
    ]);

    var ciTasks = ['production'];

    // See https://docs.travis-ci.com/user/pull-requests/#Security-Restrictions-when-testing-Pull-Requests
    if (process.env.TRAVIS_PULL_REQUEST === 'false') {
        ciTasks.push('connect');
        ciTasks.push('saucelabs-qunit');
    }

    grunt.registerTask('ci', ciTasks);
};
