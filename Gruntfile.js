module.exports = function (grunt) {
    'use strict';

    require('load-grunt-tasks')(grunt);
    
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        clean: [
            'dist/*'
        ],
        copy: {
            dist: {
                options: {
                    nonull: true
                },
                src: 'src/js/scrollbox.js',
                dest: 'dist/js/<%= pkg.name %>.js'
            },
            demoCss: {
                dest: 'dist/css/demo.css',
                src: 'src/less/demo.css'
            },
            demoJs: {
                dest: 'dist/js/demo.js',
                src: 'src/js/demo.js'
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
                    require('postcss-opacity'),
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
                preserveComments: /^!|@preserve|@license|@cc_on/i
            },
            dist: {
                files: {
                    'dist/js/<%= pkg.name %>.min.js': 'src/js/scrollbox.js'
                }
            }
        },
        cssmin: {
            options: {
                shorthandCompacting: false,
                roundingPrecision: -1
            },
            dist: {
                files: {
                    'dist/css/<%= pkg.name %>.min.css': 'dist/css/<%= pkg.name %>.css'
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
        'postcss'
    ]);
};
