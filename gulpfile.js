'use strict';

const CONFIG = require('./project-config.json');

const {
    src,
    dest,
    parallel,
    series,
    watch,
} = require('gulp');

const
    $ = require('gulp-load-plugins')(),
    argv = require('yargs').argv,
    browserSync = require('browser-sync').create(),
    fs = require('fs'),
    csv = require('csv-parser'),
    through = require('through2'),
    imageminJpegRecompress = require('imagemin-jpeg-recompress');

const sources = {
    fonts: 'src/assets/fonts/**/*.ttf',
    styles: 'src/assets/styles/*.scss',
    styles_any: 'src/assets/styles/**/*.scss',
    scripts: 'src/assets/scripts/app.js',
    vendor: 'src/assets/vendor/*.js',
    translations: 'src/translations/*.csv',
    assets_buffer: 'src/assets_buffer',
    jade_app: 'src/app.jade',
    jade_settings: 'src/parts/settings/*.jade',
    jade_any: [
        'src/app.jade',
        'src/parts/**/*.jade'
    ],
    images: [
        'src/favicon.ico',
        'src/assets/images/**'
    ]
};

const stringFormat = (s, a) => s.replace(/\{(\d+)\}/g, (m, n) => a[n] || m);

function checkAndGetLang(_lang) {
    let lang;
    if (_lang !== undefined) lang = _lang;
    else lang = argv.locale ? argv.locale : CONFIG['default_settings']['lang'];
    return lang;
}

function getEnv() {
    return argv.env ? argv.env : CONFIG['ENV_DEV'];
}

function getOutputPath(_lang) {
    const env = getEnv();
    const lang = checkAndGetLang(_lang);
    return CONFIG['default_settings']['output_path'] + '/' + env + '/' + lang;
}

function task(callable, ...args) {
    var task = () => callable(...args);
    task.displayName = callable.name;
    return task;
}

// scripts task
function styles() {
    if (CONFIG['ENV_PROD'] === getEnv()) {
        return src(sources.styles)
            .pipe($.sass().on('error', $.sass.logError))
            .pipe($.autoprefixer('last 3 version'))
            .pipe($.minifyCss())
            .pipe($.size())
            .pipe(dest(sources.assets_buffer + '/css/'))
    } else {
        return src(sources.styles)
            .pipe($.sass().on('error', $.sass.logError))
            .pipe($.autoprefixer('last 3 version'))
            .pipe(dest(sources.assets_buffer + '/css/'))
            .pipe(browserSync.stream());
    }
}

// scripts task
function scripts() {
    if (CONFIG['ENV_PROD'] === getEnv()) {
        return src(sources.scripts)
            .pipe($.jsmin())
            .pipe(dest(sources.assets_buffer + '/scripts/'))
            .pipe($.size())
    } else {
        return src(sources.scripts)
            .pipe(dest(sources.assets_buffer + '/scripts/'))
            .pipe(browserSync.stream());
    }
}

// template task
function translations() {
    return src(sources.translations)
        .pipe(through.obj(function (chunk, enc, cb) {
            let self = this;
            let content = '';
            fs.createReadStream(chunk.path)
                .pipe(csv())
                .on('data', function (data) {
                    content += '- var ' + data.key + ' = \'' + data.value + '\';\n'
                })
                .on('end', function () {
                    chunk.contents = Buffer.from(content);
                    self.push(chunk);
                    cb();
                });
        }))
        .pipe($.rename({
            prefix: "translation_",
            extname: ".jade"
        }))
        .pipe(dest('src/parts/settings/'));
}

function jade_settings(_lang) {
    const lang = checkAndGetLang(_lang);
    const env = getEnv();
    const server = CONFIG['deployment'][lang][env];
    const promo = CONFIG['servers'][server]['host'].replace('.lan', '');
    return src(sources.jade_app)
        .pipe($.replace(/\@\@lang/gi, lang))
        .pipe($.replace(/\@\@env/gi, env))
        .pipe($.replace(/\@\@promo/gi, promo))
        .pipe($.concat('index.jade'))
        .pipe(dest('src'));
}

// templates tasks
function phpminify(_lang) {
    return src('src/index.jade')
        .pipe($.jade())
        .pipe($.htmlmin({collapseWhitespace: true}))
        .pipe($.rename(function (path) {
            path.extname = '.php';
        }))
        .pipe(dest(getOutputPath(_lang) + '/'));
}

function htmlminify(_lang) {
    return src('src/index.jade')
        .pipe($.jade())
        .pipe($.htmlmin({collapseWhitespace: true}))
        .pipe(dest(getOutputPath(_lang) + '/'))
        .pipe(browserSync.stream());
}

function rev(_lang) {
    const now = new Date().getTime();
    return src(getOutputPath(_lang) + '/*.php')
        .pipe($.replace(/\@\@hash/gi, now))
        .pipe(dest(getOutputPath(_lang) + '/'));
}

// fonts task
function fonts() {
    if (CONFIG['ENV_PROD'] === getEnv()) {
        return src(sources.fonts)
            .pipe($.fontmin())
            .pipe($.ttf2woff2())
            .pipe(dest(sources.assets_buffer + '/fonts/'))
    } else {
        return src(sources.fonts)
            .pipe($.ttf2woff2())
            .pipe(dest(sources.assets_buffer + '/fonts/'))
    }
}

