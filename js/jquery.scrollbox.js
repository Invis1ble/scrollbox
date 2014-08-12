/**
 * jquery.scrollbox.js
 * 
 * @version    0.2.2
 * @author     Max Invis1ble
 * @copyright  (c) 2013-2014, Max Invis1ble
 * @license    MIT http://www.opensource.org/licenses/mit-license.php
 */
+function ($, window, document, undefined) {

    'use strict';
    
    var name = 'scrollbox',
        Scrollbox = function ($element, options) {
            var o = this.options = $.extend({}, $.fn[name].defaults, options);

            this.$element = $element;
            this.$rail = $(o.templates.rail);
            this.$bar = $(o.templates.bar);

            this.init = o.init || this.init;
            this.addListeners = o.addListeners || this.addListeners;
            this.removeListeners = o.removeListeners || this.removeListeners;
            this.scroll = o.scroll || this.scroll;
            this.jump = o.jump || this.jump;
            this.update = o.update || this.update;
            this.destroy = o.destroy || this.destroy;

            this._isOver = this._isCaptured = this._isShown = false;
            this._prevY = this._scrolledTo = 0;
            this._isReachTriggered = {top: false, bottom: false};
            this._scrollHeight = undefined;
            
            this._listeners = {};

            this.init();
        };
    
    Scrollbox.prototype = {
        
        init: function () {
            var options = this.options;
            
            this.$wrapper = this.$element
                .trigger('init.' + name)
                .css('overflow', 'hidden')
                .wrap(options.templates.wrapper).parent()
                .append(this.$rail)
                .append(this.$bar);
            
            this._updateBarHeight();
            
            if ('top' !== options.start) {
                this.jump(options.start);
            }
            
            if (this._isShown) {
                this.addListeners();
            }
        },
        
        addListeners: function () {
            this._listeners.wheel = $.proxy(this._wheel, this);
            
            this.$wrapper.on({
                mouseenter: $.proxy(this._enter, this),
                mouseleave: $.proxy(this._leave, this)
            });
            
            if (window.addEventListener) {
                window.addEventListener('DOMMouseScroll', this._listeners.wheel, false);
                window.addEventListener('mousewheel', this._listeners.wheel, false);
            }
            else {
                document.attachEvent('onmousewheel', this._listeners.wheel);
            }
            
            this.$bar.on('mousedown', $.proxy(this._capture, this));
            
            $(document).on({
                mouseup: $.proxy(this._release, this),
                mousemove: $.proxy(this._move, this)
            });
        },
        
        removeListeners: function () {
            this.$wrapper.off({
                mouseenter: this._enter,
                mouseleave: this._leave
            });
            
            if (window.removeEventListener) {
                window.removeEventListener('DOMMouseScroll', this._listeners.wheel, false);
                window.removeEventListener('mousewheel', this._listeners.wheel, false);
            }
            else {
                document.detachEvent('onmousewheel', this._listeners.wheel);
            }
            
            this.$bar.off('mousedown', this._capture);
            
            $(document).off({
                mouseup: this._release,
                mousemove: this._move
            });
        },
        
        _enter: function (e) {
            var event = $.Event('enter.' + name);
            
            this.$element.trigger(event);
            
            if (!event.isDefaultPrevented()) {
                e.preventDefault();
                this._isOver = true;
            }
        },
        
        _leave: function (e) {
            var event = $.Event('leave.' + name);
            
            this.$element.trigger(event);
            
            if (!event.isDefaultPrevented()) {
                e.preventDefault();
                this._isOver = false;
            }
        },
        
        _wheel: function (e) {
            if (!this._isOver) {
                return;
            }
            
            var e = e || window.event,
                event = $.Event('wheel.' + name);
            
            this.$element.trigger(event);
            
            if (!event.isDefaultPrevented()) {
                if (e.preventDefault) {
                    e.preventDefault();
                }
                else {
                    e.returnValue = false;
                }

                this.scroll((e.detail ? e.detail / 3 : - e.wheelDelta / 120) * this.options.sensitivity);
            }
        },
        
        _capture: function (e) {
            if (1 === e.which) {
                e.preventDefault();
                this.$element.trigger('dragstart.' + name);
                this._isCaptured = true;
                this._prevY = e.pageY;
            }
        },
        
        _move: function (e) {
            if (!this._isCaptured) return;
            this.$element.trigger('drag.' + name);
            e.preventDefault();
            this.scroll((e.pageY - this._prevY) / this._getRatio());
            this._prevY = e.pageY;
        },
        
        _release: function (e) {
            if (!this._isCaptured || 1 !== e.which) {
                return;
            }
            
            this.$element.trigger('dragstop.' + name);
            e.preventDefault();
            this._isCaptured = false;
        },
        
        scroll: function (delta) {
            var max = this._getScrollHeight() - this.$element.outerHeight(),
                scrollTo = this._scrolledTo + delta,
                options = this.options,
                position;
            
            this.$element.trigger('scroll.' + name);
            
            if (scrollTo >= max) {
                this._scrolledTo = max;
            }
            else if (scrollTo <= 0) {
                this._scrolledTo = 0;
            }
            else {
                this._scrolledTo = scrollTo;
            }
            
            this.$element.scrollTop(this._scrolledTo);
            this._updateBarPosition();
            
            if (!this._isReachTriggered.bottom && this._scrolledTo + options.buffer >= max) {
                position = 'bottom';
            }
            else if (!this._isReachTriggered.top && this._scrolledTo - options.buffer <= 0) {
                position = 'top';
            }
            
            if (position) {
                this.$element.trigger($.Event('reach.' + name, {position: position}));
                this._isReachTriggered[position] = true;
            }
        },
        
        jump: function (y) {
            if ('top' === y) {
                y = 0;
            }
            else if ('bottom' === y) {
                y = this._getScrollHeight() - this.$element.height();
            }
            
            this.scroll(y - this._scrolledTo);
        },
        
        update: function () {
            var isShown = this._isShown;
            
            this._scrollHeight = undefined;
            this._isReachTriggered.top = this._isReachTriggered.bottom = false;
            this._updateBarHeight();
            
            if (this._isShown) {
                this._updateBarPosition();
                
                if (!isShown) {
                    this.addListeners();
                }
            }
        },
        
        _getRatio: function () {
            return this.$element.outerHeight() / this._getScrollHeight();
        },
        
        _getScrollHeight: function () {
            // opera bug workaround
            if (undefined === this._scrollHeight) {
                this._scrollHeight = this.$element[0].scrollHeight;
            }
            
            return this._scrollHeight;
        },
        
        _updateBarHeight: function () {
            var ratio = this._getRatio();
            
            if (1 !== ratio) {
                this.$bar.height(this.$element.outerHeight() * ratio);
                
                if (!this._isShown) {
                    this.$bar.addClass(name + '-bar-in');
                    this.$rail.addClass(name + '-rail-in');
                    this._isShown = true;
                }
            }
            else if (this._isShown) {
                this.removeListeners();
                this.$bar.removeClass(name + '-bar-in');
                this.$rail.removeClass(name + '-rail-in');
                this._isShown = false;
            }
        },
        
        _updateBarPosition: function () {
            var h = this.$element.outerHeight();
            this.$bar.css('top', (h - this.$bar.outerHeight()) * (this._scrolledTo / (this._getScrollHeight() - h)));
        },
        
        destroy: function () {
            this.$wrapper
                .off('.' + name)
                .find('*').off('.' + name);
            
            this.removeListeners();
            
            this.$element
                .unwrap()
                .removeData(name);
            
            this.$rail.remove();
            this.$bar.remove();
            
            this.$bar = this.$rail = this.$element = this.$wrapper = null;
        }
        
    };
    
    $.fn[name] = function (option) {
        var args = Array.prototype.slice.call(arguments, 1);
        
        return this.each(function () {
            var $this = $(this),
                data = $this.data(name),
                options;
            
            if ('object' === typeof option) {
                options = option;
            }
            
            if (!data) {
                $this.data(name, (data = new Scrollbox($this, options)));
            }
            
            if (typeof 'string' === option) {
                data[option].apply(data, args);
            }
        });
    };
    
    $.fn[name].Constructor = Scrollbox;
    
    $.fn[name].defaults = {
        buffer: 0,
        sensitivity: 20,
        start: 'top',
        templates: {
            bar: '<div class="' + name + '-bar"></div>',
            rail: '<div class="' + name + '-rail"></div>',
            wrapper: '<div class="' + name + '-wrapper"></div>'
        }
    };
    
}(jQuery, window, document);