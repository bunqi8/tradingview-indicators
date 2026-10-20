({
    name: "Support Resistance Channels",
    metainfo: {
        _metainfoVersion: 52,
        isTVScript: false,
        is_hidden_study: false,
        is_price_study: true,
        isCustomIndicator: true,
        format: { precision: 2, type: "price" },
        id: "SupportResistanceChannels@tv-basicstudies-1",
        scriptIdPart: "",
        name: "Support Resistance Channels",
        description: "Support Resistance Channels",
        shortDescription: "SRchannel",
        defaults: {
            styles: {
                plot_ma1: { plottype: 0, linewidth: 2, color: "#2196F3", linestyle: 0, trackPrice: false },
                plot_ma2: { plottype: 0, linewidth: 2, color: "#F23645", linestyle: 0, trackPrice: false },
                plot_res_broken: { plottype: "shape_triangle_up", location: "BelowBar", color: "#089981", size: "tiny" },
                plot_sup_broken: { plottype: "shape_triangle_down", location: "AboveBar", color: "#F23645", size: "tiny" },
                plot_pp_h: { plottype: "shape_label_down", location: "AboveBar", color: "#F23645", textColor: "#ffffff", size: "tiny" },
                plot_pp_l: { plottype: "shape_label_up", location: "BelowBar", color: "#089981", textColor: "#ffffff", size: "tiny" }
            },
            inputs: {
                in_0: 10,
                in_1: "High/Low",
                in_2: 5,
                in_3: 1,
                in_4: 6,
                in_5: 290,
                in_6: false,
                in_7: false,
                in_8: false,
                in_9: 50,
                in_10: "SMA",
                in_11: false,
                in_12: 200,
                in_13: "SMA"
            }
        },
        plots: [
            { id: "plot_ma1", type: "line" },
            { id: "plot_ma2", type: "line" },
            { id: "plot_res_broken", type: "shapes" },
            { id: "plot_sup_broken", type: "shapes" },
            { id: "plot_pp_h", type: "shapes" },
            { id: "plot_pp_l", type: "shapes" }
        ],
        styles: {
            plot_ma1: { title: "MA 1", histogramBase: 0, joinPoints: false },
            plot_ma2: { title: "MA 2", histogramBase: 0, joinPoints: false },
            plot_res_broken: { title: "Resistance Broken", isHidden: false },
            plot_sup_broken: { title: "Support Broken", isHidden: false },
            plot_pp_h: { title: "Pivot High", isHidden: false, text: "H" },
            plot_pp_l: { title: "Pivot Low", isHidden: false, text: "L" }
        },
        inputs: [
            { id: "in_0", name: "Pivot Period", defval: 10, type: "integer", min: 4, max: 30, tooltip: "Used while calculating Pivot Points, checks left & right bars" },
            { id: "in_1", name: "Source", defval: "High/Low", type: "text", options: ["High/Low", "Close/Open"], tooltip: "Source for Pivot Points" },
            { id: "in_2", name: "Maximum Channel Width %", defval: 5, type: "integer", min: 1, max: 8, tooltip: "Calculated using Highest/Lowest levels in 300 bars" },
            { id: "in_3", name: "Minimum Strength", defval: 1, type: "integer", min: 1, tooltip: "Channel must contain at least 2 Pivot Points" },
            { id: "in_4", name: "Maximum Number of S/R", defval: 6, type: "integer", min: 1, max: 10, tooltip: "Maximum number of Support/Resistance Channels to Show" },
            { id: "in_5", name: "Loopback Period", defval: 290, type: "integer", min: 100, max: 400, tooltip: "While calculating S/R levels it checks Pivots in Loopback Period" },
            { id: "in_6", name: "Show Pivot Points", defval: false, type: "bool" },
            { id: "in_7", name: "Show Broken Support/Resistance", defval: false, type: "bool" },
            { id: "in_8", name: "MA 1 Enable", defval: false, type: "bool" },
            { id: "in_9", name: "MA 1 Length", defval: 50, type: "integer", min: 1 },
            { id: "in_10", name: "MA 1 Type", defval: "SMA", type: "text", options: ["SMA", "EMA"] },
            { id: "in_11", name: "MA 2 Enable", defval: false, type: "bool" },
            { id: "in_12", name: "MA 2 Length", defval: 200, type: "integer", min: 1 },
            { id: "in_13", name: "MA 2 Type", defval: "SMA", type: "text", options: ["SMA", "EMA"] }
        ]
    },
    constructor: function () {
        this.init = function (ctx, get_input) {
            this._context = ctx;
            this._input = get_input;
            this._isDestroyed = false;
            this._subscribedVis = false;
            this._subscribedVisEvent = false;
            this._subscribedDestroyEvent = false;
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
            this.highs = [];
            this.lows = [];
            this.closes = [];
            this.opens = [];

            this.pivotvals = [];
            this.pivotlocs = [];
            this.suportresistance = new Array(20).fill(0);

            this.prevMa1 = NaN;
            this.prevMa2 = NaN;
        };

        this.destroy = function () {
            this._isDestroyed = true;
            if (this._renderTimer) { clearTimeout(this._renderTimer); this._renderTimer = null; }
            if (this._heartbeatInterval) { clearInterval(this._heartbeatInterval); this._heartbeatInterval = null; }
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
            this._studyEverFound = false;
            this._subscribedVis = false;
            this._subscribedVisEvent = false;
            this._subscribedDestroyEvent = false;
            this.bars = [];
            this.barTimes = [];
            this.pivotvals = [];
            this.pivotlocs = [];
            this.suportresistance = [];
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

        function isOurStudy(name, desc, id) {
            var n = (name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
            var d = (desc || "").toLowerCase().replace(/[^a-z0-9]/g, "");
            var i = (id || "").toLowerCase().replace(/[^a-z0-9]/g, "");
            return n.indexOf("supportresistance") !== -1 ||
                   d.indexOf("supportresistance") !== -1 ||
                   i.indexOf("supportresistance") !== -1 ||
                   n.indexOf("srchannel") !== -1 ||
                   d.indexOf("srchannel") !== -1 ||
                   i.indexOf("srchannel") !== -1 ||
                   n.indexOf("supportandresistance") !== -1 ||
                   d.indexOf("supportandresistance") !== -1;
        }

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
                    var studies = chart.getAllStudies() || [];
                    for (var sIdx = 0; sIdx < studies.length; sIdx++) {
                        var stObj = studies[sIdx];
                        if (stObj && isOurStudy(stObj.name, stObj.description, stObj.id)) {
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
                            if (asMeta && isOurStudy(asMeta.name, asMeta.description, asMeta.id)) {
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
                    var found = false;
                    for (var i = 0; i < studies.length; i++) {
                        var st = studies[i];
                        if (st && isOurStudy(st.name, st.description, st.id)) {
                            found = true;
                            break;
                        }
                    }
                    if (found) {
                        self._studyEverFound = true;
                    } else if (self._studyEverFound) {
                        self._isDestroyed = true;
                        clearInterval(self._heartbeatInterval);
                        self._heartbeatInterval = null;
                        self.clearDrawings();
                    }
                } catch (_) {}
            }, 1000);
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
            if (typeof window !== "undefined") {
                window.__src_drawnShapeIds = window.__src_drawnShapeIds || [];
                if (window.__src_drawnShapeIds.length > 0) {
                    for (var k = 0; k < window.__src_drawnShapeIds.length; k++) {
                        if (idsToClear.indexOf(window.__src_drawnShapeIds[k]) === -1) {
                            idsToClear.push(window.__src_drawnShapeIds[k]);
                        }
                    }
                    window.__src_drawnShapeIds = [];
                }
            }
            this._drawnShapeIds = [];

            try {
                var chart = this.getChart();
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
                            if (isOurTool && ltId && idsToClear.indexOf(ltId) === -1) {
                                idsToClear.push(ltId);
                            }
                        }
                    }
                }
            } catch (_) {}

            if (idsToClear.length > 0) {
                var c = this.getChart();
                if (c && typeof c.removeEntity === "function") {
                    for (var j = 0; j < idsToClear.length; j++) {
                        try {
                            c.removeEntity(idsToClear[j], { disableUndo: true });
                        } catch (_) {}
                    }
                }
            }
        };

        this.renderDrawings = function () {
            if (this._isDestroyed) return;
            var chart = this.getChart();
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

            this.startHeartbeatWatcher();

            var studyInfo = this.getStudySourceInfo();
            var studySource = studyInfo.source;
            var studyId = studyInfo.id;

            if (studySource) {
                var isVis = true;
                try {
                    if (typeof studySource.properties === "function") {
                        var p = studySource.properties();
                        if (p && p.visible && typeof p.visible.value === "function") {
                            isVis = p.visible.value();
                        } else if (p && p.childs && typeof p.childs === "function" && p.childs().visible && typeof p.childs().visible.value === "function") {
                            isVis = p.childs().visible.value();
                        }
                    }
                } catch (_) {}

                if (!isVis) {
                    self.clearDrawings();
                    return;
                }

                var visProp = null;
                try {
                    if (typeof studySource.properties === "function") {
                        var p2 = studySource.properties();
                        if (p2 && p2.visible) visProp = p2.visible;
                        else if (p2 && p2.childs && typeof p2.childs === "function" && p2.childs().visible) visProp = p2.childs().visible;
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
            if (!barTimes || barTimes.length < 2) return;

            var totalBars = barTimes.length;
            var timeDiff = 300;
            if (barTimes[totalBars - 1] > barTimes[totalBars - 2]) {
                timeDiff = barTimes[totalBars - 1] - barTimes[totalBars - 2];
            }

            var t1 = barTimes[0] - 100 * timeDiff;
            var t2 = barTimes[totalBars - 1] + 30 * timeDiff;
            if (t1 >= t2) t2 = t1 + timeDiff;

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
                        window.__src_drawnShapeIds = window.__src_drawnShapeIds || [];
                        window.__src_drawnShapeIds.push(sid);
                    }
                }
                if (typeof res.then === "function") {
                    res.then(recordId).catch(function () {});
                } else {
                    recordId(res);
                }
            }

            var sr = this.suportresistance || [];
            var maxCount = Math.min(10, this._maxNumSr || 6);
            var curClose = this.closes && this.closes.length > 0 ? this.closes[this.closes.length - 1] : 0;

            for (var x = 0; x < maxCount; x++) {
                var top = sr[x * 2];
                var btm = sr[x * 2 + 1];
                if (!top || !btm || top === 0 || btm === 0) continue;

                var colorHex = "#787B86"; // Inside channel color
                if (top > curClose && btm > curClose) {
                    colorHex = "#F23645"; // Resistance (Red)
                } else if (top < curClose && btm < curClose) {
                    colorHex = "#089981"; // Support (Green/Lime)
                }

                // 1. Shaded Band (Rectangle)
                try {
                    var rectOpts = {
                        shape: "rectangle",
                        lock: true,
                        disableSelection: true,
                        disableSave: true,
                        disableUndo: true,
                        overrides: {
                            "fillBackground": true,
                            "backgroundColor": colorHex,
                            "backgroundTransparency": 75,
                            "drawBorder": true,
                            "borderColor": colorHex,
                            "color": colorHex,
                            "linewidth": 1,
                            "linetoolrectangle.fillBackground": true,
                            "linetoolrectangle.backgroundColor": colorHex,
                            "linetoolrectangle.backgroundTransparency": 75,
                            "linetoolrectangle.drawBorder": true,
                            "linetoolrectangle.borderColor": colorHex,
                            "linetoolrectangle.color": colorHex,
                            "linetoolrectangle.linewidth": 1
                        }
                    };
                    if (studyId) rectOpts.ownerStudyId = studyId;
                    track(chart.createMultipointShape([
                        { time: t1, price: top },
                        { time: t2, price: btm }
                    ], rectOpts));
                } catch (_) {}

                // 2. Top Border Line
                try {
                    var topOpts = {
                        shape: "trend_line",
                        lock: true,
                        disableSelection: true,
                        disableSave: true,
                        disableUndo: true,
                        overrides: {
                            "linecolor": colorHex,
                            "linewidth": 1,
                            "linestyle": 0,
                            "linetooltrendline.linecolor": colorHex,
                            "linetooltrendline.linewidth": 1,
                            "linetooltrendline.linestyle": 0
                        }
                    };
                    if (studyId) topOpts.ownerStudyId = studyId;
                    track(chart.createMultipointShape([
                        { time: t1, price: top },
                        { time: t2, price: top }
                    ], topOpts));
                } catch (_) {}

                // 3. Bottom Border Line
                try {
                    var btmOpts = {
                        shape: "trend_line",
                        lock: true,
                        disableSelection: true,
                        disableSave: true,
                        disableUndo: true,
                        overrides: {
                            "linecolor": colorHex,
                            "linewidth": 1,
                            "linestyle": 0,
                            "linetooltrendline.linecolor": colorHex,
                            "linetooltrendline.linewidth": 1,
                            "linetooltrendline.linestyle": 0
                        }
                    };
                    if (studyId) btmOpts.ownerStudyId = studyId;
                    track(chart.createMultipointShape([
                        { time: t1, price: btm },
                        { time: t2, price: btm }
                    ], btmOpts));
                } catch (_) {}
            }
        };

        this.main = function (ctx, inputCallback) {
            this._context = ctx;
            var PineStd = (typeof PineJS !== "undefined" && PineJS.Std) ? PineJS.Std : null;
            var bar_index = PineStd ? PineStd.n(this._context) : this.bars.length;
            var rawTime = PineStd ? PineStd.time(this._context) : Date.now();
            var timeSec = rawTime > 1e11 ? Math.floor(rawTime / 1000) : Math.floor(rawTime);
            var open = PineStd ? PineStd.open(this._context) : 0;
            var high = PineStd ? PineStd.high(this._context) : 0;
            var low = PineStd ? PineStd.low(this._context) : 0;
            var close = PineStd ? PineStd.close(this._context) : 0;

            if (bar_index === 0) {
                this.bars = [];
                this.barTimes = [];
                this.highs = [];
                this.lows = [];
                this.closes = [];
                this.opens = [];
                this.pivotvals = [];
                this.pivotlocs = [];
                this.suportresistance = new Array(20).fill(0);
                this.prevMa1 = NaN;
                this.prevMa2 = NaN;
            }

            if (this.bars.length > bar_index) {
                this.bars.length = bar_index;
                this.barTimes.length = bar_index;
                this.highs.length = bar_index;
                this.lows.length = bar_index;
                this.closes.length = bar_index;
                this.opens.length = bar_index;
            }

            var getInp = function (idx, def) {
                var v = typeof inputCallback === "function" ? inputCallback(idx) : undefined;
                return v !== undefined ? v : def;
            };

            var prd = Math.max(4, Math.min(30, Math.round(Number(getInp(0, 10)))));
            var ppsrc = String(getInp(1, "High/Low"));
            var ChannelW = Math.max(1, Math.min(8, Number(getInp(2, 5))));
            var minstrength = Math.max(1, Math.round(Number(getInp(3, 1))));
            var maxnumsr = Math.max(1, Math.min(10, Math.round(Number(getInp(4, 6))))) - 1;
            this._maxNumSr = maxnumsr + 1;
            var loopback = Math.max(100, Math.min(400, Math.round(Number(getInp(5, 290)))));

            var showpp = Boolean(getInp(6, false));
            var showsrbroken = Boolean(getInp(7, false));
            var showthema1en = Boolean(getInp(8, false));
            var showthema1len = Math.max(1, Math.round(Number(getInp(9, 50))));
            var showthema1type = String(getInp(10, "SMA"));
            var showthema2en = Boolean(getInp(11, false));
            var showthema2len = Math.max(1, Math.round(Number(getInp(12, 200))));
            var showthema2type = String(getInp(13, "SMA"));

            this.bars[bar_index] = { open: open, high: high, low: low, close: close, time: timeSec };
            this.barTimes[bar_index] = timeSec;
            this.highs[bar_index] = high;
            this.lows[bar_index] = low;
            this.closes[bar_index] = close;
            this.opens[bar_index] = open;

            // Optional MA1 & MA2
            var ma1 = NaN;
            if (showthema1en) {
                if (showthema1type === "EMA") {
                    var a1 = 2.0 / (showthema1len + 1.0);
                    this.prevMa1 = isNaN(this.prevMa1) ? close : a1 * close + (1.0 - a1) * this.prevMa1;
                    ma1 = this.prevMa1;
                } else {
                    var s1 = 0, c1 = 0;
                    for (var m1 = 0; m1 < showthema1len && (bar_index - m1) >= 0; m1++) { s1 += this.closes[bar_index - m1]; c1++; }
                    ma1 = c1 > 0 ? (s1 / c1) : close;
                }
            }

            var ma2 = NaN;
            if (showthema2en) {
                if (showthema2type === "EMA") {
                    var a2 = 2.0 / (showthema2len + 1.0);
                    this.prevMa2 = isNaN(this.prevMa2) ? close : a2 * close + (1.0 - a2) * this.prevMa2;
                    ma2 = this.prevMa2;
                } else {
                    var s2 = 0, c2 = 0;
                    for (var m2 = 0; m2 < showthema2len && (bar_index - m2) >= 0; m2++) { s2 += this.closes[bar_index - m2]; c2++; }
                    ma2 = c2 > 0 ? (s2 / c2) : close;
                }
            }

            // Pivot High / Low
            var ph = null;
            var pl = null;

            if (bar_index >= 2 * prd) {
                var centerIdx = bar_index - prd;
                var centerHigh = ppsrc === "High/Low" ? this.highs[centerIdx] : Math.max(this.closes[centerIdx], this.opens[centerIdx]);
                var centerLow = ppsrc === "High/Low" ? this.lows[centerIdx] : Math.min(this.closes[centerIdx], this.opens[centerIdx]);

                var isHigh = true;
                var isLow = true;

                for (var k = centerIdx - prd; k <= centerIdx + prd; k++) {
                    if (k === centerIdx) continue;
                    var kHigh = ppsrc === "High/Low" ? this.highs[k] : Math.max(this.closes[k], this.opens[k]);
                    var kLow = ppsrc === "High/Low" ? this.lows[k] : Math.min(this.closes[k], this.opens[k]);
                    if (k < centerIdx) {
                        if (kHigh > centerHigh) isHigh = false;
                        if (kLow < centerLow) isLow = false;
                    } else {
                        if (kHigh >= centerHigh) isHigh = false;
                        if (kLow <= centerLow) isLow = false;
                    }
                }

                if (isHigh) ph = centerHigh;
                if (isLow) pl = centerLow;
            }

            // Update Pivot levels
            if (ph !== null || pl !== null) {
                this.pivotvals.unshift(ph !== null ? ph : pl);
                this.pivotlocs.unshift(bar_index);
                while (this.pivotvals.length > 0 && (bar_index - this.pivotlocs[this.pivotlocs.length - 1]) > loopback) {
                    this.pivotvals.pop();
                    this.pivotlocs.pop();
                }

                // Channel width from highest/lowest in 300 bars
                var prdhighest = -Infinity;
                var prdlowest = Infinity;
                var startLookup = Math.max(0, bar_index - 299);
                for (var bIdx = startLookup; bIdx <= bar_index; bIdx++) {
                    if (this.highs[bIdx] > prdhighest) prdhighest = this.highs[bIdx];
                    if (this.lows[bIdx] < prdlowest) prdlowest = this.lows[bIdx];
                }
                var cwidth = (prdhighest - prdlowest) * ChannelW / 100.0;

                // get_sr_vals for each pivot
                var supres = [];
                for (var x = 0; x < this.pivotvals.length; x++) {
                    var lo = this.pivotvals[x];
                    var hi = lo;
                    var numpp = 0;
                    for (var y = 0; y < this.pivotvals.length; y++) {
                        var cpp = this.pivotvals[y];
                        var wdth = cpp <= hi ? hi - cpp : cpp - lo;
                        if (wdth <= cwidth) {
                            if (cpp <= hi) {
                                lo = Math.min(lo, cpp);
                            } else {
                                hi = Math.max(hi, cpp);
                            }
                            numpp += 20;
                        }
                    }
                    supres.push(numpp, hi, lo);
                }

                // Add price touches to strength
                for (var x2 = 0; x2 < this.pivotvals.length; x2++) {
                    var h = supres[x2 * 3 + 1];
                    var l = supres[x2 * 3 + 2];
                    var s = 0;
                    var startTouches = Math.max(0, bar_index - loopback);
                    for (var y2 = startTouches; y2 <= bar_index; y2++) {
                        if ((this.highs[y2] <= h && this.highs[y2] >= l) || (this.lows[y2] <= h && this.lows[y2] >= l)) {
                            s++;
                        }
                    }
                    supres[x2 * 3] += s;
                }

                // Pick strongest non-overlapping channels
                this.suportresistance.fill(0);
                var stren = new Array(10).fill(0);
                var srcCount = 0;

                for (var x3 = 0; x3 < this.pivotvals.length; x3++) {
                    var stv = -1.0;
                    var stl = -1;
                    for (var y3 = 0; y3 < this.pivotvals.length; y3++) {
                        if (supres[y3 * 3] > stv && supres[y3 * 3] >= minstrength * 20) {
                            stv = supres[y3 * 3];
                            stl = y3;
                        }
                    }
                    if (stl >= 0) {
                        var hh = supres[stl * 3 + 1];
                        var ll = supres[stl * 3 + 2];
                        this.suportresistance[srcCount * 2] = hh;
                        this.suportresistance[srcCount * 2 + 1] = ll;
                        stren[srcCount] = supres[stl * 3];

                        for (var y4 = 0; y4 < this.pivotvals.length; y4++) {
                            var yh = supres[y4 * 3 + 1];
                            var yl = supres[y4 * 3 + 2];
                            if ((yh <= hh && yh >= ll) || (yl <= hh && yl >= ll)) {
                                supres[y4 * 3] = -1;
                            }
                        }
                        srcCount++;
                        if (srcCount >= 10) break;
                    }
                }

                // Sort by strength
                for (var sx = 0; sx < 9; sx++) {
                    for (var sy = sx + 1; sy < 10; sy++) {
                        if (stren[sy] > stren[sx]) {
                            var tmpS = stren[sy];
                            stren[sy] = stren[sx];
                            stren[sx] = tmpS;

                            var tmpH = this.suportresistance[sy * 2];
                            this.suportresistance[sy * 2] = this.suportresistance[sx * 2];
                            this.suportresistance[sx * 2] = tmpH;

                            var tmpL = this.suportresistance[sy * 2 + 1];
                            this.suportresistance[sy * 2 + 1] = this.suportresistance[sx * 2 + 1];
                            this.suportresistance[sx * 2 + 1] = tmpL;
                        }
                    }
                }
            }

            // Check if price is not in a channel
            var not_in_a_channel = true;
            for (var cx = 0; cx <= Math.min(9, maxnumsr); cx++) {
                var chH = this.suportresistance[cx * 2];
                var chL = this.suportresistance[cx * 2 + 1];
                if (chH !== 0 && chL !== 0 && close <= chH && close >= chL) {
                    not_in_a_channel = false;
                    break;
                }
            }

            // Broken detection
            var prevClose = bar_index > 0 ? this.closes[bar_index - 1] : close;
            var resistancebroken = false;
            var supportbroken = false;

            if (not_in_a_channel) {
                for (var bx = 0; bx <= Math.min(9, maxnumsr); bx++) {
                    var rH = this.suportresistance[bx * 2];
                    var rL = this.suportresistance[bx * 2 + 1];
                    if (rH !== 0 && prevClose <= rH && close > rH) {
                        resistancebroken = true;
                    }
                    if (rL !== 0 && prevClose >= rL && close < rL) {
                        supportbroken = true;
                    }
                }
            }

            // Schedule Debounced Drawing
            if (typeof setTimeout !== "undefined") {
                if (this._renderTimer) clearTimeout(this._renderTimer);
                var selfTimer = this;
                this._renderTimer = setTimeout(function () {
                    if (!selfTimer._isDestroyed) selfTimer.renderDrawings();
                }, 100);
            }

            return [
                ma1,
                ma2,
                (showsrbroken && resistancebroken) ? low : NaN,
                (showsrbroken && supportbroken) ? high : NaN,
                (showpp && ph !== null) ? ph : NaN,
                (showpp && pl !== null) ? pl : NaN
            ];
        };
    }
})