// images task
function images() {
    if (CONFIG['ENV_PROD'] === getEnv()) {
        return src(sources.images)
            .pipe($.newer(sources.assets_buffer + '/images/*.*'))
            .pipe($.imagemin({
                interlaced: true,
                progressive: true,
                optimizationLevel: 5,
                svgoPlugins: [{removeViewBox: false}]
            }))
            .pipe($.newer(sources.assets_buffer + '/images/*.*'))
            .pipe($.imagemin([
                $.imagemin.gifsicle({interlaced: true}),
                imageminJpegRecompress({progressive: true}),
                $.imagemin.optipng({optimizationLevel: 5}),
                $.imagemin.svgo({plugins: [{removeViewBox: false}]})
            ]))
            .pipe(dest(sources.assets_buffer + '/images/'))
            .pipe($.size())
    } else {
        return src(sources.images)
            .pipe(dest(sources.assets_buffer + '/images/'))
            .pipe(browserSync.stream());
    }
}

function copy_assets_from_buffer(_lang, _asset) {
    const lang = checkAndGetLang(_lang);
    let input;
    let output;
    switch (_asset) {
        case 'scripts':
            input = '/scripts/*.js';
            output = '/scripts/';
            break;
        case 'styles':
            input = '/css/*.css';
            output = '/css/';
            break;
        default:
            input = '/**/*.*';
            output = '';
    }
    return src(sources.assets_buffer + '/**/*.*')
        .pipe(dest(getOutputPath(lang)));
}

function copy_vendor(_lang) {
    const lang = checkAndGetLang(_lang);
    return src(sources.vendor)
        .pipe(dest(getOutputPath(lang) + '/vendor/'));
}

function build() {
    return series(
        styles,
        scripts,
        images,
        fonts,
        translations,
        task(jade_settings),
        task(phpminify),
        task(rev),
        task(copy_assets_from_buffer),
        task(copy_vendor)
    );
}

function build_watch() {
    return series(
        parallel(
            styles,
            fonts,
            images,
            scripts,
            series(
                translations,
                task(jade_settings),
                task(htmlminify)
            )
        ),
        task(copy_assets_from_buffer),
        task(copy_vendor)
    )
}

function clean() {
    return src([
        CONFIG['default_settings']['output_path'] + '/' + CONFIG['ENV_DEV'] + '/',
        CONFIG['default_settings']['output_path'] + '/' + CONFIG['ENV_PROD'] + '/',
        CONFIG['default_settings']['output_path'] + '/' + 'artifacts',
        sources.assets_buffer
    ], {read: false, allowEmpty: true})
        .pipe($.clean());
}

function getDeployShellTask(_lang) {
    const env = getEnv();
    const lang = checkAndGetLang(_lang);
    const server = CONFIG['deployment'][lang][env];
    const connection = CONFIG['servers'][server]['user'] + '@' + CONFIG['servers'][server]['host'];
    let release_path;
    if (CONFIG['multilang']) {
        release_path = stringFormat('{0}/current/{1}', [CONFIG['servers'][server]['root'], lang]);
    } else {
        release_path = stringFormat('{0}/current', [CONFIG['servers'][server]['root']]);
    }
    return [
        stringFormat('ssh {0} -t "mkdir -p {1}"', [connection, release_path]),
        stringFormat('rsync --delete -zvr {0} {1}:{2}/', [getOutputPath(), connection, release_path])
    ]
}

function deploy() {
    var deploy = $.shell.task(getDeployShellTask(), {verbose: true});
    deploy.displayName = 'deploy';
    return deploy;
}

function deploy_all() {
    var deploy_all = $.shell.task(CONFIG['locales'].map((locale) => {
        return getDeployShellTask(locale)
    }), {verbose: true});
    deploy_all.displayName = 'deploy_all';
    return deploy_all;
}

function build_all() {
    const callbacks = CONFIG['locales'].map(locale => {
        return [
            task(jade_settings, locale),
            task(phpminify, locale),
            task(rev, locale),
            task(copy_assets_from_buffer, locale),
            task(copy_vendor, locale)
        ]
    });
    return series(
        styles,
        scripts,
        images,
        fonts,
        translations,
        ...callbacks
    );
}

function build_and_deploy() {
    return series(
        clean,
        build(),
        deploy()
    );
}

function build_and_deploy_all() {
    return series(
        clean,
        build_all(),
        deploy_all()
    );
}

function browser_sync() {
    browserSync.init({
        server: './' + getOutputPath()
    });
}

function run_watch() {
    return series(
        build_watch(),
        run_watchers,
        browser_sync
    );
}

function run_watchers(cb) {
    watch(sources.jade_any, {delay: 1000}, series(task(jade_settings), task(htmlminify)));
    watch(sources.styles_any, {delay: 1000}, series(styles, task(copy_assets_from_buffer, undefined, 'styles')));
    watch(sources.scripts, {delay: 1000}, series(scripts, task(copy_assets_from_buffer, undefined, 'scripts')));
    cb();
}

exports.default = build();
exports.build_translations = translations;
exports.build = build();
exports.clean = clean;
exports.watch = run_watch();
exports.deploy = deploy();
exports.build_deploy = build_and_deploy();
exports.build_all = build_all();
exports.deploy_all = deploy_all();
exports.all = build_and_deploy_all();