var gulp = require('gulp'),
    merge = require('merge2'),
    nodemon = require('gulp-nodemon'),
    sourcemaps = require('gulp-sourcemaps'),
    gulpPlumber = require('gulp-plumber'),
    ts = require('gulp-typescript'),
    clean = require('gulp-clean');

var fs = require('fs');

// const zip = require('gulp-zip');
// const runSequence = require('run-sequence');
// const clean = require('gulp-clean');

gulp.task('clean-dist', function (done) {
    if(!fs.existsSync('./dist/')) done();
    else {
        const RELEASE_PATH = ['./dist'];
        return gulp.src(RELEASE_PATH)
            .pipe(clean({ force: true }))
    }
});

gulp.task('transpile-ts', function () {
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

gulp.task('build', gulp.series('clean-dist', 'transpile-ts'));

gulp.task('serve', gulp.series('build', function () {

    // gulp.watch('./src/**/*.ts', ['typescript']);

    return nodemon({
        script: './dist/src/bin/www.js',
        ext: 'js',
        ignore: './src/**/*.ts'
    });

}));