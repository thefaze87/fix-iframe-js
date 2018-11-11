domains.done(function(data) {
    app.variables.ALLOWED_HOST_NAMES = data.split(',');
    if ($.inArray(hostname, app.variables.ALLOWED_HOST_NAMES) >= 0) {
        app.variables.encodedUrl = encodeURI(url);
        iframeStyles.attr('href', app.variables.encodedUrl);
    } else {
        throw { message: 'Invalid Iframe Styles URL received.' };
    }
});