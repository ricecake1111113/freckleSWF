function IronSource(params, options) {
    this.ironRV = IronRV.getInstance(params)

    this.options = options || {}
    this.onAdCompleteCallback = this.options.onAdCompleteCallback || null
    this.onAdVideoStarted = this.options.onAdVideoStarted || null
    this.onAdVideoEnded = this.options.onAdVideoEnded || null
    this.onAdVideoReady = this.options.onAdVideoReady || null
    this.onAdLoadErrorCallback = options.onAdLoadErrorCallback || null
    this.completed = false
    this.loaded = false

    this.ironRV.addListener(IronRV.EVENTS.INIT_ERROR, this.onAdEvent.bind(this));
    this.ironRV.addListener(IronRV.EVENTS.READY, this.onAdEvent.bind(this));
    this.ironRV.addListener(IronRV.EVENTS.OPEN, this.onAdEvent.bind(this));
    this.ironRV.addListener(IronRV.EVENTS.CLOSE, this.onAdEvent.bind(this));
    this.ironRV.addListener(IronRV.EVENTS.COMPLETION, this.onAdEvent.bind(this));
    this.ironRV.addListener(IronRV.EVENTS.NO_CAMPAIGNS, this.onAdEvent.bind(this));
    this.ironRV.addListener(IronRV.EVENTS.AD_BLOCK, this.onAdEvent.bind(this));
}

IronSource.prototype.show = function() {
    this.ironRV.show()
}

IronSource.prototype.isReady = function() {
    return this.loaded || this.ironRV.isReady()
}

IronSource.prototype.isVisible = function() {
    this.ironRV.isVisible();
}

IronSource.prototype.onAdEvent = function(eventType) {
    var self = this
    //console.log(eventType)
    switch (eventType.name) {
        case IronRV.EVENTS.READY:
            console.log("Ad Ready");
            self.completed = false
            self.loaded = true
            self.onAdVideoReady && self.onAdVideoReady()
            break
        case IronRV.EVENTS.OPEN:
            //console.log("Opened");
            self.completed = false
            self.loaded = false
            self.onAdVideoStarted && self.onAdVideoStarted()
            break
        case IronRV.EVENTS.CLOSE:
            //console.log("Closed");
            if (self.completed) {
                self.onAdCompleteCallback && self.onAdCompleteCallback()
            } else {
                self.onAdVideoEnded && self.onAdVideoEnded()
            }
            self.completed = false
            self.loaded = false
            break
        case IronRV.EVENTS.COMPLETION:
            //console.log("Completion");
            self.completed = true
            break
        case IronRV.EVENTS.NO_CAMPAIGNS:
            console.log("No Fill");
            self.loaded = false
            self.onAdLoadErrorCallback && self.onAdLoadErrorCallback("No Campaigns")
            break
        case IronRV.EVENTS.AD_BLOCK:
            console.log("Ad Block");
            self.loaded = false
            self.onAdLoadErrorCallback && self.onAdLoadErrorCallback("Ad Block")
            break
        case IronRV.EVENTS.INIT_ERROR:
            console.log("Init Error");
            self.loaded = false
            self.onAdLoadErrorCallback && self.onAdLoadErrorCallback("Not Initialized")
            break
        default:
            console.log("unknown :", eventType)
            break

    }
}