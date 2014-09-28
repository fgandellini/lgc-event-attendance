var gulp = require('gulp');
var rm = require('gulp-rimraf');
var minifyHTML = require('gulp-minify-html');
var minifyCSS = require('gulp-minify-css');
var uglify = require('gulp-uglify');
var imagemin = require('gulp-imagemin');
var pngcrush = require('imagemin-pngcrush');
var useref = require('gulp-useref');
var gulpif = require('gulp-if');
var ftp = require('gulp-ftp');
var ftpAccounts = require('./ftp-accounts.js');
var minimist = require('minimist');

gulp.task('clean', function(done) {
  return gulp.src('dist', {
      read: false
    })
    .pipe(rm());
});

gulp.task('img', ['clean'], function(done) {
  return gulp.src('img/*')
    .pipe(imagemin({
      progressive: true,
      svgoPlugins: [{
        removeViewBox: false
      }],
      use: [pngcrush()]
    }))
    .pipe(gulp.dest('dist/img'));
});

gulp.task('fonts', ['clean'], function(done) {
  return gulp.src('bower_components/ionic/fonts/*')
    .pipe(gulp.dest('dist/fonts'));
});

gulp.task('assets', ['clean'], function(done) {
  var assets = useref.assets();
  return gulp.src('index.html')
    .pipe(assets)
    .pipe(gulpif('*.js', uglify()))
    .pipe(gulpif('*.css', minifyCSS()))
    .pipe(assets.restore())
    .pipe(useref())
    .pipe(gulp.dest('dist'));
});

gulp.task('html', ['assets'], function(done) {
  return gulp.src('dist/index.html')
    .pipe(minifyHTML({
      quotes: true
    }))
    .pipe(gulp.dest('dist'));
});

var deployOptions = {
  string: 'env',
  default: {
    env: 'test'
  }
};

var options = minimist(process.argv.slice(2), deployOptions);

gulp.task('deploy', function() {
  return gulp.src('dist/**/*')
    .pipe(ftp(ftpAccounts[options.env]));
});

gulp.task('build', ['html', 'img', 'fonts']);
gulp.task('default', ['build']);