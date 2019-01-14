var gulp = require('gulp'),
    merge = require('merge2'),
    nodemon = require('gulp-nodemon'),
    sourcemaps = require('gulp-sourcemaps'),
    gulpPlumber = require('gulp-plumber'),
    ts = require('gulp-typescript');

// const zip = require('gulp-zip');
// const runSequence = require('run-sequence');
// const clean = require('gulp-clean');

gulp.task('build', function () {
    var tsProject = ts.createProject('tsconfig.json');

    var tsResult = gulp.src(['src/**/*.ts'])
        .pipe(gulpPlumber())
        .pipe(sourcemaps.init())
        .pipe(tsProject());

    // merge dts & js output streams...
    return merge([
        // type definitions
        tsResult.dts
            .pipe(gulp.dest("./dist/")),
        // javascript
        tsResult.js
            //.pipe(sourcemaps.write(writeOptions))
            .pipe(gulp.dest('./dist/'))
    ])
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('./dist/'));

});

gulp.task('serve', gulp.series('build', function () {

    // gulp.watch('./src/**/*.ts', ['typescript']);

    return nodemon({
        script: './dist/index.js',
        ext: 'js',
        ignore: './src/**/*.ts'
    });

}));