var gulp = require('gulp');
var rm = require('gulp-rimraf');
var minifyHTML = require('gulp-minify-html');
var minifyCSS = require('gulp-minify-css');
var uglify = require('gulp-uglify');
var imagemin = require('gulp-imagemin');
var pngcrush = require('imagemin-pngcrush');
var useref = require('gulp-useref');
var gulpif = require('gulp-if');
var rename = require('gulp-rename');
var ftp = require('gulp-ftp');
var ftpAccounts = require('./ftp-accounts.js');
var minimist = require('minimist');
var rev = require('gulp-rev');
var revReplace = require('gulp-rev-replace');

gulp.task('clean', function(done) {
  return gulp.src('dist', {
      read: false
    })
    .pipe(rm());
});

gulp.task('imagemin', function(done) {
  return gulp.src('img/*')
    .pipe(imagemin({
      progressive: true,
      svgoPlugins: [{
        removeViewBox: false
      }],
      use: [pngcrush()]
    }))
    .pipe(gulp.dest('img-min'));
});

gulp.task('img', ['clean'], function(done) {
  return gulp.src('img-min/*')
    .pipe(gulp.dest('dist/img'));
});

gulp.task('fonts', ['clean'], function(done) {
  return gulp.src('bower_components/ionic/fonts/*')
    .pipe(gulp.dest('dist/fonts'));
});

gulp.task('assets', ['clean'], function(done) {
  var cssAssets = useref.assets({ types: ['css'] });
  var jsAssets = useref.assets({ types: ['js'] });
  return gulp.src('index.html')
    .pipe(jsAssets)
    .pipe(uglify())
    .pipe(rev())
    .pipe(jsAssets.restore())
    .pipe(cssAssets)
    .pipe(minifyCSS())
    .pipe(cssAssets.restore())
    .pipe(useref())
    .pipe(revReplace())
    .pipe(gulp.dest('dist'));
});

gulp.task('partials', ['assets'], function(done) {
  return gulp.src('partials/*.html')
    .pipe(minifyHTML({
      quotes: true
    }))
    .pipe(gulp.dest('dist/partials'));
});

gulp.task('html', ['partials'], function(done) {
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

gulp.task('deploy', ['build'], function() {
  return gulp.src('dist/**/*')
    .pipe(ftp(ftpAccounts[options.env]));
});

gulp.task('build', ['html', 'img', 'fonts']);
gulp.task('default', ['build']);