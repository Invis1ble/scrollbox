$(function () {
    var $container = $('#container');

    $(window).on('resize orientationchange', function () {
        if ($container.data('scrollbox') !== undefined) {
            $container.scrollbox('update');
        }
    });

    $.ajax({
        type: 'GET',
        url: 'https://en.wikipedia.org/w/api.php?callback=?',
        data: {
            page: 'JavaScript',
            action: 'mobileview',
            format: 'json',
            prop: 'text',
            sections: 'all'
        },
        contentType: 'application/json; charset=utf-8',
        dataType: 'json'
    }).done(function (data) {
        $.each(data.mobileview.sections, function (i, section) {
            $container.append(section.text);
        });

        $container.scrollbox();
    });
});