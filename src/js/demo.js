$(function () {
    var $container = $('#container'),
        content,
        i;

    $(window).on('resize orientationchange', function () {
        if ($container.data('scrollbox') !== undefined) {
            $container.scrollbox('update');
        }
    });

    content = '<ul>';

    for (i = 1; i <= 500; ++ i) {
        content += '<li id="line' + i + '">Line ' + i + '</li>';
    }

    content += '</ul>';

    $container.append(content);

    $container.scrollbox();
});