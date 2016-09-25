const gulp = require('gulp');
const babel = require('gulp-babel');

gulp.task('server:build', () => {
    return gulp.src('src/server/**/*.js')
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(gulp.dest('build/server'));
});
