module.exports = (grunt) => {
    'use strict';

    require('load-grunt-tasks')(grunt);

    let testBuildNumber;
    
    if (process.env.TRAVIS_JOB_ID) {
        testBuildNumber = "travis-" + process.env.TRAVIS_JOB_ID;
    } else {
        testBuildNumber = "manual-" + (new Date()).getTime();
    }
    
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        clean: [
            'dist/*'
        ],
        eslint: {
            src: ['src/js/scrollbox.js']
        },
        babel: {
            options: {
                presets: [
                    ['es2015', { modules: false, loose: true }]
                ]
            },
            production: {
                files: {
                    'dist/js/scrollbox.js': 'src/js/scrollbox.js'
                }
            },
            development: {
                options: {
                    sourceMap: true
                },
                files: {
                    'dist/js/scrollbox.js': 'src/js/scrollbox.js'
                }
            },
            visualTests: {
                options: {
                    sourceMap: true
                },
                files: {
                    'tests/visual/dist/js/setup.js': 'tests/visual/src/js/setup.js'
                }
            },
            unitTests: {
                options: {
                    sourceMap: true
                },
                files: {
                    'tests/unit/dist/js/setup.js': 'tests/unit/src/js/setup.js',
                    'tests/unit/dist/js/scrollbox.js': 'tests/unit/src/js/scrollbox.js'
                }
            }
        },
        uglify: {
            options: {
                report: 'gzip',
                sourceMap: true,
                screwIE8: false,
                banner: `/*!
* Scrollbox v<%= pkg.version %>
* (c) 2013-<%= grunt.template.today('yyyy') %>, <%= pkg.author %>
* Licensed under MIT (https://opensource.org/licenses/mit-license.php)
*/`,
                compress: {
                    unsafe: true
                }
            },
            dist: {
                files: {
                    'dist/js/<%= pkg.name %>.min.js': 'dist/js/<%= pkg.name %>.js'
                }
            }
        },
        less: {
            options: {
                sourceMapRootpath: '/'
            },
            production: {
                files: {
                    'dist/css/<%= pkg.name %>.css': 'src/less/scrollbox.less'
                }
            },
            development: {
                options: {
                    sourceMap: true
                },
                files: {
                    'dist/css/<%= pkg.name %>.css': 'src/less/scrollbox.less'
                }
            },
            visualTests: {
                options: {
                    sourceMap: true
                },
                files: {
                    'tests/visual/dist/css/styles.css': 'tests/visual/src/less/styles.less'
                }
            },
            unitTests: {
                options: {
                    sourceMap: true
                },
                files: {
                    'tests/unit/dist/css/styles.css': 'tests/unit/src/less/styles.less'
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
            dist: 'tests/unit/index.html'
        },
        watch: {
            srcJs: {
                files: 'src/js/scrollbox.js',
                tasks: ['babel:development']
            },
            srcLess: {
                files: 'src/less/**/*.less',
                tasks: ['less:development']
            },
            visualTestsJs: {
                files: 'tests/visual/src/js/setup.js',
                tasks: ['babel:visualTests']
            },
            visualTestsLess: {
                files: 'tests/visual/src/less/styles.less',
                tasks: ['less:visualTests']
            },
            unitTestsJs: {
                files: 'tests/unit/src/js/*.js',
                tasks: ['babel:unitTests']
            },
            unitTestsLess: {
                files: 'tests/unit/src/less/styles.less',
                tasks: ['less:unitTests']
            }
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
                    urls: ['http://localhost:9999/tests/unit/index.html'],
                    testname: 'QUnit test for Scrollbox',
                    browsers: grunt.file.readYAML('tests/sauce_browsers.yml')
                }
            }
        }
    });

    grunt.registerTask('default', [
        'production'
    ]);

    grunt.registerTask('tests', [
        'babel:visualTests',
        'babel:unitTests',
        'less:visualTests',
        'less:unitTests',
        'modernizr',
        'qunit'
    ]);

    grunt.registerTask('production', [
        'eslint',
        'clean',
        'babel:production',
        'less:production',
        'postcss',
        'uglify',
        'cssmin',
        'tests'
    ]);

    grunt.registerTask('development', [
        'eslint',
        'clean',
        'babel:development',
        'less:development',
        'postcss',
        'uglify',
        'cssmin',
        'tests'
    ]);

    let ciTasks = ['production'];

    // See https://docs.travis-ci.com/user/pull-requests/#Security-Restrictions-when-testing-Pull-Requests
    if ('false' === process.env.TRAVIS_PULL_REQUEST) {
        ciTasks.push(
            'connect',
            'saucelabs-qunit'
        );
    }

    grunt.registerTask('ci', ciTasks);
};
