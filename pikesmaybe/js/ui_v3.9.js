var startGameFromScreen

window.onresize = resizeCanvas
window.onload = function(e) {
    // Window has loaded
    // defaultAdManager.requestAds()

    window.header = document.getElementById('header')
    window.banner = document.getElementById('googlebannerads')
    window.bannerRight = document.getElementById('googlebannerads-right')
    window.bannerLeft = document.getElementById('googlebannerads-left')
    window.bannerBottom = document.getElementById('googlebannerads-bottom')

    window.gameInstance = UnityLoader.instantiate(
        'gameContainer',
        'Build/WebGLv2.4.json', {
            onProgress: UnityProgress,
            width: '100%',
            height: '100%'
        }
    )
    window.gameInstance.onProgress = function(instance, progress) {
        moveProgress(progress)
        if (progress == 1) {
            hideProgress()
        }
    }

    //sendImpressionEvent('crosspromo', 'mobgs-io')
}

var UIManager = {
    HideUI: function() {
        var gameContent = window.document.getElementById('game-content')
        gameContent.classList.add('hide')
        window.banner && window.banner.classList.add('hide')
        window.bannerRight && window.bannerRight.classList.add('hide')
        window.bannerLeft && window.bannerLeft.classList.add('hide')
        //window.bannerBottom && window.bannerBottom.classList.add('hide')
        window.header && window.header.classList.add('hide')
    },

    ShowUI: function() {
        var gameContent = window.document.getElementById('game-content')
        gameContent.classList.remove('hide')
        window.banner && window.banner.classList.remove('hide')
        window.bannerRight && window.bannerRight.classList.remove('hide')
        window.bannerLeft && window.bannerLeft.classList.remove('hide')
        window.bannerBottom && window.bannerBottom.classList.remove('hide')
        window.header && window.header.classList.remove('hide')
    },

    HideLoading: function() {
        var loading = window.document.getElementById('loading')
        loading.classList.add('hide')
    }
}

function onShowUI() {
    return UIManager.ShowUI()
}

function onHideUI() {
    return UIManager.HideUI()
}

function onGameLoaded() {
    return UIManager.HideLoading()
}

function hideProgress() {
    var progress = document.getElementById('progress')
    var startingGame = document.getElementById('starting-game')
    progress.classList.add('hide')
    startingGame.classList.remove('hide')
}

function resizeCanvas() {
    canvas = document.getElementById('#canvas')
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
}

function moveProgress(width) {
    var elem = document.getElementById('bar')
    elem.style.width = Math.floor(width * 100) + '%'
    elem.innerHTML = Math.floor(width * 100) + '%'
}

function playButtonClicked(from) {
    sendClickEvent('game', 'play')
    startGameFromScreen = from
    try {
        defaultAdManager.requestAds()
    } catch (e) {
        StartGame(startGameFromScreen)
    }
}

function sendClickEvent(category, label) {
    window.ga && window.ga('send', 'event', category, 'Clicked', label)
}

function sendImpressionEvent(category, label) {
    window.ga && window.ga('send', 'event', category, 'Impression', label)
}

function openClownGames(element, game) {
    if (game === '/') {
        sendClickEvent('clowngames', 'homepage')
        openInNewTab('https://clown.gs/')
    } else {
        sendClickEvent('clowngames', game)
        openInNewTab(`https://clown.gs/play/${game}`)
    }
}

function openMoreIoGames() {
    sendClickEvent('external', 'more-io-games')
    openInNewTab('https://mobg.io')
}

function openCrossPromo(element, game) {
    sendClickEvent('crosspromo', game)
    openInNewTab(`https://${game}.io`)
}

function openPlayStorePage() {
    sendClickEvent('store', 'playstore')
    openInNewTab(
        'https://play.google.com/store/apps/details?id=com.clowngames.pikesio&referrer=utm_source%3DWebsite_pikesio%26utm_campaign%3DBadge'
    )
}

function openAppStorePage() {
    sendClickEvent('store', 'appstore')
    openInNewTab(
        'https://itunes.apple.com/us/app/pikes-io-brutal-squad/id1235530695'
    )
}

function openInNewTab(url) {
    var link = url
    document.onmouseup = function() {
        window.open(url, '_blank')
        document.onmouseup = null
    }
}

//-------------- Skin ----------
var twSkins = {
    RAINBOW: 'pic.twitter.com/2JMjY5gc5t',
    FROZEN: 'pic.twitter.com/3eORuwpL5p',
    FLAMEGUY: 'pic.twitter.com/znuLw0clfS',
    STRAWBAE: 'pic.twitter.com/MgUzW1woyQ'
}

function openSharePopup(skin) {
    openInNewTab(
        'https://www.facebook.com/sharer/sharer.php?u=http%3A%2F%2Fpikes.io%2F&title=Playing%20Pikes.io%20-%20Join%20me!&description=I%20unlocked%20' +
        skin +
        '%20!'
    )
}

function openTweetPopup(skin) {
    var url = 'http://pikes.io'
    var text = "Hey! Check out #pikesio. I've got a new skin! " + twSkins[skin]
    openInNewTab(
        'https://twitter.com/share?url=' +
        encodeURIComponent(url) +
        '&text=' +
        encodeURIComponent(text),
        '',
        'left=0,top=0,width=550,height=450,personalbar=0,toolbar=0,scrollbars=0,resizable=0'
    )
}

function beAFanClickHandler() {
    sendClickEvent('social', 'facebook')
    SendOpenPlatformMessage(1)
}

function followUsTwitterClickHandler() {
    sendClickEvent('social', 'twitter')
    SendOpenPlatformMessage(2)
}

function subscribeYoutubeClickHandler() {
    sendClickEvent('social', 'youtube')
    SendOpenPlatformMessage(3)
}

function followUsInstagramClickHandler() {
    sendClickEvent('social', 'instagram')
    SendOpenPlatformMessage(4)
}

function SendOpenPlatformMessage(platform) {
    if (platform == 1) {
        gameInstance.SendMessage('GameManager', 'likeFacebook')
    } else if (platform == 2) {
        gameInstance.SendMessage('GameManager', 'followTwitter')
    } else if (platform == 3) {
        gameInstance.SendMessage('GameManager', 'SubscribeToYoutube')
    } else if (platform == 4) {
        gameInstance.SendMessage('GameManager', 'FollowInstagram')
    }
}

function getFetchResult() {
    return !window.blocked
}

function StartGame(target) {
    gameInstance.SendMessage(target, 'startGame')
}

function showVideoAd() {
    if (ironsrcAdManager.isReady()) {
        ironsrcAdManager.show()
    } else {
        reviveAdManager.requestAds()
    }
}