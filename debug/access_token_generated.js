'use strict';

mapboxgl.accessToken = getAccessToken();

function getAccessToken() {
    var accessToken = (
        undefined ||
        "MAPBOX_TOKEN_REDACTED" ||
        getURLParameter('access_token') ||
        localStorage.getItem('accessToken')
    );
    try {
        localStorage.setItem('accessToken', accessToken);
    } catch (_) {}
    return accessToken;
}

function getURLParameter(name) {
    var regexp = new RegExp('[?&]' + name + '=([^&#]*)', 'i');
    var output = regexp.exec(window.location.href);
    return output && output[1];
}
