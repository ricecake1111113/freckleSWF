/**
 * General Ad Manager(video/image) for IMA SDK
 * for easier use in multiple different occasions at the
 * same time.
 */

var AD_STATUS = {
    NONE: 0,
    CLOSE_FINISHED: 1,
    CLOSE_ABORTED: 2,
    ERROR: 3
}

function AdManager(url, containers, options) {
    this.url = url || null
    this.containers = {
        wrapper: containers.wrapper,
        video: containers.video,
        ad: containers.ad,
        text: containers.text
    }

    this.adDisplayContainer = null
    this.adsRenderingSettings = null
    this.adsManager = null
    this.adsLoader = null

    this.state = {
        hadError: false
    }

    options = options || {}
    this.originManager = options.originManager || null
    this.width = options.width || 938
    this.height = options.height || 528
    this.tabSwitchDetection = options.tabSwitchDetection || false

    // called when Ad Wrapper container is hidden
    this.onAdOverlayHide = null
    this.onAdOverlayShow = null

    this.onAdErrorCallback = options.onAdErrorCallback || null
    this.onAdCompleteCallback = options.onAdCompleteCallback || null
    this.onAdVideoStarted = options.onAdVideoStarted || null
    this.onAdVideoEnded = options.onAdVideoEnded || null

    if (!window.google || !url || !this.containers.wrapper || !this.containers.video || !this.containers.ad)
        throw new Error('AdManager could not be initialized, possibly due to AdBlockers.')

    this.init()
}

AdManager.prototype.createAdDisplayContainer = function() {
    // We assume the adContainer is the DOM id of the element that will house the ads.
    adDisplayContainer = new google.ima.AdDisplayContainer(
        this.containers.ad, this.containers.video
    )

    adDisplayContainer.initialize()
    this.adDisplayContainer = adDisplayContainer
}

AdManager.prototype.init = function() {
    if (this.isDisabled()) return

    // Create the ad display container.
    this.createAdDisplayContainer()
    // Create ads loader.
    adsLoader = new google.ima.AdsLoader(this.adDisplayContainer)
    // Listen and respond to ads loaded and error events.
    adsLoader.addEventListener(
        google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED,
        this.onAdsManagerLoaded.bind(this),
        false
    )
    adsLoader.addEventListener(
        google.ima.AdErrorEvent.Type.AD_ERROR,
        this.onAdError.bind(this),
        false
    )

    this.adsLoader = adsLoader

    // add Visibility API hooks
    this.tabSwitchDetection && this.registerTabSwitchCallback()
}

AdManager.prototype.onAdsManagerLoaded = function(adsManagerLoadedEvent) {
    // Get the ads manager.
    var adsRenderingSettings = new google.ima.AdsRenderingSettings()
    adsRenderingSettings.restoreCustomPlaybackStateOnAdBreakComplete = true

    // videoContent should be set to the content video element.
    adsManager = adsManagerLoadedEvent.getAdsManager(
        this.containers.video, adsRenderingSettings
    )

    // Add listeners to the required events.
    adsManager.addEventListener(
        google.ima.AdErrorEvent.Type.AD_ERROR,
        this.onAdError.bind(this)
    )
    adsManager.addEventListener(
        google.ima.AdEvent.Type.CONTENT_PAUSE_REQUESTED,
        this.onContentPauseRequested.bind(this)
    )
    adsManager.addEventListener(
        google.ima.AdEvent.Type.CONTENT_RESUME_REQUESTED,
        this.onContentResumeRequested.bind(this)
    )
    adsManager.addEventListener(
        google.ima.AdEvent.Type.ALL_ADS_COMPLETED,
        this.onAdEvent.bind(this)
    )

    // Listen to any additional events, if necessary.
    adsManager.addEventListener(
        google.ima.AdEvent.Type.LOADED,
        this.onAdEvent.bind(this)
    )
    adsManager.addEventListener(
        google.ima.AdEvent.Type.STARTED,
        this.onAdEvent.bind(this)
    )
    adsManager.addEventListener(
        google.ima.AdEvent.Type.COMPLETE,
        this.onAdEvent.bind(this)
    )
    adsManager.addEventListener(
        google.ima.AdEvent.Type.SKIPPED,
        this.onAdEvent.bind(this)
    )

    this.adsRenderingSettings = adsRenderingSettings
    this.adsManager = adsManager
    this.showAd()
}

