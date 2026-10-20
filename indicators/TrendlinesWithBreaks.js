({
    name: "Trendlines with Breaks",
    metainfo: {
        _metainfoVersion: 52,
        isTVScript: false,
        is_hidden_study: false,
        is_price_study: true,
        isCustomIndicator: true,
        format: { precision: 2, type: "price" },
        id: "TrendlinesWithBreaks@tv-basicstudies-1",
        scriptIdPart: "",
        name: "Trendlines with Breaks",
        description: "Trendlines with Breaks",
        shortDescription: "Trendlines with Breaks",
        defaults: {
            styles: {
                plot_up_break: {
                    plottype: "shape_label_up",
                    location: "Absolute",
                    color: "#089981",
                    textColor: "#FFFFFF",
                    size: "tiny",
                    text: "B",
                    visible: true
                },
                plot_dn_break: {
                    plottype: "shape_label_down",
                    location: "Absolute",
                    color: "#F23645",
                    textColor: "#FFFFFF",
                    size: "tiny",
                    text: "B",
                    visible: true
                }
            },
            inputs: {
                in_length: 14,
                in_mult: 1.0,
                in_calcMethod: "Atr",
                in_backpaint: true,
                in_showExt: true,
                in_upColor: "#089981",
                in_dnColor: "#F23645"
            }
        },
        inputs: [
            { id: "in_length", name: "Swing Detection Lookback", defval: 14, type: "integer", min: 1, max: 2000 },
            { id: "in_mult", name: "Slope", defval: 1.0, type: "float", min: 0.0, max: 100.0, step: 0.1 },
            { id: "in_calcMethod", name: "Slope Calculation Method", defval: "Atr", type: "text", options: ["Atr", "Stdev", "Linreg"] },
            { id: "in_backpaint", name: "Backpainting", defval: true, type: "bool", tooltip: "Backpainting offset displayed elements in the past. Disable backpainting to see real time information returned by the indicator." },
            { id: "in_showExt", name: "Show Extended Lines", defval: true, type: "bool" },
            { id: "in_upColor", name: "Up Trendline Color", defval: "#089981", type: "text" },
            { id: "in_dnColor", name: "Down Trendline Color", defval: "#F23645", type: "text" }
        ],
        plots: [
            { id: "plot_up_break", type: "shapes" },
            { id: "plot_dn_break", type: "shapes" }
        ],
        styles: {
            plot_up_break: { title: "Upper Break", isHidden: false, size: "tiny", text: "B" },
            plot_dn_break: { title: "Lower Break", isHidden: false, size: "tiny", text: "B" }
        }
    },
    constructor: function () {
        this.init = function (ctx, get_input) {
            this._context = ctx;
            this._input = get_input;
            this.clearDrawings();
            this.bars = [];
            this.barTimes = [];
            this._drawnShapeIds = [];
            this._renderGen = (this._renderGen || 0) + 1;
            this._isDestroyed = false;
            this._heartbeatStarted = false;
            this._cachedStudyInfo = null;
            this._subscribedVis = false;
            this._subscribedVisEvent = false;
            this._subscribedDestroyEvent = false;

            this.upperPivots = [];
            this.lowerPivots = [];
            this.upper = 0;
            this.lower = 0;
            this.slope_ph = 0;
            this.slope_pl = 0;
            this.upos = 0;
            this.dnos = 0;
            this.hasPH = false;
            this.hasPL = false;
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
                try {
                    this._visProp.unsubscribe(this);
                } catch (_) {}
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
            this._subscribedDestroyEvent = false;
            this.bars = [];
            this.barTimes = [];
            this.upperPivots = [];
            this.lowerPivots = [];
        };

        this.getChart = function () {
            if (typeof window === "undefined") return null;
            if (window.tvWidget) {
                if (typeof window.tvWidget.activeChart === "function") return window.tvWidget.activeChart();
                if (typeof window.tvWidget.chart === "function") return window.tvWidget.chart();
            }
            if (window.chartWidgetCollection && typeof window.chartWidgetCollection.activeChartWidget === "function") {
                var acw = window.chartWidgetCollection.activeChartWidget();
                if (acw && acw.chart) return acw.chart();
            }
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
                if (typeof chart.getAllStudies === "function") {
                    var studies = chart.getAllStudies();
                    for (var sIdx = 0; sIdx < studies.length; sIdx++) {
                        var stObj = studies[sIdx];
                        if (stObj && (
                            stObj.name === "Trendlines with Breaks" ||
                            stObj.description === "Trendlines with Breaks" ||
                            (stObj.name && stObj.name.indexOf("Trendlines with Breaks") !== -1) ||
                            (stObj.description && stObj.description.indexOf("Trendlines with Breaks") !== -1) ||
                            (stObj.id && stObj.id.indexOf("TrendlinesWithBreaks") !== -1)
                        )) {
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
                            if (asMeta && (asMeta.id === "TrendlinesWithBreaks@tv-basicstudies-1" ||
                                           asMeta.description === "Trendlines with Breaks" ||
                                           asMeta.name === "Trendlines with Breaks" ||
                                           (asMeta.name && asMeta.name.indexOf("Trendlines with Breaks") !== -1) ||
                                           (asMeta.description && asMeta.description.indexOf("Trendlines with Breaks") !== -1))) {
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
            }
            return { chart: chart, source: studySource, id: studyId };
        };

        this.clearDrawings = function () {
            if (this._renderTimer) {
                clearTimeout(this._renderTimer);
                this._renderTimer = null;
            }
            this._renderGen = (this._renderGen || 0) + 1;
            var idsToClear = [];
            if (this._drawnShapeIds && this._drawnShapeIds.length > 0) {
                idsToClear = idsToClear.concat(this._drawnShapeIds);
            }
            if (typeof window !== "undefined" && window.__twb_drawnShapeIds && window.__twb_drawnShapeIds.length > 0) {
                for (var k = 0; k < window.__twb_drawnShapeIds.length; k++) {
                    if (idsToClear.indexOf(window.__twb_drawnShapeIds[k]) === -1) {
                        idsToClear.push(window.__twb_drawnShapeIds[k]);
                    }
                }
                window.__twb_drawnShapeIds = [];
            }
            this._drawnShapeIds = [];

            try {
                var chart = this.getChart();
                if (chart && typeof chart.removeEntity === "function" && idsToClear.length > 0) {
                    for (var dIdx = 0; dIdx < idsToClear.length; dIdx++) {
                        try {
                            chart.removeEntity(idsToClear[dIdx], { disableUndo: true });
                        } catch (_) {}
                    }
                }
            } catch (_) {}
        };

        this.startHeartbeatWatcher = function () {
            if (this._heartbeatStarted) return;
            this._heartbeatStarted = true;
            var self = this;
            this._heartbeatInterval = setInterval(function () {
                if (self._isDestroyed) {
                    clearInterval(self._heartbeatInterval);
                    self._heartbeatInterval = null;
                    return;
                }
                var chart = self.getChart();
                if (!chart || typeof chart.getAllStudies !== "function") return;
                try {
                    var studies = chart.getAllStudies() || [];
                    var stillExists = studies.some(function (s) {
                        var sName = (s.name || "").toLowerCase();
                        var sDesc = (s.description || "").toLowerCase();
                        return sName.indexOf("trendlines with breaks") !== -1 ||
                               sDesc.indexOf("trendlines with breaks") !== -1 ||
                               (s.id && s.id.indexOf("TrendlinesWithBreaks") !== -1);
                    });
                    if (!stillExists) {
                        self._isDestroyed = true;
                        self.clearDrawings();
                        clearInterval(self._heartbeatInterval);
                        self._heartbeatInterval = null;
                    }
                } catch (_) {}
            }, 1000);
        };

        this.renderDrawings = function () {
            if (this._isDestroyed) {
                this.clearDrawings();
                return;
            }
            var info = this.getStudySourceInfo();
            var chart = info.chart;
            var studySource = info.source;
            var studyId = info.id;

            var self = this;
            if (!chart || typeof chart.createMultipointShape !== "function") {
                if (!self._retryCount) self._retryCount = 0;
                if (self._retryCount < 20) {
                    self._retryCount++;
                    setTimeout(function () {
                        if (!self._isDestroyed) {
                            self.renderDrawings();
                        }
                    }, 200);
                }
                return;
            }
            self._retryCount = 0;

            this.startHeartbeatWatcher();

            if (studySource) {
                var isVis = true;
                if (typeof studySource.isVisible === "function") {
                    isVis = studySource.isVisible();
                }
                if (!isVis) {
                    self.clearDrawings();
                    return;
                }

                // Subscribe to properties().visible if not yet subscribed
                var visProp = null;
                try {
                    if (typeof studySource.properties === "function") {
                        var p = studySource.properties();
                        if (p.visible) visProp = p.visible;
                        else if (p.childs && typeof p.childs === "function" && p.childs().visible) visProp = p.childs().visible;
                    }
                } catch (_) {}

                if (visProp && typeof visProp.subscribe === "function" && !self._subscribedVis) {
                    self._subscribedVis = true;
                    self._visProp = visProp;
                    visProp.subscribe(self, function (val) {
                        var isNowVis = (typeof val === "boolean") ? val : (visProp.value ? visProp.value() : true);
                        if (!isNowVis) {
                            self.clearDrawings();
                        } else {
                            self.renderDrawings();
                        }
                    });
                }

                if (typeof studySource.onVisibilityChanged === "function" && !self._subscribedVisEvent) {
                    try {
                        var visEvent = studySource.onVisibilityChanged();
                        if (visEvent && typeof visEvent.subscribe === "function") {
                            self._subscribedVisEvent = true;
                            visEvent.subscribe(self, function (isNowVis) {
                                if (!isNowVis) {
                                    self.clearDrawings();
                                } else {
                                    self.renderDrawings();
                                }
                            });
                        }
                    } catch (_) {}
                }

                if (typeof studySource.onDestroyed === "function" && !self._subscribedDestroyEvent) {
                    self._subscribedDestroyEvent = true;
                    try {
                        var destEv = studySource.onDestroyed();
                        if (destEv && typeof destEv.subscribe === "function") {
                            destEv.subscribe(self, function () {
                                self._isDestroyed = true;
                                self.clearDrawings();
                            });
                        }
                    } catch (_) {}
                }
            }

            this.clearDrawings();
            var currentGen = self._renderGen;

            var barTimes = this.barTimes || [];
            var totalBars = barTimes.length;
            if (totalBars === 0) return;
            var timeDiff = (totalBars > 1 && barTimes[totalBars - 1] > barTimes[totalBars - 2])
                ? (barTimes[totalBars - 1] - barTimes[totalBars - 2])
                : 300;

            function trackShape(res) {
                if (!res) return;
                if (typeof res.then === "function") {
                    res.then(function (id) {
                        if (!id) return;
                        if (self._isDestroyed || self._renderGen !== currentGen) {
                            try {
                                if (chart && typeof chart.removeEntity === "function") {
                                    chart.removeEntity(id, { disableUndo: true });
                                }
                            } catch (_) {}
                            return;
                        }
                        self._drawnShapeIds.push(id);
                        if (typeof window !== "undefined") {
                            if (!window.__twb_drawnShapeIds) window.__twb_drawnShapeIds = [];
                            window.__twb_drawnShapeIds.push(id);
                        }
                    }).catch(function () {});
                } else {
                    var id = res;
                    if (self._isDestroyed || self._renderGen !== currentGen) {
                        try {
                            if (chart && typeof chart.removeEntity === "function") {
                                chart.removeEntity(id, { disableUndo: true });
                            }
                        } catch (_) {}
                        return;
                    }
                    self._drawnShapeIds.push(id);
                    if (typeof window !== "undefined") {
                        if (!window.__twb_drawnShapeIds) window.__twb_drawnShapeIds = [];
                        window.__twb_drawnShapeIds.push(id);
                    }
                }
            }

            var upColor = this._cfg_upColor || "#089981";
            var dnColor = this._cfg_dnColor || "#F23645";
            var showExt = (this._cfg_showExt !== undefined) ? this._cfg_showExt : true;
            var in_backpaint = (this._cfg_backpaint !== undefined) ? this._cfg_backpaint : true;
            var in_length = this._cfg_length || 14;

            // 1. Render Upper Trendlines (Teal)
            var uPivots = this.upperPivots || [];
            var uTotal = uPivots.length;
            var uStartIdx = Math.max(0, uTotal - 60);

            for (var i = uStartIdx; i < uTotal; i++) {
                var ph = uPivots[i];
                var isLast = (i === uTotal - 1);

                var startBar = in_backpaint ? ph.pivotBar : ph.confirmBar;
                var startPrice = in_backpaint ? ph.price : (ph.price - ph.slope * in_length);

                if (startBar < 0 || startBar >= barTimes.length) continue;

                var endBar;
                if (!isLast) {
                    var nextPH = uPivots[i + 1];
                    var nextStart = in_backpaint ? nextPH.pivotBar : nextPH.confirmBar;
                    endBar = Math.max(startBar, nextStart - 1);
                } else {
                    endBar = in_backpaint ? Math.max(startBar, (totalBars - 1) - in_length) : (totalBars - 1);
                }

                if (endBar >= barTimes.length) endBar = barTimes.length - 1;

                var barsSpan = endBar - startBar;
                var endPrice = startPrice - ph.slope * barsSpan;

                var t1 = barTimes[startBar];
                var t2 = barTimes[endBar];
                if (!t1 || !t2) continue;

                if (t1 === t2) {
                    t2 = t1 + timeDiff;
                    endPrice = startPrice - ph.slope;
                }

                // Solid trendline segment
                trackShape(chart.createMultipointShape([
                    { time: t1, price: startPrice },
                    { time: t2, price: endPrice }
                ], {
                    shape: "trend_line",
                    lock: true,
                    disableSelection: true,
                    disableSave: true,
                    disableUndo: true,
                    ownerStudyId: studyId,
                    overrides: {
                        "linecolor": upColor,
                        "linewidth": 1,
                        "linestyle": 0,
                        "linetooltrendline.linecolor": upColor,
                        "linetooltrendline.linewidth": 1,
                        "linetooltrendline.linestyle": 0
                    }
                }));

                // If active (latest) pivot and showExt: draw dashed ray into empty space
                if (isLast && showExt) {
                    var rayT2 = t2 + timeDiff;
                    var rayP2 = endPrice - ph.slope;
                    trackShape(chart.createMultipointShape([
                        { time: t2, price: endPrice },
                        { time: rayT2, price: rayP2 }
                    ], {
                        shape: "ray",
                        lock: true,
                        disableSelection: true,
                        disableSave: true,
                        disableUndo: true,
                        ownerStudyId: studyId,
                        overrides: {
                            "linecolor": upColor,
                            "linewidth": 1,
                            "linestyle": 2, // dashed
                            "linetoolray.linecolor": upColor,
                            "linetoolray.linewidth": 1,
                            "linetoolray.linestyle": 2
                        }
                    }));
                }
            }

            // 2. Render Lower Trendlines (Red)
            var lPivots = this.lowerPivots || [];
            var lTotal = lPivots.length;
            var lStartIdx = Math.max(0, lTotal - 60);

            for (var j = lStartIdx; j < lTotal; j++) {
                var pl = lPivots[j];
                var isLastL = (j === lTotal - 1);

                var startBarL = in_backpaint ? pl.pivotBar : pl.confirmBar;
                var startPriceL = in_backpaint ? pl.price : (pl.price + pl.slope * in_length);

                if (startBarL < 0 || startBarL >= barTimes.length) continue;

                var endBarL;
                if (!isLastL) {
                    var nextPL = lPivots[j + 1];
                    var nextStartL = in_backpaint ? nextPL.pivotBar : nextPL.confirmBar;
                    endBarL = Math.max(startBarL, nextStartL - 1);
                } else {
                    endBarL = in_backpaint ? Math.max(startBarL, (totalBars - 1) - in_length) : (totalBars - 1);
                }

                if (endBarL >= barTimes.length) endBarL = barTimes.length - 1;

                var barsSpanL = endBarL - startBarL;
                var endPriceL = startPriceL + pl.slope * barsSpanL;

                var lt1 = barTimes[startBarL];
                var lt2 = barTimes[endBarL];
                if (!lt1 || !lt2) continue;

                if (lt1 === lt2) {
                    lt2 = lt1 + timeDiff;
                    endPriceL = startPriceL + pl.slope;
                }

                // Solid trendline segment
                trackShape(chart.createMultipointShape([
                    { time: lt1, price: startPriceL },
                    { time: lt2, price: endPriceL }
                ], {
                    shape: "trend_line",
                    lock: true,
                    disableSelection: true,
                    disableSave: true,
                    disableUndo: true,
                    ownerStudyId: studyId,
                    overrides: {
                        "linecolor": dnColor,
                        "linewidth": 1,
                        "linestyle": 0,
                        "linetooltrendline.linecolor": dnColor,
                        "linetooltrendline.linewidth": 1,
                        "linetooltrendline.linestyle": 0
                    }
                }));

                // If active (latest) pivot and showExt: draw dashed ray into empty space
                if (isLastL && showExt) {
                    var rayLt2 = lt2 + timeDiff;
                    var rayLp2 = endPriceL + pl.slope;
                    trackShape(chart.createMultipointShape([
                        { time: lt2, price: endPriceL },
                        { time: rayLt2, price: rayLp2 }
                    ], {
                        shape: "ray",
                        lock: true,
                        disableSelection: true,
                        disableSave: true,
                        disableUndo: true,
                        ownerStudyId: studyId,
                        overrides: {
                            "linecolor": dnColor,
                            "linewidth": 1,
                            "linestyle": 2, // dashed
                            "linetoolray.linecolor": dnColor,
                            "linetoolray.linewidth": 1,
                            "linetoolray.linestyle": 2
                        }
                    }));
                }
            }
        };

        this.main = function (ctx, get_input) {
            this._context = ctx || this._context;
            this._input = get_input || this._input;

            var in_length = 14;
            var in_mult = 1.0;
            var in_calcMethod = "Atr";
            var in_backpaint = true;
            var in_showExt = true;
            var in_upColor = "#089981";
            var in_dnColor = "#F23645";

            if (typeof this._input === "function") {
                var v0 = this._input(0); if (v0 !== undefined) in_length = Math.max(1, Math.round(Number(v0)));
                var v1 = this._input(1); if (v1 !== undefined) in_mult = Math.max(0, Number(v1));
                var v2 = this._input(2); if (v2 !== undefined) in_calcMethod = String(v2);
                var v3 = this._input(3); if (v3 !== undefined) in_backpaint = Boolean(v3);
                var v4 = this._input(4); if (v4 !== undefined) in_showExt = Boolean(v4);
                var v5 = this._input(5); if (v5 !== undefined) in_upColor = String(v5);
                var v6 = this._input(6); if (v6 !== undefined) in_dnColor = String(v6);
            }

            this._cfg_length = in_length;
            this._cfg_mult = in_mult;
            this._cfg_calcMethod = in_calcMethod;
            this._cfg_backpaint = in_backpaint;
            this._cfg_showExt = in_showExt;
            this._cfg_upColor = in_upColor;
            this._cfg_dnColor = in_dnColor;

            var bar_index = PineJS.Std.n(this._context);
            var open = PineJS.Std.open(this._context);
            var high = PineJS.Std.high(this._context);
            var low = PineJS.Std.low(this._context);
            var close = PineJS.Std.close(this._context);
            var timeSec = Math.floor(PineJS.Std.time(this._context) / 1000);

            if (!this.bars || bar_index === 0) {
                this.bars = [];
                this.barTimes = [];
                this.upperPivots = [];
                this.lowerPivots = [];
                this.upper = 0;
                this.lower = 0;
                this.slope_ph = 0;
                this.slope_pl = 0;
                this.upos = 0;
                this.dnos = 0;
                this.hasPH = false;
                this.hasPL = false;
            }

            // Truncate future bars if engine rewinds on bar tick updates
            if (this.bars.length > bar_index) {
                this.bars.length = bar_index;
                this.barTimes.length = bar_index;
                while (this.upperPivots.length > 0 && this.upperPivots[this.upperPivots.length - 1].confirmBar >= bar_index) {
                    this.upperPivots.pop();
                }
                while (this.lowerPivots.length > 0 && this.lowerPivots[this.lowerPivots.length - 1].confirmBar >= bar_index) {
                    this.lowerPivots.pop();
                }
            }

            // 1. True Range & Wilder RMA ATR
            var tr = high - low;
            var currentAtr = tr;
            if (bar_index > 0 && this.bars[bar_index - 1]) {
                var prevClose = this.bars[bar_index - 1].close;
                tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
                var lastAtr = this.bars[bar_index - 1].atr;
                if (!isNaN(lastAtr)) {
                    currentAtr = (lastAtr * (in_length - 1) + tr) / in_length;
                } else {
                    currentAtr = tr;
                }
            } else {
                currentAtr = tr;
            }

            this.bars[bar_index] = {
                open: open,
                high: high,
                low: low,
                close: close,
                time: timeSec,
                tr: tr,
                atr: currentAtr
            };
            this.barTimes[bar_index] = timeSec;

            // 2. Slope Calculation
            var slope = 0;
            var method = (in_calcMethod || "Atr").toLowerCase();

            if (method === "stdev") {
                if (bar_index >= in_length - 1) {
                    var sumC = 0;
                    for (var k = bar_index - in_length + 1; k <= bar_index; k++) {
                        sumC += this.bars[k].close;
                    }
                    var meanC = sumC / in_length;
                    var sumSq = 0;
                    for (var k = bar_index - in_length + 1; k <= bar_index; k++) {
                        var d = this.bars[k].close - meanC;
                        sumSq += d * d;
                    }
                    var stdev = Math.sqrt(sumSq / in_length);
                    slope = (stdev / in_length) * in_mult;
                }
            } else if (method === "linreg") {
                if (bar_index >= in_length - 1) {
                    var sumSrcN = 0;
                    var sumSrc = 0;
                    var sumN = 0;
                    for (var k = bar_index - in_length + 1; k <= bar_index; k++) {
                        var c = this.bars[k].close;
                        sumSrcN += c * k;
                        sumSrc += c;
                        sumN += k;
                    }
                    var smaSrcN = sumSrcN / in_length;
                    var smaSrc = sumSrc / in_length;
                    var smaN = sumN / in_length;
                    var cov = smaSrcN - smaSrc * smaN;
                    var varN = (in_length * in_length - 1) / 12;
                    slope = (varN > 0) ? (Math.abs(cov) / varN / 2 * in_mult) : 0;
                }
            } else {
                slope = (currentAtr / in_length) * in_mult;
            }

            // 3. Pivot High & Pivot Low
            var ph = NaN;
            var pl = NaN;

            if (bar_index >= 2 * in_length) {
                var p = bar_index - in_length;
                var candHigh = this.bars[p].high;
                var isPH = true;

                for (var k = p - in_length; k < p; k++) {
                    if (this.bars[k].high > candHigh) {
                        isPH = false;
                        break;
                    }
                }

                if (isPH) {
                    for (var k = p + 1; k <= bar_index; k++) {
                        if (this.bars[k].high >= candHigh) {
                            isPH = false;
                            break;
                        }
                    }
                }

                if (isPH) {
                    ph = candHigh;
                    this.hasPH = true;
                    this.upperPivots.push({
                        pivotBar: p,
                        confirmBar: bar_index,
                        price: candHigh,
                        slope: slope
                    });
                }

                var candLow = this.bars[p].low;
                var isPL = true;

                for (var k = p - in_length; k < p; k++) {
                    if (this.bars[k].low < candLow) {
                        isPL = false;
                        break;
                    }
                }

                if (isPL) {
                    for (var k = p + 1; k <= bar_index; k++) {
                        if (this.bars[k].low <= candLow) {
                            isPL = false;
                            break;
                        }
                    }
                }

                if (isPL) {
                    pl = candLow;
                    this.hasPL = true;
                    this.lowerPivots.push({
                        pivotBar: p,
                        confirmBar: bar_index,
                        price: candLow,
                        slope: slope
                    });
                }
            }

            // 4. Update Trendline Slopes & Breakout States
            if (!isNaN(ph)) this.slope_ph = slope;
            if (!isNaN(pl)) this.slope_pl = slope;

            this.upper = !isNaN(ph) ? ph : (this.upper - this.slope_ph);
            this.lower = !isNaN(pl) ? pl : (this.lower + this.slope_pl);

            var prev_upos = this.upos;
            var prev_dnos = this.dnos;

            if (!isNaN(ph)) {
                this.upos = 0;
            } else if (this.hasPH) {
                var upperLevel = this.upper - this.slope_ph * in_length;
                if (close > upperLevel) {
                    this.upos = 1;
                }
            }

            if (!isNaN(pl)) {
                this.dnos = 0;
            } else if (this.hasPL) {
                var lowerLevel = this.lower + this.slope_pl * in_length;
                if (close < lowerLevel) {
                    this.dnos = 1;
                }
            }

            var upBreak = (this.hasPH && this.upos > prev_upos) ? low : NaN;
            var dnBreak = (this.hasPL && this.dnos > prev_dnos) ? high : NaN;

            // Debounced drawing rendering
            if (typeof setTimeout !== "undefined") {
                if (this._renderTimer) clearTimeout(this._renderTimer);
                var self = this;
                this._renderTimer = setTimeout(function () {
                    if (!self._isDestroyed) {
                        self.renderDrawings();
                    }
                }, 80);
            }

            return [
                upBreak,
                dnBreak
            ];
        };
    }
})
