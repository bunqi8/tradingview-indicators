({
    name: "Smart Money Breakout Channels",
    metainfo: {
        _metainfoVersion: 52,
        isTVScript: false,
        is_hidden_study: false,
        is_price_study: true,
        isCustomIndicator: true,
        format: { precision: 2, type: "price" },
        id: "SmartMoneyBreakoutChannels@tv-basicstudies-1",
        scriptIdPart: "",
        name: "Smart Money Breakout Channels",
        description: "Smart Money Breakout Channels",
        shortDescription: "Breakout Channels",
        defaults: {
            styles: {
                plot_upbreak: { plottype: "shape_label_up", location: "Absolute", color: "#00ffbb", textColor: "#131722", text: "▲", size: "auto" },
                plot_downbreak: { plottype: "shape_label_down", location: "Absolute", color: "#ff1100", textColor: "#ffffff", text: "▼", size: "auto" }
            },
            inputs: {
                in_0: false,
                in_1: true,
                in_2: 100,
                in_3: 14,
                in_4: true,
                in_5: "Comparison",
                in_6: "1",
                in_7: 0.5,
                in_8: "Tiny",
                in_9: "#00ffbb",
                in_10: "#ff1100"
            }
        },
        plots: [
            { id: "plot_upbreak", type: "shapes" },
            { id: "plot_downbreak", type: "shapes" }
        ],
        styles: {
            plot_upbreak: { title: "Bullish Breakout Signal", isHidden: false, text: "▲" },
            plot_downbreak: { title: "Bearish Breakout Signal", isHidden: false, text: "▼" }
        },
        inputs: [
            { id: "in_0", name: "Nested Channels", defval: false, type: "bool", group: "Main Settings", tooltip: "When enabled, allows multiple channels to overlap. When disabled, only one channel can exist at a time. Overlapping channels can show multiple breakout levels simultaneously." },
            { id: "in_1", name: "Strong Closes Only", defval: true, type: "bool", group: "Main Settings", tooltip: "When enabled, breakouts only trigger when more than 50% of the candle body is outside the channel. This reduces false signals from wicks. When disabled, any price movement outside the channel triggers a breakout." },
            { id: "in_2", name: "Normalization Length", defval: 100, type: "integer", min: 1, group: "Main Settings", tooltip: "The number of bars used to calculate the highest high and lowest low for price normalization. Higher values create more stable normalization but may be less responsive to recent price changes." },
            { id: "in_3", name: "Box Detection Length", defval: 14, type: "integer", min: 1, group: "Main Settings", tooltip: "The number of bars used to detect channel formation patterns. Lower values create more frequent channels but may be more sensitive to noise. Higher values create fewer but potentially more significant channels." },
            { id: "in_4", name: "Show Volume Analysis", defval: true, type: "bool", group: "Volume Analysis", tooltip: "When enabled, displays volume analysis as candle-like bars within the channel. This helps identify volume patterns that may precede breakouts." },
            { id: "in_5", name: "Volume Display Mode", defval: "Comparison", type: "text", options: ["Volume", "Comparison", "Delta"], group: "Volume Analysis", tooltip: "Volume: Shows total volume as symmetrical bars. Comparison: Shows up volume above midline, down volume below. Delta: Shows net volume delta (positive above, negative below midline)." },
            { id: "in_6", name: "Volume Delta Timeframe Source", defval: "1", type: "text", group: "Volume Analysis", tooltip: "The timeframe used to calculate volume delta data. Lower timeframes provide more granular volume analysis but may be noisier." },
            { id: "in_7", name: "Volume Scale", defval: 0.5, type: "float", min: 0.1, max: 2.0, step: 0.1, group: "Volume Analysis", tooltip: "Adjusts the height of volume bars relative to channel size. Higher values make volume bars more prominent, lower values make them more subtle." },
            { id: "in_8", name: "Volume Text Size", defval: "Tiny", type: "text", options: ["Tiny", "Small", "Medium", "Large"], group: "Appearance", tooltip: "Size of the volume text at the corner of the channels." },
            { id: "in_9", name: "Bullish Colour", defval: "#00ffbb", type: "color", group: "Appearance", tooltip: "Primary colour for bullish visual elements. Adjust for preferred palette – affects bars, fills, and labels when momentum is positive." },
            { id: "in_10", name: "Bearish Colour", defval: "#ff1100", type: "color", group: "Appearance", tooltip: "Primary colour for bearish visual elements. Adjust for preferred palette – affects bars, fills, and labels when momentum is negative." }
        ]
    },
    constructor: function () {
        this.init = function (ctx, get_input) {
            this._context = ctx;
            this._input = get_input;
            this._isDestroyed = false;
            this._subscribedVis = false;
            this._subscribedVisEvent = false;
            this._cachedStudyInfo = null;
            this._studyEverFound = false;
            this._heartbeatStarted = false;
            if (this._heartbeatInterval) {
                clearInterval(this._heartbeatInterval);
                this._heartbeatInterval = null;
            }
            this._drawnShapeIds = [];
            this.clearDrawings();

            this.bars = [];
            this.barTimes = [];
            this.channels = [];
            this.brokenChannels = [];
            this.signals = [];
            this.atrHistory = [];
            this.smoothedVolHistory = [];
            this.lastCrossLowerUpper = -1;
            this.prevLower = NaN;
            this.prevUpper = NaN;
            this.hvold = 0;
            this.lvold = 0;
            this._renderGen = (this._renderGen || 0) + 1;
        };

        this.destroy = function () {
            this._isDestroyed = true;
            if (this._renderTimer) {
                clearTimeout(this._renderTimer);
                this._renderTimer = null;
            }
            if (this._heartbeatInterval) {
                clearInterval(this._heartbeatInterval);
                this._heartbeatInterval = null;
            }
            this.clearDrawings();
            if (this._visProp && typeof this._visProp.unsubscribe === "function") {
                try { this._visProp.unsubscribe(this); } catch (_) {}
                this._visProp = null;
            }
            if (this._cachedStudyInfo && this._cachedStudyInfo.source && typeof this._cachedStudyInfo.source.onVisibilityChanged === "function") {
                try {
                    var visEv = this._cachedStudyInfo.source.onVisibilityChanged();
                    if (visEv && typeof visEv.unsubscribe === "function") {
                        visEv.unsubscribe(this);
                    }
                } catch (_) {}
            }
            this._cachedStudyInfo = null;
            this._subscribedVis = false;
            this._subscribedVisEvent = false;
            this._studyEverFound = false;
            this._heartbeatStarted = false;
            this.bars = [];
            this.barTimes = [];
            this.channels = [];
            this.brokenChannels = [];
            this.signals = [];
        };

        this.getChart = function () {
            if (typeof window === "undefined") return null;
            try {
                if (window.tvWidget) {
                    if (typeof window.tvWidget.activeChart === "function") return window.tvWidget.activeChart();
                    if (typeof window.tvWidget.chart === "function") return window.tvWidget.chart();
                }
                if (window.chartWidgetCollection && typeof window.chartWidgetCollection.activeChartWidget === "function") {
                    var acw = window.chartWidgetCollection.activeChartWidget();
                    if (acw && acw.chart) return acw.chart();
                }
                if (window.chartWidgetCollection && typeof window.chartWidgetCollection.activeChart === "function") {
                    return window.chartWidgetCollection.activeChart();
                }
                if (window.parent && window.parent !== window && window.parent.tvWidget) {
                    if (typeof window.parent.tvWidget.activeChart === "function") return window.parent.tvWidget.activeChart();
                    if (typeof window.parent.tvWidget.chart === "function") return window.parent.tvWidget.chart();
                }
            } catch (_) {}
            return null;
        };

        this.getStudySourceInfo = function () {
            if (this._cachedStudyInfo && this._cachedStudyInfo.source) {
                return this._cachedStudyInfo;
            }
            var chart = this.getChart();
            if (!chart) return { chart: null, source: null, id: null };

            var studyId = null;
            var studySource = null;
            try {
                function isOurStudy(name, id, desc) {
                    var n = String(name || "").toLowerCase();
                    var d = String(desc || "").toLowerCase();
                    var i = String(id || "").toLowerCase();
                    return n.indexOf("smart money breakout") !== -1 ||
                           n.indexOf("breakout channel") !== -1 ||
                           d.indexOf("smart money breakout") !== -1 ||
                           d.indexOf("breakout channel") !== -1 ||
                           i.indexOf("smartmoneybreakout") !== -1 ||
                           i.indexOf("breakoutchannels") !== -1;
                }

                if (typeof chart.getAllStudies === "function") {
                    var studies = chart.getAllStudies();
                    for (var sIdx = 0; sIdx < studies.length; sIdx++) {
                        var stObj = studies[sIdx];
                        if (stObj && isOurStudy(stObj.name, stObj.id, stObj.description)) {
                            studyId = stObj.id;
                            break;
                        }
                    }
                }
                if (chart._chartWidget && chart._chartWidget.model && chart._chartWidget.model().model) {
                    var mModel = chart._chartWidget.model().model();
                    if (studyId && typeof mModel.dataSourceForId === "function") {
                        studySource = mModel.dataSourceForId(studyId);
                    }
                    if (!studySource && typeof mModel.allStudies === "function") {
                        var allSt = mModel.allStudies();
                        for (var aIdx = 0; aIdx < allSt.length; aIdx++) {
                            var as = allSt[aIdx];
                            var asMeta = (typeof as.metaInfo === "function") ? as.metaInfo() : as._metaInfo;
                            if (asMeta && isOurStudy(asMeta.name, asMeta.id, asMeta.description)) {
                                studySource = as;
                                if (!studyId && as.id) {
                                    studyId = (typeof as.id === "function") ? as.id() : as.id;
                                }
                                break;
                            }
                        }
                    }
                }
            } catch (_) {}

            if (studySource) {
                this._cachedStudyInfo = { chart: chart, source: studySource, id: studyId };
                this._studyEverFound = true;
            }
            return { chart: chart, source: studySource, id: studyId };
        };

        this.clearDrawings = function () {
            if (this._renderTimer) {
                clearTimeout(this._renderTimer);
                this._renderTimer = null;
            }
            this._renderGen = (this._renderGen || 0) + 1;
            var chart = this.getChart();
            var idsToRemove = (this._drawnShapeIds || []).slice();
            if (typeof window !== "undefined" && window.__smbc_drawnShapeIds) {
                idsToRemove = idsToRemove.concat(window.__smbc_drawnShapeIds);
                window.__smbc_drawnShapeIds = [];
            }

            try {
                if (chart && chart._chartWidget && chart._chartWidget.model && chart._chartWidget.model().model) {
                    var mModel = chart._chartWidget.model().model();
                    var info = this._cachedStudyInfo;
                    var sSource = info ? info.source : null;
                    var sId = info ? info.id : null;
                    if (typeof mModel.allLineTools === "function") {
                        var lts = mModel.allLineTools();
                        for (var ltIdx = 0; ltIdx < lts.length; ltIdx++) {
                            var lt = lts[ltIdx];
                            if (!lt) continue;
                            var isOurTool = false;
                            if (typeof lt.ownerSource === "function") {
                                var os = lt.ownerSource();
                                var osId = os ? ((typeof os.id === "function") ? os.id() : os.id) : null;
                                if (os && (os === sSource || (sId && osId && osId === sId))) {
                                    isOurTool = true;
                                }
                            }
                            var ltId = (typeof lt.id === "function") ? lt.id() : lt.id;
                            if (isOurTool && ltId && idsToRemove.indexOf(ltId) === -1) {
                                idsToRemove.push(ltId);
                            }
                        }
                    }
                }
            } catch (_) {}

            if (chart && typeof chart.removeEntity === "function") {
                var seen = {};
                for (var i = 0; i < idsToRemove.length; i++) {
                    var id = idsToRemove[i];
                    if (id && !seen[id]) {
                        seen[id] = true;
                        try {
                            chart.removeEntity(id, { disableUndo: true });
                        } catch (_) {}
                    }
                }
            }
            this._drawnShapeIds = [];
        };

        function hexToRgba(hex, alpha) {
            if (!hex) return "rgba(120, 123, 134, " + alpha + ")";
            var c = hex.replace("#", "");
            if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
            var num = parseInt(c, 16);
            if (isNaN(num)) return hex;
            var r = (num >> 16) & 255;
            var g = (num >> 8) & 255;
            var b = num & 255;
            return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")";
        }

        function interpolateColor(color1, color2, factor) {
            function parseHex(h) {
                var c = (h || "#ffffff").replace("#", "");
                if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
                var n = parseInt(c, 16);
                if (isNaN(n)) return [255, 255, 255];
                return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
            }
            var rgb1 = parseHex(color1);
            var rgb2 = parseHex(color2);
            var r = Math.round(rgb1[0] + factor * (rgb2[0] - rgb1[0]));
            var g = Math.round(rgb1[1] + factor * (rgb2[1] - rgb1[1]));
            var b = Math.round(rgb1[2] + factor * (rgb2[2] - rgb1[2]));
            return "rgb(" + r + ", " + g + ", " + b + ")";
        }

        this.renderDrawings = function () {
            if (this._isDestroyed) return;
            var info = this.getStudySourceInfo();
            var chart = info.chart;
            var source = info.source;
            var studyId = info.id;
            var self = this;
            if (!chart || typeof chart.createMultipointShape !== "function") {
                if (!self._retryCount) self._retryCount = 0;
                if (self._retryCount < 20) {
                    self._retryCount++;
                    setTimeout(function () {
                        if (!self._isDestroyed) self.renderDrawings();
                    }, 200);
                }
                return;
            }
            self._retryCount = 0;
            if (source && !this._subscribedVis) {
                var props = (typeof source.properties === "function") ? source.properties() : source._properties;
                if (props && props.visible) {
                    this._visProp = props.visible;
                    this._subscribedVis = true;
                    try {
                        this._visProp.subscribe(this, function () {
                            var isVis = self._visProp.value();
                            if (!isVis) {
                                self.clearDrawings();
                            } else {
                                if (self._renderTimer) clearTimeout(self._renderTimer);
                                self._renderTimer = setTimeout(function () {
                                    if (!self._isDestroyed) self.renderDrawings();
                                }, 50);
                            }
                        });
                    } catch (_) {}
                }
            }
            if (source && !this._subscribedVisEvent && typeof source.onVisibilityChanged === "function") {
                try {
                    var visEv = source.onVisibilityChanged();
                    if (visEv && typeof visEv.subscribe === "function") {
                        this._subscribedVisEvent = true;
                        visEv.subscribe(this, function () {
                            if (source.isSourceHidden && source.isSourceHidden()) {
                                self.clearDrawings();
                            } else {
                                if (self._renderTimer) clearTimeout(self._renderTimer);
                                self._renderTimer = setTimeout(function () {
                                    if (!self._isDestroyed) self.renderDrawings();
                                }, 50);
                            }
                        });
                    }
                } catch (_) {}
            }

            if (source && typeof source.isSourceHidden === "function" && source.isSourceHidden()) {
                this.clearDrawings();
                return;
            }

            // Periodic heartbeat to auto-clean drawings if study is removed
            if (!this._heartbeatStarted) {
                this._heartbeatStarted = true;
                this._heartbeatInterval = setInterval(function () {
                    if (self._isDestroyed) return;
                    var c = self.getChart();
                    if (!c) return;
                    var found = false;
                    try {
                        if (typeof c.getAllStudies === "function") {
                            var sts = c.getAllStudies();
                            for (var k = 0; k < sts.length; k++) {
                                var sName = sts[k].name || "";
                                var sDesc = sts[k].description || "";
                                var sId = sts[k].id || "";
                                if (sName.indexOf("Smart Money Breakout") !== -1 ||
                                    sName.indexOf("Breakout Channel") !== -1 ||
                                    sDesc.indexOf("Smart Money Breakout") !== -1 ||
                                    sDesc.indexOf("Breakout Channel") !== -1 ||
                                    sId.indexOf("SmartMoneyBreakout") !== -1 ||
                                    sId.indexOf("BreakoutChannels") !== -1) {
                                    found = true;
                                    break;
                                }
                            }
                        }
                    } catch (_) {}
                    if (self._studyEverFound && !found) {
                        self._isDestroyed = true;
                        self.clearDrawings();
                    }
                }, 1000);
            }

            this.clearDrawings();
            var currentGen = self._renderGen;

            var barTimes = this.barTimes || [];
            var totalBars = barTimes.length;
            if (totalBars < 2) return;

            var timeDiff = (barTimes[totalBars - 1] - barTimes[0]) / Math.max(1, totalBars - 1);
            if (!timeDiff || isNaN(timeDiff) || timeDiff <= 0) timeDiff = 300;

            function track(res) {
                if (!res) return;
                function recordId(id) {
                    if (!id) return;
                    var sid = (typeof id === "string") ? id : (id.id ? (typeof id.id === "function" ? id.id() : id.id) : id);
                    if (!sid) return;
                    if (self._isDestroyed || self._renderGen !== currentGen) {
                        try {
                            if (chart && typeof chart.removeEntity === "function") {
                                chart.removeEntity(sid, { disableUndo: true });
                            }
                        } catch (_) {}
                        return;
                    }
                    self._drawnShapeIds.push(sid);
                    if (typeof window !== "undefined") {
                        window.__smbc_drawnShapeIds = window.__smbc_drawnShapeIds || [];
                        window.__smbc_drawnShapeIds.push(sid);
                    }
                }
                if (typeof res.then === "function") {
                    res.then(recordId).catch(function () {});
                } else {
                    recordId(res);
                }
            }

            var isDark = (typeof document !== "undefined" && document.body && (document.body.classList.contains("theme-dark") || document.body.getAttribute("data-theme") === "dark")) || false;
            var greenCss = this._green || "#00ffbb";
            var redCss = this._red || "#ff1100";
            var fgColor = isDark ? "#d1d4dc" : "#131722";
            var fgTextMuted = isDark ? "rgba(209, 212, 220, 0.75)" : "rgba(19, 23, 34, 0.7)";

            // Determine font size from input
            var fSize = 9;
            var tSizeStr = String(this._textSize || "Tiny").toLowerCase();
            if (tSizeStr === "small") fSize = 10;
            else if (tSizeStr === "medium") fSize = 12;
            else if (tSizeStr === "large") fSize = 14;

            // Combine active channels and recent broken channels (up to 60 channels total)
            var allChannelsToDraw = [];
            var broken = this.brokenChannels || [];
            var maxBroken = Math.min(55, broken.length);
            for (var bI = Math.max(0, broken.length - maxBroken); bI < broken.length; bI++) {
                allChannelsToDraw.push(broken[bI]);
            }
            var active = this.channels || [];
            for (var aI = 0; aI < active.length; aI++) {
                allChannelsToDraw.push(active[aI]);
            }

            // 1. Render Channels (Boxes + Bands + CenterLine + Volume Text)
            for (var cIdx = 0; cIdx < allChannelsToDraw.length; cIdx++) {
                var ch = allChannelsToDraw[cIdx];
                var sBar = Math.max(0, Math.min(totalBars - 1, ch.startBar));
                var eBar = Math.max(sBar, Math.min(totalBars - 1, ch.endBar));
                var t1 = barTimes[sBar];
                var t2 = barTimes[eBar];
                if (!t1 || !t2 || t1 >= t2) {
                    if (t1) t2 = t1 + timeDiff;
                    else continue;
                }

                var top = ch.top;
                var btm = ch.bottom;
                var vola = ch.vola || (top - btm) * 0.15;
                if (!top || !btm || top <= btm) continue;

                var upperBtm = Math.max(btm, top - vola);
                var lowerTop = Math.min(top, btm + vola);
                var centerY = ch.centerY || (top + btm) / 2;

                // 1a. Main Box (Semi-transparent background)
                try {
                    var boxOpts = {
                        shape: "rectangle",
                        lock: true,
                        disableSelection: true,
                        disableSave: true,
                        disableUndo: true,
                        overrides: {
                            "fillBackground": true,
                            "backgroundColor": "rgba(120, 123, 134, 0.1)",
                            "backgroundTransparency": 90,
                            "drawBorder": false,
                            "borderColor": "rgba(0,0,0,0)",
                            "color": "rgba(0,0,0,0)",
                            "linewidth": 0,
                            "linetoolrectangle.fillBackground": true,
                            "linetoolrectangle.backgroundColor": "rgba(120, 123, 134, 0.1)",
                            "linetoolrectangle.backgroundTransparency": 90,
                            "linetoolrectangle.drawBorder": false,
                            "linetoolrectangle.borderColor": "rgba(0,0,0,0)",
                            "linetoolrectangle.color": "rgba(0,0,0,0)",
                            "linetoolrectangle.linewidth": 0
                        }
                    };
                    if (studyId) boxOpts.ownerStudyId = studyId;
                    track(chart.createMultipointShape([{ time: t1, price: top }, { time: t2, price: btm }], boxOpts));
                } catch (_) {}

                // 1b. Upper Resistance Band (Red)
                try {
                    var uOpts = {
                        shape: "rectangle",
                        lock: true,
                        disableSelection: true,
                        disableSave: true,
                        disableUndo: true,
                        overrides: {
                            "fillBackground": true,
                            "backgroundColor": redCss,
                            "backgroundTransparency": 70,
                            "drawBorder": false,
                            "borderColor": "rgba(0,0,0,0)",
                            "color": "rgba(0,0,0,0)",
                            "linewidth": 0,
                            "linetoolrectangle.fillBackground": true,
                            "linetoolrectangle.backgroundColor": redCss,
                            "linetoolrectangle.backgroundTransparency": 70,
                            "linetoolrectangle.drawBorder": false,
                            "linetoolrectangle.borderColor": "rgba(0,0,0,0)",
                            "linetoolrectangle.color": "rgba(0,0,0,0)",
                            "linetoolrectangle.linewidth": 0
                        }
                    };
                    if (studyId) uOpts.ownerStudyId = studyId;
                    track(chart.createMultipointShape([{ time: t1, price: top }, { time: t2, price: upperBtm }], uOpts));
                } catch (_) {}

                // 1c. Lower Support Band (Green)
                try {
                    var lOpts = {
                        shape: "rectangle",
                        lock: true,
                        disableSelection: true,
                        disableSave: true,
                        disableUndo: true,
                        overrides: {
                            "fillBackground": true,
                            "backgroundColor": greenCss,
                            "backgroundTransparency": 70,
                            "drawBorder": false,
                            "borderColor": "rgba(0,0,0,0)",
                            "color": "rgba(0,0,0,0)",
                            "linewidth": 0,
                            "linetoolrectangle.fillBackground": true,
                            "linetoolrectangle.backgroundColor": greenCss,
                            "linetoolrectangle.backgroundTransparency": 70,
                            "linetoolrectangle.drawBorder": false,
                            "linetoolrectangle.borderColor": "rgba(0,0,0,0)",
                            "linetoolrectangle.color": "rgba(0,0,0,0)",
                            "linetoolrectangle.linewidth": 0
                        }
                    };
                    if (studyId) lOpts.ownerStudyId = studyId;
                    track(chart.createMultipointShape([{ time: t1, price: lowerTop }, { time: t2, price: btm }], lOpts));
                } catch (_) {}

                // 1d. Dashed Center Line
                try {
                    var cOpts = {
                        shape: "trend_line",
                        lock: true,
                        disableSelection: true,
                        disableSave: true,
                        disableUndo: true,
                        overrides: {
                            "linecolor": "rgba(120, 123, 134, 0.5)",
                            "linewidth": 1,
                            "linestyle": 2, // dashed
                            "linetooltrendline.linecolor": "rgba(120, 123, 134, 0.5)",
                            "linetooltrendline.linewidth": 1,
                            "linetooltrendline.linestyle": 2
                        }
                    };
                    if (studyId) cOpts.ownerStudyId = studyId;
                    track(chart.createMultipointShape([{ time: t1, price: centerY }, { time: t2, price: centerY }], cOpts));
                } catch (_) {}

                // 1e. Volume Text on Active Channel (at latest bar)
                if (ch.isActive && ch.volText) {
                    try {
                        var textPrice = ch.isTextUpper ? (top - vola * 0.5) : (btm + vola * 0.5);
                        var txtOpts = {
                            shape: "text",
                            text: ch.volText,
                            lock: true,
                            disableSelection: true,
                            disableSave: true,
                            disableUndo: true,
                            overrides: {
                                "color": fgTextMuted,
                                "textColor": fgTextMuted,
                                "fontsize": fSize,
                                "bold": true,
                                "fillBackground": false,
                                "backgroundColor": "rgba(0,0,0,0)",
                                "drawBorder": false,
                                "borderColor": "rgba(0,0,0,0)"
                            }
                        };
                        if (studyId) txtOpts.ownerStudyId = studyId;
                        track(chart.createShape({ time: t2, price: textPrice }, txtOpts));
                    } catch (_) {}
                }
            }

            // 2. Render Volume Analysis Bars (within active channels)
            if (this._shwVol && this._volBars && this._volBars.length > 0) {
                var maxVb = Math.min(100, this._volBars.length);
                for (var vIdx = this._volBars.length - maxVb; vIdx < this._volBars.length; vIdx++) {
                    var vb = this._volBars[vIdx];
                    var vbTime = barTimes[vb.bar];
                    if (!vbTime) continue;

                    // Upper Volume Bar
                    if (vb.uHigh > vb.uLow) {
                        try {
                            var uBarOpts = {
                                shape: "trend_line",
                                lock: true,
                                disableSelection: true,
                                disableSave: true,
                                disableUndo: true,
                                overrides: {
                                    "linecolor": vb.uColor || greenCss,
                                    "linewidth": 2,
                                    "linestyle": 0,
                                    "linetooltrendline.linecolor": vb.uColor || greenCss,
                                    "linetooltrendline.linewidth": 2,
                                    "linetooltrendline.linestyle": 0
                                }
                            };
                            if (studyId) uBarOpts.ownerStudyId = studyId;
                            track(chart.createMultipointShape([{ time: vbTime, price: vb.uHigh }, { time: vbTime, price: vb.uLow }], uBarOpts));
                        } catch (_) {}
                    }

                    // Lower Volume Bar
                    if (vb.lHigh > vb.lLow) {
                        try {
                            var lBarOpts = {
                                shape: "trend_line",
                                lock: true,
                                disableSelection: true,
                                disableSave: true,
                                disableUndo: true,
                                overrides: {
                                    "linecolor": vb.lColor || redCss,
                                    "linewidth": 2,
                                    "linestyle": 0,
                                    "linetooltrendline.linecolor": vb.lColor || redCss,
                                    "linetooltrendline.linewidth": 2,
                                    "linetooltrendline.linestyle": 0
                                }
                            };
                            if (studyId) lBarOpts.ownerStudyId = studyId;
                            track(chart.createMultipointShape([{ time: vbTime, price: vb.lHigh }, { time: vbTime, price: vb.lLow }], lBarOpts));
                        } catch (_) {}
                    }
                }
            }

            // 3. Render 21-Segment Gauge Bar + Pointer Label (on latest active channel)
            var activeChannels = this.channels || [];
            if (activeChannels.length > 0 && !this._lastUpbreak && !this._lastDownbreak) {
                var latestCh = activeChannels[0];
                var gTop = latestCh.top;
                var gBtm = latestCh.bottom;
                var lastTime = barTimes[totalBars - 1];

                if (gTop && gBtm && gTop !== gBtm && lastTime) {
                    var gaugeTime = lastTime + 2 * timeDiff;
                    var ptrTime = lastTime + 3 * timeDiff;
                    var segments = 21;
                    var segLen = (gTop - gBtm) / segments;

                    for (var sG = 0; sG < segments; sG++) {
                        var y1 = gTop - sG * segLen;
                        var y2 = gTop - (sG + 1) * segLen;
                        var factor = (segments > 1) ? (1 - sG / (segments - 1)) : 0.5; // 0 at bottom, 1 at top
                        var segCol = interpolateColor(redCss, greenCss, factor);

                        try {
                            var gOpts = {
                                shape: "trend_line",
                                lock: true,
                                disableSelection: true,
                                disableSave: true,
                                disableUndo: true,
                                overrides: {
                                    "linecolor": segCol,
                                    "linewidth": 4,
                                    "linestyle": 0,
                                    "linetooltrendline.linecolor": segCol,
                                    "linetooltrendline.linewidth": 4,
                                    "linetooltrendline.linestyle": 0
                                }
                            };
                            if (studyId) gOpts.ownerStudyId = studyId;
                            track(chart.createMultipointShape([{ time: gaugeTime, price: y1 }, { time: gaugeTime, price: y2 }], gOpts));
                        } catch (_) {}
                    }

                    // Pointer Label "◀"
                    var delvol = this._lastDelvol || 0;
                    delvol = Math.max(-100, Math.min(100, delvol));
                    var pointerPos = gTop - ((delvol + 100) / 200) * (gTop - gBtm);

                    try {
                        var pOpts = {
                            shape: "text",
                            text: "◀",
                            lock: true,
                            disableSelection: true,
                            disableSave: true,
                            disableUndo: true,
                            overrides: {
                                "color": fgColor,
                                "textColor": fgColor,
                                "fontsize": 11,
                                "bold": true,
                                "fillBackground": false,
                                "backgroundColor": "rgba(0,0,0,0)",
                                "drawBorder": false,
                                "borderColor": "rgba(0,0,0,0)"
                            }
                        };
                        if (studyId) pOpts.ownerStudyId = studyId;
                        track(chart.createShape({ time: ptrTime, price: pointerPos }, pOpts));
                    } catch (_) {}
                }
            }
        };

        this.main = function (ctx, inputCallback) {
            this._context = ctx;
            var PineStd = (typeof PineJS !== "undefined" && PineJS.Std) ? PineJS.Std : null;
            var rawIndex = -1;
            if (this._context && this._context.symbol && typeof this._context.symbol.index === "number") {
                rawIndex = this._context.symbol.index;
            } else if (PineStd && typeof PineStd.n === "function") {
                rawIndex = PineStd.n(this._context) - 1;
            } else if (this.bars) {
                rawIndex = this.bars.length;
            }

            // Safe guard against TradingView pre-bar initialization call (where symbol.index === -1)
            if (rawIndex < 0) {
                this.bars = [];
                this.barTimes = [];
                this.channels = [];
                this.brokenChannels = [];
                this.signals = [];
                this.atrHistory = [];
                this.smoothedVolHistory = [];
                this._volBars = [];
                this.lastCrossLowerUpper = -1;
                this.prevLower = NaN;
                this.prevUpper = NaN;
                this.prevClose = NaN;
                this.hvold = 0;
                this.lvold = 0;
                return [NaN, NaN];
            }

            var bar_index = rawIndex;
            var rawTime = PineStd ? PineStd.time(this._context) : Date.now();
            var timeSec = rawTime > 1e11 ? Math.floor(rawTime / 1000) : Math.floor(rawTime);
            var open = PineStd ? PineStd.open(this._context) : 0;
            var high = PineStd ? PineStd.high(this._context) : 0;
            var low = PineStd ? PineStd.low(this._context) : 0;
            var close = PineStd ? PineStd.close(this._context) : 0;
            var volume = PineStd ? PineStd.volume(this._context) : 0;
            if (isNaN(volume) || volume === null) volume = 0;

            if (!this.bars || bar_index === 0) {
                this.bars = [];
                this.barTimes = [];
                this.channels = [];
                this.brokenChannels = [];
                this.signals = [];
                this.atrHistory = [];
                this.smoothedVolHistory = [];
                this._volBars = [];
                this.lastCrossLowerUpper = -1;
                this.prevLower = NaN;
                this.prevUpper = NaN;
                this.prevClose = NaN;
                this.hvold = 0;
                this.lvold = 0;
            }

            if (this.bars.length > bar_index) {
                this.bars.length = bar_index;
                this.barTimes.length = bar_index;
                this.atrHistory.length = bar_index;
                this.smoothedVolHistory.length = bar_index;
                while (this.signals.length > 0 && this.signals[this.signals.length - 1].bar >= bar_index) {
                    this.signals.pop();
                }
            }

            var getInp = function (idx, def) {
                var v = typeof inputCallback === "function" ? inputCallback(idx) : undefined;
                return v !== undefined ? v : def;
            };

            var in_overlap = Boolean(getInp(0, false));
            var in_strong = Boolean(getInp(1, true));
            var in_length_ = Math.max(1, Math.round(Number(getInp(2, 100))));
            var in_length = Math.max(1, Math.round(Number(getInp(3, 14))));
            var in_shw_vol = Boolean(getInp(4, true));
            var in_vol_mode = String(getInp(5, "Comparison"));
            var in_tf = String(getInp(6, "1"));
            var in_vol_scale = Math.max(0.1, Math.min(2.0, Number(getInp(7, 0.5))));
            var in_text_size = String(getInp(8, "Tiny"));
            var in_green = String(getInp(9, "#00ffbb"));
            var in_red = String(getInp(10, "#ff1100"));

            this._green = in_green;
            this._red = in_red;
            this._textSize = in_text_size;
            this._shwVol = in_shw_vol;

            // 1. Normalization Length (ta.lowest and ta.highest over length_)
            var lLow = low;
            var hHigh = high;
            var normStart = Math.max(0, bar_index - in_length_ + 1);
            for (var k = normStart; k < bar_index; k++) {
                if (this.bars[k].low < lLow) lLow = this.bars[k].low;
                if (this.bars[k].high > hHigh) hHigh = this.bars[k].high;
            }
            var normalizedPrice = (hHigh === lLow) ? 0.5 : ((close - lLow) / (hHigh - lLow));

            this.bars[bar_index] = {
                open: open, high: high, low: low, close: close, volume: volume,
                time: timeSec, norm: normalizedPrice
            };
            this.barTimes[bar_index] = timeSec;

            // 2. vol = ta.stdev(normalizedPrice, 14)
            var curVol = 0;
            if (bar_index >= 13) {
                var sumN = 0;
                for (var vK = bar_index - 13; vK <= bar_index; vK++) {
                    sumN += this.bars[vK].norm;
                }
                var meanN = sumN / 14;
                var sumSqN = 0;
                for (var vK2 = bar_index - 13; vK2 <= bar_index; vK2++) {
                    var diffN = this.bars[vK2].norm - meanN;
                    sumSqN += diffN * diffN;
                }
                curVol = Math.sqrt(sumSqN / 14);
            }
            this.bars[bar_index].vol = curVol;

            // 3. upper = (highestbars(vol, length + 1) + length) / length
            //    lower = (lowestbars(vol, length + 1) + length) / length
            var highestIdx = 0, highestVal = -Infinity;
            var lowestIdx = 0, lowestVal = Infinity;
            var lookback = Math.min(bar_index, in_length);
            for (var offset = 0; offset <= lookback; offset++) {
                var v = this.bars[bar_index - offset].vol;
                if (v > highestVal) { highestVal = v; highestIdx = offset; }
                if (v < lowestVal) { lowestVal = v; lowestIdx = offset; }
            }
            var hBars = -highestIdx;
            var lBars = -lowestIdx;
            var curUpper = (hBars + in_length) / in_length;
            var curLower = (lBars + in_length) / in_length;

            // 4. duration = math.max(nz(ta.barssince(ta.crossover(lower, upper))), 1)
            var crossLowerUpper = (bar_index > 0 && this.prevLower <= this.prevUpper && curLower > curUpper);
            if (crossLowerUpper) {
                this.lastCrossLowerUpper = bar_index;
            }
            var duration = (this.lastCrossLowerUpper === -1) ? 1 : Math.max(1, bar_index - this.lastCrossLowerUpper);

            // 5. h = ta.highest(duration), l = ta.lowest(duration)
            var h = -Infinity;
            var l = Infinity;
            var durStart = Math.max(0, bar_index - duration + 1);
            for (var dK = durStart; dK <= bar_index; dK++) {
                if (this.bars[dK].high > h) h = this.bars[dK].high;
                if (this.bars[dK].low < l) l = this.bars[dK].low;
            }

            // 6. Up/Down Volume & Volume Delta (ta.requestUpAndDownVolume)
            var range = high - low;
            var upRatio = (range > 0) ? (close - low) / range : 0.5;
            var dnRatio = (range > 0) ? (high - close) / range : 0.5;
            var uv = volume * upRatio;
            var dv = volume * dnRatio;
            var vold = uv - dv;

            if (bar_index === 0) {
                this.hvold = vold;
                this.lvold = vold;
            }
            if (crossLowerUpper) {
                this.hvold = vold;
                this.lvold = vold;
            }
            if (vold > this.hvold) this.hvold = vold;
            if (vold < this.lvold) this.lvold = vold;

            // 7. smoothedvol = ta.sma(volume, 20), vola = ta.atr(length)/2
            var curSmoothedVol = volume;
            if (bar_index >= 19) {
                var sumV = 0;
                for (var sK = bar_index - 19; sK <= bar_index; sK++) sumV += this.bars[sK].volume;
                curSmoothedVol = sumV / 20;
            }
            this.smoothedVolHistory[bar_index] = curSmoothedVol;

            var tr = (bar_index === 0) ? (high - low) : Math.max(high - low, Math.abs(high - this.prevClose), Math.abs(low - this.prevClose));
            var curAtr = tr;
            if (bar_index > 0 && typeof this.atrHistory[bar_index - 1] === "number") {
                var lastAtr = this.atrHistory[bar_index - 1];
                curAtr = (lastAtr * (in_length - 1) + tr) / in_length;
            }
            this.atrHistory[bar_index] = curAtr;
            var vola = curAtr / 2.0;

            // 8. New Channel Formation: ta.crossover(upper, lower) and duration > 10
            var crossUpperLower = (bar_index > 0 && this.prevUpper <= this.prevLower && curUpper > curLower);
            var channelsList = this.channels;

            function canCreate(tNew, bNew) {
                if (channelsList.length === 0) return true;
                for (var j = 0; j < channelsList.length; j++) {
                    if (tNew > channelsList[j].bottom && bNew < channelsList[j].top) {
                        return false;
                    }
                }
                return true;
            }

            var newChannelFormed = false;
            if (crossUpperLower && duration > 10) {
                if (in_overlap || canCreate(h, l)) {
                    var newCh = {
                        startBar: bar_index - duration,
                        endBar: bar_index,
                        top: h,
                        bottom: l,
                        vola: vola,
                        centerY: (h + l) / 2.0,
                        isActive: true,
                        volText: "",
                        isTextUpper: false
                    };
                    this.channels.unshift(newCh);
                    newChannelFormed = true;
                }
            }

            // 9. Channel Breakouts and Expansion
            var upbreak = 0.0;
            var downbreak = 0.0;
            var bullishBreakout = false;
            var bearishBreakout = false;

            var currentTestPrice = in_strong ? ((close + open) / 2.0) : close;

            if (this.channels.length > 0) {
                for (var i = this.channels.length - 1; i >= 0; i--) {
                    var ch = this.channels[i];
                    if (currentTestPrice > ch.top) {
                        upbreak = ch.bottom;
                        ch.endBar = bar_index;
                        ch.isActive = false;
                        ch.brokenType = "BULLISH";
                        this.brokenChannels.push(ch);
                        this.channels.splice(i, 1);
                        bullishBreakout = true;
                        this.signals.push({ bar: bar_index, type: "BUY", price: upbreak });
                    } else if (currentTestPrice < ch.bottom) {
                        downbreak = ch.top;
                        ch.endBar = bar_index;
                        ch.isActive = false;
                        ch.brokenType = "BEARISH";
                        this.brokenChannels.push(ch);
                        this.channels.splice(i, 1);
                        bearishBreakout = true;
                        this.signals.push({ bar: bar_index, type: "SELL", price: downbreak });
                    } else {
                        ch.endBar = bar_index;
                        ch.isActive = true;

                        // Add volume text to appropriate box
                        var boxMidline = (ch.top + ch.bottom) / 2.0;
                        var volText = "";
                        if (in_vol_mode === "Volume") {
                            volText = (Math.round((volume / 1000.0) * 10) / 10).toFixed(1) + "K";
                        } else if (in_vol_mode === "Comparison") {
                            volText = (Math.round((uv / 1000.0) * 10) / 10).toFixed(1) + "K/" + (Math.round((dv / 1000.0) * 10) / 10).toFixed(1) + "K";
                        } else if (in_vol_mode === "Delta") {
                            volText = (Math.round((vold / 1000.0) * 10) / 10).toFixed(1) + "K";
                        }

                        ch.volText = volText;
                        ch.isTextUpper = (currentTestPrice <= boxMidline);
                    }
                }
            }

            // 10. Volume Analysis Bars Calculation
            if (in_shw_vol && this.channels.length > 0) {
                var topBound = this.channels[0].top;
                var bottomBound = this.channels[0].bottom;
                var currentMidline = (topBound + bottomBound) / 2.0;
                var channelHeight = (topBound - bottomBound) * in_vol_scale;

                var uHigh = currentMidline, uLow = currentMidline, uCol = in_green;
                var lHigh = currentMidline, lLow = currentMidline, lCol = in_red;

                if (in_vol_mode === "Volume") {
                    var vol_height = (curSmoothedVol > 0) ? (volume / curSmoothedVol) * (channelHeight / 4.0) : 0;
                    uHigh = currentMidline + vol_height;
                    uLow = currentMidline;
                    lHigh = currentMidline;
                    lLow = currentMidline - vol_height;
                    uCol = hexToRgba("#787B86", 0.6);
                    lCol = hexToRgba("#787B86", 0.6);
                } else if (in_vol_mode === "Comparison") {
                    var uv_height = (curSmoothedVol > 0) ? (uv / curSmoothedVol) * (channelHeight / 4.0) : 0;
                    var dv_height = (curSmoothedVol > 0) ? (dv / curSmoothedVol) * (channelHeight / 4.0) : 0;
                    uHigh = currentMidline + uv_height;
                    uLow = currentMidline;
                    lHigh = currentMidline;
                    lLow = currentMidline - dv_height;
                    uCol = in_green;
                    lCol = in_red;
                } else if (in_vol_mode === "Delta") {
                    var delta_height = (curSmoothedVol > 0) ? (Math.abs(vold) / curSmoothedVol) * (channelHeight / 4.0) : 0;
                    if (vold >= 0) {
                        uHigh = currentMidline + delta_height;
                        uLow = currentMidline;
                        uCol = in_green;
                    } else {
                        lHigh = currentMidline;
                        lLow = currentMidline - delta_height;
                        lCol = in_red;
                    }
                }

                this._volBars.push({
                    bar: bar_index,
                    uHigh: uHigh, uLow: uLow, uColor: uCol,
                    lHigh: lHigh, lLow: lLow, lColor: lCol
                });
            }

            // Store gauge state for latest bar
            var hvDiff = this.hvold - this.lvold;
            var delvol = (hvDiff > 0) ? (-100 * 2 * ((vold - this.lvold) / hvDiff - 0.5)) : 0;
            this._lastDelvol = delvol;
            this._lastUpbreak = (upbreak !== 0.0);
            this._lastDownbreak = (downbreak !== 0.0);

            this.prevLower = curLower;
            this.prevUpper = curUpper;
            this.prevClose = close;

            // Schedule drawing refresh
            if (typeof setTimeout !== "undefined") {
                if (this._renderTimer) clearTimeout(this._renderTimer);
                var selfTimer = this;
                this._renderTimer = setTimeout(function () {
                    if (!selfTimer._isDestroyed) selfTimer.renderDrawings();
                }, 100);
            }

            return [
                upbreak !== 0.0 ? upbreak : NaN,
                downbreak !== 0.0 ? downbreak : NaN
            ];
        };
    }
})
