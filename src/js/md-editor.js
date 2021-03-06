(function ($) {
    'use strict';
    var MarkdownEditor = function (ele, opt) {
        this.$element = ele;
        this.defaults = {
            debug: false,
            codeMirror: {
                mode: 'gfm',
                lineWrapping: true,
                matchBrackets: true,
                indentUnit: 4,
                extraKeys: {
                    Enter: 'newlineAndIndentContinueMarkdownList',
                    Tab: function(cm) {
                        if (cm.somethingSelected()) {
                            cm.indentSelection("add");
                        } else {
                            cm.replaceSelection(cm.getOption("indentWithTabs") ? "\t" : Array(cm.getOption("indentUnit") + 1).join(" "), "end", "+input");
                        }
                    },
                    'Shift-Tab': "indentLess"
                },
            },
            buttons: {
                mainHeader: {
                    name: "mainHeader",
                    className: "fa fa-header",
                    action: function () {
                        this.insertBefore('## ', 3);
                    }
                },
                subHeader: {
                    name: "subHeader",
                    className: "fa fa-header",
                    action: function () {
                        this.insertBefore('### ', 4);
                    }
                },
                bold: {
                    name: "bold",
                    className: "fa fa-bold",
                    action: function () {
                        this.insertAround('**', '**')
                    }
                },
                italicize: {
                    name: "italicize",
                    className: "fa fa-italic",
                    action: function () {
                        this.insertAround('*', '*');
                    }
                },
                blockquote: {
                    name: "blockquote",
                    className: "fa fa-quote-left",
                    action: function () {
                        this.insertBefore('> ', 2);
                    }
                },
                link: {
                    name: "link",
                    className: "fa fa-link",
                    action: function () {
                        this.insertAround('[', '](http://)');
                    }
                },
                image: {
                    name: "image",
                    className: "fa fa-image",
                    action: function () {
                        this.insertBefore('![](http://)', 2);
                    }
                },
                unorderedList: {
                    name: "unorderedList",
                    className: "fa fa-list",
                    action: function () {
                        this.insertBefore('* ', 2);
                    }

                },
                orderedList: {
                    name: "orderedList",
                    className: "fa fa-list-ol",
                    action: function () {
                        this.insertBefore('1. ', 3);
                    }
                },
                code: {
                    name: "code",
                    className: "fa fa-code",
                    action: function () {
                        if (this.cm.getDoc().getSelection().indexOf('\n') > 0) {
                            this.insertAround('```\r\n', '\r\n```');
                        } else {
                            this.insertAround('`', '`');
                        }
                    }
                },
                preview: {
                    name: "preview",
                    className: "fa fa-search",
                    action: function () {
                        if ($(".md-editor-preview").length > 0) {
                            $('.CodeMirror').show();
                            $(".md-editor-toolbar li a").removeClass("disabled");
                            $('.md-editor-preview').remove();
                        } else {
                            $(".md-editor-toolbar li:not(.preview,.fullScreen) a").addClass("disabled");
                            $('<div/>').css({height: $('.CodeMirror').height(), overflow: 'auto', background: 'white'}).addClass('md-editor-preview').html(marked(this.cm.getValue())).insertBefore($('.CodeMirror'));
                            $('.CodeMirror').hide();
                        }
                    }
                },
                info: {
                    name: "info",
                    className: "fa fa-info-circle",
                    action: function() {
                        window.open("https://cuileon.github.io/md-editor/");
                    }
                },
                fullScreen: {
                    name: "fullScreen",
                    className: "fa fa-expand",
                    action: function () {
                        var el = this.cm.getWrapperElement();
                        if ($(el.parentNode).hasClass('fullscreen')) {
                            $('.fullScreen a').removeClass('fa-compress').addClass('fa-expand');
                            $(el.parentNode).removeClass('fullscreen');
                            $(el).height('300');
                        } else {
                            $(el).height('100%');
                            $('.fullScreen a').removeClass('fa-expand').addClass('fa-compress');
                            $(el.parentNode).addClass('fullscreen');
                        }
                    }
                }
            },
            disabledButtons: []
        };
        this.options = $.extend(true, {}, this.defaults, opt);
    };

    MarkdownEditor.prototype = {
        debug: function () {
        },
        setWrapper: function () {
            this.wrapper = $('<div/>').addClass('md-editor');
        },
        setCodeMirror: function () {
            this.cm = CodeMirror.fromTextArea(this.$element[0], this.options.codeMirror);
        },
        setToolbar: function () {
            var editor = this;
            var cm = editor.cm;
            var toolbar = $('<ul/>').addClass('md-editor-toolbar');
            jQuery.each(this.options.buttons, function(key, button) {
                if(jQuery.inArray(key, editor.options.disabledButtons) != -1) {
                    return true;
                }
                var item = $('<li/>').addClass(key),
                    anchor = $('<a/>').addClass(button.className);
                anchor.appendTo(item).click(function () {
                    if (button.action && !$(this).hasClass('disabled')) {
                        cm.focus();
                        button.action.call(editor);
                    }
                });
                toolbar.append(item);
            });
            this.toolbar = toolbar;
        },
        setAssemble: function () {
            var cmWrapper = this.cm.getWrapperElement();
            $(cmWrapper).wrap(this.wrapper);
            this.toolbar.insertBefore(cmWrapper);
        },
        insert: function insert(insertion) {
            var doc = this.cm.getDoc();
            var cursor = doc.getCursor();

            doc.replaceRange(insertion, {line: cursor.line, ch: cursor.ch});
        },
        insertAround: function (start, end) {
            var doc = this.cm.getDoc();
            var cursor = doc.getCursor();

            if (doc.somethingSelected()) {
                var selection = doc.getSelection();
                doc.replaceSelection(start + selection + end);
            } else {
                doc.replaceRange(start + end, {line: cursor.line, ch: cursor.ch});
                doc.setCursor({line: cursor.line, ch: cursor.ch + start.length});
            }
        },
        insertBefore: function (insertion, cursorOffset) {
            var doc = this.cm.getDoc();
            var cursor = doc.getCursor();

            if (doc.somethingSelected()) {
                var selections = doc.listSelections();
                selections.forEach(function (selection) {
                    var pos = [selection.head.line, selection.anchor.line].sort();

                    for (var i = pos[0]; i <= pos[1]; i++) {
                        doc.replaceRange(insertion, {line: i, ch: 0});
                    }

                    doc.setCursor({line: pos[0], ch: cursorOffset || 0});
                });
            } else {
                doc.replaceRange(insertion, {line: cursor.line, ch: 0});
                doc.setCursor({line: cursor.line, ch: cursorOffset || 0});
            }
        }
    };

    $.fn.mdEditor = function (options) {
        var markdownEditor = new MarkdownEditor(this, options);
        markdownEditor.setWrapper();
        markdownEditor.setCodeMirror();
        markdownEditor.setToolbar();
        markdownEditor.setAssemble();
        return this;
    };
})(window.jQuery);
