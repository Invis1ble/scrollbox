module.exports = function (grunt) {
    'use strict';

    require('load-grunt-tasks')(grunt);
    
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
        qunit: {
            files: 'tests/index.html'
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
        'qunit'
    ]);

    grunt.registerTask('ci', [
        'production'
    ]);
};
