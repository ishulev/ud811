var gulp = require('gulp');
var serve = require('gulp-serve');

gulp.task('generate-service-worker', function (callback) {
    var swPrecache = require('sw-precache');
    var rootDir = '1-12-skeleton';

    swPrecache.write(`${rootDir}/generated-sw.js`, {
        staticFileGlobs: [rootDir + '/**/*.{js,html,css,png,jpg,gif,svg,eot,ttf,woff}'],
        stripPrefix: rootDir,
        runtimeCaching: [{
            urlPattern: /^http:\/\/127\.0\.0\.1:9800/,
            handler: 'networkFirst',
            options: {
                cache: {
                    name: 'weatherApiCache'
                }
            }
        }]
    }, callback);
});


gulp.task('serve', serve('1-12-skeleton'));
