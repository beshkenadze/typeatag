!function ($) {
    "use strict"

    var Typeatag = function (element, options) {
        this.$element = $(element).clone(), this.$original = $(element)
        this.$element.insertBefore(element)
        this.$original.hide()
        this.$element.attr('name', '')
        this.$element.attr('required', false)
        this.$element.attr('id', this.$original.attr('id') + '_clone')

        this.options = $.extend({}, $.fn.typeatag.defaults, options)

        this.tagplace = this.$element.parent().find(this.options.tagplace)

        if (this.tagplace.length == 0) {
            this.tagplace = $('<span/>').addClass('help-block').insertAfter(this.$element)
        }

        this.onSelect = this.options.onSelect
        this.queryName = this.options.queryName
        this.path = (this.$element.data('path') != undefined ? this.$element.data('path') : this.options.path ) || false
        this.getName = this.options.getName || this.getNameDefault
        this.getVal = this.options.getVal || this.getgetValDefault
        this.onRemove = this.options.onRemove
        this.getSource = this.options.getSource || this.getSourceDefault
        this.additionalParams = this.options.additionalParams || {}
        this.onChange = this.options.onChange
        this.tags = (this.$element.data('tags') != undefined ? this.$element.data('tags') : this.options.tags ) || []
        this.delimiter = this.options.delimiter
        this.listen()
        this.fillTags()
    }

    Typeatag.prototype = {
        constructor: Typeatag, listen: function () {
            var that = this;
            this.$element.typeahead({
                item: that.options.item,
                addnew: that.options.addnew,
                renderitem: this.options.renderitem,
                source: $.proxy(that.getSource, that),
                onselect: function (tag) {
                    that.$element.attr('value', '')
                    if (!that.checkUnique(tag) && that.options.unique) return

                    if (that.onSelect(tag) === false) return

                    if (this.creatednew) tag = tag.replace(this.newtext, '').trim()

                    that.addTag(tag);
                    that.checkLimit(that.$element)
                    that.onChange()
                },
                property: "name"
            })
        }, getSourceDefault: function (query, callback) {
            if (!this.path) false
            var params = {}
            params[this.queryName] = query

            $.get(this.path, $.extend({}, params, this.additionalParams), function (data) {
                callback(data)
            }, 'json');

        }, getTags: function () {
            return this.tags.length > 0 ? this.tags : [];
        }, setTags: function (tags, from) {
            this.tags = tags;

            var that = this
                , isNumber = typeof tags == "number"
                , isObject = typeof tags == "object"
                , isString = typeof tags == "string"
            this.$original.val('')
            if (isString) {
                this.$original.val(tags + this.delimiter)
            } else if (isObject) {
                var value = $.map(tags,function (tag) {
                    return that.getVal(tag);
                }).join(this.delimiter);

                this.$original.val(value);
            } else if (isNumber) {
            }

        }, addTag: function (tag) {
            var isExist = jQuery.inArray(this.getVal(tag), $.map(this.getTags(), this.getVal)) >= 0,
                tags = this.getTags();

            if (!isExist) {
                tags.push(tag);
                this.setTags(tags);
            }

            this.updateUi();

        }, updateUi: function () {
            var that = this;
            $(that.tagplace).empty();
            jQuery.each(that.getTags(), function (index, tag) {
                that.createTag(tag);
            });
        }, removeTag: function (tag) {
            var that = this, newTags;
            newTags = jQuery.grep(that.getTags(), function (value) {
                return that.getVal(value) != that.getVal(tag)
            })

            that.setTags(newTags, "removeTag")
            that.onRemove(tag)
            that.onChange()
        }, createTag: function (tag) {
            var that = this;

            var label = $('<span/>').addClass('label label-info tag').html(that.getName(tag))
            label.attr('data-tag', JSON.stringify(tag))
            var remove = $('<a/>').attr('href', '#').appendTo(label)
            remove.click(function (e) {
                e.preventDefault()
                try {
                    var tag = JSON.parse($(this).parent('.tag').data('tag'))
                } catch (e) {
                    var tag = $(this).parent('.tag').data('tag')
                }
                that.removeTag(tag)
                $(this).parent('.tag').remove()
                that.checkLimit()
            })
            $('<i/>').addClass('icon-remove icon-white').appendTo(remove)
            return label.appendTo(that.tagplace)
        }, fillTags: function () {
            var that = this
            that.updateUi();
            that.checkLimit()
        }, checkUnique: function (tag) {
            var that = this, flag = true
                , isNumber = typeof tag == "number"
                , isObject = typeof tag == "object"
                , isString = typeof tag == "string"

            $.each(this.getTags(), function (i, v) {
                if (isObject) {
                    if (v == that.getVal(tag)) {
                        flag = false
                        return
                    }
                } else {
                    if (v == tag) {
                        flag = false
                        return
                    }
                }

            })
            return flag
        }, checkLimit: function () {
            if (this.getTags().length >= this.options.limit) {
                this.$element.attr('disabled', true)
                this.$element.val(this.options.messages.limit)
            } else {
                this.$element.attr('disabled', false)
                this.$element.val('')
            }
        }, getNameDefault: function (tag) {
            return tag
        }, getValDefault: function (tag) {
            return tag
        }, select: function () {
            this.$element.typeahead('select')
        }
    }

    /* TYPEATAG PLUGIN DEFINITION
     * =========================== */
    $.fn.typeatag = function (option, args) {
        return this.each(function () {
            var $this = $(this)
                , data = $this.data('typeatag')
                , options = typeof option == 'object' && option
            if (!data) $this.data('typeatag', (data = new Typeatag(this, options)))
            if (typeof option == 'string') data[option](args)
        })
    }

    $.fn.typeatag.defaults = {
        'tags': [],
        'item': '<li><a href="#"></a></li>',
        'renderitem': null,
        'tagplace': '.help-block',
        'messageplace': '.help-inline',
        'messages': {
            'limit': 'Tag limit reached'
        },
        'onSelect': function (tag) {
        },
        'onRemove': function (tag) {
        },
        'onChange': function () {
        },
        'unique': true,
        'limit': 3,
        'delimiter': '|',
        'addnew': false,
        'queryName': 'query',
        'additionalParams': {},
        'min': 2,
        'getName': null,
        'getVal': null,
        'getSource': null,
        'path': ''
    }

    $.fn.typeatag.Constructor = Typeatag

    /* TYPEATAG DATA-API
     * ================== */

    $(function () {
        $('body').on('focus.typeatag.data-api', '[data-provide="typeatag"]', function (e) {
            var $this = $(this)
            if ($this.data('typeatag')) return
            e.preventDefault()
            $this.typeatag($this.data())
        })
    })
}(window.jQuery);