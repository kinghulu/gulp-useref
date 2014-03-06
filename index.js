'use strict';
var gutil = require('gulp-util');
var through = require('through2');
var useref = require('useref');
var path = require('path');
var fs = require('fs');

module.exports = function(){
    return through.obj(function (file, enc, cb) {
        if (file.isNull()) {
            this.push(file);
            return cb();
        }

        if (file.isStream()) {
            this.emit('error', new gutil.PluginError('gulp-useref', 'Streaming not supported'));
            return cb();
        }

        var output = useref(file.contents.toString());
        var html = output[0];
        var assets = output[1];

        ['css', 'js'].forEach(function (type) {
            var files = assets[type];
            if (files) {
                Object.keys(files).forEach(function (name) {
                    var buffer = [];
                    var filepaths = files[name];
                    filepaths.forEach(function (filepath) {
                        filepath = path.join(file.base, filepath);
                        try {
                            buffer.push(fs.readFileSync(filepath));
                        } catch (err) {
                            this.emit('error', new gutil.PluginError('gulp-useref', err));
                        }
                    }.bind(this));

                    var joinedFile = new gutil.File({
                        cwd: file.cwd,
                        base: file.base,
                        path: path.join(file.base, name),
                        contents: new Buffer(buffer.join(gutil.linefeed))
                    });

                    this.push(joinedFile);

                }.bind(this));
            }
        }.bind(this));

        try {
            file.contents = new Buffer(html);
        } catch (err) {
            this.emit('error', new gutil.PluginError('gulp-useref', err));
        }

        this.push(file);

        cb();
    });
};