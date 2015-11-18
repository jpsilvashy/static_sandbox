var gulp = require('gulp');
var sequence = require('run-sequence');
var replace = require('gulp-replace');
var through = require('through');
var path = require('path');
var fs = require('fs');

// Clean
var clean = require('gulp-clean');
gulp.task('build-clean', function () {
  return gulp.src(['./dist/*', './tmp/*'], { read: false })
    .pipe(clean());
});

// Copy html over to dist
gulp.task('build-html', function () {
  return gulp.src(['./src/**/*.html', './src/**/*.text'])
    .pipe(gulp.dest('./dist/'));
})

// Complile Sass into CSS
var sass = require('gulp-sass');
gulp.task('build-sass', function() {
  return gulp.src('./src/scss/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('./dist/css/'));
});

// create JSON from front-matter
var frontMatter = require('gulp-front-matter');
gulp.task('build-config', function() {
  function writeJsonFromFrontMatter(file) {
    template = file["frontMatter"]
    fileName = template["name"].replace(/\./g, "-");
    fs.writeFileSync('./dist/' + fileName + '/' + fileName + '.json', JSON.stringify(template));
  };

  var options = {
    property: 'frontMatter',
    remove: true
  };

  return gulp.src('./src/**/*.html')
    .pipe(frontMatter(options))
    .pipe(through(writeJsonFromFrontMatter));
});

// Remove the frontmatter
gulp.task('build-remove-frontmatter', function () {
  return gulp.src('./dist/**/*.html')
    .pipe(replace(/^(-{3}(?:\n|\r)([\w\W]+?)(?:\n|\r)-{3}(?:\n|\r){2})/g, ''))
    .pipe(gulp.dest('./dist/'));
})

// Compile handlebars
var handlebars = require('handlebars');
var gulpHandlebars = require('gulp-compile-handlebars');
gulp.task('compile-with-sample-data', function () {
  var options = {
    helpers: {
      unsub: function(str){
        return '<a href=' + str + '>' + str + '</a>'
      },
      date: function(str) {
        var dt = new Date(str);
        return ((dt.getMonth() + 1) + "/" + dt.getDate() + "/" + dt.getFullYear());
      }
    }
  }

  return gulp.src(['./dist/**/*.html', './dist/**/*.text'])
    .pipe(gulpHandlebars({ data: require('./data/cloth.json') }, options))
    .pipe(gulp.dest('./tmp/'));

});

// Server
var connect = require('gulp-connect');
gulp.task('connect', function() {
  connect.server({
    root: 'tmp',
    livereload: true
  });
});

// Watch
gulp.task('watch', function() {
  livereload.listen();
  gulp.watch('./src/**/**/*', ['build']);
});

// Reload
livereload = require('gulp-livereload');
gulp.task('build-livereload', function () {
  return gulp.src('./dist/*.html')
    .pipe(livereload());
})

//
// Task groups
//

// Default task
gulp.task('default', function(callback) {
  sequence('server', callback);
});

// Build
gulp.task('build', function(callback) {
  sequence('build-clean',
    'build-html',
    'build-sass',
    'build-config',
    'build-remove-frontmatter',
    'compile-with-sample-data',
    'build-livereload', callback);
});

// Server
gulp.task('server', function(callback) {
  sequence('build', 'connect', 'watch', callback);
});
