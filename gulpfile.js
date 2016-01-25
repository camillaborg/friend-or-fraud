var gulp = require('gulp'),
    sass = require('gulp-ruby-sass'),
    browserify = require('browserify'),
    source = require('vinyl-source-stream'),
    browserSync = require('browser-sync').create();


gulp.task('sass', function () {
  return sass('app/style/style.scss')
    .on('error', sass.logError)
    .pipe(gulp.dest('app/style'));
});

gulp.task('serve', function(){
    browserSync.init({
        server: "./app"
       // online: true
    });

    gulp.watch("app/index.html").on('change', browserSync.reload);
    gulp.watch("app/views/*.html").on('change', browserSync.reload);

    gulp.watch("app/style/style.scss", ['sass']);
    gulp.watch("app/style/*.css").on('change', browserSync.reload);

    gulp.watch("app/scripts/**/*.js").on('change', browserSync.reload);
});


gulp.task('dist', function(){
    
});