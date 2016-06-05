(function (QUnit, $, Modernizr) {
    'use strict';

    var createScrollbox = function (scrollboxMaxHeight, contentHeight) {
        return $([
            '<div class="scrollbox-test" style="max-height: ' + scrollboxMaxHeight + 'px">',
                '<div style="height: ' + contentHeight + 'px"></div>',
            '</div>'
        ].join(''));
    };

    var moveFingerBy = function (type, from, by, delay, timing) {
        var deferred = $.Deferred();

        if (undefined === timing) {
            timing = 'minimal';
        }

        (new Hand({ timing: timing }))
            .growFinger(type, {
                x: from.x,
                y: from.y
            })
            .down()
            .moveBy(by.x, by.y, delay)
            .up();

        window.setTimeout(deferred.resolve, delay + 50);

        return deferred;
    };

    $(function () {
        QUnit.module('Scrollbox plugin');

        QUnit.test('should be defined on jquery object', function (assert) {
            assert.expect(1);

            assert.ok($(document.body).scrollbox, 'scrollbox method is defined');
        });

        QUnit.module('Scrollbox API');

        QUnit.test('should return jquery collection containing the element', function (assert) {
            assert.expect(2);

            var $el = $('<div/>'),
                $scrollbox = $el.scrollbox();

            assert.ok($scrollbox instanceof $, 'returns jquery collection');
            assert.strictEqual($scrollbox[0], $el[0], 'collection contains element');
        });

        QUnit.test('should expose defaults var for settings', function (assert) {
            assert.expect(1);

            assert.ok($.fn.scrollbox.defaults, 'default object exposed');
        });

        QUnit.test('should fire `init` event', function (assert) {
            assert.expect(1);

            var done = assert.async();

            $('<div/>')
                .on('init.scrollbox', function () {
                    assert.ok(true, '`init` event fired');
                    done();
                })
                .scrollbox();
        });

        QUnit.test('should fire `scroll` event', function (assert) {
            assert.expect(1);

            var done = assert.async();

            createScrollbox(40, 150)
                .appendTo('#qunit-fixture')
                .scrollbox()
                .on('scroll.scrollbox', function () {
                    assert.ok(true, '`scroll` event fired');
                    done();
                })
                .trigger($.Event('mousewheel', {
                    deltaY: 1
                }));
        });

        QUnit.test('should fire `reach` event', function (assert) {
            assert.expect(6);

            var done = assert.async(6),
                scrollboxMaxHeight = 40,
                contentHeight = 150;

            createScrollbox(scrollboxMaxHeight, contentHeight)
                .appendTo('#qunit-fixture')
                .one('reach.scrollbox', function (e) {
                    assert.strictEqual(
                        e.position,
                        'top',
                        '`reach` event with `position` == `top` fired on start'
                    );

                    done();

                    $(this)
                        .one('reach.scrollbox', function (e) {
                            assert.strictEqual(
                                e.position,
                                'bottom',
                                '`reach` event with `position` == `bottom` fired on scroll through plugin API'
                            );

                            done();

                            $(this)
                                .scrollbox('destroy')
                                .remove();
                        });

                    setTimeout($.proxy(function () {
                        $(this).scrollbox('jump', 'bottom');
                    }, this), 20);
                })
                .scrollbox({
                    start: 'top'
                });

            createScrollbox(scrollboxMaxHeight, contentHeight)
                .appendTo('#qunit-fixture')
                .one('reach.scrollbox', function (e) {
                    assert.strictEqual(
                        e.position,
                        'bottom',
                        '`reach` event with `position` == `bottom` fired on start'
                    );

                    done();

                    $(this)
                        .one('reach.scrollbox', function (e) {
                            assert.strictEqual(
                                e.position,
                                'top',
                                '`reach` event with `position` == `top` fired on scroll through plugin API'
                            );

                            done();

                            $(this)
                                .scrollbox('destroy')
                                .remove();
                        });

                    setTimeout($.proxy(function () {
                        $(this).scrollbox('jump', 'top');
                    }, this), 20);
                })
                .scrollbox({
                    start: 'bottom'
                });

            createScrollbox(scrollboxMaxHeight, contentHeight)
                .appendTo('#qunit-fixture')
                .scrollbox({
                    start: 'top'
                })
                .one('reach.scrollbox', function (e) {
                    assert.strictEqual(
                        e.position,
                        'bottom',
                        '`reach` event with `position` == `bottom` fired on scroll through browser API'
                    );

                    done();

                    $(this)
                        .scrollbox('update') // reset triggers
                        .one('reach.scrollbox', function (e) {
                            assert.strictEqual(
                                e.position,
                                'top',
                                '`reach` event with `position` == `top` fired on scroll through browser API'
                            );

                            done();
                        })
                        .scrollTop(0);
                })
                .scrollTop(contentHeight - scrollboxMaxHeight);
        });

        QUnit.test('should not fire `reach` event if already is reached', function (assert) {
            assert.expect(2);

            var done = assert.async(2),
                scrollboxMaxHeight = 40,
                contentHeight = 150,
                $scrollbox;

            $scrollbox = createScrollbox(scrollboxMaxHeight, contentHeight)
                .appendTo('#qunit-fixture')
                .scrollbox({
                    start: 'top'
                })
                .one(function (e) {
                    if (e.position === 'top') {
                        assert.ok(false, '`reach` event with `position` == `top` fired repeatedly');
                        done();
                    }
                })
                .scrollTop(0);

            setTimeout(function () {
                assert.ok(true, '`reach` event is not fired');
                done();

                $scrollbox
                    .scrollbox('destroy')
                    .remove();

                $scrollbox = createScrollbox(scrollboxMaxHeight, contentHeight)
                    .appendTo('#qunit-fixture')
                    .scrollbox({
                        start: 'bottom'
                    })
                    .one(function (e) {
                        if (e.position === 'bottom') {
                            assert.ok(false, '`reach` event with `position` == `bottom` fired repeatedly');
                            done();
                        }
                    })
                    .scrollTop(contentHeight - scrollboxMaxHeight);

                setTimeout(function () {
                    assert.ok(true, '`reach` event is not fired');
                    done();
                }, 100);
            }, 100);
        });

        QUnit.test('should show rail and bar if content is taller than container', function (assert) {
            assert.expect(2);

            var $scrollbox = createScrollbox(40, 150),
                $container;

            $scrollbox
                .appendTo('#qunit-fixture')
                .scrollbox();

            $container = $scrollbox.parent();

            assert.ok($('.scrollbox-rail', $container).is(':visible'), 'rail is visible');
            assert.ok($('.scrollbox-bar', $container).is(':visible'), 'bar is visible');
        });

        QUnit.test('should not show rail and bar if container is taller than content', function (assert) {
            assert.expect(2);

            var $scrollbox = createScrollbox(150, 40),
                $container;

            $scrollbox
                .appendTo('#qunit-fixture')
                .scrollbox();

            $container = $scrollbox.parent();

            assert.ok($('.scrollbox-rail', $container).is(':not(:visible)'), 'rail is not visible');
            assert.ok($('.scrollbox-bar', $container).is(':not(:visible)'), 'bar is not visible');
        });

        QUnit.test('should not show rail and bar if height of the container is equal to height of the content', function (assert) {
            assert.expect(2);

            var $scrollbox = createScrollbox(150, 150),
                $container;

            $scrollbox
                .appendTo('#qunit-fixture')
                .scrollbox();

            $container = $scrollbox.parent();

            assert.ok($('.scrollbox-rail', $container).is(':not(:visible)'), 'rail is not visible');
            assert.ok($('.scrollbox-bar', $container).is(':not(:visible)'), 'bar is not visible');
        });

        QUnit.test('should start from the defined point', function (assert) {
            assert.expect(4);

            var $scrollbox = createScrollbox(40, 150);

            $scrollbox
                .appendTo('#qunit-fixture')
                .scrollbox();

            assert.strictEqual(
                $scrollbox.scrollTop(),
                0,
                'started from very top by default'
            );

            $scrollbox
                .scrollbox('destroy')
                .remove()
                .appendTo('#qunit-fixture')
                .scrollbox({
                    start: 'top'
                });

            assert.strictEqual(
                $scrollbox.scrollTop(),
                0,
                'started from very top if `start` defined as `top`'
            );

            $scrollbox
                .scrollbox('destroy')
                .remove()
                .appendTo('#qunit-fixture')
                .scrollbox({
                    start: 'bottom'
                });

            assert.strictEqual(
                $scrollbox.scrollTop(),
                $scrollbox[0].scrollHeight - $scrollbox.outerHeight(),
                'started from very bottom if `start` defined as `bottom`'
            );

            $scrollbox
                .scrollbox('destroy')
                .remove()
                .appendTo('#qunit-fixture')
                .scrollbox({
                    start: 25
                });

            assert.strictEqual(
                $scrollbox.scrollTop(),
                25,
                'started from defined point if `start` defined as number'
            );
        });

        QUnit.test('should scroll by defined distance', function (assert) {
            assert.expect(2);

            var $scrollbox = createScrollbox(40, 150),
                distance = 25;

            $scrollbox
                .appendTo('#qunit-fixture')
                .scrollbox({
                    start: 'top'
                })
                .scrollbox('scroll', distance);

            assert.strictEqual(
                $scrollbox.scrollTop(),
                distance,
                'scrolled down by ' + distance + 'px'
            );

            $scrollbox.scrollbox('scroll', -distance);

            assert.strictEqual(
                $scrollbox.scrollTop(),
                0,
                'scrolled up by ' + distance + 'px'
            );
        });

        QUnit.test('should not scroll by defined distance if already reached the boundaries', function (assert) {
            assert.expect(2);

            var done = assert.async(),
                $scrollbox = createScrollbox(40, 150),
                distance = 25,
                initialPosition;

            $scrollbox
                .appendTo('#qunit-fixture')
                .scrollbox({
                    start: 'top'
                })
                .scrollbox('scroll', -distance);

            assert.strictEqual(
                $scrollbox.scrollTop(),
                0,
                'not scrolled up outside the boundary'
            );

            $scrollbox
                .scrollbox('destroy')
                .remove()
                .appendTo('#qunit-fixture')
                .scrollbox({
                    start: 'bottom'
                });

            setTimeout(function () {
                initialPosition = $scrollbox.scrollTop();

                $scrollbox.scrollbox('scroll', distance);

                assert.strictEqual(
                    $scrollbox.scrollTop(),
                    initialPosition,
                    'not scrolled down outside the boundary'
                );

                done();
            }, 20);
        });
        
        QUnit.test('should jump to defined point', function (assert) {
            assert.expect(3);

            var $scrollbox = createScrollbox(40, 150),
                y;

            $scrollbox
                .appendTo('#qunit-fixture')
                .scrollbox({
                    start: 'top'
                });

            y = 100;

            $scrollbox.scrollbox('jump', y);

            assert.strictEqual(
                $scrollbox.scrollTop(),
                y,
                'scrolled to ' + y + 'px'
            );

            $scrollbox.scrollbox('jump', 'top');

            assert.strictEqual(
                $scrollbox.scrollTop(),
                0,
                'scrolled to the very top'
            );

            $scrollbox.scrollbox('jump', 'bottom');

            assert.strictEqual(
                $scrollbox.scrollTop(),
                $scrollbox[0].scrollHeight - $scrollbox.outerHeight(),
                'scrolled to the very bottom'
            );
        });
        
        QUnit.test('should re-render bar on update called', function (assert) {
            assert.expect(3);

            var done = assert.async(),
                $scrollbox = $('<div style="max-height: 50px"></div>'),
                contentHeight = 250,
                $content = $('<div></div>'),
                factor = 2,
                $bar,
                barHeight,
                barPosition;

            $content
                .height(contentHeight)
                .appendTo($scrollbox);

            $scrollbox
                .appendTo('#qunit-fixture')
                .scrollbox({
                    start: 'top'
                });

            $bar = $('.scrollbox-bar', $scrollbox.parent());
            barHeight = $bar.outerHeight();
            contentHeight *= factor; // 500px

            $content.height(contentHeight);
            $scrollbox.scrollbox('update');

            barHeight /= factor;

            assert.strictEqual(
                $bar.outerHeight(),
                barHeight,
                'bar height is decreased'
            );

            factor = .2;
            contentHeight *= factor; // 100px

            $content.height(contentHeight);
            $scrollbox.scrollbox('update');

            barHeight /= factor;

            assert.strictEqual(
                $bar.outerHeight(),
                barHeight,
                'bar height is increased'
            );

            $scrollbox.scrollbox('scroll', 20);

            setTimeout(function () {
                barPosition = $bar.position();

                factor = 2;
                contentHeight *= factor; // 200px

                $content.height(contentHeight);
                $scrollbox.scrollbox('update');

                assert.strictEqual(
                    Math.round($bar.position().top),
                    barPosition.top / factor,
                    'bar position is changed'
                );

                done();
            }, 100);
        });

        QUnit.test('should completely remove all stuff', function (assert) {
            assert.expect(5);

            var $scrollbox = createScrollbox(40, 150)
                    .appendTo('#qunit-fixture')
                    .scrollbox({
                        start: 'top'
                    })
                    .scrollbox('destroy'),
                $container = $scrollbox.parent();

            assert.strictEqual(
                $scrollbox.data('scrollbox'),
                undefined,
                'instance is removed'
            );

            assert.ok(
                $('.scrollbox-bar', $container).length === 0,
                'bar is disappeared'
            );

            assert.ok(
                $('.scrollbox-rail', $container).length === 0,
                'rail is disappeared'
            );

            assert.notOk(
                $container.is('.scrollbox-wrapper'),
                'wrapper is disappeared'
            );

            assert.notOk(
                $scrollbox.hasClass('scrollbox-overflowed'),
                'overflow restored'
            );
        });

        QUnit.module('Scrollbox GUI interaction');

        QUnit.test('should change bar state if it is captured or released (mouse)', function (assert) {
            assert.expect(2);

            var $scrollbox = createScrollbox(40, 150),
                $bar;

            $scrollbox
                .appendTo('#qunit-fixture')
                .scrollbox();

            $bar = $('.scrollbox-bar', $scrollbox.parent());

            $bar.trigger($.Event('mousedown', {
                which: 1
            }));

            assert.ok(
                $bar.hasClass('scrollbox-bar-captured'),
                'bar state has been changed to captured'
            );

            $(document).trigger($.Event('mouseup', {
                which: 1
            }));

            assert.notOk(
                $bar.hasClass('scrollbox-bar-captured'),
                'bar state has been changed to released'
            );
        });

        if (Modernizr.touchevents) {
            QUnit.test('should change bar state if it is captured or released (touch)', function (assert) {
                assert.expect(2);

                var done = assert.async(2),
                    $scrollbox = createScrollbox(40, 150),
                    hand = new Hand({timing: 'minimal'}),
                    finger,
                    $bar,
                    barOffset;

                $scrollbox
                    .appendTo('#qunit-fixture')
                    .scrollbox();

                $bar = $('.scrollbox-bar', $scrollbox.parent());
                barOffset = $bar.offset();

                finger = hand.growFinger('touch', {
                    x: barOffset.left + 1,
                    y: barOffset.top + 1
                });

                finger.down();

                setTimeout(function () {
                    assert.ok(
                        $bar.hasClass('scrollbox-bar-captured'),
                        'bar state has been changed to captured (touch)'
                    );

                    done();

                    finger.up();

                    setTimeout(function () {
                        assert.notOk(
                            $bar.hasClass('scrollbox-bar-captured'),
                            'bar state has been changed to released (touch)'
                        );

                        done();
                    }, 20);
                }, 20);
            });
        }

        QUnit.test('should scroll by the distance on mouse wheel', function (assert) {
            assert.expect(2);

            var done = assert.async(),
                $scrollbox = createScrollbox(40, 150)
                    .appendTo('#qunit-fixture')
                    .scrollbox({
                        start: 'top'
                    }),
                wheelSensitivity = $scrollbox.data('scrollbox').options.wheelSensitivity,
                deltaY,
                expectedDistance,
                scrollTop;

            scrollTop = $scrollbox.scrollTop();

            deltaY = -2;

            $scrollbox.trigger($.Event('mousewheel', {
                deltaY: deltaY
            }));

            expectedDistance = -deltaY * wheelSensitivity;

            assert.equal(
                $scrollbox.scrollTop(),
                scrollTop + expectedDistance,
                'scrolled down by ' + Math.abs(expectedDistance) + 'px'
            );

            setTimeout(function () {
                scrollTop = $scrollbox.scrollTop();

                deltaY = 1;

                $scrollbox.trigger($.Event('mousewheel', {
                    deltaY: deltaY
                }));

                expectedDistance = -deltaY * wheelSensitivity;

                assert.equal(
                    $scrollbox.scrollTop(),
                    scrollTop + expectedDistance,
                    'scrolled up by ' + Math.abs(expectedDistance) + 'px'
                );

                done();
            }, 20);
        });

        QUnit.test('should scroll by the distance on drag bar (mouse)', function (assert) {
            assert.expect(2);

            var scrollboxMaxHeight = 50,
                contentHeight = 200,
                ratio = scrollboxMaxHeight / contentHeight,
                $scrollbox = createScrollbox(scrollboxMaxHeight, contentHeight)
                    .appendTo('#qunit-fixture')
                    .scrollbox({
                        start: 'top'
                    }),
                $bar = $('.scrollbox-bar', $scrollbox.parent()),
                barOffset,
                delta,
                distance,
                scrollTop;

            scrollTop = $scrollbox.scrollTop();
            barOffset = $bar.offset();
            delta = 8;

            $bar
                .trigger($.Event('mousedown', {
                    which: 1,
                    pageY: barOffset.top
                }));

            $(document)
                .trigger($.Event('mousemove', {
                    pageY: barOffset.top + delta
                }))
                .trigger($.Event('mouseup', {
                    which: 1
                }));

            distance = delta / ratio;

            assert.strictEqual(
                $scrollbox.scrollTop() - scrollTop,
                distance,
                'scrolled down by ' + Math.abs(distance) + 'px'
            );

            scrollTop = $scrollbox.scrollTop();
            barOffset = $bar.offset();
            delta = -8;

            $bar
                .trigger($.Event('mousedown', {
                    which: 1,
                    pageY: barOffset.top
                }));

            $(document)
                .trigger($.Event('mousemove', {
                    pageY: barOffset.top + delta
                }))
                .trigger($.Event('mouseup', {
                    which: 1
                }));

            distance = delta / ratio;

            assert.strictEqual(
                $scrollbox.scrollTop() - scrollTop,
                distance,
                'scrolled up by ' + Math.abs(distance) + 'px'
            );
        });

        if (Modernizr.touchevents) {
            QUnit.test('should scroll by the distance on drag bar (touch)', function (assert) {
                assert.expect(2);

                var done = assert.async(2),
                    scrollboxMaxHeight = 500,
                    contentHeight = 5000,
                    ratio = scrollboxMaxHeight / contentHeight,
                    $scrollbox = createScrollbox(scrollboxMaxHeight, contentHeight)
                        .appendTo('#qunit-fixture')
                        .scrollbox({
                            start: 'top'
                        }),
                    $bar = $('.scrollbox-bar', $scrollbox.parent()),
                    barOffset,
                    delta,
                    distance,
                    scrollTop;

                scrollTop = $scrollbox.scrollTop();

                delta = {
                    x: 0,
                    y: 20
                };

                barOffset = $bar.offset();

                moveFingerBy('touch', {
                    x: barOffset.left,
                    y: barOffset.top
                }, delta, 20, 'instant').done(function () {
                    distance = delta.y / ratio;

                    assert.strictEqual(
                        $scrollbox.scrollTop() - scrollTop,
                        distance,
                        'scrolled down by ' + Math.abs(distance) + 'px'
                    );

                    done();

                    scrollTop = $scrollbox.scrollTop();

                    delta = {
                        x: 0,
                        y: -8
                    };

                    barOffset = $bar.offset();

                    moveFingerBy('touch', {
                        x: barOffset.left,
                        y: barOffset.top + 10
                    }, delta, 20, 'instant').done(function () {
                        distance = delta.y / ratio;

                        assert.strictEqual(
                            $scrollbox.scrollTop() - scrollTop,
                            distance,
                            'scrolled up by ' + Math.abs(distance) + 'px'
                        );

                        done();
                    });
                });
            });

            QUnit.test('should scroll by the distance on drag container', function (assert) {
                assert.expect(2);

                var done = assert.async(2),
                    scrollboxMaxHeight = 500,
                    contentHeight = 5000,
                    $scrollbox = createScrollbox(scrollboxMaxHeight, contentHeight)
                        .appendTo('#qunit-fixture')
                        .scrollbox({
                            start: 'top'
                        }),
                    containerOffset = $scrollbox.offset(),
                    momentumThresholdTime = $scrollbox.data('scrollbox').options.momentum.thresholdTime,
                    delta,
                    scrollTop;

                scrollTop = $scrollbox.scrollTop();

                delta = {
                    x: 0,
                    y: -100
                };

                moveFingerBy('touch', {
                    x: containerOffset.left,
                    y: containerOffset.top + 150
                }, delta, momentumThresholdTime + 1).done(function () {
                    assert.strictEqual(
                        $scrollbox.scrollTop() - scrollTop,
                        -delta.y,
                        'scrolled down by ' + Math.abs(delta.y) + 'px'
                    );

                    done();

                    scrollTop = $scrollbox.scrollTop();

                    delta = {
                        x: 0,
                        y: 100
                    };

                    moveFingerBy('touch', {
                        x: containerOffset.left,
                        y: containerOffset.top + 50
                    }, delta, momentumThresholdTime + 1).done(function () {
                        assert.strictEqual(
                            $scrollbox.scrollTop() - scrollTop,
                            -delta.y,
                            'scrolled up by ' + Math.abs(delta.y) + 'px'
                        );

                        done();
                    });
                });
            });

            QUnit.test('should scroll with inertia on swipe container', function (assert) {
                assert.expect(2);

                var done = assert.async(2),
                    scrollboxMaxHeight = 500,
                    contentHeight = 5000,
                    $scrollbox = createScrollbox(scrollboxMaxHeight, contentHeight)
                        .appendTo('#qunit-fixture')
                        .scrollbox({
                            start: 'top'
                        }),
                    containerOffset = $scrollbox.offset(),
                    delta,
                    scrollTop,
                    distance;

                scrollTop = $scrollbox.scrollTop();

                delta = {
                    x: 0,
                    y: -100
                };

                moveFingerBy('touch', {
                    x: containerOffset.left,
                    y: containerOffset.top + 150
                }, delta, 100).done(function () {
                    distance = Math.abs($scrollbox.scrollTop() - scrollTop);

                    assert.ok(
                        distance > Math.abs(delta.y),
                        'scrolled down with inertia by ' + distance + 'px'
                    );

                    done();

                    scrollTop = $scrollbox.scrollTop();

                    delta = {
                        x: 0,
                        y: 100
                    };

                    moveFingerBy('touch', {
                        x: containerOffset.left,
                        y: containerOffset.top + 50
                    }, delta, 100).done(function () {
                        distance = Math.abs($scrollbox.scrollTop() - scrollTop);

                        assert.ok(
                            distance > Math.abs(delta.y),
                            'scrolled up with inertia by ' + distance + 'px'
                        );

                        done();
                    });
                });
            });
        }
    });
})(QUnit, jQuery, Modernizr);

