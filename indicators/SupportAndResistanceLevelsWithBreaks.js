({
    name: "Support and Resistance Levels with Breaks",
    metainfo: {
        _metainfoVersion: 52,
        isTVScript: false,
        is_hidden_study: false,
        is_price_study: true,
        isCustomIndicator: true,
        format: { precision: 2, type: "price" },
        id: "SupportAndResistanceLevelsWithBreaks@tv-basicstudies-1",
        scriptIdPart: "",
        name: "Support and Resistance Levels with Breaks",
        description: "Support and Resistance Levels with Breaks",
        shortDescription: "S&R Levels with Breaks",
        defaults: {
            styles: {
                plot_dn_break: {
                    plottype: "shape_label_down",
                    location: "AboveBar",
                    color: "#FF0000",
                    textColor: "#FFFFFF",
                    size: "tiny",
                    text: "B",
                    visible: true
                },
                plot_up_break: {
                    plottype: "shape_label_up",
                    location: "BelowBar",
                    color: "#089981",
                    textColor: "#FFFFFF",
                    size: "tiny",
                    text: "B",
                    visible: true
                },
                plot_bull_wick: {
                    plottype: "shape_label_up",
                    location: "BelowBar",
                    color: "#089981",
                    textColor: "#FFFFFF",
                    size: "tiny",
                    text: "Bull Wick",
                    visible: true
                },
                plot_bear_wick: {
                    plottype: "shape_label_down",
                    location: "AboveBar",
                    color: "#FF0000",
                    textColor: "#FFFFFF",
                    size: "tiny",
                    text: "Bear Wick",
                    visible: true
                }
            },
            inputs: {
                in_toggleBreaks: true,
                in_leftBars: 15,
                in_rightBars: 15,
                in_volumeThresh: 20,
                in_showExt: true,
                in_resColor: "#FF0000",
                in_supColor: "#233dee",
                in_lineWidth: 3
            }
        },
        inputs: [
            { id: "in_toggleBreaks", name: "Show Breaks", defval: true, type: "bool" },
            { id: "in_leftBars", name: "Left Bars", defval: 15, type: "integer", min: 1, max: 500 },
            { id: "in_rightBars", name: "Right Bars", defval: 15, type: "integer", min: 1, max: 500 },
            { id: "in_volumeThresh", name: "Volume Threshold", defval: 20, type: "float", min: 0, max: 1000 },
            { id: "in_showExt", name: "Show Extended Lines", defval: true, type: "bool" },
            { id: "in_resColor", name: "Resistance Color", defval: "#FF0000", type: "text" },
            { id: "in_supColor", name: "Support Color", defval: "#233dee", type: "text" },
            { id: "in_lineWidth", name: "Line Width", defval: 3, type: "integer", min: 1, max: 5 }
        ],
        plots: [
            { id: "plot_dn_break", type: "shapes" },
            { id: "plot_up_break", type: "shapes" },
            { id: "plot_bull_wick", type: "shapes" },
            { id: "plot_bear_wick", type: "shapes" }
        ],
        styles: {
            plot_dn_break: { title: "Break (Support)", isHidden: false, size: "tiny", text: "B" },
            plot_up_break: { title: "Break (Resistance)", isHidden: false, size: "tiny", text: "B" },
            plot_bull_wick: { title: "Bull Wick", isHidden: false, size: "tiny", text: "Bull Wick" },
            plot_bear_wick: { title: "Bear Wick", isHidden: false, size: "tiny", text: "Bear Wick" }
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
            this.highUsePivot = NaN;
            this.lowUsePivot = NaN;
            this.lastPH = NaN;
            this.lastPL = NaN;
            this.ema5 = 0;
            this.ema10 = 0;
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
                            stObj.name === "Support and Resistance Levels with Breaks" ||
                            stObj.description === "Support and Resistance Levels with Breaks" ||
                            (stObj.name && stObj.name.indexOf("Support and Resistance Levels") !== -1) ||
                            (stObj.description && stObj.description.indexOf("Support and Resistance Levels") !== -1) ||
                            (stObj.id && stObj.id.indexOf("SupportAndResistanceLevelsWithBreaks") !== -1)
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
                            if (asMeta && (asMeta.id === "SupportAndResistanceLevelsWithBreaks@tv-basicstudies-1" ||
                                           asMeta.description === "Support and Resistance Levels with Breaks" ||
                                           asMeta.name === "Support and Resistance Levels with Breaks" ||
                                           (asMeta.name && asMeta.name.indexOf("Support and Resistance Levels") !== -1) ||
                                           (asMeta.description && asMeta.description.indexOf("Support and Resistance Levels") !== -1))) {
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
            if (typeof window !== "undefined" && window.__srb_drawnShapeIds && window.__srb_drawnShapeIds.length > 0) {
                for (var k = 0; k < window.__srb_drawnShapeIds.length; k++) {
                    if (idsToClear.indexOf(window.__srb_drawnShapeIds[k]) === -1) {
                        idsToClear.push(window.__srb_drawnShapeIds[k]);
                    }
                }
                window.__srb_drawnShapeIds = [];
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
                        return sName.indexOf("support and resistance levels") !== -1 ||
                               sDesc.indexOf("support and resistance levels") !== -1 ||
                               (s.id && s.id.indexOf("SupportAndResistanceLevelsWithBreaks") !== -1);
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
                            if (!window.__srb_drawnShapeIds) window.__srb_drawnShapeIds = [];
                            window.__srb_drawnShapeIds.push(id);
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
                        if (!window.__srb_drawnShapeIds) window.__srb_drawnShapeIds = [];
                        window.__srb_drawnShapeIds.push(id);
                    }
                }
            }

            var resColor = this._cfg_resColor || "#FF0000";
            var supColor = this._cfg_supColor || "#233dee";
            var lineWidth = this._cfg_lineWidth || 3;
            var showExt = (this._cfg_showExt !== undefined) ? this._cfg_showExt : true;

            // 1. Render Resistance Levels (Red horizontal lines)
            var uPivots = this.upperPivots || [];
            var uTotal = uPivots.length;
            var uStartIdx = Math.max(0, uTotal - 60);

            for (var i = uStartIdx; i < uTotal; i++) {
                var ph = uPivots[i];
                var isLast = (i === uTotal - 1);

                var startBar = ph.pivotBar;
                var price = ph.price;

                if (startBar < 0 || startBar >= barTimes.length) continue;

                var endBar;
                if (!isLast) {
                    var nextPH = uPivots[i + 1];
                    endBar = Math.max(startBar, nextPH.pivotBar - 1);
                } else {
                    endBar = totalBars - 1;
                }

                if (endBar >= barTimes.length) endBar = barTimes.length - 1;

                var t1 = barTimes[startBar];
                var t2 = barTimes[endBar];
                if (!t1 || !t2) continue;

                if (t1 === t2) {
                    t2 = t1 + timeDiff;
                }

                // Solid horizontal resistance line
                trackShape(chart.createMultipointShape([
                    { time: t1, price: price },
                    { time: t2, price: price }
                ], {
                    shape: "trend_line",
                    lock: true,
                    disableSelection: true,
                    disableSave: true,
                    disableUndo: true,
                    ownerStudyId: studyId,
                    overrides: {
                        "linecolor": resColor,
                        "linewidth": lineWidth,
                        "linestyle": 0,
                        "linetooltrendline.linecolor": resColor,
                        "linetooltrendline.linewidth": lineWidth,
                        "linetooltrendline.linestyle": 0
                    }
                }));

                // If active (latest) pivot and showExt: draw dashed ray into empty space
                if (isLast && showExt) {
                    var rayT2 = t2 + timeDiff;
                    trackShape(chart.createMultipointShape([
                        { time: t2, price: price },
                        { time: rayT2, price: price }
                    ], {
                        shape: "ray",
                        lock: true,
                        disableSelection: true,
                        disableSave: true,
                        disableUndo: true,
                        ownerStudyId: studyId,
                        overrides: {
                            "linecolor": resColor,
                            "linewidth": lineWidth,
                            "linestyle": 2, // dashed
                            "linetoolray.linecolor": resColor,
                            "linetoolray.linewidth": lineWidth,
                            "linetoolray.linestyle": 2
                        }
                    }));
                }
            }

            // 2. Render Support Levels (Blue horizontal lines)
            var lPivots = this.lowerPivots || [];
            var lTotal = lPivots.length;
            var lStartIdx = Math.max(0, lTotal - 60);

            for (var j = lStartIdx; j < lTotal; j++) {
                var pl = lPivots[j];
                var isLastL = (j === lTotal - 1);

                var startBarL = pl.pivotBar;
                var priceL = pl.price;

                if (startBarL < 0 || startBarL >= barTimes.length) continue;

                var endBarL;
                if (!isLastL) {
                    var nextPL = lPivots[j + 1];
                    endBarL = Math.max(startBarL, nextPL.pivotBar - 1);
                } else {
                    endBarL = totalBars - 1;
                }

                if (endBarL >= barTimes.length) endBarL = barTimes.length - 1;

                var lt1 = barTimes[startBarL];
                var lt2 = barTimes[endBarL];
                if (!lt1 || !lt2) continue;

                if (lt1 === lt2) {
                    lt2 = lt1 + timeDiff;
                }

                // Solid horizontal support line
                trackShape(chart.createMultipointShape([
                    { time: lt1, price: priceL },
                    { time: lt2, price: priceL }
                ], {
                    shape: "trend_line",
                    lock: true,
                    disableSelection: true,
                    disableSave: true,
                    disableUndo: true,
                    ownerStudyId: studyId,
                    overrides: {
                        "linecolor": supColor,
                        "linewidth": lineWidth,
                        "linestyle": 0,
                        "linetooltrendline.linecolor": supColor,
                        "linetooltrendline.linewidth": lineWidth,
                        "linetooltrendline.linestyle": 0
                    }
                }));

                // If active (latest) pivot and showExt: draw dashed ray into empty space
                if (isLastL && showExt) {
                    var rayLt2 = lt2 + timeDiff;
                    trackShape(chart.createMultipointShape([
                        { time: lt2, price: priceL },
                        { time: rayLt2, price: priceL }
                    ], {
                        shape: "ray",
                        lock: true,
                        disableSelection: true,
                        disableSave: true,
                        disableUndo: true,
                        ownerStudyId: studyId,
                        overrides: {
                            "linecolor": supColor,
                            "linewidth": lineWidth,
                            "linestyle": 2, // dashed
                            "linetoolray.linecolor": supColor,
                            "linetoolray.linewidth": lineWidth,
                            "linetoolray.linestyle": 2
                        }
                    }));
                }
            }
        };

        this.main = function (ctx, get_input) {
            this._context = ctx || this._context;
            this._input = get_input || this._input;

            var in_toggleBreaks = true;
            var in_leftBars = 15;
            var in_rightBars = 15;
            var in_volumeThresh = 20;
            var in_showExt = true;
            var in_resColor = "#FF0000";
            var in_supColor = "#233dee";
            var in_lineWidth = 3;

            if (typeof this._input === "function") {
                var v0 = this._input(0); if (v0 !== undefined) in_toggleBreaks = Boolean(v0);
                var v1 = this._input(1); if (v1 !== undefined) in_leftBars = Math.max(1, Math.round(Number(v1)));
                var v2 = this._input(2); if (v2 !== undefined) in_rightBars = Math.max(1, Math.round(Number(v2)));
                var v3 = this._input(3); if (v3 !== undefined) in_volumeThresh = Number(v3);
                var v4 = this._input(4); if (v4 !== undefined) in_showExt = Boolean(v4);
                var v5 = this._input(5); if (v5 !== undefined) in_resColor = String(v5);
                var v6 = this._input(6); if (v6 !== undefined) in_supColor = String(v6);
                var v7 = this._input(7); if (v7 !== undefined) in_lineWidth = Math.max(1, Math.min(5, Math.round(Number(v7))));
            }

            this._cfg_toggleBreaks = in_toggleBreaks;
            this._cfg_leftBars = in_leftBars;
            this._cfg_rightBars = in_rightBars;
            this._cfg_volumeThresh = in_volumeThresh;
            this._cfg_showExt = in_showExt;
            this._cfg_resColor = in_resColor;
            this._cfg_supColor = in_supColor;
            this._cfg_lineWidth = in_lineWidth;

            var bar_index = PineJS.Std.n(this._context);
            var open = PineJS.Std.open(this._context);
            var high = PineJS.Std.high(this._context);
            var low = PineJS.Std.low(this._context);
            var close = PineJS.Std.close(this._context);
            var volume = PineJS.Std.volume ? PineJS.Std.volume(this._context) : 0;
            if (isNaN(volume) || volume === undefined || volume === null) volume = 0;
            var timeSec = Math.floor(PineJS.Std.time(this._context) / 1000);

            if (!this.bars || bar_index === 0) {
                this.bars = [];
                this.barTimes = [];
                this.upperPivots = [];
                this.lowerPivots = [];
                this.highUsePivot = NaN;
                this.lowUsePivot = NaN;
                this.lastPH = NaN;
                this.lastPL = NaN;
                this.ema5 = 0;
                this.ema10 = 0;
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

            // 1. Volume EMAs and Oscillator
            var a5 = 2 / (5 + 1);
            var a10 = 2 / (10 + 1);
            if (bar_index === 0) {
                this.ema5 = volume;
                this.ema10 = volume;
            } else {
                var prevEma5 = (this.bars[bar_index - 1] && !isNaN(this.bars[bar_index - 1].ema5)) ? this.bars[bar_index - 1].ema5 : volume;
                var prevEma10 = (this.bars[bar_index - 1] && !isNaN(this.bars[bar_index - 1].ema10)) ? this.bars[bar_index - 1].ema10 : volume;
                this.ema5 = a5 * volume + (1 - a5) * prevEma5;
                this.ema10 = a10 * volume + (1 - a10) * prevEma10;
            }

            var osc = this.ema10 > 0 ? (100 * (this.ema5 - this.ema10) / this.ema10) : 0;

            this.bars[bar_index] = {
                open: open,
                high: high,
                low: low,
                close: close,
                volume: volume,
                time: timeSec,
                ema5: this.ema5,
                ema10: this.ema10,
                osc: osc
            };
            this.barTimes[bar_index] = timeSec;

            // 2. Pivots Detection (pivothigh(leftBars, rightBars) & pivotlow(leftBars, rightBars))
            var currentPH = NaN;
            var currentPL = NaN;

            if (bar_index >= in_leftBars + in_rightBars) {
                var p = bar_index - in_rightBars;
                var candH = this.bars[p].high;
                var isH = true;
                for (var k = p - in_leftBars; k < p; k++) {
                    if (this.bars[k].high > candH) { isH = false; break; }
                }
                if (isH) {
                    for (var k = p + 1; k <= bar_index; k++) {
                        if (this.bars[k].high >= candH) { isH = false; break; }
                    }
                }
                if (isH) {
                    currentPH = candH;
                }

                var candL = this.bars[p].low;
                var isL = true;
                for (var k = p - in_leftBars; k < p; k++) {
                    if (this.bars[k].low < candL) { isL = false; break; }
                }
                if (isL) {
                    for (var k = p + 1; k <= bar_index; k++) {
                        if (this.bars[k].low <= candL) { isL = false; break; }
                    }
                }
                if (isL) {
                    currentPL = candL;
                }
            }

            // 3. highUsePivot = fixnan(pivothigh(leftBars, rightBars)[1])
            // In Pine, [1] means the value of pivothigh from 1 bar ago.
            // When a pivot is detected at bar_index, it becomes available to highUsePivot on the NEXT bar.
            var prev_highUsePivot = this.highUsePivot;
            var prev_lowUsePivot = this.lowUsePivot;

            if (!isNaN(this.lastPH)) {
                this.highUsePivot = this.lastPH;
            }
            if (!isNaN(this.lastPL)) {
                this.lowUsePivot = this.lastPL;
            }

            if (!isNaN(currentPH)) {
                this.lastPH = currentPH;
                this.upperPivots.push({
                    pivotBar: bar_index - in_rightBars,
                    confirmBar: bar_index,
                    price: currentPH
                });
            }
            if (!isNaN(currentPL)) {
                this.lastPL = currentPL;
                this.lowerPivots.push({
                    pivotBar: bar_index - in_rightBars,
                    confirmBar: bar_index,
                    price: currentPL
                });
            }

            // 4. Breakout Shapes Detection
            var dnBreak = NaN;
            var upBreak = NaN;
            var bullWick = NaN;
            var bearWick = NaN;

            if (in_toggleBreaks && bar_index > 0 && !isNaN(this.highUsePivot) && !isNaN(this.lowUsePivot) && !isNaN(prev_highUsePivot) && !isNaN(prev_lowUsePivot)) {
                var prev_close = this.bars[bar_index - 1].close;

                // crossover(close, highUsePivot) => prev_close <= prev_highUsePivot && close > highUsePivot
                var crossoverHigh = (prev_close <= prev_highUsePivot && close > this.highUsePivot);
                // crossunder(close, lowUsePivot) => prev_close >= prev_lowUsePivot && close < lowUsePivot
                var crossunderLow = (prev_close >= prev_lowUsePivot && close < this.lowUsePivot);

                var isBullWickCandle = (open - low > close - open);
                var isBearWickCandle = (open - close < high - open);

                // Signal 1: Lower Break with volume
                if (crossunderLow && !isBearWickCandle && osc > in_volumeThresh) {
                    dnBreak = high;
                }

                // Signal 2: Upper Break with volume
                if (crossoverHigh && !isBullWickCandle && osc > in_volumeThresh) {
                    upBreak = low;
                }

                // Signal 3: Bull Wick Break
                if (crossoverHigh && isBullWickCandle) {
                    bullWick = low;
                }

                // Signal 4: Bear Wick Break
                if (crossunderLow && isBearWickCandle) {
                    bearWick = high;
                }
            }

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
                dnBreak,
                upBreak,
                bullWick,
                bearWick
            ];
        };
    }
})
