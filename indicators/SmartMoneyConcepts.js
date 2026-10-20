// Smart Money Concepts [LuxAlgo] - 100% Exact JavaScript Port
// Converted directly from tv_frontend/pinecode/SmartMoneyConcepts.pine with 40k+ Candle Performance Optimization
({
    name: "Smart Money Concepts",
    metainfo: {
        _metainfoVersion: 52,
        isTVScript: false,
        is_hidden_study: false,
        is_price_study: true,
        isCustomIndicator: true,
        format: { precision: 2, type: "price" },
        id: "SmartMoneyConcepts@tv-basicstudies-1",
        scriptIdPart: "",
        name: "Smart Money Concepts",
        description: "Smart Money Concepts",
        shortDescription: "SMC",
        defaults: {
            styles: {
                plot_candle: { plottype: 0, linewidth: 1, color: "#089981", trackPrice: false }
            },
            inputs: {
                in_0: "Historical",          // Mode
                in_1: "Colored",             // Style
                in_2: false,                 // Color Candles
                in_3: true,                  // Show Internal Structure
                in_4: "All",                 // Bullish Structure
                in_5: "#089981",             // Bullish Structure Color
                in_6: "All",                 // Bearish Structure
                in_7: "#F23645",             // Bearish Structure Color
                in_8: false,                 // Confluence Filter
                in_9: "tiny",                // Internal Label Size
                in_10: true,                 // Show Swing Structure
                in_11: "All",                // Swing Bullish Structure
                in_12: "#089981",            // Swing Bullish Color
                in_13: "All",                // Swing Bearish Structure
                in_14: "#F23645",            // Swing Bearish Color
                in_15: "small",              // Swing Label Size
                in_16: false,                // Show Swings Points
                in_17: 50,                   // Swings Length
                in_18: true,                 // Show Strong/Weak High/Low
                in_19: true,                 // Internal Order Blocks
                in_20: 5,                    // Internal Order Blocks Size
                in_21: false,                // Swing Order Blocks
                in_22: 5,                    // Swing Order Blocks Size
                in_23: "Atr",                // Order Block Filter
                in_24: "High/Low",           // Order Block Mitigation
                in_25: "rgba(49, 121, 245, 0.2)",  // Internal Bullish OB
                in_26: "rgba(247, 124, 128, 0.2)", // Internal Bearish OB
                in_27: "rgba(24, 72, 204, 0.2)",   // Bullish OB
                in_28: "rgba(178, 40, 51, 0.2)",   // Bearish OB
                in_29: true,                 // Equal High/Low
                in_30: 3,                    // Bars Confirmation
                in_31: 0.1,                  // Threshold
                in_32: "tiny",               // EQ Label Size
                in_33: false,                // Fair Value Gaps
                in_34: true,                 // Auto Threshold
                in_35: "Chart",              // FVG Timeframe
                in_36: "rgba(0, 255, 104, 0.3)",   // Bullish FVG
                in_37: "rgba(255, 0, 8, 0.3)",     // Bearish FVG
                in_38: 1,                    // Extend FVG
                in_39: false,                // Daily Levels
                in_40: "⎯⎯⎯",                // Daily Style
                in_41: "#2157f3",            // Daily Color
                in_42: false,                // Weekly Levels
                in_43: "⎯⎯⎯",                // Weekly Style
                in_44: "#2157f3",            // Weekly Color
                in_45: false,                // Monthly Levels
                in_46: "⎯⎯⎯",                // Monthly Style
                in_47: "#2157f3",            // Monthly Color
                in_48: false,                // Premium/Discount Zones
                in_49: "#F23645",            // Premium Zone Color
                in_50: "#878b94",            // Equilibrium Zone Color
                in_51: "#089981",            // Discount Zone Color
                in_52: "Full History (up to 40k+ candles)", // Plotting Mode
                in_53: 40000                 // Max Candles to Plot
            }
        },
        plots: [
            { id: "plot_candle", type: "line" }
        ],
        styles: {
            plot_candle: { title: "PlotCandle", histogramBase: 0 }
        },
        inputs: [
            // ================= SMART MONEY CONCEPTS =================
            { id: "in_0", name: "Mode", defval: "Historical", type: "text", options: ["Historical", "Present"], group: "Smart Money Concepts", tooltip: "Allows to display historical Structure or only the recent ones" },
            { id: "in_1", name: "Style", defval: "Colored", type: "text", options: ["Colored", "Monochrome"], group: "Smart Money Concepts", tooltip: "Indicator color theme" },
            { id: "in_2", name: "Color Candles", defval: false, type: "bool", group: "Smart Money Concepts", tooltip: "Display additional candles with a color reflecting the current trend detected by structure" },

            // ================= REAL TIME INTERNAL STRUCTURE =================
            { id: "in_3", name: "Show Internal Structure", defval: true, type: "bool", group: "Real Time Internal Structure", tooltip: "Display internal market structure" },
            { id: "in_4", name: "Bullish Structure", defval: "All", type: "text", options: ["All", "BOS", "CHoCH"], group: "Real Time Internal Structure", inline: "ibull" },
            { id: "in_5", name: "", defval: "#089981", type: "color", group: "Real Time Internal Structure", inline: "ibull" },
            { id: "in_6", name: "Bearish Structure", defval: "All", type: "text", options: ["All", "BOS", "CHoCH"], group: "Real Time Internal Structure", inline: "ibear" },
            { id: "in_7", name: "", defval: "#F23645", type: "color", group: "Real Time Internal Structure", inline: "ibear" },
            { id: "in_8", name: "Confluence Filter", defval: false, type: "bool", group: "Real Time Internal Structure", tooltip: "Filter non significant internal structure breakouts" },
            { id: "in_9", name: "Internal Label Size", defval: "tiny", type: "text", options: ["tiny", "small", "normal"], group: "Real Time Internal Structure" },

            // ================= REAL TIME SWING STRUCTURE =================
            { id: "in_10", name: "Show Swing Structure", defval: true, type: "bool", group: "Real Time Swing Structure", tooltip: "Display swing market Structure" },
            { id: "in_11", name: "Bullish Structure", defval: "All", type: "text", options: ["All", "BOS", "CHoCH"], group: "Real Time Swing Structure", inline: "bull" },
            { id: "in_12", name: "", defval: "#089981", type: "color", group: "Real Time Swing Structure", inline: "bull" },
            { id: "in_13", name: "Bearish Structure", defval: "All", type: "text", options: ["All", "BOS", "CHoCH"], group: "Real Time Swing Structure", inline: "bear" },
            { id: "in_14", name: "", defval: "#F23645", type: "color", group: "Real Time Swing Structure", inline: "bear" },
            { id: "in_15", name: "Swing Label Size", defval: "small", type: "text", options: ["tiny", "small", "normal"], group: "Real Time Swing Structure" },
            { id: "in_16", name: "Show Swings Points", defval: false, type: "bool", group: "Real Time Swing Structure", tooltip: "Display swing point as labels on the chart", inline: "swings" },
            { id: "in_17", name: "", defval: 50, type: "integer", min: 10, group: "Real Time Swing Structure", inline: "swings" },
            { id: "in_18", name: "Show Strong/Weak High/Low", defval: true, type: "bool", group: "Real Time Swing Structure", tooltip: "Highlight most recent strong and weak high/low points on the chart" },

            // ================= ORDER BLOCKS =================
            { id: "in_19", name: "Internal Order Blocks", defval: true, type: "bool", group: "Order Blocks", tooltip: "Display internal order blocks on the chart\n\nNumber of internal order blocks to display on the chart", inline: "iob" },
            { id: "in_20", name: "", defval: 5, type: "integer", min: 1, max: 20, group: "Order Blocks", inline: "iob" },
            { id: "in_21", name: "Swing Order Blocks", defval: false, type: "bool", group: "Order Blocks", tooltip: "Display swing order blocks on the chart\n\nNumber of internal swing blocks to display on the chart", inline: "ob" },
            { id: "in_22", name: "", defval: 5, type: "integer", min: 1, max: 20, group: "Order Blocks", inline: "ob" },
            { id: "in_23", name: "Order Block Filter", defval: "Atr", type: "text", options: ["Atr", "Cumulative Mean Range"], group: "Order Blocks", tooltip: "Method used to filter out volatile order blocks \n\nIt is recommended to use the cumulative mean range method when a low amount of data is available" },
            { id: "in_24", name: "Order Block Mitigation", defval: "High/Low", type: "text", options: ["High/Low", "Close"], group: "Order Blocks", tooltip: "Select what values to use for order block mitigation" },
            { id: "in_25", name: "Internal Bullish OB", defval: "rgba(49, 121, 245, 0.2)", type: "color", group: "Order Blocks" },
            { id: "in_26", name: "Internal Bearish OB", defval: "rgba(247, 124, 128, 0.2)", type: "color", group: "Order Blocks" },
            { id: "in_27", name: "Bullish OB", defval: "rgba(24, 72, 204, 0.2)", type: "color", group: "Order Blocks" },
            { id: "in_28", name: "Bearish OB", defval: "rgba(178, 40, 51, 0.2)", type: "color", group: "Order Blocks" },

            // ================= EQH/EQL =================
            { id: "in_29", name: "Equal High/Low", defval: true, type: "bool", group: "EQH/EQL", tooltip: "Display equal highs and equal lows on the chart" },
            { id: "in_30", name: "Bars Confirmation", defval: 3, type: "integer", min: 1, group: "EQH/EQL", tooltip: "Number of bars used to confirm equal highs and equal lows" },
            { id: "in_31", name: "Threshold", defval: 0.1, type: "float", min: 0, max: 0.5, step: 0.1, group: "EQH/EQL", tooltip: "Sensitivity threshold in a range (0, 1) used for the detection of equal highs & lows\n\nLower values will return fewer but more pertinent results" },
            { id: "in_32", name: "Label Size", defval: "tiny", type: "text", options: ["tiny", "small", "normal"], group: "EQH/EQL" },

            // ================= FAIR VALUE GAPS =================
            { id: "in_33", name: "Fair Value Gaps", defval: false, type: "bool", group: "Fair Value Gaps", tooltip: "Display fair values gaps on the chart" },
            { id: "in_34", name: "Auto Threshold", defval: true, type: "bool", group: "Fair Value Gaps", tooltip: "Filter out non significant fair value gaps" },
            { id: "in_35", name: "Timeframe", defval: "Chart", type: "text", options: ["Chart", "1", "3", "5", "15", "30", "60", "240", "1D"], group: "Fair Value Gaps", tooltip: "Fair value gaps timeframe" },
            { id: "in_36", name: "Bullish FVG", defval: "rgba(0, 255, 104, 0.3)", type: "color", group: "Fair Value Gaps" },
            { id: "in_37", name: "Bearish FVG", defval: "rgba(255, 0, 8, 0.3)", type: "color", group: "Fair Value Gaps" },
            { id: "in_38", name: "Extend FVG", defval: 1, type: "integer", min: 0, group: "Fair Value Gaps", tooltip: "Determine how many bars to extend the Fair Value Gap boxes on chart" },

            // ================= HIGHS & LOWS MTF =================
            { id: "in_39", name: "Daily", defval: false, type: "bool", group: "Highs & Lows MTF", inline: "daily" },
            { id: "in_40", name: "", defval: "⎯⎯⎯", type: "text", options: ["⎯⎯⎯", "----", "····"], group: "Highs & Lows MTF", inline: "daily" },
            { id: "in_41", name: "", defval: "#2157f3", type: "color", group: "Highs & Lows MTF", inline: "daily" },

            { id: "in_42", name: "Weekly", defval: false, type: "bool", group: "Highs & Lows MTF", inline: "weekly" },
            { id: "in_43", name: "", defval: "⎯⎯⎯", type: "text", options: ["⎯⎯⎯", "----", "····"], group: "Highs & Lows MTF", inline: "weekly" },
            { id: "in_44", name: "", defval: "#2157f3", type: "color", group: "Highs & Lows MTF", inline: "weekly" },

            { id: "in_45", name: "Monthly", defval: false, type: "bool", group: "Highs & Lows MTF", inline: "monthly" },
            { id: "in_46", name: "", defval: "⎯⎯⎯", type: "text", options: ["⎯⎯⎯", "----", "····"], group: "Highs & Lows MTF", inline: "monthly" },
            { id: "in_47", name: "", defval: "#2157f3", type: "color", group: "Highs & Lows MTF", inline: "monthly" },

            // ================= PREMIUM & DISCOUNT ZONES =================
            { id: "in_48", name: "Premium/Discount Zones", defval: false, type: "bool", group: "Premium & Discount Zones", tooltip: "Display premium, discount, and equilibrium zones on chart" },
            { id: "in_49", name: "Premium Zone", defval: "#F23645", type: "color", group: "Premium & Discount Zones" },
            { id: "in_50", name: "Equilibrium Zone", defval: "#878b94", type: "color", group: "Premium & Discount Zones" },
            { id: "in_51", name: "Discount Zone", defval: "#089981", type: "color", group: "Premium & Discount Zones" },

            // ================= DISPLAY & PERFORMANCE (40K+ CANDLE SUPPORT) =================
            { id: "in_52", name: "Plotting Mode", defval: "Full History (up to 40k+ candles)", type: "text", options: ["Full History (up to 40k+ candles)", "Visible Chart Only", "Custom Candle Limit"], group: "Display & Performance", tooltip: "Choose how much history to plot. 'Full History' plots all history shown on chart up to 40k+ candles." },
            { id: "in_53", name: "Max Candles to Plot", defval: 40000, type: "integer", min: 50, max: 100000, group: "Display & Performance", tooltip: "Maximum number of historical candles to plot structures for (e.g. 500, 2000, 40000, etc.)" }
        ]
    },
    constructor: function () {
        this.init = function (ctx, get_input) {
            this._context = ctx;
            this._input = get_input;
            this._isDestroyed = false;
            this._subscribedVis = false;
            this._subscribedVisEvent = false;
            this._subscribedVisibleRange = false;
            this._cachedStudyInfo = null;
            this._studyEverFound = false;
            this._heartbeatStarted = false;
            if (this._heartbeatInterval) {
                clearInterval(this._heartbeatInterval);
                this._heartbeatInterval = null;
            }
            this._drawnShapeIds = [];
            this.clearDrawings();

            // Historical bar series
            this.highs = [];
            this.lows = [];
            this.opens = [];
            this.closes = [];
            this.times = [];
            this.parsedHighs = [];
            this.parsedLows = [];
            this.trHistory = [];
            this.cumTr = 0;
            this.atrHistory = [];

            // Legs states
            this.legSwing = 0;
            this.prevLegSwing = 0;
            this.legInternal = 0;
            this.prevLegInternal = 0;
            this.legEqual = 0;
            this.prevLegEqual = 0;

            // Pivots
            this.swingHigh = { currentLevel: NaN, lastLevel: NaN, crossed: false, barTime: 0, barIndex: 0 };
            this.swingLow = { currentLevel: NaN, lastLevel: NaN, crossed: false, barTime: 0, barIndex: 0 };
            this.internalHigh = { currentLevel: NaN, lastLevel: NaN, crossed: false, barTime: 0, barIndex: 0 };
            this.internalLow = { currentLevel: NaN, lastLevel: NaN, crossed: false, barTime: 0, barIndex: 0 };
            this.equalHigh = { currentLevel: NaN, lastLevel: NaN, crossed: false, barTime: 0, barIndex: 0 };
            this.equalLow = { currentLevel: NaN, lastLevel: NaN, crossed: false, barTime: 0, barIndex: 0 };

            // Trend Biases: +1 Bullish, -1 Bearish, 0 Initial
            this.swingTrend = 0;
            this.internalTrend = 0;

            // Trailing Extremes
            this.trailing = { top: -Infinity, bottom: Infinity, barTime: 0, barIndex: 0, lastTopTime: 0, lastBottomTime: 0 };

            // Storage for Structures & Order Blocks
            this.breakouts = [];
            this.equalHighsLows = [];
            this.swingLabels = [];
            this.swingOrderBlocks = [];
            this.internalOrderBlocks = [];
            this.fairValueGaps = [];

            this.prevClose = NaN;
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
            this.highs = [];
            this.lows = [];
            this.opens = [];
            this.closes = [];
            this.times = [];
            this.parsedHighs = [];
            this.parsedLows = [];
            this.atrHistory = [];
            this.breakouts = [];
            this.equalHighsLows = [];
            this.swingLabels = [];
            this.swingOrderBlocks = [];
            this.internalOrderBlocks = [];
            this.fairValueGaps = [];
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
                    return n.indexOf("smart money concepts") !== -1 ||
                           d.indexOf("smart money concepts") !== -1 ||
                           i.indexOf("smartmoneyconcepts") !== -1 ||
                           (n.indexOf("smc") !== -1 && n.indexOf("debug") === -1);
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
            if (typeof window !== "undefined" && window.__smc_drawnShapeIds) {
                idsToRemove = idsToRemove.concat(window.__smc_drawnShapeIds);
                window.__smc_drawnShapeIds = [];
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
            if (!hex) return "rgba(135, 139, 148, " + alpha + ")";
            if (String(hex).indexOf("rgba") === 0 || String(hex).indexOf("rgb") === 0) return hex;
            var c = hex.replace("#", "");
            if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
            var num = parseInt(c, 16);
            if (isNaN(num)) return hex;
            var r = (num >> 16) & 255;
            var g = (num >> 8) & 255;
            var b = num & 255;
            return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")";
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

            // Visibility subscription setup
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

            // Visible Range Subscription for Dynamic 40k+ Pan/Zoom Rendering
            if (chart && !this._subscribedVisibleRange && typeof chart.onVisibleRangeChanged === "function") {
                try {
                    var vrEv = chart.onVisibleRangeChanged();
                    if (vrEv && typeof vrEv.subscribe === "function") {
                        this._subscribedVisibleRange = true;
                        vrEv.subscribe(this, function () {
                            if (self._renderTimer) clearTimeout(self._renderTimer);
                            self._renderTimer = setTimeout(function () {
                                if (!self._isDestroyed) self.renderDrawings();
                            }, 80);
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
                                var sName = (sts[k].name || "").toLowerCase();
                                var sDesc = (sts[k].description || "").toLowerCase();
                                var sId = (sts[k].id || "").toLowerCase();
                                if (sName.indexOf("smart money concepts") !== -1 ||
                                    sDesc.indexOf("smart money concepts") !== -1 ||
                                    sId.indexOf("smartmoneyconcepts") !== -1 ||
                                    (sName.indexOf("smc") !== -1 && sName.indexOf("debug") === -1)) {
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

            var times = this.times || [];
            var totalBars = times.length;
            if (totalBars < 2) return;

            var timeDiff = (times[totalBars - 1] - times[0]) / Math.max(1, totalBars - 1);
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
                        window.__smc_drawnShapeIds = window.__smc_drawnShapeIds || [];
                        window.__smc_drawnShapeIds.push(sid);
                    }
                }
                if (typeof res.then === "function") {
                    res.then(recordId).catch(function () {});
                } else {
                    recordId(res);
                }
            }

            var isDark = (typeof document !== "undefined" && document.body && (document.body.classList.contains("theme-dark") || document.body.getAttribute("data-theme") === "dark")) || false;
            var fgColor = isDark ? "#d1d4dc" : "#131722";

            var isMonochrome = (this._style === "Monochrome");
            var isPresentMode = (this._mode === "Present");

            var swingBullColor = isMonochrome ? "#b2b5be" : (this._swingBullColor || "#089981");
            var swingBearColor = isMonochrome ? "#5d606b" : (this._swingBearColor || "#F23645");
            var internalBullColor = isMonochrome ? "#b2b5be" : (this._internalBullColor || "#089981");
            var internalBearColor = isMonochrome ? "#5d606b" : (this._internalBearColor || "#F23645");

            function getLabelFontSize(sz) {
                var s = String(sz || "").toLowerCase();
                if (s === "tiny") return 9;
                if (s === "normal") return 12;
                return 10; // small
            }
            var intFSize = getLabelFontSize(this._internalSize);
            var swFSize = getLabelFontSize(this._swingSize);
            var eqFSize = getLabelFontSize(this._equalSize);

            // ==========================================
            // 40K+ CANDLE & VIEWPORT RANGE FILTERING
            // ==========================================
            var plotMode = this._plotMode || "Full History (up to 40k+ candles)";
            var maxCandlesLimit = Math.max(50, this._maxCandles || 40000);

            var startLimitTime = 0;
            var endLimitTime = Infinity;

            if (plotMode === "Custom Candle Limit") {
                var startBarIdx = Math.max(0, totalBars - maxCandlesLimit);
                startLimitTime = times[startBarIdx] || 0;
            } else if (plotMode === "Visible Chart Only") {
                try {
                    if (typeof chart.getVisibleRange === "function") {
                        var vr = chart.getVisibleRange();
                        if (vr && vr.from && vr.to) {
                            startLimitTime = (vr.from > 1e11 ? vr.from / 1000 : vr.from) - 30 * timeDiff;
                            endLimitTime = (vr.to > 1e11 ? vr.to / 1000 : vr.to) + 30 * timeDiff;
                        }
                    }
                } catch (_) {}
            } else {
                // Full History mode: support up to 40,000+ candles
                var startFullBar = Math.max(0, totalBars - maxCandlesLimit);
                startLimitTime = times[startFullBar] || 0;
            }

            // ==========================================
            // 1. RENDER BREAKOUT STRUCTURES (BOS & CHoCH)
            // ==========================================
            var breakoutsToDraw = this.breakouts || [];
            if (isPresentMode && breakoutsToDraw.length > 0) {
                var latestIntBull = null, latestIntBear = null;
                var latestSwBull = null, latestSwBear = null;
                for (var bIdx = breakoutsToDraw.length - 1; bIdx >= 0; bIdx--) {
                    var bo = breakoutsToDraw[bIdx];
                    if (bo.internal) {
                        if (bo.bias === "BULLISH" && !latestIntBull) latestIntBull = bo;
                        if (bo.bias === "BEARISH" && !latestIntBear) latestIntBear = bo;
                    } else {
                        if (bo.bias === "BULLISH" && !latestSwBull) latestSwBull = bo;
                        if (bo.bias === "BEARISH" && !latestSwBear) latestSwBear = bo;
                    }
                }
                breakoutsToDraw = [];
                if (latestIntBull) breakoutsToDraw.push(latestIntBull);
                if (latestIntBear) breakoutsToDraw.push(latestIntBear);
                if (latestSwBull) breakoutsToDraw.push(latestSwBull);
                if (latestSwBear) breakoutsToDraw.push(latestSwBear);
            } else if (!isPresentMode) {
                // Filter by chosen candle limit / viewport
                var filteredBreakouts = [];
                for (var fI = 0; fI < breakoutsToDraw.length; fI++) {
                    var bItem = breakoutsToDraw[fI];
                    if (bItem.breakTime >= startLimitTime && bItem.pivotTime <= endLimitTime) {
                        filteredBreakouts.push(bItem);
                    }
                }
                // Cap to 250 visible line tools at a time for smooth 60fps rendering across 40k bars
                if (filteredBreakouts.length > 250) {
                    filteredBreakouts = filteredBreakouts.slice(filteredBreakouts.length - 250);
                }
                breakoutsToDraw = filteredBreakouts;
            }

            for (var i = 0; i < breakoutsToDraw.length; i++) {
                var brk = breakoutsToDraw[i];
                var tStart = brk.pivotTime;
                var tEnd = brk.breakTime;
                if (!tStart || !tEnd) continue;

                var isBull = (brk.bias === "BULLISH");
                var col = brk.internal ? (isBull ? internalBullColor : internalBearColor) : (isBull ? swingBullColor : swingBearColor);
                var fSize = brk.internal ? intFSize : swFSize;
                var lStyle = brk.internal ? 2 : 0; // 2=dashed, 0=solid
                var tMid = Math.round(tStart + 0.5 * (tEnd - tStart));

                // 1a. Horizontal Level Line
                try {
                    var lOpts = {
                        shape: "trend_line",
                        lock: true,
                        disableSelection: true,
                        disableSave: true,
                        disableUndo: true,
                        overrides: {
                            "linecolor": col,
                            "linewidth": 1,
                            "linestyle": lStyle,
                            "linetooltrendline.linecolor": col,
                            "linetooltrendline.linewidth": 1,
                            "linetooltrendline.linestyle": lStyle
                        }
                    };
                    if (studyId) lOpts.ownerStudyId = studyId;
                    track(chart.createMultipointShape([
                        { time: tStart, price: brk.level },
                        { time: tEnd, price: brk.level }
                    ], lOpts));
                } catch (_) {}

                // 1b. Badge Text Label at Midpoint ('BOS' or 'CHoCH')
                try {
                    var txtOpts = {
                        shape: "text",
                        text: brk.tag,
                        lock: true,
                        disableSelection: true,
                        disableSave: true,
                        disableUndo: true,
                        overrides: {
                            "color": col,
                            "textColor": col,
                            "fontsize": fSize,
                            "bold": true,
                            "fillBackground": false,
                            "backgroundColor": "rgba(0,0,0,0)",
                            "drawBorder": false,
                            "borderColor": "rgba(0,0,0,0)"
                        }
                    };
                    if (studyId) txtOpts.ownerStudyId = studyId;
                    track(chart.createShape({ time: tMid, price: brk.level }, txtOpts));
                } catch (_) {}
            }

            // ==========================================
            // 2. RENDER SWING POINTS ('HH', 'LH', 'HL', 'LL')
            // ==========================================
            if (this._showSwings && this.swingLabels && this.swingLabels.length > 0) {
                var swLabels = this.swingLabels;
                if (isPresentMode) {
                    swLabels = swLabels.slice(-4);
                } else {
                    var fSw = [];
                    for (var swI = 0; swI < swLabels.length; swI++) {
                        if (swLabels[swI].time >= startLimitTime && swLabels[swI].time <= endLimitTime) {
                            fSw.push(swLabels[swI]);
                        }
                    }
                    if (fSw.length > 100) fSw = fSw.slice(fSw.length - 100);
                    swLabels = fSw;
                }
                for (var sIdx = 0; sIdx < swLabels.length; sIdx++) {
                    var sl = swLabels[sIdx];
                    var sCol = (sl.tag === "HH" || sl.tag === "LH") ? swingBearColor : swingBullColor;
                    try {
                        var slOpts = {
                            shape: "text",
                            text: sl.tag,
                            lock: true,
                            disableSelection: true,
                            disableSave: true,
                            disableUndo: true,
                            overrides: {
                                "color": sCol,
                                "textColor": sCol,
                                "fontsize": 9,
                                "bold": true,
                                "fillBackground": false,
                                "backgroundColor": "rgba(0,0,0,0)",
                                "drawBorder": false,
                                "borderColor": "rgba(0,0,0,0)"
                            }
                        };
                        if (studyId) slOpts.ownerStudyId = studyId;
                        track(chart.createShape({ time: sl.time, price: sl.level }, slOpts));
                    } catch (_) {}
                }
            }

            // ==========================================
            // 3. RENDER EQUAL HIGHS & EQUAL LOWS (EQH / EQL)
            // ==========================================
            if (this._showEqual && this.equalHighsLows && this.equalHighsLows.length > 0) {
                var eqList = this.equalHighsLows;
                if (isPresentMode) {
                    eqList = eqList.slice(-2);
                } else {
                    var fEq = [];
                    for (var eqI = 0; eqI < eqList.length; eqI++) {
                        if (eqList[eqI].t2 >= startLimitTime && eqList[eqI].t1 <= endLimitTime) {
                            fEq.push(eqList[eqI]);
                        }
                    }
                    if (fEq.length > 50) fEq = fEq.slice(fEq.length - 50);
                    eqList = fEq;
                }
                for (var eIdx = 0; eIdx < eqList.length; eIdx++) {
                    var eq = eqList[eIdx];
                    var isEqh = (eq.tag === "EQH");
                    var eqCol = isEqh ? swingBearColor : swingBullColor;
                    var eqMidTime = Math.round(eq.t1 + 0.5 * (eq.t2 - eq.t1));

                    // Dotted line
                    try {
                        var eqLineOpts = {
                            shape: "trend_line",
                            lock: true,
                            disableSelection: true,
                            disableSave: true,
                            disableUndo: true,
                            overrides: {
                                "linecolor": eqCol,
                                "linewidth": 1,
                                "linestyle": 1, // dotted
                                "linetooltrendline.linecolor": eqCol,
                                "linetooltrendline.linewidth": 1,
                                "linetooltrendline.linestyle": 1
                            }
                        };
                        if (studyId) eqLineOpts.ownerStudyId = studyId;
                        track(chart.createMultipointShape([
                            { time: eq.t1, price: eq.level },
                            { time: eq.t2, price: eq.level }
                        ], eqLineOpts));
                    } catch (_) {}

                    // Label 'EQH' or 'EQL'
                    try {
                        var eqLabelOpts = {
                            shape: "text",
                            text: eq.tag,
                            lock: true,
                            disableSelection: true,
                            disableSave: true,
                            disableUndo: true,
                            overrides: {
                                "color": eqCol,
                                "textColor": eqCol,
                                "fontsize": eqFSize,
                                "bold": true,
                                "fillBackground": false,
                                "backgroundColor": "rgba(0,0,0,0)",
                                "drawBorder": false,
                                "borderColor": "rgba(0,0,0,0)"
                            }
                        };
                        if (studyId) eqLabelOpts.ownerStudyId = studyId;
                        track(chart.createShape({ time: eqMidTime, price: eq.level }, eqLabelOpts));
                    } catch (_) {}
                }
            }

            // ==========================================
            // 4. RENDER ORDER BLOCKS (Active / Unmitigated)
            // ==========================================
            var lastBarTime = times[totalBars - 1];
            var rightExtendBar = lastBarTime + 20 * timeDiff;

            function renderOrderBlockBoxes(obs, maxCount, isInternal) {
                if (!obs || obs.length === 0) return;
                var count = Math.min(maxCount, obs.length);
                for (var oIdx = 0; oIdx < count; oIdx++) {
                    var b = obs[oIdx];
                    var isBear = (b.bias === -1);
                    var bColor = "";
                    if (isMonochrome) {
                        bColor = isBear ? "rgba(93, 96, 107, 0.25)" : "rgba(178, 181, 190, 0.25)";
                    } else if (isInternal) {
                        bColor = isBear ? hexToRgba(self._intBearObColor || "rgba(247, 124, 128, 0.2)", 0.25) : hexToRgba(self._intBullObColor || "rgba(49, 121, 245, 0.2)", 0.25);
                    } else {
                        bColor = isBear ? hexToRgba(self._swBearObColor || "rgba(178, 40, 51, 0.2)", 0.25) : hexToRgba(self._swBullObColor || "rgba(24, 72, 204, 0.2)", 0.25);
                    }
                    var borderColor = isInternal ? "rgba(0,0,0,0)" : (isBear ? (self._swBearObColor || "#b22833") : (self._swBullObColor || "#1848cc"));
                    var drawBorders = !isInternal;

                    try {
                        var obOpts = {
                            shape: "rectangle",
                            lock: true,
                            disableSelection: true,
                            disableSave: true,
                            disableUndo: true,
                            overrides: {
                                "fillBackground": true,
                                "backgroundColor": bColor,
                                "backgroundTransparency": 75,
                                "drawBorder": drawBorders,
                                "borderColor": borderColor,
                                "color": borderColor,
                                "linewidth": 1,
                                "linetoolrectangle.fillBackground": true,
                                "linetoolrectangle.backgroundColor": bColor,
                                "linetoolrectangle.backgroundTransparency": 75,
                                "linetoolrectangle.drawBorder": drawBorders,
                                "linetoolrectangle.borderColor": borderColor,
                                "linetoolrectangle.color": borderColor,
                                "linetoolrectangle.linewidth": 1
                            }
                        };
                        if (studyId) obOpts.ownerStudyId = studyId;
                        track(chart.createMultipointShape([
                            { time: b.barTime, price: b.barHigh },
                            { time: rightExtendBar, price: b.barLow }
                        ], obOpts));
                    } catch (_) {}
                }
            }

            if (this._showInternalOB) {
                renderOrderBlockBoxes(this.internalOrderBlocks, this._intObSize, true);
            }
            if (this._showSwingOB) {
                renderOrderBlockBoxes(this.swingOrderBlocks, this._swObSize, false);
            }

            // ==========================================
            // 5. RENDER STRONG & WEAK HIGHS / LOWS
            // ==========================================
            if (this._showHighLowSwings && this.trailing && !isNaN(this.trailing.top) && !isNaN(this.trailing.bottom)) {
                var trTop = this.trailing.top;
                var trBtm = this.trailing.bottom;
                var tTopStart = this.trailing.lastTopTime || times[0];
                var tBtmStart = this.trailing.lastBottomTime || times[0];

                var topLabelText = (this.swingTrend === -1) ? "Strong High" : "Weak High";
                var btmLabelText = (this.swingTrend === 1) ? "Strong Low" : "Weak Low";

                // Top Line & Label
                try {
                    var shOpts = {
                        shape: "trend_line",
                        lock: true,
                        disableSelection: true,
                        disableSave: true,
                        disableUndo: true,
                        overrides: {
                            "linecolor": swingBearColor,
                            "linewidth": 1,
                            "linestyle": 0,
                            "linetooltrendline.linecolor": swingBearColor,
                            "linetooltrendline.linewidth": 1,
                            "linetooltrendline.linestyle": 0
                        }
                    };
                    if (studyId) shOpts.ownerStudyId = studyId;
                    track(chart.createMultipointShape([
                        { time: tTopStart, price: trTop },
                        { time: rightExtendBar, price: trTop }
                    ], shOpts));

                    var shTxtOpts = {
                        shape: "text",
                        text: topLabelText,
                        lock: true,
                        disableSelection: true,
                        disableSave: true,
                        disableUndo: true,
                        overrides: {
                            "color": swingBearColor,
                            "textColor": swingBearColor,
                            "fontsize": 9,
                            "bold": true,
                            "fillBackground": false,
                            "backgroundColor": "rgba(0,0,0,0)",
                            "drawBorder": false,
                            "borderColor": "rgba(0,0,0,0)"
                        }
                    };
                    if (studyId) shTxtOpts.ownerStudyId = studyId;
                    track(chart.createShape({ time: rightExtendBar, price: trTop }, shTxtOpts));
                } catch (_) {}

                // Bottom Line & Label
                try {
                    var slOpts = {
                        shape: "trend_line",
                        lock: true,
                        disableSelection: true,
                        disableSave: true,
                        disableUndo: true,
                        overrides: {
                            "linecolor": swingBullColor,
                            "linewidth": 1,
                            "linestyle": 0,
                            "linetooltrendline.linecolor": swingBullColor,
                            "linetooltrendline.linewidth": 1,
                            "linetooltrendline.linestyle": 0
                        }
                    };
                    if (studyId) slOpts.ownerStudyId = studyId;
                    track(chart.createMultipointShape([
                        { time: tBtmStart, price: trBtm },
                        { time: rightExtendBar, price: trBtm }
                    ], slOpts));

                    var slTxtOpts = {
                        shape: "text",
                        text: btmLabelText,
                        lock: true,
                        disableSelection: true,
                        disableSave: true,
                        disableUndo: true,
                        overrides: {
                            "color": swingBullColor,
                            "textColor": swingBullColor,
                            "fontsize": 9,
                            "bold": true,
                            "fillBackground": false,
                            "backgroundColor": "rgba(0,0,0,0)",
                            "drawBorder": false,
                            "borderColor": "rgba(0,0,0,0)"
                        }
                    };
                    if (studyId) slTxtOpts.ownerStudyId = studyId;
                    track(chart.createShape({ time: rightExtendBar, price: trBtm }, slTxtOpts));
                } catch (_) {}
            }

            // ==========================================
            // 6. RENDER PREMIUM / DISCOUNT / EQUILIBRIUM ZONES
            // ==========================================
            if (this._showZones && this.trailing && !isNaN(this.trailing.top) && !isNaN(this.trailing.bottom) && this.trailing.top > this.trailing.bottom) {
                var zTop = this.trailing.top;
                var zBtm = this.trailing.bottom;
                var zStart = this.trailing.barTime || times[0];
                var zMidTime = Math.round(zStart + 0.5 * (lastBarTime - zStart));

                var premCol = isMonochrome ? "#5d606b" : (this._premZoneColor || "#F23645");
                var eqCol = this._eqZoneColor || "#878b94";
                var discCol = isMonochrome ? "#b2b5be" : (this._discZoneColor || "#089981");

                // Premium Box (top down to 95% top + 5% btm)
                try {
                    var pOpts = {
                        shape: "rectangle",
                        lock: true,
                        disableSelection: true,
                        disableSave: true,
                        disableUndo: true,
                        overrides: {
                            "fillBackground": true,
                            "backgroundColor": hexToRgba(premCol, 0.2),
                            "backgroundTransparency": 80,
                            "drawBorder": false,
                            "borderColor": "rgba(0,0,0,0)",
                            "color": "rgba(0,0,0,0)",
                            "linewidth": 0
                        }
                    };
                    if (studyId) pOpts.ownerStudyId = studyId;
                    track(chart.createMultipointShape([
                        { time: zStart, price: zTop },
                        { time: lastBarTime, price: 0.95 * zTop + 0.05 * zBtm }
                    ], pOpts));

                    var pTxt = {
                        shape: "text",
                        text: "Premium",
                        lock: true,
                        disableSelection: true,
                        disableSave: true,
                        disableUndo: true,
                        overrides: {
                            "color": premCol,
                            "textColor": premCol,
                            "fontsize": 10,
                            "bold": true,
                            "fillBackground": false,
                            "backgroundColor": "rgba(0,0,0,0)",
                            "drawBorder": false,
                            "borderColor": "rgba(0,0,0,0)"
                        }
                    };
                    if (studyId) pTxt.ownerStudyId = studyId;
                    track(chart.createShape({ time: zMidTime, price: zTop }, pTxt));
                } catch (_) {}

                // Equilibrium Zone (midline +/- 2.5%)
                var eqMidline = 0.5 * (zTop + zBtm);
                try {
                    var eqOpts = {
                        shape: "rectangle",
                        lock: true,
                        disableSelection: true,
                        disableSave: true,
                        disableUndo: true,
                        overrides: {
                            "fillBackground": true,
                            "backgroundColor": hexToRgba(eqCol, 0.2),
                            "backgroundTransparency": 80,
                            "drawBorder": false,
                            "borderColor": "rgba(0,0,0,0)",
                            "color": "rgba(0,0,0,0)",
                            "linewidth": 0
                        }
                    };
                    if (studyId) eqOpts.ownerStudyId = studyId;
                    track(chart.createMultipointShape([
                        { time: zStart, price: 0.525 * zTop + 0.475 * zBtm },
                        { time: lastBarTime, price: 0.525 * zBtm + 0.475 * zTop }
                    ], eqOpts));

                    var eqTxt = {
                        shape: "text",
                        text: "Equilibrium",
                        lock: true,
                        disableSelection: true,
                        disableSave: true,
                        disableUndo: true,
                        overrides: {
                            "color": eqCol,
                            "textColor": eqCol,
                            "fontsize": 10,
                            "bold": true,
                            "fillBackground": false,
                            "backgroundColor": "rgba(0,0,0,0)",
                            "drawBorder": false,
                            "borderColor": "rgba(0,0,0,0)"
                        }
                    };
                    if (studyId) eqTxt.ownerStudyId = studyId;
                    track(chart.createShape({ time: lastBarTime, price: eqMidline }, eqTxt));
                } catch (_) {}

                // Discount Zone (95% btm + 5% top down to btm)
                try {
                    var dOpts = {
                        shape: "rectangle",
                        lock: true,
                        disableSelection: true,
                        disableSave: true,
                        disableUndo: true,
                        overrides: {
                            "fillBackground": true,
                            "backgroundColor": hexToRgba(discCol, 0.2),
                            "backgroundTransparency": 80,
                            "drawBorder": false,
                            "borderColor": "rgba(0,0,0,0)",
                            "color": "rgba(0,0,0,0)",
                            "linewidth": 0
                        }
                    };
                    if (studyId) dOpts.ownerStudyId = studyId;
                    track(chart.createMultipointShape([
                        { time: zStart, price: 0.95 * zBtm + 0.05 * zTop },
                        { time: lastBarTime, price: zBtm }
                    ], dOpts));

                    var dTxt = {
                        shape: "text",
                        text: "Discount",
                        lock: true,
                        disableSelection: true,
                        disableSave: true,
                        disableUndo: true,
                        overrides: {
                            "color": discCol,
                            "textColor": discCol,
                            "fontsize": 10,
                            "bold": true,
                            "fillBackground": false,
                            "backgroundColor": "rgba(0,0,0,0)",
                            "drawBorder": false,
                            "borderColor": "rgba(0,0,0,0)"
                        }
                    };
                    if (studyId) dTxt.ownerStudyId = studyId;
                    track(chart.createShape({ time: zMidTime, price: zBtm }, dTxt));
                } catch (_) {}
            }

            // ==========================================
            // 7. RENDER FAIR VALUE GAPS (FVG)
            // ==========================================
            if (this._showFvg && this.fairValueGaps && this.fairValueGaps.length > 0) {
                var fvgs = this.fairValueGaps;
                var fvgCount = Math.min(30, fvgs.length);
                for (var fIdx = fvgs.length - fvgCount; fIdx < fvgs.length; fIdx++) {
                    var fvg = fvgs[fIdx];
                    var isBullFvg = (fvg.bias === 1);
                    var fvgCol = isBullFvg ? (self._fvgBullColor || "rgba(0, 255, 104, 0.3)") : (self._fvgBearColor || "rgba(255, 0, 8, 0.3)");
                    var fvgBg = hexToRgba(fvgCol, 0.25);
                    try {
                        var fvgOpts = {
                            shape: "rectangle",
                            lock: true,
                            disableSelection: true,
                            disableSave: true,
                            disableUndo: true,
                            overrides: {
                                "fillBackground": true,
                                "backgroundColor": fvgBg,
                                "backgroundTransparency": 75,
                                "drawBorder": false,
                                "borderColor": "rgba(0,0,0,0)",
                                "color": "rgba(0,0,0,0)",
                                "linewidth": 0
                            }
                        };
                        if (studyId) fvgOpts.ownerStudyId = studyId;
                        track(chart.createMultipointShape([
                            { time: fvg.t1, price: fvg.top },
                            { time: fvg.t2, price: fvg.bottom }
                        ], fvgOpts));
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
            } else if (this.highs) {
                rawIndex = this.highs.length;
            }

            // Safe guard against TradingView pre-bar initialization call
            if (rawIndex < 0) {
                this.highs = [];
                this.lows = [];
                this.opens = [];
                this.closes = [];
                this.times = [];
                this.parsedHighs = [];
                this.parsedLows = [];
                this.atrHistory = [];
                this.breakouts = [];
                this.equalHighsLows = [];
                this.swingLabels = [];
                this.swingOrderBlocks = [];
                this.internalOrderBlocks = [];
                this.fairValueGaps = [];
                this.prevClose = NaN;
                return [NaN];
            }

            var bar_index = rawIndex;
            var rawTime = PineStd ? PineStd.time(this._context) : Date.now();
            var timeSec = rawTime > 1e11 ? Math.floor(rawTime / 1000) : Math.floor(rawTime);
            var open = PineStd ? PineStd.open(this._context) : 0;
            var high = PineStd ? PineStd.high(this._context) : 0;
            var low = PineStd ? PineStd.low(this._context) : 0;
            var close = PineStd ? PineStd.close(this._context) : 0;

            if (bar_index === 0 || !this.highs) {
                this.highs = [];
                this.lows = [];
                this.opens = [];
                this.closes = [];
                this.times = [];
                this.parsedHighs = [];
                this.parsedLows = [];
                this.trHistory = [];
                this.cumTr = 0;
                this.atrHistory = [];

                this.legSwing = 0;
                this.prevLegSwing = 0;
                this.legInternal = 0;
                this.prevLegInternal = 0;
                this.legEqual = 0;
                this.prevLegEqual = 0;

                this.swingHigh = { currentLevel: NaN, lastLevel: NaN, crossed: false, barTime: 0, barIndex: 0 };
                this.swingLow = { currentLevel: NaN, lastLevel: NaN, crossed: false, barTime: 0, barIndex: 0 };
                this.internalHigh = { currentLevel: NaN, lastLevel: NaN, crossed: false, barTime: 0, barIndex: 0 };
                this.internalLow = { currentLevel: NaN, lastLevel: NaN, crossed: false, barTime: 0, barIndex: 0 };
                this.equalHigh = { currentLevel: NaN, lastLevel: NaN, crossed: false, barTime: 0, barIndex: 0 };
                this.equalLow = { currentLevel: NaN, lastLevel: NaN, crossed: false, barTime: 0, barIndex: 0 };

                this.swingTrend = 0;
                this.internalTrend = 0;

                this.trailing = { top: high, bottom: low, barTime: timeSec, barIndex: 0, lastTopTime: timeSec, lastBottomTime: timeSec };

                this.breakouts = [];
                this.equalHighsLows = [];
                this.swingLabels = [];
                this.swingOrderBlocks = [];
                this.internalOrderBlocks = [];
                this.fairValueGaps = [];
                this.prevClose = NaN;
            }

            if (this.highs.length > bar_index) {
                this.highs.length = bar_index;
                this.lows.length = bar_index;
                this.opens.length = bar_index;
                this.closes.length = bar_index;
                this.times.length = bar_index;
                this.parsedHighs.length = bar_index;
                this.parsedLows.length = bar_index;
                this.atrHistory.length = bar_index;
                while (this.breakouts.length > 0 && this.breakouts[this.breakouts.length - 1].bar >= bar_index) {
                    this.breakouts.pop();
                }
            }

            var getInp = function (idx, def) {
                var v = typeof inputCallback === "function" ? inputCallback(idx) : undefined;
                return v !== undefined ? v : def;
            };

            // Inputs parsing matching metainfo index-by-index
            var in_mode = String(getInp(0, "Historical"));
            var in_style = String(getInp(1, "Colored"));
            var in_showTrend = Boolean(getInp(2, false));
            var in_showInternals = Boolean(getInp(3, true));
            var in_showInternalBull = String(getInp(4, "All"));
            var in_internalBullColor = String(getInp(5, "#089981"));
            var in_showInternalBear = String(getInp(6, "All"));
            var in_internalBearColor = String(getInp(7, "#F23645"));
            var in_confluenceFilter = Boolean(getInp(8, false));
            var in_internalSize = String(getInp(9, "tiny"));

            var in_showStructure = Boolean(getInp(10, true));
            var in_showSwingBull = String(getInp(11, "All"));
            var in_swingBullColor = String(getInp(12, "#089981"));
            var in_showSwingBear = String(getInp(13, "All"));
            var in_swingBearColor = String(getInp(14, "#F23645"));
            var in_swingSize = String(getInp(15, "small"));
            var in_showSwings = Boolean(getInp(16, false));
            var in_swingsLength = Math.max(10, Math.round(Number(getInp(17, 50))));
            var in_showHighLowSwings = Boolean(getInp(18, true));

            var in_showInternalOB = Boolean(getInp(19, true));
            var in_intObSize = Math.max(1, Math.min(20, Math.round(Number(getInp(20, 5)))));
            var in_showSwingOB = Boolean(getInp(21, false));
            var in_swObSize = Math.max(1, Math.min(20, Math.round(Number(getInp(22, 5)))));
            var in_obFilter = String(getInp(23, "Atr"));
            var in_obMitigation = String(getInp(24, "High/Low"));
            var in_intBullObColor = String(getInp(25, "rgba(49, 121, 245, 0.2)"));
            var in_intBearObColor = String(getInp(26, "rgba(247, 124, 128, 0.2)"));
            var in_swBullObColor = String(getInp(27, "rgba(24, 72, 204, 0.2)"));
            var in_swBearObColor = String(getInp(28, "rgba(178, 40, 51, 0.2)"));

            var in_showEqual = Boolean(getInp(29, true));
            var in_equalLength = Math.max(1, Math.round(Number(getInp(30, 3))));
            var in_equalThreshold = Math.max(0, Math.min(0.5, Number(getInp(31, 0.1))));
            var in_equalSize = String(getInp(32, "tiny"));

            var in_showFvg = Boolean(getInp(33, false));
            var in_fvgThreshold = Boolean(getInp(34, true));
            var in_fvgTimeframe = String(getInp(35, "Chart"));
            var in_fvgBullColor = String(getInp(36, "rgba(0, 255, 104, 0.3)"));
            var in_fvgBearColor = String(getInp(37, "rgba(255, 0, 8, 0.3)"));
            var in_fvgExtend = Math.max(0, Math.round(Number(getInp(38, 1))));

            var in_showZones = Boolean(getInp(48, false));
            var in_premZoneColor = String(getInp(49, "#F23645"));
            var in_eqZoneColor = String(getInp(50, "#878b94"));
            var in_discZoneColor = String(getInp(51, "#089981"));

            var in_plotMode = String(getInp(52, "Full History (up to 40k+ candles)"));
            var in_maxCandles = Math.max(50, Math.round(Number(getInp(53, 40000))));

            // Store instance references for renderer
            this._mode = in_mode;
            this._style = in_style;
            this._showSwings = in_showSwings;
            this._showHighLowSwings = in_showHighLowSwings;
            this._showInternalOB = in_showInternalOB;
            this._intObSize = in_intObSize;
            this._showSwingOB = in_showSwingOB;
            this._swObSize = in_swObSize;
            this._showEqual = in_showEqual;
            this._showFvg = in_showFvg;
            this._showZones = in_showZones;
            this._swingBullColor = in_swingBullColor;
            this._swingBearColor = in_swingBearColor;
            this._internalBullColor = in_internalBullColor;
            this._internalBearColor = in_internalBearColor;
            this._intBullObColor = in_intBullObColor;
            this._intBearObColor = in_intBearObColor;
            this._swBullObColor = in_swBullObColor;
            this._swBearObColor = in_swBearObColor;
            this._fvgBullColor = in_fvgBullColor;
            this._fvgBearColor = in_fvgBearColor;
            this._premZoneColor = in_premZoneColor;
            this._eqZoneColor = in_eqZoneColor;
            this._discZoneColor = in_discZoneColor;
            this._internalSize = in_internalSize;
            this._swingSize = in_swingSize;
            this._equalSize = in_equalSize;
            this._plotMode = in_plotMode;
            this._maxCandles = in_maxCandles;

            // Push candle into historical series
            this.highs[bar_index] = high;
            this.lows[bar_index] = low;
            this.opens[bar_index] = open;
            this.closes[bar_index] = close;
            this.times[bar_index] = timeSec;

            // 1. Calculate TR and ATR(200) (Wilder's Smoothing)
            var prevClose = isNaN(this.prevClose) ? close : this.prevClose;
            var tr = (bar_index === 0) ? (high - low) : Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
            this.cumTr += tr;

            var curAtr = tr;
            if (bar_index > 0 && typeof this.atrHistory[bar_index - 1] === "number") {
                var lastAtr = this.atrHistory[bar_index - 1];
                curAtr = (lastAtr * 199.0 + tr) / 200.0;
            }
            this.atrHistory[bar_index] = curAtr;

            // 2. Volatility Measure & Parsed High / Low
            var atrMeasure = curAtr;
            var volatilityMeasure = (in_obFilter === "Atr") ? atrMeasure : (this.cumTr / Math.max(1, bar_index + 1));
            var highVolatilityBar = ((high - low) >= (2.0 * volatilityMeasure));
            var parsedHigh = highVolatilityBar ? low : high;
            var parsedLow = highVolatilityBar ? high : low;

            this.parsedHighs[bar_index] = parsedHigh;
            this.parsedLows[bar_index] = parsedLow;

            // 3. Trailing Extremes Update
            if (high >= this.trailing.top) {
                this.trailing.top = high;
                this.trailing.lastTopTime = timeSec;
            }
            if (low <= this.trailing.bottom) {
                this.trailing.bottom = low;
                this.trailing.lastBottomTime = timeSec;
            }

            // 4. Function leg(size) & getCurrentStructure(size)
            var highsArr = this.highs;
            var lowsArr = this.lows;
            var timesArr = this.times;
            var selfObj = this;

            function checkLeg(size, legKey) {
                if (bar_index < size) return selfObj[legKey];
                var hSize = highsArr[bar_index - size];
                var lSize = lowsArr[bar_index - size];

                var highestRecent = -Infinity;
                var lowestRecent = Infinity;
                for (var k = bar_index - size + 1; k <= bar_index; k++) {
                    if (highsArr[k] > highestRecent) highestRecent = highsArr[k];
                    if (lowsArr[k] < lowestRecent) lowestRecent = lowsArr[k];
                }

                if (hSize > highestRecent) {
                    selfObj[legKey] = 0; // BEARISH_LEG
                } else if (lSize < lowestRecent) {
                    selfObj[legKey] = 1; // BULLISH_LEG
                }
                return selfObj[legKey];
            }

            function updateStructure(size, equalHighLow, internal, legKey, prevLegKey) {
                if (bar_index < size) return;
                var prevLeg = selfObj[prevLegKey];
                var curLeg = checkLeg(size, legKey);

                var newPivot = (curLeg !== prevLeg);
                var pivotLow = ((curLeg - prevLeg) === 1);
                var pivotHigh = ((curLeg - prevLeg) === -1);
                selfObj[prevLegKey] = curLeg;

                if (newPivot) {
                    var pivotTime = timesArr[bar_index - size];
                    var pivotIndex = bar_index - size;

                    if (pivotLow) {
                        var p_ivot = equalHighLow ? selfObj.equalLow : (internal ? selfObj.internalLow : selfObj.swingLow);
                        var curLowVal = lowsArr[bar_index - size];

                        if (equalHighLow && Math.abs(p_ivot.currentLevel - curLowVal) < (in_equalThreshold * atrMeasure)) {
                            selfObj.equalHighsLows.push({
                                tag: "EQL",
                                t1: p_ivot.barTime,
                                t2: pivotTime,
                                level: curLowVal,
                                bar: bar_index
                            });
                        }

                        p_ivot.lastLevel = p_ivot.currentLevel;
                        p_ivot.currentLevel = curLowVal;
                        p_ivot.crossed = false;
                        p_ivot.barTime = pivotTime;
                        p_ivot.barIndex = pivotIndex;

                        if (!equalHighLow && !internal) {
                            selfObj.trailing.bottom = p_ivot.currentLevel;
                            selfObj.trailing.barTime = p_ivot.barTime;
                            selfObj.trailing.barIndex = p_ivot.barIndex;
                            selfObj.trailing.lastBottomTime = p_ivot.barTime;
                        }

                        if (in_showSwings && !internal && !equalHighLow) {
                            var swTag = (p_ivot.currentLevel < p_ivot.lastLevel) ? "LL" : "HL";
                            selfObj.swingLabels.push({
                                tag: swTag,
                                time: pivotTime,
                                level: p_ivot.currentLevel,
                                bar: bar_index
                            });
                        }
                    } else if (pivotHigh) {
                        var p_ivotH = equalHighLow ? selfObj.equalHigh : (internal ? selfObj.internalHigh : selfObj.swingHigh);
                        var curHighVal = highsArr[bar_index - size];

                        if (equalHighLow && Math.abs(p_ivotH.currentLevel - curHighVal) < (in_equalThreshold * atrMeasure)) {
                            selfObj.equalHighsLows.push({
                                tag: "EQH",
                                t1: p_ivotH.barTime,
                                t2: pivotTime,
                                level: curHighVal,
                                bar: bar_index
                            });
                        }

                        p_ivotH.lastLevel = p_ivotH.currentLevel;
                        p_ivotH.currentLevel = curHighVal;
                        p_ivotH.crossed = false;
                        p_ivotH.barTime = pivotTime;
                        p_ivotH.barIndex = pivotIndex;

                        if (!equalHighLow && !internal) {
                            selfObj.trailing.top = p_ivotH.currentLevel;
                            selfObj.trailing.barTime = p_ivotH.barTime;
                            selfObj.trailing.barIndex = p_ivotH.barIndex;
                            selfObj.trailing.lastTopTime = p_ivotH.barTime;
                        }

                        if (in_showSwings && !internal && !equalHighLow) {
                            var swTagH = (p_ivotH.currentLevel > p_ivotH.lastLevel) ? "HH" : "LH";
                            selfObj.swingLabels.push({
                                tag: swTagH,
                                time: pivotTime,
                                level: p_ivotH.currentLevel,
                                bar: bar_index
                            });
                        }
                    }
                }
            }

            // A. Update Swing Structure (swingsLength)
            updateStructure(in_swingsLength, false, false, "legSwing", "prevLegSwing");

            // B. Update Internal Structure (5)
            updateStructure(5, false, true, "legInternal", "prevLegInternal");

            // C. Update Equal Highs/Lows (equalLength)
            if (in_showEqual) {
                updateStructure(in_equalLength, true, false, "legEqual", "prevLegEqual");
            }

            // 5. Store Order Block Function
            function storeOrderBlock(p_ivot, internal, bias) {
                var canStore = internal ? in_showInternalOB : in_showSwingOB;
                if (!canStore) return;

                var fromIdx = Math.max(0, p_ivot.barIndex);
                var toIdx = bar_index;
                var parsedIdx = fromIdx;

                if (bias === -1) { // BEARISH
                    var maxVal = -Infinity;
                    for (var m = fromIdx; m <= toIdx; m++) {
                        if (selfObj.parsedHighs[m] > maxVal) {
                            maxVal = selfObj.parsedHighs[m];
                            parsedIdx = m;
                        }
                    }
                } else { // BULLISH
                    var minVal = Infinity;
                    for (var n = fromIdx; n <= toIdx; n++) {
                        if (selfObj.parsedLows[n] < minVal) {
                            minVal = selfObj.parsedLows[n];
                            parsedIdx = n;
                        }
                    }
                }

                var ob = {
                    barHigh: selfObj.parsedHighs[parsedIdx],
                    barLow: selfObj.parsedLows[parsedIdx],
                    barTime: selfObj.times[parsedIdx],
                    bias: bias
                };

                var obsList = internal ? selfObj.internalOrderBlocks : selfObj.swingOrderBlocks;
                if (obsList.length >= 100) obsList.pop();
                obsList.unshift(ob);
            }

            // 6. Breakout Evaluation: displayStructure(internal)
            function displayStructure(internal) {
                var bullishBar = true;
                var bearishBar = true;
                if (in_confluenceFilter) {
                    var upperWick = high - Math.max(close, open);
                    var lowerDist = Math.min(close, open - low);
                    bullishBar = (upperWick > lowerDist);
                    bearishBar = (upperWick < lowerDist);
                }

                // Bullish Breakout Check
                var p_ivotH = internal ? selfObj.internalHigh : selfObj.swingHigh;
                var extraCondBull = internal ? (selfObj.internalHigh.currentLevel !== selfObj.swingHigh.currentLevel && bullishBar) : true;

                if (!isNaN(p_ivotH.currentLevel) && prevClose <= p_ivotH.currentLevel && close > p_ivotH.currentLevel && !p_ivotH.crossed && extraCondBull) {
                    var curTrendVal = internal ? selfObj.internalTrend : selfObj.swingTrend;
                    var tagBull = (curTrendVal === -1) ? "CHoCH" : "BOS";

                    p_ivotH.crossed = true;
                    if (internal) selfObj.internalTrend = 1; else selfObj.swingTrend = 1;

                    var displayCondBull = internal ?
                        (in_showInternals && (in_showInternalBull === "All" || (in_showInternalBull === "BOS" && tagBull !== "CHoCH") || (in_showInternalBull === "CHoCH" && tagBull === "CHoCH"))) :
                        (in_showStructure && (in_showSwingBull === "All" || (in_showSwingBull === "BOS" && tagBull !== "CHoCH") || (in_showSwingBull === "CHoCH" && tagBull === "CHoCH")));

                    if (displayCondBull) {
                        selfObj.breakouts.push({
                            internal: internal,
                            bias: "BULLISH",
                            tag: tagBull,
                            level: p_ivotH.currentLevel,
                            pivotTime: p_ivotH.barTime,
                            breakTime: timeSec,
                            bar: bar_index
                        });
                    }

                    if ((internal && in_showInternalOB) || (!internal && in_showSwingOB)) {
                        storeOrderBlock(p_ivotH, internal, 1);
                    }
                }

                // Bearish Breakout Check
                var p_ivotL = internal ? selfObj.internalLow : selfObj.swingLow;
                var extraCondBear = internal ? (selfObj.internalLow.currentLevel !== selfObj.swingLow.currentLevel && bearishBar) : true;

                if (!isNaN(p_ivotL.currentLevel) && prevClose >= p_ivotL.currentLevel && close < p_ivotL.currentLevel && !p_ivotL.crossed && extraCondBear) {
                    var curTrendValBear = internal ? selfObj.internalTrend : selfObj.swingTrend;
                    var tagBear = (curTrendValBear === 1) ? "CHoCH" : "BOS";

                    p_ivotL.crossed = true;
                    if (internal) selfObj.internalTrend = -1; else selfObj.swingTrend = -1;

                    var displayCondBear = internal ?
                        (in_showInternals && (in_showInternalBear === "All" || (in_showInternalBear === "BOS" && tagBear !== "CHoCH") || (in_showInternalBear === "CHoCH" && tagBear === "CHoCH"))) :
                        (in_showStructure && (in_showSwingBear === "All" || (in_showSwingBear === "BOS" && tagBear !== "CHoCH") || (in_showSwingBear === "CHoCH" && tagBear === "CHoCH")));

                    if (displayCondBear) {
                        selfObj.breakouts.push({
                            internal: internal,
                            bias: "BEARISH",
                            tag: tagBear,
                            level: p_ivotL.currentLevel,
                            pivotTime: p_ivotL.barTime,
                            breakTime: timeSec,
                            bar: bar_index
                        });
                    }

                    if ((internal && in_showInternalOB) || (!internal && in_showSwingOB)) {
                        storeOrderBlock(p_ivotL, internal, -1);
                    }
                }
            }

            if (in_showInternals || in_showInternalOB || in_showTrend) {
                displayStructure(true);
            }
            if (in_showStructure || in_showSwingOB || in_showHighLowSwings) {
                displayStructure(false);
            }

            // 7. Mitigate / Delete Order Blocks
            var bSourceBear = (in_obMitigation === "Close") ? close : high;
            var bSourceBull = (in_obMitigation === "Close") ? close : low;

            function deleteOrderBlocks(internal) {
                var obs = internal ? selfObj.internalOrderBlocks : selfObj.swingOrderBlocks;
                for (var bI = obs.length - 1; bI >= 0; bI--) {
                    var eachOB = obs[bI];
                    var isMitigated = false;
                    if (eachOB.bias === -1 && bSourceBear > eachOB.barHigh) isMitigated = true;
                    else if (eachOB.bias === 1 && bSourceBull < eachOB.barLow) isMitigated = true;
                    if (isMitigated) {
                        obs.splice(bI, 1);
                    }
                }
            }

            if (in_showInternalOB) deleteOrderBlocks(true);
            if (in_showSwingOB) deleteOrderBlocks(false);

            // 8. Fair Value Gaps (FVG)
            if (in_showFvg && bar_index >= 2) {
                var lastClose = this.closes[bar_index - 1];
                var lastOpen = this.opens[bar_index - 1];
                var lastTime = this.times[bar_index - 1];
                var last2High = this.highs[bar_index - 2];
                var last2Low = this.lows[bar_index - 2];

                var barDeltaPercent = (lastOpen !== 0) ? ((lastClose - lastOpen) / (lastOpen * 100.0)) : 0;
                var threshold = 0;

                var bullFvg = (low > last2High && lastClose > last2High && barDeltaPercent > threshold);
                var bearFvg = (high < last2Low && lastClose < last2Low && -barDeltaPercent > threshold);

                if (bullFvg) {
                    this.fairValueGaps.unshift({
                        top: low,
                        bottom: last2High,
                        bias: 1,
                        t1: lastTime,
                        t2: timeSec + in_fvgExtend * timeDiff
                    });
                }
                if (bearFvg) {
                    this.fairValueGaps.unshift({
                        top: last2Low,
                        bottom: high,
                        bias: -1,
                        t1: lastTime,
                        t2: timeSec + in_fvgExtend * timeDiff
                    });
                }

                for (var fI = this.fairValueGaps.length - 1; fI >= 0; fI--) {
                    var f = this.fairValueGaps[fI];
                    if ((low < f.bottom && f.bias === 1) || (high > f.top && f.bias === -1)) {
                        this.fairValueGaps.splice(fI, 1);
                    }
                }
            }

            this.prevClose = close;

            // Schedule drawing refresh
            if (typeof setTimeout !== "undefined") {
                if (this._renderTimer) clearTimeout(this._renderTimer);
                var selfTimer = this;
                this._renderTimer = setTimeout(function () {
                    if (!selfTimer._isDestroyed) selfTimer.renderDrawings();
                }, 80);
            }

            return [NaN];
        };
    }
})