document.addEventListener("DOMContentLoaded", function(event) {
    var isMobile = {
        Android: function() {
            return navigator.userAgent.match(/Android/i)
        },
        BlackBerry: function() {
            return navigator.userAgent.match(/BlackBerry/i)
        },
        iOS: function() {
            return navigator.userAgent.match(/iPhone|iPad|iPod/i)
        },
        Opera: function() {
            return navigator.userAgent.match(/Opera Mini/i)
        },
        Windows: function() {
            return navigator.userAgent.match(/IEMobile/i)
        },
        any: function() {
            return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows())
        }
    }

    function openMobileRedirectPopup(url) {
        var wrapper = document.getElementById('mobile-redirect-wrapper')
        var link = document.getElementById('mobile-redirect-link')

        var closeBtn = document.getElementById('mobile-close-redirect')
        closeBtn.onclick = function(e) {
            window.location.href = 'http://mobile.pikes.io'
        }

        link.href = url
        wrapper.classList.remove('whide')
    }

    if (isMobile.Android())
        openMobileRedirectPopup('http://market.android.com/details?id=com.clowngames.pikesio&hl=en')
    else if (isMobile.any())
        window.location.href = 'http://mobile.pikes.io'
})