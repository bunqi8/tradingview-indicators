({
    name: "Zigzag Trend/Divergence Detector",
    metainfo: {
        _metainfoVersion: 52,
        isTVScript: false,
        is_hidden_study: false,
        is_price_study: true,
        isCustomIndicator: true,
        format: { precision: 2, type: "price" },
        id: "ZigzagTrendDivergenceDetector_v2@tv-basicstudies-1",
        scriptIdPart: "",
        name: "Zigzag Trend/Divergence Detector",
        description: "Zigzag Trend/Divergence Detector",
        shortDescription: "Zigzag-Trend-Divergence",
        defaults: {
            styles: {
                plot_supertrend: { linestyle: 0, linewidth: 1, plottype: 0, trackPrice: false, transparency: 0, visible: true, color: "#00E676" }
            },
            palettes: {
                trendPalette: {
                    colors: {
                        0: { color: "#00E676", width: 1, style: 0 },
                        1: { color: "#FF9800", width: 1, style: 0 }
                    }
                },
                barPalette: {
                    colors: [
                        { color: "#00E676", width: 1, style: 0 },
                        { color: "#FF9800", width: 1, style: 0 }
                    ]
                }
            },
            inputs: {
                in_0: true, in_1: false, in_2: 5, in_3: "#FBC02D", in_4: "RSI",
                in_5: 22, in_6: 12, in_7: 26, in_8: true, in_9: 4, in_10: 22,
                in_11: 1.0, in_12: true, in_13: true, in_14: true, in_15: 10,
                in_16: "small", in_17: true, in_18: true, in_19: true, in_20: true
            }
        },
        plots: [
            { id: "plot_supertrend", type: "line" },
            { id: "plot_supertrend_color", palette: "trendPalette", target: "plot_supertrend", type: "colorer" },
            { id: "plot_bar_colorer", type: "bar_colorer", palette: "barPalette" }
        ],
        styles: {
            plot_supertrend: { title: "Supertrend", histogramBase: 0, joinPoints: false, isHidden: false }
        },
        palettes: {
            trendPalette: {
                colors: {
                    0: { name: "Bullish Trend" },
                    1: { name: "Bearish Trend" }
                },
                valToIndex: { 0: 0, 1: 1 }
            },
            barPalette: {
                colors: [{ name: "Bullish Candle" }, { name: "Bearish Candle" }],
                valToIndex: { 1: 0, 2: 1 }
            }
        },
        inputs: [
            { id: "in_0", name: "Close Prices", defval: true, type: "bool" },
            { id: "in_1", name: "Confirmed Pivots", defval: false, type: "bool" },
            { id: "in_2", name: "Zigzag Length", defval: 5, type: "integer", min: 3 },
            { id: "in_3", name: "Zigzag Color", defval: "#FBC02D", type: "color" },
            { id: "in_4", name: "Oscillator Source", defval: "RSI", type: "text", options: ["RSI", "MACD", "HIST", "BB", "KC", "DC", "ADC", "MOM", "ROC", "CCI"] },
            { id: "in_5", name: "Length", defval: 22, type: "integer", min: 1 },
            { id: "in_6", name: "Fast", defval: 12, type: "integer", min: 1 },
            { id: "in_7", name: "Slow", defval: 26, type: "integer", min: 1 },
            { id: "in_8", name: "Pivot History", defval: true, type: "bool" },
            { id: "in_9", name: "Supertrend History", defval: 4, type: "integer", min: 1 },
            { id: "in_10", name: "ATR Length", defval: 22, type: "integer", min: 1, step: 5 },
            { id: "in_11", name: "ATR Multiplier", defval: 1.0, type: "float", min: 0.1, step: 0.5 },
            { id: "in_12", name: "Color Candles", defval: true, type: "bool" },
            { id: "in_13", name: "Plot Supertrend", defval: true, type: "bool" },
            { id: "in_14", name: "Show Stat Table", defval: true, type: "bool" },
            { id: "in_15", name: "Max Rows", defval: 10, type: "integer", min: 5, step: 5 },
            { id: "in_16", name: "Size", defval: "small", type: "text", options: ["tiny", "small", "normal", "large", "huge"] },
            { id: "in_17", name: "Continuation", defval: true, type: "bool" },
            { id: "in_18", name: "Indeterminate", defval: true, type: "bool" },
            { id: "in_19", name: "Divergence", defval: true, type: "bool" },
            { id: "in_20", name: "Hidden Divergence", defval: true, type: "bool" }
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
            if (typeof window !== "undefined") {
                window.__zg_statsDisabled = false;
            }
            this._drawnShapeIds = [];
            this.clearDrawings();

            this.bars = [];
            this.barTimes = [];
            this.closes = [];
            this.highs = [];
            this.lows = [];

            this.rmaTr = NaN;
            this.rmaGain = NaN;
            this.rmaLoss = NaN;

            this.stDir = 1;
            this.stBuyStop = NaN;
            this.stSellStop = NaN;
            this.supertrendDirHistory = [];

            this.pZigzagPivots = [];
            this.pZigzagPivotBars = [];
            this.pZigzagPivotDirs = [];
            this.opZigzagPivots = [];
            this.opZigzagPivotDirs = [];

            this.pZigzagLines = [];
            this.pZigzagLabels = [];
        };

        this.destroy = function () {
            this._isDestroyed = true;
            if (this._renderTimer) { clearTimeout(this._renderTimer); this._renderTimer = null; }
            if (this._heartbeatInterval) { clearInterval(this._heartbeatInterval); this._heartbeatInterval = null; }
            this.clearDrawings();
            this._cachedStudyInfo = null;
            this._subscribedVis = false;
            this._subscribedVisEvent = false;
            this.bars = [];
            this.barTimes = [];
            this.pZigzagLines = [];
            this.pZigzagLabels = [];
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
                            stObj.name === "Zigzag Trend/Divergence Detector" ||
                            (stObj.name && stObj.name.indexOf("Zigzag") !== -1) ||
                            (stObj.description && stObj.description.indexOf("Zigzag") !== -1) ||
                            (stObj.id && stObj.id.indexOf("Zigzag") !== -1)
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
                                asMeta.id === "ZigzagTrendDivergenceDetector_v2@tv-basicstudies-1" ||
                                (asMeta.id && asMeta.id.indexOf("Zigzag") !== -1) ||
                                (asMeta.name && asMeta.name.indexOf("Zigzag") !== -1) ||
                                (asMeta.description && asMeta.description.indexOf("Zigzag") !== -1)
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
                    var stillExists = false;
                    if (self._cachedStudyInfo && self._cachedStudyInfo.id) {
                        stillExists = studies.some(function (s) { return s.id === self._cachedStudyInfo.id; });
                    }
                    if (!stillExists) {
                        stillExists = studies.some(function (s) {
                            var sName = (s.name || "").toLowerCase();
                            var sDesc = (s.description || "").toLowerCase();
                            return (sName === "zigzag trend/divergence detector" ||
                                    sDesc === "zigzag trend/divergence detector" ||
                                    (s.id && s.id.indexOf("ZigzagTrendDivergenceDetector") !== -1)) &&
                                    (sName.indexOf("strategy") === -1 && sDesc.indexOf("strategy") === -1);
                        });
                    }
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
            if (typeof window !== "undefined") {
                window.__zg_drawnShapeIds = window.__zg_drawnShapeIds || [];
                if (window.__zg_drawnShapeIds.length > 0) {
                    for (var k = 0; k < window.__zg_drawnShapeIds.length; k++) {
                        if (idsToClear.indexOf(window.__zg_drawnShapeIds[k]) === -1) {
                            idsToClear.push(window.__zg_drawnShapeIds[k]);
                        }
                    }
                    window.__zg_drawnShapeIds = [];
                }
            }
            this._drawnShapeIds = [];

            try {
                var chart = this.getChart();
                if (chart && typeof chart.removeEntity === "function" && idsToClear.length > 0) {
                    for (var i = 0; i < idsToClear.length; i++) {
                        try { chart.removeEntity(idsToClear[i], { disableUndo: true }); } catch (_) {}
                    }
                }
            } catch (_) {}

            if (typeof document !== "undefined") {
                var t = document.getElementById("zg_stat_table_overlay");
                if (t) t.remove();
            }
        };

        this.renderDrawings = function () {
            if (this._isDestroyed) { this.clearDrawings(); return; }
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

            var cfg = this._cfg || {};
            var barTimes = this.barTimes;
            var maxDraw = Math.min(25, this.pZigzagLines.length);

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
                        window.__zg_drawnShapeIds = window.__zg_drawnShapeIds || [];
                        window.__zg_drawnShapeIds.push(sid);
                    }
                }
                if (typeof res.then === "function") {
                    res.then(recordId);
                } else {
                    recordId(res);
                }
            }

            // 1. Zigzag Lines (UNIX seconds time)
            for (var l = 0; l < maxDraw; l++) {
                var lm = this.pZigzagLines[l];
                if (!lm || lm.x1 === lm.x2) continue;
                var t1 = barTimes[lm.x1], t2 = barTimes[lm.x2];
                if (!t1 || !t2 || t1 === t2 || t1 <= 0 || t2 <= 0) continue;
                try {
                    track(chart.createMultipointShape([{ time: t2, price: lm.y2 }, { time: t1, price: lm.y1 }], {
                        shape: "trend_line", lock: true, disableSelection: true, disableSave: true, disableUndo: true,
                        overrides: {
                            "linecolor": cfg.pZigzagColor || "#FBC02D",
                            "linewidth": 1,
                            "linestyle": 0,
                            "linetooltrendline.linecolor": cfg.pZigzagColor || "#FBC02D",
                            "linetooltrendline.linewidth": 1,
                            "linetooltrendline.linestyle": 0
                        }
                    }));
                } catch (_) {}
            }

            // 2. Divergence Labels (UNIX seconds time)
            if (typeof chart.createShape === "function") {
                for (var b = 0; b < maxDraw; b++) {
                    var lb = this.pZigzagLabels[b];
                    if (!lb) continue;
                    if (!cfg.showIndeterminate && lb.div === 0) continue;
                    if (!cfg.showContinuation && lb.div === 1) continue;
                    if (!cfg.showDivergence && lb.div === -1) continue;
                    if (!cfg.showHiddenDivergence && lb.div === -2) continue;

                    var lt = barTimes[lb.x];
                    if (!lt || lt <= 0) continue;
                    var offset = (this.lastAtr && !isNaN(this.lastAtr)) ? (this.lastAtr * 0.35) : (lb.y * 0.001);
                    var lPrice = lb.pDir > 0 ? (lb.y + offset) : (lb.y - offset);

                    try {
                        track(chart.createShape({ time: lt, price: lPrice }, {
                            shape: "text", text: lb.text, lock: true, disableSelection: true, disableSave: true, disableUndo: true,
                            overrides: {
                                "color": "#000000", "textColor": "#000000", "fontsize": 10, "bold": true,
                                "fillBackground": true, "backgroundColor": lb.color, "drawBorder": true, "borderColor": lb.color
                            }
                        }));
                    } catch (_) {}
                }
            }

            // 3. Stat Table Overlay
            if (cfg.showStatTable && typeof document !== "undefined") {
                this.renderTable();
            }
        };

        this.renderTable = function () {
            var cfg = this._cfg || {};
            if (this._isDestroyed || (typeof window !== "undefined" && window.__zg_statsDisabled) || !cfg.showStatTable) {
                if (typeof document !== "undefined") {
                    var ex = document.getElementById("zg_stat_table_overlay");
                    if (ex) ex.remove();
                }
                return;
            }

            var startIndex = cfg.waitForConfirmation ? 1 : 0;
            var maxRows = cfg.max_array_size || 10;
            var pDirs = this.pZigzagPivotDirs;
            if (pDirs.length <= startIndex) return;

            if (typeof window !== "undefined") {
                window.__zg_lastInstance = this;
                if (!window.__zg_toggleMinimize) {
                    window.__zg_toggleMinimize = function (e) {
                        if (e && e.stopPropagation) e.stopPropagation();
                        window.__zg_statsMinimized = !window.__zg_statsMinimized;
                        if (window.__zg_lastInstance && typeof window.__zg_lastInstance.renderTable === "function") {
                            window.__zg_lastInstance.renderTable();
                        }
                    };
                }
                if (!window.__zg_disableStats) {
                    window.__zg_disableStats = function (e) {
                        if (e && e.stopPropagation) e.stopPropagation();
                        window.__zg_statsDisabled = true;
                        var t = document.getElementById("zg_stat_table_overlay");
                        if (t) t.remove();
                    };
                }
            }

            var existing = document.getElementById("zg_stat_table_overlay");
            if (existing) existing.remove();

            var container = document.getElementById("tv_chart_container") || document.body;
            var overlay = document.createElement("div");
            overlay.id = "zg_stat_table_overlay";
            overlay.style.cssText = "position:absolute;top:55px;right:75px;z-index:99;background:rgba(19,23,34,0.95);border:1px solid #434651;border-radius:4px;box-shadow:0 4px 16px rgba(0,0,0,0.5);font-size:11px;color:#d1d4dc;user-select:none;overflow:hidden;pointer-events:auto;";

            if (typeof window !== "undefined" && window.__zg_statsMinimized) {
                overlay.innerHTML = '<div style="display:flex;align-items:center;justify-content:space-between;padding:4px 8px;background:#000;color:#fff;font-weight:bold;font-size:10px;cursor:pointer;border-radius:4px;" onclick="window.__zg_toggleMinimize(event)">' +
                    '<span style="display:flex;align-items:center;gap:4px;">📊 <span>ZIGZAG STATS</span></span>' +
                    '<div style="display:flex;align-items:center;gap:6px;margin-left:8px;">' +
                    '<span style="color:#00E676;font-size:13px;padding:0 3px;" title="Maximize">＋</span>' +
                    '<span onclick="window.__zg_disableStats(event)" style="color:#888;font-size:12px;padding:0 3px;" title="Close & Disable">✕</span>' +
                    '</div></div>';
                container.appendChild(overlay);
                return;
            }

            var dirColors = { 2: "#4CAF50", 1: "#FF9800", "-1": "#00E676", "-2": "#F44336" };
            var dirLabels = { 2: "⇈", 1: "↑", "-1": "↓", "-2": "⇊" };

            var html = '<div style="display:flex;justify-content:space-between;align-items:center;background:#000;color:#fff;padding:4px 8px;font-weight:bold;font-size:10px;border-bottom:1px solid #434651;">' +
                '<span>ZIGZAG DIVERGENCE STATS</span>' +
                '<div style="display:flex;gap:6px;align-items:center;">' +
                '<span onclick="window.__zg_toggleMinimize(event)" style="cursor:pointer;color:#bbb;font-size:13px;font-weight:bold;padding:0 3px;" title="Minimize">−</span>' +
                '<span onclick="window.__zg_disableStats(event)" style="cursor:pointer;color:#888;font-size:12px;padding:0 3px;" title="Close & Disable">✕</span>' +
                '</div></div>' +
                '<table style="border-collapse:collapse;width:100%;text-align:center;font-size:11px;">' +
                '<tr style="background:#000;color:#fff;font-weight:bold;"><th style="padding:4px 6px;">Bar Time</th><th style="padding:4px 6px;">Price</th><th style="padding:4px 6px;">Oscillator</th><th style="padding:4px 6px;">Trend</th><th style="padding:4px 6px;">Sentiment</th></tr>';

            var count = 0;
            for (var i = startIndex; i < Math.min(pDirs.length, startIndex + maxRows); i++) {
                var pBar = this.pZigzagPivotBars[i], pd = pDirs[i], od = this.opZigzagPivotDirs[i];
                var sd = this.supertrendDirHistory[pBar] || 1;

                var div = 0;
                if (pd === od) div = ((pd % 2 === 0 && (pd / 2) === sd) || (pd % 2 !== 0 && pd !== sd)) ? 1 : 0;
                else if (pd === 2 * od && od === sd) div = -1;
                else if (2 * pd === od && pd === -sd) div = -2;

                if (!cfg.showIndeterminate && div === 0) continue;
                if (!cfg.showContinuation && div === 1) continue;
                if (!cfg.showDivergence && div === -1) continue;
                if (!cfg.showHiddenDivergence && div === -2) continue;

                var b = (pd === 2 && od === 2) ? 1 : ((pd === -2 && od === -2) ? -1 : (pd > 0 ? -1 : (pd < 0 ? 1 : 0)));
                var sCol = (div === 1) ? (b === 1 ? "#4CAF50" : "#F44336") : ((div === -1 || div === -2) ? (b === 1 ? "#00E676" : "#FF9800") : "#B2B5BE");
                var sSym = (div === 0) ? "▣" : (b > 0 ? (div === 1 ? "⬆" : (div === -1 ? "⤴" : (div === -2 ? "↗" : "⤮"))) : (div === 1 ? "⬇" : (div === -1 ? "⤵" : (div === -2 ? "↘" : "⤭"))));

                var dt = new Date(this.barTimes[pBar] * 1000 || Date.now());
                var tStr = dt.getFullYear() + "/" + String(dt.getMonth() + 1).padStart(2, "0") + "/" + String(dt.getDate()).padStart(2, "0") + "-" + String(dt.getHours()).padStart(2, "0") + ":" + String(dt.getMinutes()).padStart(2, "0");

                var pCol = dirColors[pd] || "#B2B5BE", oCol = dirColors[od] || "#B2B5BE";
                html += '<tr style="border-bottom:1px solid #2a2e39;">' +
                    '<td style="padding:3px 6px;background:' + pCol + ';color:#000;font-weight:bold;">' + tStr + '</td>' +
                    '<td style="padding:3px 6px;background:' + pCol + ';color:#000;font-weight:bold;">' + (dirLabels[pd] || "NA") + '</td>' +
                    '<td style="padding:3px 6px;background:' + oCol + ';color:#000;font-weight:bold;">' + (dirLabels[od] || "NA") + '</td>' +
                    '<td style="padding:3px 6px;background:' + (sd > 0 ? "#4CAF50" : "#F44336") + ';color:#fff;font-weight:bold;">' + (sd > 0 ? "⇑" : "⇓") + '</td>' +
                    '<td style="padding:3px 6px;background:' + sCol + ';color:#000;font-weight:bold;">' + sSym + '</td></tr>';
                count++;
            }
            if (!count) html += '<tr><td colspan="5" style="padding:8px;color:#888;">No divergence pivots</td></tr>';
            html += '</table>';
            overlay.innerHTML = html;
            container.appendChild(overlay);
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
                this.closes = [];
                this.highs = [];
                this.lows = [];
                this.rmaTr = NaN;
                this.rmaGain = NaN;
                this.rmaLoss = NaN;
                this.stDir = 1;
                this.stBuyStop = NaN;
                this.stSellStop = NaN;
                this.supertrendDirHistory = [];
                this.pZigzagPivots = [];
                this.pZigzagPivotBars = [];
                this.pZigzagPivotDirs = [];
                this.opZigzagPivots = [];
                this.opZigzagPivotDirs = [];
                this.pZigzagLines = [];
                this.pZigzagLabels = [];
            }

            if (this.bars.length > bar_index) {
                this.bars.length = bar_index;
                this.barTimes.length = bar_index;
                this.closes.length = bar_index;
                this.highs.length = bar_index;
                this.lows.length = bar_index;
                this.supertrendDirHistory.length = bar_index;
            }

            this.bars[bar_index] = { open: open, high: high, low: low, close: close, time: timeSec };
            this.barTimes[bar_index] = timeSec;
            this.closes[bar_index] = close;
            this.highs[bar_index] = high;
            this.lows[bar_index] = low;

            var getInp = function (idx, def) { var v = inputCallback(idx); return v !== undefined ? v : def; };
            var useClose = getInp(0, true), waitConf = getInp(1, false);
            var pZzLen = Math.max(3, Math.round(Number(getInp(2, 5))));
            var pZzCol = getInp(3, "#FBC02D"), oscSrc = getInp(4, "RSI");
            var oscLen = Math.max(1, Math.round(Number(getInp(5, 22))));
            var stHist = Math.max(1, Math.round(Number(getInp(9, 4))));
            var atrLen = Math.max(1, Math.round(Number(getInp(10, 22))));
            var atrMult = Number(getInp(11, 1.0));
            var colorCandles = Boolean(getInp(12, true)), showSt = Boolean(getInp(13, true));
            var showTable = Boolean(getInp(14, true)), maxRows = Math.max(5, Math.round(Number(getInp(15, 10))));

            this._cfg = {
                useClose: useClose, waitForConfirmation: waitConf, pZigzagLength: pZzLen, pZigzagColor: pZzCol,
                showSupertrend: showSt, colorCandles: colorCandles, showStatTable: showTable, max_array_size: maxRows,
                showContinuation: Boolean(getInp(17, true)), showIndeterminate: Boolean(getInp(18, true)),
                showDivergence: Boolean(getInp(19, true)), showHiddenDivergence: Boolean(getInp(20, true))
            };

            var prevClose = bar_index > 0 ? this.closes[bar_index - 1] : close;

            // 1. Wilder's RMA ATR
            var tr = bar_index === 0 ? (high - low) : Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
            this.rmaTr = isNaN(this.rmaTr) ? tr : ((tr + (atrLen - 1) * this.rmaTr) / atrLen);
            var atrVal = this.rmaTr;
            this.lastAtr = atrVal;

            // 2. Wilder's RMA RSI (or Close fallback)
            var change = bar_index > 0 ? (close - prevClose) : 0;
            var gain = Math.max(change, 0), loss = Math.max(-change, 0);
            this.rmaGain = isNaN(this.rmaGain) ? gain : ((gain + (oscLen - 1) * this.rmaGain) / oscLen);
            this.rmaLoss = isNaN(this.rmaLoss) ? loss : ((loss + (oscLen - 1) * this.rmaLoss) / oscLen);
            var rsiVal = (this.rmaLoss === 0) ? 100 : (this.rmaGain === 0 ? 0 : (100 - (100 / (1 + this.rmaGain / this.rmaLoss))));
            var oscillator = (oscSrc === "RSI" && !isNaN(rsiVal)) ? rsiVal : close;

            // 3. Supertrend Trailing Stop (Pine lines 88-106)
            var dir = this.stDir, buyStop = this.stBuyStop, sellStop = this.stSellStop;
            var tail = this.pZigzagPivots.length > 1 + stHist ? this.pZigzagPivots.slice(1, 1 + stHist) : [];
            var highest = tail.length > 0 ? Math.max.apply(null, tail) : NaN;
            var lowest = tail.length > 0 ? Math.min.apply(null, tail) : NaN;
            var atrDiff = atrVal * atrMult;
            var newBuyStop = isNaN(lowest) ? NaN : (lowest - atrDiff);
            var newSellStop = isNaN(highest) ? NaN : (highest + atrDiff);

            var newDir = (dir > 0 && !isNaN(buyStop) && prevClose < buyStop) ? -1 : ((dir < 0 && !isNaN(sellStop) && prevClose > sellStop) ? 1 : dir);
            if (newDir > 0) newBuyStop = (!isNaN(buyStop) && !isNaN(newBuyStop)) ? Math.max(buyStop, newBuyStop) : (!isNaN(newBuyStop) ? newBuyStop : buyStop);
            if (newDir < 0) newSellStop = (!isNaN(sellStop) && !isNaN(newSellStop)) ? Math.min(sellStop, newSellStop) : (!isNaN(newSellStop) ? newSellStop : sellStop);

            this.stDir = newDir;
            this.stBuyStop = newBuyStop;
            this.stSellStop = newSellStop;
            this.supertrendDirHistory[bar_index] = newDir;
            var supertrendDir = newDir;
            var stopVal = supertrendDir > 0 ? newBuyStop : newSellStop;

            // 4. Pivots (Pine lines 113-118)
            var highsrc = useClose ? close : high, lowsrc = useClose ? close : low;
            var isH = true, isL = true;
            var pStart = Math.max(0, bar_index - pZzLen + 1);
            for (var k = pStart; k <= bar_index; k++) {
                if ((useClose ? this.closes[k] : this.highs[k]) > highsrc) isH = false;
                if ((useClose ? this.closes[k] : this.lows[k]) < lowsrc) isL = false;
            }
            var phigh = isH ? highsrc : null, plow = isL ? lowsrc : null;

            // 5. ZigZag Core (Pine lines 136-170)
            var startIndex = waitConf ? 1 : 0;
            var maxItems = maxRows + startIndex;
            var self = this;

            function addnewpivot(val, othVal, bar, d) {
                var nDir = d, oDir = d;
                if (self.pZigzagPivots.length >= 2) {
                    nDir = (d * val > d * self.pZigzagPivots[1]) ? (d * 2) : d;
                    oDir = (d * othVal > d * self.opZigzagPivots[1]) ? (d * 2) : d;
                }
                self.pZigzagPivots.unshift(val); if (self.pZigzagPivots.length > maxItems) self.pZigzagPivots.pop();
                self.pZigzagPivotBars.unshift(bar); if (self.pZigzagPivotBars.length > maxItems) self.pZigzagPivotBars.pop();
                self.pZigzagPivotDirs.unshift(nDir); if (self.pZigzagPivotDirs.length > maxItems) self.pZigzagPivotDirs.pop();
                self.opZigzagPivots.unshift(othVal); if (self.opZigzagPivots.length > maxItems) self.opZigzagPivots.pop();
                self.opZigzagPivotDirs.unshift(oDir); if (self.opZigzagPivotDirs.length > maxItems) self.opZigzagPivotDirs.pop();
            }

            var pDir = 1, newZG = false, doubleZG = (phigh !== null && plow !== null);
            if (this.pZigzagPivots.length >= 1) {
                pDir = this.pZigzagPivotDirs[0];
                pDir = (pDir % 2 === 0) ? (pDir / 2) : pDir;
            }

            if (((pDir === 1 && phigh !== null) || (pDir === -1 && plow !== null)) && this.pZigzagPivots.length >= 1) {
                var pivot = this.pZigzagPivots.shift();
                var pivotbar = this.pZigzagPivotBars.shift();
                var pivotdir = this.pZigzagPivotDirs.shift();
                var otherVal = this.opZigzagPivots.shift();
                this.opZigzagPivotDirs.shift();

                var valCand = (pDir === 1) ? phigh : plow;
                var useNew = (valCand * pivotdir > pivot * pivotdir);
                newZG = newZG || useNew;
                addnewpivot(useNew ? valCand : pivot, useNew ? oscillator : otherVal, useNew ? bar_index : pivotbar, pDir);
            }

            if ((pDir === 1 && plow !== null) || (pDir === -1 && phigh !== null)) {
                newZG = true;
                addnewpivot((pDir === 1) ? plow : phigh, oscillator, bar_index, (pDir === 1) ? -1 : 1);
            }

            // 6. Divergence & Drawing Lines (Pine lines 183-225)
            function drawZgLine(idx1, idx2) {
                if (self.pZigzagPivots.length > idx2) {
                    var y1 = self.pZigzagPivots[idx1], y2 = self.pZigzagPivots[idx2];
                    var x1 = self.pZigzagPivotBars[idx1], x2 = self.pZigzagPivotBars[idx2];
                    var pd = self.pZigzagPivotDirs[idx1], od = self.opZigzagPivotDirs[idx1];
                    var sd = self.supertrendDirHistory[x1] || 1;

                    var div = 0;
                    if (pd === od) div = ((pd % 2 === 0 && (pd / 2) === sd) || (pd % 2 !== 0 && pd !== sd)) ? 1 : 0;
                    else if (pd === 2 * od && od === sd) div = -1;
                    else if (2 * pd === od && pd === -sd) div = -2;

                    var dId = (div === 1) ? "C" : ((div === -1) ? "D" : ((div === -2) ? "H" : "I"));
                    var b = (pd === 2 && od === 2) ? 1 : ((pd === -2 && od === -2) ? -1 : (pd > 0 ? -1 : (pd < 0 ? 1 : 0)));
                    var sCol = (div === 1) ? (b === 1 ? "#4CAF50" : "#F44336") : ((div === -1 || div === -2) ? (b === 1 ? "#00E676" : "#FF9800") : "#B2B5BE");

                    if (self.pZigzagLines.length >= 1 && x2 === self.pZigzagLines[0].x2 && y2 === self.pZigzagLines[0].y2) {
                        self.pZigzagLines.shift();
                        self.pZigzagLabels.shift();
                    }
                    self.pZigzagLines.unshift({ x1: x1, y1: y1, x2: x2, y2: y2 });
                    self.pZigzagLabels.unshift({ x: x1, y: y1, text: dId, div: div, pDir: pd, color: sCol });

                    if (self.pZigzagLines.length > 50) {
                        self.pZigzagLines.pop();
                        self.pZigzagLabels.pop();
                    }
                }
            }

            if (newZG) {
                if (doubleZG) drawZgLine(startIndex + 1, startIndex + 2);
                if (this.pZigzagPivots.length >= startIndex + 2) drawZgLine(startIndex, startIndex + 1);
            }

            if (typeof setTimeout !== "undefined") {
                if (this._renderTimer) clearTimeout(this._renderTimer);
                var selfTimer = this;
                this._renderTimer = setTimeout(function () {
                    if (!selfTimer._isDestroyed) selfTimer.renderDrawings();
                }, 100);
            }

            var stVal = (showSt && !isNaN(stopVal)) ? stopVal : NaN;
            var trendColorIdx = isNaN(stVal) ? NaN : (supertrendDir > 0 ? 0 : 1);
            var barColorVal = colorCandles ? (supertrendDir > 0 ? 1 : 2) : NaN;

            return [stVal, trendColorIdx, barColorVal];
        };
    }
})
