const { src, dest, series, parallel, watch } = require("gulp");

// console log
function task(cb) {
  console.log("gulp ok");
  cb();
}

exports.taskconsole = task;

function tasA(cb) {
  console.log("taskA");
  cb();
}

function taskB(cb) {
  console.log("taskB");
  cb();
}

// 同步執行
exports.sync = parallel(tasA, taskB);

// 不同步 先A在B
exports.async = series(tasA, taskB);

// 搬家
function copy() {
  return src("index.html", "!main.js").pipe(dest("dist"));
  // src("*.*") 把所有檔案放進去 dist 資料夾，後面的 * 填副檔名
  // 也可以填 ! opy;

  // css 壓縮表示該檔案不會跟著過去
}

// 圖片打包
function img_copy() {
  return src(["images/*.*", "images/**/*.*"]).pipe(dest("dist/images"));
}

exports.m = img_copy;
const cleanCSS = require("gulp-clean-css");

function minify() {
  return src("css/*.css").pipe(cleanCSS()).pipe(dest("dist/css"));
}

exports.cssmini = minify;

// js 壓縮
const uglify = require("gulp-uglify");

function minjs() {
  return src("main.js").pipe(uglify()).pipe(dest("dist/js"));
}

exports.js = minjs;

// sass 編譯
// SourceMap 讓 css 文件可以追朔 sass
// 解決跨瀏覽器的問題

const sass = require("gulp-sass")(require("sass"));
const sourcemaps = require("gulp-sourcemaps");
const autoprefixer = require("gulp-autoprefixer");

function styleSass() {
  return (
    src("./sass/*.scss")
      .pipe(sourcemaps.init())
      .pipe(sass.sync().on("error", sass.logError)) // 編譯 css
      // .pipe(cleanCSS()) // minify css
      .pipe(
        autoprefixer({
          cascade: false,
        })
      )
      .pipe(sourcemaps.write())
      .pipe(dest("./dist/css"))
  );
}

exports.style = styleSass;

// html template
const fileinclude = require("gulp-file-include");

function includeHTML() {
  return src("*.html")
    .pipe(
      fileinclude({
        prefix: "@@",
        basepath: "@file",
      })
    )
    .pipe(dest("./dist"));
}

exports.html = includeHTML;

//watch files
function watchfiles() {
  watch(["*.html", "layout/*.html"], includeHTML);
  watch(["sass/*.scss", "sass/**/*.scss"], styleSass);
  watch(["*.js", "!gulpfile.js"], minjs);
}

exports.w = watchfiles;

// 瀏覽器同步
const browserSync = require("browser-sync");
const reload = browserSync.reload;

function browser(done) {
  browserSync.init({
    server: {
      baseDir: "./dist",
      index: "index.html",
    },
    port: 3000,
  });

  watch(["*.html", "layout/*.html"], includeHTML).on("change", reload);
  watch(["sass/*.scss", "sass/**/*.scss"], styleSass).on("change", reload);
  watch(["images/*.*", "imagess/**/*.*"], img_copy).on("change", reload);
  watch(["main.js", "!gulpfile.js"], minjs).on("change", reload);
  done();
}

exports.default = browser;

// 壓縮圖片
const imagemin = require("gulp-imagemin");

function min_images() {
  return src("dev/images/*.*")
    .pipe(
      imagemin([
        imagemin.mozjpeg({ quality: 70, progressive: true }), // 壓縮品質      quality越低 -> 壓縮越大 -> 品質越差
      ])
    )
    .pipe(dest("dist/images"));
}

exports.pic = min_images;

// babel es6 - > es5
const babel = require("gulp-babel");

function babel5() {
  return src(["*.js", "!gulpfile.js"])
    .pipe(
      babel({
        presets: ["@babel/env"],
      })
    )
    .pipe(dest("dist/js"));
}

exports.es = babel5;

// 清除舊檔案
const clean = require("gulp-clean");

function clear() {
  return src("dist", { read: false, allowEmpty: true }) //不去讀檔案結構，增加刪除效率  / allowEmpty : 允許刪除空的檔案
    .pipe(clean({ force: true })); //強制刪除檔案
}

exports.c = clear;

// 開發用
exports.dev = series(
  parallel(includeHTML, styleSass, minjs, img_copy),
  browser
);

// 上線用
exports.online = series(
  clear,
  parallel(includeHTML, styleSass, babel5, min_images)
);
