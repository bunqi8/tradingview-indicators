({
    name: "Trend Range Detector",
    metainfo: {
        _metainfoVersion: 52,
        isTVScript: false,
        is_hidden_study: false,
        is_price_study: true,
        isCustomIndicator: true,
        format: { precision: 2, type: "price" },
        id: "TrendRangeDetector@tv-basicstudies-1",
        scriptIdPart: "",
        name: "Trend Range Detector",
        description: "Trend Range Detector",
        shortDescription: "Trend Range Detector",
        defaults: {
            styles: {},
            inputs: {
                in_0: 50,
                in_1: 2.0,
                in_2: true
            }
        },
        plots: [
            { id: "plot_dummy", type: "line" }
        ],
        styles: {
            plot_dummy: { title: "Dummy", histogramBase: 0, joinPoints: false, isHidden: true }
        },
        inputs: [
            { id: "in_0", name: "Minimum Range Length", defval: 50, type: "integer", min: 1, max: 500, tooltip: "The minimum number of bars required to qualify a range box. A higher value ensures the range is well-established, but may reduce responsiveness." },
            { id: "in_1", name: "Range Width Multiplier", defval: 2.0, type: "float", min: 0.1, step: 0.1, tooltip: "Multiplier that adjusts the vertical size of the range box based on ATR. Larger values create wider boxes and accommodate higher volatility." },
            { id: "in_2", name: "Highlight Box Breaks", defval: true, type: "bool", tooltip: "Enable this to highlight boxes that are actively being broken. Green means a breakout above the box; red indicates a breakdown below." }
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
            this.closes = [];
            this.highs = [];
            this.lows = [];

            this.rmaHistory = [];
            this.lastRmaAtr = NaN;

            this.boxes = [];
            this.activeBox = null;
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
            this.closes = [];
            this.highs = [];
            this.lows = [];
            this.rmaHistory = [];
            this.boxes = [];
            this.activeBox = null;
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
            var n = (name || "").toLowerCase().replace(/[-_\s]+/g, "");
            var d = (desc || "").toLowerCase().replace(/[-_\s]+/g, "");
            var i = (id || "").toLowerCase();
            return n.indexOf("trendrange") !== -1 ||
                   d.indexOf("trendrange") !== -1 ||
                   i.indexOf("trendrange") !== -1;
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
                window.__trd_drawnShapeIds = window.__trd_drawnShapeIds || [];
                if (window.__trd_drawnShapeIds.length > 0) {
                    for (var k = 0; k < window.__trd_drawnShapeIds.length; k++) {
                        if (idsToClear.indexOf(window.__trd_drawnShapeIds[k]) === -1) {
                            idsToClear.push(window.__trd_drawnShapeIds[k]);
                        }
                    }
                    window.__trd_drawnShapeIds = [];
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
            if (!chart || typeof chart.createMultipointShape !== "function") return;

            var studyInfo = this.getStudySourceInfo();
            var studySource = studyInfo.source;
            var studyId = studyInfo.id;
            var self = this;

            this.startHeartbeatWatcher();

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

            var timeDiff = 300;
            if (barTimes.length > 1 && barTimes[barTimes.length - 1] > barTimes[barTimes.length - 2]) {
                timeDiff = barTimes[barTimes.length - 1] - barTimes[barTimes.length - 2];
            }

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
                        window.__trd_drawnShapeIds = window.__trd_drawnShapeIds || [];
                        window.__trd_drawnShapeIds.push(sid);
                    }
                }
                if (typeof res.then === "function") {
                    res.then(recordId).catch(function () {});
                } else {
                    recordId(res);
                }
            }

            var boxes = this.boxes || [];
            var maxBoxesToDraw = Math.min(80, boxes.length);
            var startIdx = boxes.length - maxBoxesToDraw;

            for (var i = startIdx; i < boxes.length; i++) {
                var bx = boxes[i];
                if (!bx) continue;
                var x1 = bx.x1;
                var xBox2 = bx.createdBar; // 50-bar consolidation rectangle
                var xLine2 = bx.lineX2 || bx.createdBar; // 3 horizontal lines extend forward to lineX2

                if (x1 < 0) x1 = 0;
                if (xBox2 >= barTimes.length) xBox2 = barTimes.length - 1;
                if (xLine2 >= barTimes.length) xLine2 = barTimes.length - 1;
                if (x1 > xBox2) continue;

                var t1 = barTimes[x1];
                var tBox2 = barTimes[xBox2] || (t1 + 50 * timeDiff);
                var tLine2 = barTimes[xLine2] || (t1 + (xLine2 - x1) * timeDiff);
                if (!t1 || t1 <= 0) continue;
                if (tBox2 <= t1) tBox2 = t1 + 50 * timeDiff;
                if (tLine2 < tBox2) tLine2 = tBox2;

                var topPrice = bx.top;
                var btmPrice = bx.bottom;
                var midPrice = bx.mid;
                if (topPrice === btmPrice) topPrice += 0.01;

                var hexCol = bx.hexColor || "#2157F3";

                // 1. 50-Bar Shaded Consolidation Rectangle (Pine: rectBox := box.new(b - length, ma + atr, b, ma - atr))
                try {
                    var rectOpts = {
                        shape: "rectangle",
                        lock: true,
                        disableSelection: true,
                        disableSave: true,
                        disableUndo: true,
                        overrides: {
                            "fillBackground": true,
                            "backgroundColor": hexCol,
                            "backgroundTransparency": 85,
                            "drawBorder": true,
                            "borderColor": hexCol,
                            "color": hexCol,
                            "linewidth": 1,
                            "linetoolrectangle.fillBackground": true,
                            "linetoolrectangle.backgroundColor": hexCol,
                            "linetoolrectangle.backgroundTransparency": 85,
                            "linetoolrectangle.drawBorder": true,
                            "linetoolrectangle.borderColor": hexCol,
                            "linetoolrectangle.color": hexCol,
                            "linetoolrectangle.linewidth": 1
                        }
                    };
                    if (studyId) rectOpts.ownerStudyId = studyId;
                    track(chart.createMultipointShape([
                        { time: t1, price: topPrice },
                        { time: tBox2, price: btmPrice }
                    ], rectOpts));
                } catch (_) {}

                // 2. Center Dotted Line Extending to lineX2 (Pine: boxMidLine := line.new(...) + boxMidLine.set_x2(b))
                try {
                    var midOpts = {
                        shape: "trend_line",
                        lock: true,
                        disableSelection: true,
                        disableSave: true,
                        disableUndo: true,
                        overrides: {
                            "linecolor": hexCol,
                            "linewidth": 1,
                            "linestyle": 1,
                            "linetooltrendline.linecolor": hexCol,
                            "linetooltrendline.linewidth": 1,
                            "linetooltrendline.linestyle": 1
                        }
                    };
                    if (studyId) midOpts.ownerStudyId = studyId;
                    track(chart.createMultipointShape([
                        { time: t1, price: midPrice },
                        { time: tLine2, price: midPrice }
                    ], midOpts));
                } catch (_) {}

                // 3. Top Horizontal Line Extending to lineX2 (Pine: boxTopLine := line.new(...) + boxTopLine.set_x2(b))
                try {
                    var topOpts = {
                        shape: "trend_line",
                        lock: true,
                        disableSelection: true,
                        disableSave: true,
                        disableUndo: true,
                        overrides: {
                            "linecolor": hexCol,
                            "linewidth": 1,
                            "linestyle": 0,
                            "linetooltrendline.linecolor": hexCol,
                            "linetooltrendline.linewidth": 1,
                            "linetooltrendline.linestyle": 0
                        }
                    };
                    if (studyId) topOpts.ownerStudyId = studyId;
                    track(chart.createMultipointShape([
                        { time: t1, price: topPrice },
                        { time: tLine2, price: topPrice }
                    ], topOpts));
                } catch (_) {}

                // 4. Bottom Horizontal Line Extending to lineX2 (Pine: boxBotLine := line.new(...) + boxBotLine.set_x2(b))
                try {
                    var btmOpts = {
                        shape: "trend_line",
                        lock: true,
                        disableSelection: true,
                        disableSave: true,
                        disableUndo: true,
                        overrides: {
                            "linecolor": hexCol,
                            "linewidth": 1,
                            "linestyle": 0,
                            "linetooltrendline.linecolor": hexCol,
                            "linetooltrendline.linewidth": 1,
                            "linetooltrendline.linestyle": 0
                        }
                    };
                    if (studyId) btmOpts.ownerStudyId = studyId;
                    track(chart.createMultipointShape([
                        { time: t1, price: btmPrice },
                        { time: tLine2, price: btmPrice }
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
            var high = PineStd ? PineStd.high(this._context) : 0;
            var low = PineStd ? PineStd.low(this._context) : 0;
            var close = PineStd ? PineStd.close(this._context) : 0;

            if (bar_index === 0) {
                this.bars = [];
                this.barTimes = [];
                this.closes = [];
                this.highs = [];
                this.lows = [];
                this.rmaHistory = [];
                this.lastRmaAtr = NaN;
                this.boxes = [];
                this.activeBox = null;
            }

            // Truncate future bars if engine rewinds on tick updates
            if (this.bars.length > bar_index) {
                this.bars.length = bar_index;
                this.barTimes.length = bar_index;
                this.closes.length = bar_index;
                this.highs.length = bar_index;
                this.lows.length = bar_index;
                this.rmaHistory.length = bar_index;
                this.lastRmaAtr = bar_index > 0 ? this.rmaHistory[bar_index - 1] : NaN;
                while (this.boxes.length > 0 && this.boxes[this.boxes.length - 1].createdBar >= bar_index) {
                    this.boxes.pop();
                }
                if (this.boxes.length > 0) {
                    this.activeBox = this.boxes[this.boxes.length - 1];
                    if (this.activeBox.lineX2 >= bar_index) {
                        this.activeBox.lineX2 = Math.max(this.activeBox.createdBar, bar_index - 1);
                    }
                } else {
                    this.activeBox = null;
                }
            }

            var getInp = function (idx, def) { var v = inputCallback(idx); return v !== undefined ? v : def; };
            var length = Math.max(1, Math.round(Number(getInp(0, 50))));
            var mult = Number(getInp(1, 2.0));
            var highlightBreak = Boolean(getInp(2, true));

            // 1. Adaptive RMA ATR (Pine ta.atr(2000) * mult)
            var prevClose = (bar_index > 0 && this.bars[bar_index - 1]) ? this.bars[bar_index - 1].close : close;
            var tr = (bar_index === 0) ? (high - low) : Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));

            if (isNaN(this.lastRmaAtr)) {
                this.lastRmaAtr = tr;
            } else {
                var p = Math.min(bar_index + 1, 2000);
                this.lastRmaAtr = (this.lastRmaAtr * (p - 1) + tr) / p;
            }
            this.rmaHistory[bar_index] = this.lastRmaAtr;
            var atr = this.lastRmaAtr * mult;

            this.bars[bar_index] = { high: high, low: low, close: close, time: timeSec };
            this.barTimes[bar_index] = timeSec;
            this.closes[bar_index] = close;
            this.highs[bar_index] = high;
            this.lows[bar_index] = low;

            // 2. Custom Weighted MA (Pine lines 22-29)
            var ma = NaN;
            if (bar_index >= length) {
                var sumWeightedClose = 0.0;
                var sumWeights = 0.0;
                for (var i = 0; i < length; i++) {
                    var close_i = this.closes[bar_index - i];
                    var close_prev = this.closes[bar_index - i - 1];
                    var delta = Math.abs(close_i - close_prev);
                    var w = close_prev !== 0 ? (delta / close_prev) : 0;
                    sumWeightedClose += close_i * w;
                    sumWeights += w;
                }
                ma = sumWeights !== 0 ? (sumWeightedClose / sumWeights) : NaN;
            }

            // 3. Max distance & inRange check (Pine lines 31-35)
            var inRange = false;
            if (!isNaN(ma) && !isNaN(atr)) {
                var maxDist = 0;
                for (var j = 0; j < length; j++) {
                    var dist = Math.abs(this.closes[bar_index - j] - ma);
                    if (dist > maxDist) maxDist = dist;
                }
                inRange = maxDist <= atr;
            }
            this.bars[bar_index].inRange = inRange;

            // 4. Box Transitions (Pine lines 38-60)
            var prevInRange = (bar_index > 0 && this.bars[bar_index - 1]) ? Boolean(this.bars[bar_index - 1].inRange) : false;
            var newBox = inRange && !prevInRange;
            var extendBox = inRange && !newBox;

            if (newBox) {
                // Pine: if rectBox.get_right()<(b-length) or na(rectBox)
                var lastBoxRight = this.activeBox ? this.activeBox.createdBar : -1;
                if (lastBoxRight < (bar_index - length) || !this.activeBox) {
                    var newB = {
                        createdBar: bar_index,
                        x1: bar_index - length,
                        lineX2: bar_index,
                        top: ma + atr,
                        bottom: ma - atr,
                        mid: ma,
                        colorType: "blue",
                        hexColor: "#2157F3"
                    };
                    this.boxes.push(newB);
                    this.activeBox = newB;
                    if (this.boxes.length > 500) {
                        this.boxes.shift();
                    }
                }
            }

            if (extendBox && this.activeBox) {
                // Pine lines 57-60: boxMidLine.set_x2(b), boxTopLine.set_x2(b), boxBotLine.set_x2(b)
                this.activeBox.lineX2 = bar_index;
            }

            // 5. Highlight Box Breaks (Pine lines 62-74)
            if (highlightBreak && this.activeBox) {
                var breakUp = close > this.activeBox.top;
                var breakDn = close < this.activeBox.bottom;
                var curCol = breakUp ? "#089977" : (breakDn ? "#F23645" : "#2157F3");
                this.activeBox.colorType = breakUp ? "green" : (breakDn ? "red" : "blue");
                this.activeBox.hexColor = curCol;
            }

            // Schedule Debounced Drawing
            if (typeof setTimeout !== "undefined") {
                if (this._renderTimer) clearTimeout(this._renderTimer);
                var selfTimer = this;
                this._renderTimer = setTimeout(function () {
                    if (!selfTimer._isDestroyed) selfTimer.renderDrawings();
                }, 100);
            }

            return [NaN];
        };
    }
})
