(function ($) {
    'use strict';

    $(function () {
        var content = '<ul>';

        for (var i = 1; i <= 100; ++i) {
            var anchors = [];

            for (var j = 1; j <= 10; ++j) {
                var itemId = i + '-' + j;

                anchors.push('<a id="item-' + itemId + '" href="#item-' + itemId + '">Item ' + itemId + '</a>');
            }

            content += '<li id="line' + i + '">' + anchors.join(' ') + '</li>';
        }

        content += '</ul>';

        var $container = $('#container')
            .append(content)
            .scrollbox();

        $(window).on('resize orientationchange', function () {
            $container.scrollbox('update');
        });
    });
})(jQuery);