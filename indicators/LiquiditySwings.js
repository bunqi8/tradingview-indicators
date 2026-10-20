({
    name: "Liquidity Swings",
    metainfo: {
        _metainfoVersion: 52,
        isTVScript: false,
        is_hidden_study: false,
        is_price_study: true,
        isCustomIndicator: true,
        format: { precision: 2, type: "price" },
        id: "LiquiditySwings@tv-basicstudies-1",
        scriptIdPart: "",
        name: "Liquidity Swings",
        description: "Liquidity Swings",
        shortDescription: "Liquidity Swings",
        defaults: {
            styles: {},
            inputs: {
                in_length: 14,
                in_area: "Wick Extremity",
                in_filterOptions: "Count",
                in_filterValue: 0,
                in_showTop: true,
                in_topCss: "#F23645",
                in_topAreaCss: "rgba(242, 54, 69, 0.35)",
                in_showBtm: true,
                in_btmCss: "#089981",
                in_btmAreaCss: "rgba(8, 153, 129, 0.35)",
                in_labelSize: "Tiny"
            }
        },
        plots: [{ id: "plot_dummy", type: "line" }],
        styles: { plot_dummy: { title: "Dummy", isHidden: true } },
        inputs: [
            { id: "in_length", name: "Pivot Lookback", defval: 14, type: "integer", min: 1, max: 200 },
            { id: "in_area", name: "Swing Area", defval: "Wick Extremity", type: "text", options: ["Wick Extremity", "Full Range"] },
            { id: "in_filterOptions", name: "Filter Areas By", defval: "Count", type: "text", options: ["Count", "Volume"] },
            { id: "in_filterValue", name: "Filter Value", defval: 0, type: "float", min: 0 },
            { id: "in_showTop", name: "Swing High", defval: true, type: "bool" },
            { id: "in_topCss", name: "Swing High Color", defval: "#F23645", type: "color" },
            { id: "in_topAreaCss", name: "Swing High Area Color", defval: "rgba(242, 54, 69, 0.35)", type: "text" },
            { id: "in_showBtm", name: "Swing Low", defval: true, type: "bool" },
            { id: "in_btmCss", name: "Swing Low Color", defval: "#089981", type: "color" },
            { id: "in_btmAreaCss", name: "Swing Low Area Color", defval: "rgba(8, 153, 129, 0.35)", type: "text" },
            { id: "in_labelSize", name: "Labels Size", defval: "Tiny", type: "text", options: ["Tiny", "Small", "Normal"] }
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
            this._heartbeatStarted = false;
            if (this._heartbeatInterval) {
                clearInterval(this._heartbeatInterval);
                this._heartbeatInterval = null;
            }
            this.clearDrawings();
            this.bars = [];
            this.barTimes = [];
            this.swingHighs = [];
            this.swingLows = [];
            this.currPh = null;
            this.currPl = null;
            this._drawnShapeIds = [];
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
            this._heartbeatStarted = false;
            this.bars = [];
            this.barTimes = [];
            this.swingHighs = [];
            this.swingLows = [];
            this.currPh = null;
            this.currPl = null;
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
                if (typeof chart.getAllStudies === "function") {
                    var studies = chart.getAllStudies();
                    for (var sIdx = 0; sIdx < studies.length; sIdx++) {
                        var stObj = studies[sIdx];
                        if (stObj && (
                            stObj.name === "Liquidity Swings" ||
                            stObj.description === "Liquidity Swings" ||
                            (stObj.name && stObj.name.indexOf("Liquidity Swings") !== -1) ||
                            (stObj.description && stObj.description.indexOf("Liquidity Swings") !== -1) ||
                            (stObj.id && stObj.id.indexOf("LiquiditySwings") !== -1)
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
                            if (asMeta && (
                                asMeta.id === "LiquiditySwings@tv-basicstudies-1" ||
                                asMeta.description === "Liquidity Swings" ||
                                asMeta.name === "Liquidity Swings" ||
                                (asMeta.name && asMeta.name.indexOf("Liquidity Swings") !== -1) ||
                                (asMeta.description && asMeta.description.indexOf("Liquidity Swings") !== -1)
                            )) {
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
                    var stillExists = studies.some(function (s) {
                        var sName = (s.name || "").toLowerCase();
                        var sDesc = (s.description || "").toLowerCase();
                        return sName.indexOf("liquidity swings") !== -1 ||
                               sDesc.indexOf("liquidity swings") !== -1 ||
                               (s.id && s.id.indexOf("LiquiditySwings") !== -1);
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
            if (typeof window !== "undefined" && window.__ls_drawnShapeIds && window.__ls_drawnShapeIds.length > 0) {
                for (var k = 0; k < window.__ls_drawnShapeIds.length; k++) {
                    if (idsToClear.indexOf(window.__ls_drawnShapeIds[k]) === -1) {
                        idsToClear.push(window.__ls_drawnShapeIds[k]);
                    }
                }
                window.__ls_drawnShapeIds = [];
            }
            this._drawnShapeIds = [];

            try {
                var chart = this.getChart();
                if (chart && chart._chartWidget && chart._chartWidget.model && chart._chartWidget.model().model) {
                    try {
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
                    } catch (_) {}
                }

                if (chart && typeof chart.removeEntity === "function" && idsToClear.length > 0) {
                    for (var i = 0; i < idsToClear.length; i++) {
                        try {
                            chart.removeEntity(idsToClear[i], { disableUndo: true });
                        } catch (_) {}
                    }
                }
            } catch (_) {}
        };

        function formatVolume(val) {
            if (!val || isNaN(val) || val <= 0) return "0";
            if (val >= 1e9) return (val / 1e9).toFixed(3).replace(/\.?0+$/, "") + "B";
            if (val >= 1e6) return (val / 1e6).toFixed(3).replace(/\.?0+$/, "") + "M";
            if (val >= 1e3) return (val / 1e3).toFixed(3).replace(/\.?0+$/, "") + "K";
            return Math.round(val).toString();
        }

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
                        if (!self._isDestroyed) self.renderDrawings();
                    }, 150);
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

                var visProp = null;
                try {
                    if (typeof studySource.properties === "function") {
                        var p = studySource.properties();
                        if (p && p.visible) visProp = p.visible;
                        else if (p && p.childs && typeof p.childs === "function" && p.childs().visible) visProp = p.childs().visible;
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
            }

            this.clearDrawings();
            var currentGen = self._renderGen;

            var barTimes = this.barTimes || [];
            var totalBars = barTimes.length;
            if (totalBars < 2) return;

            var lastBarTime = barTimes[totalBars - 1];
            var timeDiff = (totalBars > 1 && barTimes[totalBars - 1] > barTimes[totalBars - 2])
                ? (barTimes[totalBars - 1] - barTimes[totalBars - 2]) : 300;

            function track(res) {
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
                            if (!window.__ls_drawnShapeIds) window.__ls_drawnShapeIds = [];
                            window.__ls_drawnShapeIds.push(id);
                        }
                    }).catch(function () {});
                } else {
                    if (self._isDestroyed || self._renderGen !== currentGen) {
                        try {
                            if (chart && typeof chart.removeEntity === "function") {
                                chart.removeEntity(res, { disableUndo: true });
                            }
                        } catch (_) {}
                        return;
                    }
                    self._drawnShapeIds.push(res);
                    if (typeof window !== "undefined") {
                        if (!window.__ls_drawnShapeIds) window.__ls_drawnShapeIds = [];
                        window.__ls_drawnShapeIds.push(res);
                    }
                }
            }

            var cfg = this._cfg || {};
            var swings = [];
            if (cfg.showTop !== false) swings = swings.concat(this.swingHighs || []);
            if (cfg.showBtm !== false) swings = swings.concat(this.swingLows || []);

            var atr = 10;
            if (this.bars && this.bars.length > 0) {
                var aLen = Math.min(14, this.bars.length), sum = 0;
                for (var ai = this.bars.length - aLen; ai < this.bars.length; ai++) sum += (this.bars[ai].high - this.bars[ai].low);
                atr = sum / aLen || 10;
            }
            var fSize = cfg.labelSize === "Normal" ? 11 : (cfg.labelSize === "Small" ? 10 : 9);

            for (var i = 0; i < swings.length; i++) {
                var s = swings[i];
                var target = (cfg.filterOptions === "Volume") ? s.vol : s.count;
                if (target <= (cfg.filterValue || 0)) continue;

                var pBar = s.pivotBar;
                if (pBar < 0 || pBar >= totalBars) continue;
                var t1 = barTimes[pBar];
                var price = s.isHigh ? s.top : s.btm;
                var css = s.isHigh ? (cfg.topCss || "#F23645") : (cfg.btmCss || "#089981");
                var areaCss = s.isHigh ? (cfg.topAreaCss || "rgba(242, 54, 69, 0.35)") : (cfg.btmAreaCss || "rgba(8, 153, 129, 0.35)");

                var t2, lineStyle = 0;
                if (s.crossed && s.crossBar !== null) {
                    var cBar = Math.min(totalBars - 1, Math.max(pBar, s.crossBar));
                    t2 = barTimes[cBar] || (t1 + timeDiff);
                    lineStyle = 2; // dashed when crossed
                } else if (s.endBar !== null) {
                    var eBar = Math.min(totalBars - 1, Math.max(pBar, s.endBar));
                    t2 = barTimes[eBar] || (t1 + timeDiff);
                    lineStyle = 0; // solid capped by next pivot
                } else {
                    t2 = lastBarTime + 3 * timeDiff;
                    lineStyle = 0; // solid active
                }
                if (t1 === t2) t2 = t1 + timeDiff;

                // 1. Horizontal Level Line
                try {
                    track(chart.createMultipointShape([{ time: t1, price: price }, { time: t2, price: price }], {
                        shape: "trend_line", lock: true, disableSelection: true, disableSave: true, disableUndo: true,
                        overrides: { "linecolor": css, "linewidth": 1, "linestyle": lineStyle, "linetooltrendline.linecolor": css, "linetooltrendline.linewidth": 1, "linetooltrendline.linestyle": lineStyle }
                    }));
                } catch (_) {}

                // 2. Accumulation Zone Box (width = count bars)
                if (s.count > 0 && s.top > s.btm) {
                    try {
                        var countEndBar = Math.min(totalBars - 1, pBar + s.count);
                        var countT2 = barTimes[countEndBar] || (t1 + s.count * timeDiff);
                        if (countT2 === t1) countT2 = t1 + timeDiff;

                        track(chart.createMultipointShape([{ time: t1, price: s.top }, { time: countT2, price: s.btm }], {
                            shape: "rectangle", lock: true, disableSelection: true, disableSave: true, disableUndo: true,
                            overrides: { "fillBackground": true, "backgroundColor": areaCss, "backgroundTransparency": 50, "drawBorder": false, "borderColor": "rgba(0,0,0,0)", "color": "rgba(0,0,0,0)", "linewidth": 0, "linetoolrectangle.fillBackground": true, "linetoolrectangle.backgroundColor": areaCss, "linetoolrectangle.backgroundTransparency": 50, "linetoolrectangle.drawBorder": false, "linetoolrectangle.borderColor": "rgba(0,0,0,0)", "linetoolrectangle.color": "rgba(0,0,0,0)", "linetoolrectangle.linewidth": 0 }
                        }));
                    } catch (_) {}
                }

                // 3. Volume Label
                if (s.vol > 0 || s.count > 0) {
                    try {
                        var lblPrice = s.isHigh ? (s.top + atr * 0.35) : (s.btm - atr * 0.35);
                        if (typeof chart.createShape === "function") {
                            track(chart.createShape({ time: t1, price: lblPrice }, {
                                shape: "text", text: formatVolume(s.vol), lock: true, disableSelection: true, disableSave: true, disableUndo: true,
                                overrides: { "color": css, "textColor": css, "fontsize": fSize, "bold": true, "fillBackground": false, "backgroundColor": "rgba(0,0,0,0)", "drawBorder": false, "borderColor": "rgba(0,0,0,0)" }
                            }));
                        }
                    } catch (_) {}
                }
            }

            // 4. Active Forward Projection Boxes (ph_bx and pl_bx)
            var actSwings = [];
            if (this.currPh && !this.currPh.crossed && cfg.showTop !== false) actSwings.push(this.currPh);
            if (this.currPl && !this.currPl.crossed && cfg.showBtm !== false) actSwings.push(this.currPl);

            for (var a = 0; a < actSwings.length; a++) {
                var asw = actSwings[a];
                if (asw.pivotBar >= 0 && asw.pivotBar < totalBars && asw.top > asw.btm) {
                    try {
                        var actT1 = barTimes[asw.pivotBar];
                        var actT2 = lastBarTime + 3 * timeDiff;
                        var actCss = asw.isHigh ? (cfg.topAreaCss || "rgba(242, 54, 69, 0.35)") : (cfg.btmAreaCss || "rgba(8, 153, 129, 0.35)");
                        track(chart.createMultipointShape([{ time: actT1, price: asw.top }, { time: actT2, price: asw.btm }], {
                            shape: "rectangle", lock: true, disableSelection: true, disableSave: true, disableUndo: true,
                            overrides: { "fillBackground": true, "backgroundColor": actCss, "backgroundTransparency": 85, "drawBorder": false, "borderColor": "rgba(0,0,0,0)", "color": "rgba(0,0,0,0)", "linewidth": 0, "linetoolrectangle.fillBackground": true, "linetoolrectangle.backgroundColor": actCss, "linetoolrectangle.backgroundTransparency": 85, "linetoolrectangle.drawBorder": false, "linetoolrectangle.borderColor": "rgba(0,0,0,0)", "linetoolrectangle.color": "rgba(0,0,0,0)", "linetoolrectangle.linewidth": 0 }
                        }));
                    } catch (_) {}
                }
            }
        };

        this.main = function (ctx, inputCallback) {
            this._context = ctx;
            this._input = inputCallback;

            var in_length = 14;
            var in_area = "Wick Extremity";
            var in_filterOptions = "Count";
            var in_filterValue = 0;
            var in_showTop = true;
            var in_topCss = "#F23645";
            var in_topAreaCss = "rgba(242, 54, 69, 0.35)";
            var in_showBtm = true;
            var in_btmCss = "#089981";
            var in_btmAreaCss = "rgba(8, 153, 129, 0.35)";
            var in_labelSize = "Tiny";

            if (typeof this._input === "function") {
                var v0 = this._input(0); if (v0 !== undefined) in_length = Math.max(1, Math.round(Number(v0)));
                var v1 = this._input(1); if (v1 !== undefined) in_area = v1;
                var v2 = this._input(2); if (v2 !== undefined) in_filterOptions = v2;
                var v3 = this._input(3); if (v3 !== undefined) in_filterValue = Number(v3);
                var v4 = this._input(4); if (v4 !== undefined) in_showTop = !!v4;
                var v5 = this._input(5); if (v5 !== undefined) in_topCss = v5;
                var v6 = this._input(6); if (v6 !== undefined) in_topAreaCss = v6;
                var v7 = this._input(7); if (v7 !== undefined) in_showBtm = !!v7;
                var v8 = this._input(8); if (v8 !== undefined) in_btmCss = v8;
                var v9 = this._input(9); if (v9 !== undefined) in_btmAreaCss = v9;
                var v10 = this._input(10); if (v10 !== undefined) in_labelSize = v10;
            }

            this._cfg = {
                length: in_length, area: in_area, filterOptions: in_filterOptions, filterValue: in_filterValue,
                showTop: in_showTop, topCss: in_topCss, topAreaCss: in_topAreaCss,
                showBtm: in_showBtm, btmCss: in_btmCss, btmAreaCss: in_btmAreaCss, labelSize: in_labelSize
            };

            var bar_index = PineJS.Std.n(this._context);
            var timeMs = PineJS.Std.time(this._context);
            var timeSec = timeMs > 1e11 ? Math.floor(timeMs / 1000) : Math.floor(timeMs);
            var open = PineJS.Std.open(this._context);
            var high = PineJS.Std.high(this._context);
            var low = PineJS.Std.low(this._context);
            var close = PineJS.Std.close(this._context);
            var volume = PineJS.Std.volume(this._context);
            if (isNaN(volume) || volume === null) volume = 0;

            if (!this.bars || bar_index === 0) {
                this.bars = []; this.barTimes = []; this.swingHighs = []; this.swingLows = [];
                this.currPh = null; this.currPl = null;
            }

            if (this.bars.length > bar_index) {
                this.bars.length = bar_index;
                this.barTimes.length = bar_index;
                while (this.swingHighs.length > 0 && this.swingHighs[this.swingHighs.length - 1].pivotBar >= bar_index - in_length) {
                    this.swingHighs.pop();
                }
                this.currPh = this.swingHighs.length > 0 ? this.swingHighs[this.swingHighs.length - 1] : null;

                while (this.swingLows.length > 0 && this.swingLows[this.swingLows.length - 1].pivotBar >= bar_index - in_length) {
                    this.swingLows.pop();
                }
                this.currPl = this.swingLows.length > 0 ? this.swingLows[this.swingLows.length - 1] : null;
            }

            this.bars[bar_index] = { index: bar_index, time: timeSec, open: open, high: high, low: low, close: close, volume: volume };
            this.barTimes[bar_index] = timeSec;

            var candIdx = bar_index - in_length;
            var isPH = false, isPL = false;

            if (candIdx >= in_length) {
                var cH = this.bars[candIdx].high, cL = this.bars[candIdx].low;
                isPH = true; isPL = true;
                for (var k = candIdx - in_length; k <= bar_index; k++) {
                    if (k === candIdx) continue;
                    if (this.bars[k].high >= cH) isPH = false;
                    if (this.bars[k].low <= cL) isPL = false;
                    if (!isPH && !isPL) break;
                }
            }

            // Update active swings (get_counts accumulation and crossover detection)
            if (this.currPh && !isPH) {
                var chkH = this.bars[candIdx];
                if (chkH && chkH.low < this.currPh.top && chkH.high > this.currPh.btm) {
                    this.currPh.vol += chkH.volume;
                    this.currPh.count += 1;
                }
                if (!this.currPh.crossed && close > this.currPh.top) {
                    this.currPh.crossed = true;
                    this.currPh.crossBar = bar_index;
                }
            }
            if (this.currPl && !isPL) {
                var chkL = this.bars[candIdx];
                if (chkL && chkL.low < this.currPl.top && chkL.high > this.currPl.btm) {
                    this.currPl.vol += chkL.volume;
                    this.currPl.count += 1;
                }
                if (!this.currPl.crossed && close < this.currPl.btm) {
                    this.currPl.crossed = true;
                    this.currPl.crossBar = bar_index;
                }
            }

            // New Swing High confirmed
            if (isPH && in_showTop) {
                if (this.currPh && !this.currPh.crossed && this.currPh.endBar === null) this.currPh.endBar = candIdx;
                var bH = this.bars[candIdx];
                var topH = bH.high, btmH = in_area === "Wick Extremity" ? Math.max(bH.close, bH.open) : bH.low;
                this.currPh = { isHigh: true, pivotBar: candIdx, top: topH, btm: btmH, crossed: false, crossBar: null, endBar: null, count: 0, vol: 0 };
                this.swingHighs.push(this.currPh);
            }

            // New Swing Low confirmed
            if (isPL && in_showBtm) {
                if (this.currPl && !this.currPl.crossed && this.currPl.endBar === null) this.currPl.endBar = candIdx;
                var bL = this.bars[candIdx];
                var topL = in_area === "Wick Extremity" ? Math.min(bL.close, bL.open) : bL.high, btmL = bL.low;
                this.currPl = { isHigh: false, pivotBar: candIdx, top: topL, btm: btmL, crossed: false, crossBar: null, endBar: null, count: 0, vol: 0 };
                this.swingLows.push(this.currPl);
            }

            if (typeof setTimeout !== "undefined") {
                if (this._renderTimer) clearTimeout(this._renderTimer);
                var self = this;
                this._renderTimer = setTimeout(function () {
                    if (!self._isDestroyed) self.renderDrawings();
                }, 80);
            }

            return [NaN];
        };
    }
})