AdManager.prototype.isDisabled = function() {
    return !!(this.originManager && this.originManager.disabledAds)
}

AdManager.prototype.hide = function(err) {
    if (this.containers.wrapper && !this.containers.wrapper.classList.contains('hide'))
        this.containers.wrapper.classList.add('hide')

    this.onAdOverlayHide && this.onAdOverlayHide(err)
}

AdManager.prototype.show = function() {
    this.containers.wrapper && this.containers.wrapper.classList.remove('hide')
    this.onAdOverlayShow && this.onAdOverlayShow()
}

AdManager.prototype.showAd = function() {
    if (this.isDisabled()) {
        this.onAdOverlayHide()
        return
    }

    try {
        // Initialize the ads manager. Ad rules playlist will start at this time.
        this.adsManager.init(this.width, this.height, google.ima.ViewMode.FULLSCREEN)
        // Call play to start showing the ad. Single video and overlay ads will
        // start at this time; the call will be ignored for ad rules.
        // this.show()
        this.adsManager.start()
    } catch (adError) {
        // An error may be thrown if there was a problem with the VAST response.
        // hide the ads container on error
        this.hide()
    }
}

AdManager.prototype.onAdEvent = function(adEvent) {
    var self = this
    var adInterval

    // Retrieve the ad from the event. Some events (e.g. ALL_ADS_COMPLETED)
    // don't have ad object associated.
    var ad = adEvent.getAd()
    switch (adEvent.type) {
        case google.ima.AdEvent.Type.LOADED:
            this.containers.text.classList.add('hide')
            this.show()
            break

        case google.ima.AdEvent.Type.STARTED:
            this.onAdVideoStarted && this.onAdVideoStarted()

            // close the ad overlay when ad is finished
            // note that time from adsManager is in seconds
            adInterval = setInterval(function() {
                if (self.adsManager.getRemainingTime() * 1000 <= 0) {
                    self.hide()
                    clearInterval(adInterval)
                }
            }, 500)
            break

        case google.ima.AdEvent.Type.COMPLETE:
            this.onAdVideoEnded && this.onAdVideoEnded()

            // get new ads immediately
            clearInterval(adInterval)
            this.hide()
            this.containers.text.classList.remove('hide')
            this.onAdCompleteCallback && this.onAdCompleteCallback()
            break

        case google.ima.AdEvent.Type.SKIPPED:
            this.onAdVideoEnded && this.onAdVideoEnded()

            // get new ads immediately
            clearInterval(adInterval)
            this.containers.text.classList.remove('hide')
            this.hide()
            break
    }
}

AdManager.prototype.onAdError = function(adErrorEvent) {
    // Handle the error logging.
    this.state.hadError = true
    this.hide(adErrorEvent.getError())
    this.onAdErrorCallback && this.onAdErrorCallback()
}

AdManager.prototype.onContentPauseRequested = function() {}
AdManager.prototype.onContentResumeRequested = function() {}

AdManager.prototype.requestAds = function() {
    if (this.isDisabled()) return
    this.show()

    var adsManager = this.adsManager
    var adsLoader = this.adsLoader

    // not the first ad request
    if (adsManager) {
        adsManager.destroy()
        adsLoader.contentComplete()
    }

    // Request video ads.
    var adsRequest = new google.ima.AdsRequest()
    adsRequest.adTagUrl = this.url
    // Specify the linear and nonlinear slot sizes. This helps the SDK to
    // select the correct creative if multiple are returned.
    adsRequest.linearAdSlotWidth = this.width
    adsRequest.linearAdSlotHeight = this.height

    adsRequest.nonLinearAdSlotWidth = this.width
    adsRequest.nonLinearAdSlotHeight = this.height

    // to ensure that all AFG ads render correctly
    adsRequest.forceNonLinearFullSlot = true
    adsLoader.requestAds(adsRequest)
}

AdManager.prototype.registerTabSwitchCallback = function() {
    var self = this
    // Set the name of the hidden property and the change event for visibility
    var hidden, visibilityChange
    if (typeof document.hidden !== "undefined") { // Opera 12.10 and Firefox 18 and later support 
        hidden = "hidden"
        visibilityChange = "visibilitychange";
    } else if (typeof document.msHidden !== "undefined") {
        hidden = "msHidden"
        visibilityChange = "msvisibilitychange";
    } else if (typeof document.webkitHidden !== "undefined") {
        hidden = "webkitHidden"
        visibilityChange = "webkitvisibilitychange"
    }

    // If the page is hidden, pause the video;
    // if the page is shown, play the video
    function handleVisibilityChange() {
        if (document[hidden]) {
            self.adsManager && self.adsManager.pause()
        } else {
            self.adsManager && self.adsManager.resume()
        }
    }

    // Warn if the browser doesn't support addEventListener or the Page Visibility API
    if (typeof document.addEventListener === "undefined" || typeof document[hidden] === "undefined") {
        console.log("Page Visibility API is not supported")
    } else {
        // Handle page visibility change
        document.addEventListener(visibilityChange, handleVisibilityChange, false)
    }
}

function BannerAd(options) {
    this.libraryURL = options.libraryURL || null
    this.containerConfig = options.containerConfig || null
    this.registerCode = options.registerCode || null

    if (!this.libraryURL || !this.containerConfig || !this.registerCode) {
        console.log('[Banner ad] Not enough arguments')
        return false
    }

    this.libraryScript = BannerAd.createScript({
        src: this.libraryURL,
        async: true
    })
    this.container = BannerAd.createContainer(this.containerConfig)
    this.registerCodeScript = BannerAd.createScript({
        code: this.registerCode
    })
    this.enableServices = BannerAd.enableServices(this.containerConfig)
}

BannerAd.createScript = function(options) {
    var code = options ? options.code : null
    var src = options ? options.src : null
    var isAsync = options ? options.async : null

    // do not create empty script
    if (!code && !src) return

    var s = document.createElement('script')
    s.type = 'text/javascript'
    if (isAsync) s.async = true

    if (code) {
        try {
            s.appendChild(document.createTextNode(code))
        } catch (e) {
            s.text = code
        }
    } else if (src) {
        s.src = src
    }

    document.body.appendChild(s)
    return s
}

BannerAd.createContainer = function(options) {
    //var client = options ? options.client : null
    //var slot   = options ? options.slot   : null
    var style = options ? options.style : null
    var _class = options ? options.class : null
    var id = options ? options.id : null

    // not enough arguments
    // if ( !client || !slot ) {
    //   console.log('[Banner ad] Not enough arguments')
    //   return false
    // }

    var el = document.createElement('ins')
    // client && el.setAttribute("data-ad-client", client)
    // slot   && el.setAttribute("data-ad-slot", slot)
    style && el.setAttribute("style", style)
    _class && el.setAttribute("class", _class)
    id && el.setAttribute("id", id)

    document.body.appendChild(el)
    return el
}

BannerAd.enableServices = function(options) {
    var slot = options ? options.slot : null
    var id = options ? options.id : null
    var size = options ? options.size : null

    // not enough arguments
    if (!slot || !id ||  !size) {
        console.log('[Banner ad] Not enough arguments')
        return false
    }

    googletag.cmd.push(function() {
        googletag.defineSlot(slot, size, id).addService(googletag.pubads());
        googletag.pubads().enableSingleRequest();
        googletag.enableServices();
    });

    googletag.cmd.push(function() {
        googletag.display(id);
    });

    return true
}