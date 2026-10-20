({
    name: "MSB-OB",
    metainfo: {
        _metainfoVersion: 52,
        isTVScript: false,
        is_hidden_study: false,
        is_price_study: true,
        isCustomIndicator: true,
        format: { precision: 2, type: "price" },
        id: "MSB_OB@tv-basicstudies-1",
        scriptIdPart: "",
        name: "MSB-OB",
        description: "Market Structure Break & Order Block",
        shortDescription: "MSB-OB",
        defaults: {
            styles: {
                plot_dummy: { linestyle: 0, linewidth: 1, plottype: 0, trackPrice: false, transparency: 100, visible: false, color: "#2962FF" }
            },
            inputs: {
                in_0: 9,
                in_1: true,
                in_2: 0.33,
                in_3: "tiny",
                in_4: true,
                in_5: "#089981",
                in_6: "#089981",
                in_7: "#089981",
                in_8: "#F23645",
                in_9: "#F23645",
                in_10: "#F23645",
                in_11: "#089981",
                in_12: "#089981",
                in_13: "#089981",
                in_14: "#F23645",
                in_15: "#F23645",
                in_16: "#F23645"
            }
        },
        plots: [{ id: "plot_dummy", type: "line" }],
        styles: { plot_dummy: { title: "Dummy", isHidden: true } },
        inputs: [
            { id: "in_0", name: "ZigZag Length", defval: 9, type: "integer", min: 1, max: 200 },
            { id: "in_1", name: "Show Zigzag", defval: true, type: "bool" },
            { id: "in_2", name: "Fib Factor for breakout confirmation", defval: 0.33, type: "float", min: 0, max: 1, step: 0.01 },
            { id: "in_3", name: "Text Size", defval: "tiny", type: "text", options: ["tiny", "small", "normal", "large", "huge"] },
            { id: "in_4", name: "Delete Old/Broken Boxes", defval: true, type: "bool" },
            { id: "in_5", name: "Bu-OB Color", defval: "#089981", type: "color" },
            { id: "in_6", name: "Bu-OB Border Color", defval: "#089981", type: "color" },
            { id: "in_7", name: "Bu-OB Text Color", defval: "#089981", type: "color" },
            { id: "in_8", name: "Be-OB Color", defval: "#F23645", type: "color" },
            { id: "in_9", name: "Be-OB Border Color", defval: "#F23645", type: "color" },
            { id: "in_10", name: "Be-OB Text Color", defval: "#F23645", type: "color" },
            { id: "in_11", name: "Bu-BB Color", defval: "#089981", type: "color" },
            { id: "in_12", name: "Bu-BB Border Color", defval: "#089981", type: "color" },
            { id: "in_13", name: "Bu-BB Text Color", defval: "#089981", type: "color" },
            { id: "in_14", name: "Be-BB Color", defval: "#F23645", type: "color" },
            { id: "in_15", name: "Be-BB Border Color", defval: "#F23645", type: "color" },
            { id: "in_16", name: "Be-BB Text Color", defval: "#F23645", type: "color" }
        ]
    },
    constructor: function () {
        this.init = function (ctx, inputCallback) {
            this._context = ctx;
            this._input = inputCallback;
            this._isDestroyed = false;
            this.clearDrawings();
            this.resetState();
        };

        this.destroy = function () {
            this._isDestroyed = true;
            if (this._renderTimer) {
                clearTimeout(this._renderTimer);
                this._renderTimer = null;
            }
            this.clearDrawings();
            if (this._visProp && typeof this._visProp.unsubscribe === "function") {
                try { this._visProp.unsubscribe(this); } catch (_) {}
                this._visProp = null;
            }
            this._cachedStudyInfo = null;
            this._subscribedVis = false;
            this.bars = [];
            this.barTimes = [];
        };

        this.resetState = function () {
            this.bars = [];
            this.barTimes = [];
            this.to_up = [];
            this.to_down = [];
            this.l0i_history = [];
            this.h0i_history = [];
            this.high_points = [];
            this.low_points = [];
            this.zigzags = [];
            this.msbLines = [];
            this.msbLabels = [];
            this.bu_ob_boxes = [null, null, null, null, null];
            this.bu_bb_boxes = [null, null, null, null, null];
            this.be_ob_boxes = [null, null, null, null, null];
            this.be_bb_boxes = [null, null, null, null, null];
            this.trend = 1;
            this.market = 1;
            this.last_l0 = NaN;
            this.last_h0 = NaN;
            this._drawnShapeIds = [];
            this._isDestroyed = false;
            this._renderGen = 0;
            this._lastBarIndex = -1;
            this._retryCount = 0;
            this._cachedStudyInfo = null;
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
                if (window.parent && window.parent !== window && window.parent.chartWidgetCollection) {
                    if (typeof window.parent.chartWidgetCollection.activeChartWidget === "function") {
                        var pacw = window.parent.chartWidgetCollection.activeChartWidget();
                        if (pacw && pacw.chart) return pacw.chart();
                    }
                    if (typeof window.parent.chartWidgetCollection.activeChart === "function") {
                        return window.parent.chartWidgetCollection.activeChart();
                    }
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
                    var studies = chart.getAllStudies() || [];
                    for (var sIdx = 0; sIdx < studies.length; sIdx++) {
                        var stObj = studies[sIdx];
                        if (!stObj) continue;
                        var sName = (stObj.name || "").toLowerCase();
                        var sDesc = (stObj.description || "").toLowerCase();
                        var sId = (stObj.id || "").toLowerCase();
                        if (
                            sName === "msb-ob" ||
                            sName.indexOf("market structure break") !== -1 ||
                            sName.indexOf("msb-ob") !== -1 ||
                            sDesc.indexOf("market structure break") !== -1 ||
                            sDesc.indexOf("msb-ob") !== -1 ||
                            sId.indexOf("msb_ob") !== -1 ||
                            sId.indexOf("msb-ob") !== -1
                        ) {
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
                        var allSt = mModel.allStudies() || [];
                        for (var aIdx = 0; aIdx < allSt.length; aIdx++) {
                            var as = allSt[aIdx];
                            if (!as) continue;
                            var asMeta = (typeof as.metaInfo === "function") ? as.metaInfo() : as._metaInfo;
                            if (asMeta) {
                                var amId = (asMeta.id || "").toLowerCase();
                                var amDesc = (asMeta.description || "").toLowerCase();
                                var amName = (asMeta.name || "").toLowerCase();
                                if (
                                    amId === "msb_ob@tv-basicstudies-1" ||
                                    amId.indexOf("msb_ob") !== -1 ||
                                    amDesc.indexOf("market structure break") !== -1 ||
                                    amName.indexOf("msb-ob") !== -1
                                ) {
                                    studySource = as;
                                    if (!studyId && as.id) {
                                        studyId = (typeof as.id === "function") ? as.id() : as.id;
                                    }
                                    break;
                                }
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
            if (typeof window !== "undefined" && window.__msbob_drawnShapeIds && window.__msbob_drawnShapeIds.length > 0) {
                for (var k = 0; k < window.__msbob_drawnShapeIds.length; k++) {
                    if (idsToClear.indexOf(window.__msbob_drawnShapeIds[k]) === -1) {
                        idsToClear.push(window.__msbob_drawnShapeIds[k]);
                    }
                }
                window.__msbob_drawnShapeIds = [];
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
                            var lts = mModel.allLineTools() || [];
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
                if (self._retryCount < 25) {
                    self._retryCount++;
                    setTimeout(function () {
                        if (!self._isDestroyed) self.renderDrawings();
                    }, 200);
                }
                return;
            }
            self._retryCount = 0;

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
            }

            this.clearDrawings();
            var currentGen = this._renderGen;

            function track(res) {
                if (!res) return;
                if (typeof res.then === "function") {
                    res.then(function (id) {
                        if (!id) return;
                        if (self._isDestroyed || self._renderGen !== currentGen) {
                            try { if (chart && typeof chart.removeEntity === "function") chart.removeEntity(id, { disableUndo: true }); } catch (_) {}
                            return;
                        }
                        self._drawnShapeIds.push(id);
                        if (typeof window !== "undefined") {
                            window.__msbob_drawnShapeIds = window.__msbob_drawnShapeIds || [];
                            window.__msbob_drawnShapeIds.push(id);
                        }
                    }).catch(function () {});
                } else {
                    if (self._isDestroyed || self._renderGen !== currentGen) {
                        try { if (chart && typeof chart.removeEntity === "function") chart.removeEntity(res, { disableUndo: true }); } catch (_) {}
                        return;
                    }
                    self._drawnShapeIds.push(res);
                    if (typeof window !== "undefined") {
                        window.__msbob_drawnShapeIds = window.__msbob_drawnShapeIds || [];
                        window.__msbob_drawnShapeIds.push(res);
                    }
                }
            }

            var cfg = this._cfg || {};
            var bars = this.bars || [], barTimes = this.barTimes || [];
            var totalBars = bars.length;
            if (totalBars < 2) return;

            var lastBarTime = barTimes[totalBars - 1];
            var timeDiff = (totalBars > 1 && barTimes[totalBars - 1] > barTimes[totalBars - 2])
                ? (barTimes[totalBars - 1] - barTimes[totalBars - 2]) : 300;

            var boxFontSize = 9;
            if (cfg.text_size === "small") boxFontSize = 10;
            else if (cfg.text_size === "normal") boxFontSize = 12;
            else if (cfg.text_size === "large") boxFontSize = 14;
            else if (cfg.text_size === "huge") boxFontSize = 16;

            // 1. ACTIVE ORDER BLOCKS & BREAKER BLOCKS (Rectangles)
            var activeBoxes = this.bu_ob_boxes.concat(this.bu_bb_boxes, this.be_ob_boxes, this.be_bb_boxes).filter(Boolean);
            for (var b = 0; b < activeBoxes.length; b++) {
                var bx = activeBoxes[b];
                if (!bx || bx.left < 0 || bx.left >= totalBars) continue;
                var bt1 = barTimes[bx.left];
                if (!bt1) continue;
                var bt2 = (bx.right < totalBars) ? barTimes[bx.right] : (lastBarTime + (bx.right - totalBars + 1) * timeDiff);
                if (!bt2 || bt2 <= bt1) bt2 = bt1 + 10 * timeDiff;

                var bColor = bx.isBull ? (cfg.bu_ob_border_color || "#089981") : (cfg.be_ob_border_color || "#F23645");
                var bBg = bx.isBull ? (cfg.bu_ob_color || "#089981") : (cfg.be_ob_color || "#F23645");
                var bTextCol = bx.isBull ? (cfg.bu_ob_text_color || "#089981") : (cfg.be_ob_text_color || "#F23645");

                if (bx.boxType === "bu_bb") {
                    bColor = cfg.bu_bb_border_color || "#089981";
                    bBg = cfg.bu_bb_color || "#089981";
                    bTextCol = cfg.bu_bb_text_color || "#089981";
                } else if (bx.boxType === "be_bb") {
                    bColor = cfg.be_bb_border_color || "#F23645";
                    bBg = cfg.be_bb_color || "#F23645";
                    bTextCol = cfg.be_bb_text_color || "#F23645";
                }

                var topPrice = bx.top;
                var btmPrice = bx.bottom;
                if (topPrice === btmPrice) topPrice += 0.01;

                try {
                    track(chart.createMultipointShape([{ time: bt1, price: topPrice }, { time: bt2, price: btmPrice }], {
                        shape: "rectangle",
                        lock: true,
                        disableSelection: true,
                        disableSave: true,
                        disableUndo: true,
                        ownerStudyId: studyId,
                        overrides: {
                            "fillBackground": true,
                            "backgroundColor": bBg,
                            "backgroundTransparency": 70,
                            "drawBorder": true,
                            "borderColor": bColor,
                            "color": bColor,
                            "linewidth": 1,
                            "linetoolrectangle.fillBackground": true,
                            "linetoolrectangle.backgroundColor": bBg,
                            "linetoolrectangle.backgroundTransparency": 70,
                            "linetoolrectangle.drawBorder": true,
                            "linetoolrectangle.borderColor": bColor,
                            "linetoolrectangle.color": bColor,
                            "linetoolrectangle.linewidth": 1
                        }
                    }));
                } catch (_) {}

                if (typeof chart.createShape === "function" && bx.text) {
                    var midPrice = (topPrice + btmPrice) / 2;
                    try {
                        track(chart.createShape({ time: bt2, price: midPrice }, {
                            shape: "text",
                            text: bx.text,
                            lock: true,
                            disableSelection: true,
                            disableSave: true,
                            disableUndo: true,
                            ownerStudyId: studyId,
                            overrides: {
                                "color": bTextCol,
                                "textColor": bTextCol,
                                "fontsize": boxFontSize,
                                "bold": false,
                                "fillBackground": false,
                                "drawBorder": false,
                                "borderColor": "rgba(0,0,0,0)"
                            }
                        }));
                    } catch (_) {}
                }
            }

            // 2. HORIZONTAL MSB LINES & LABELS (All recent MSBs)
            if (this.msbLines && this.msbLines.length > 0) {
                var mStart = Math.max(0, this.msbLines.length - 100);
                for (var m = mStart; m < this.msbLines.length; m++) {
                    var ml = this.msbLines[m];
                    var mt1 = barTimes[ml.x1], mt2 = barTimes[ml.x2];
                    if (!mt1 || !mt2) continue;
                    if (mt1 === mt2) mt2 = mt1 + timeDiff;
                    var col = ml.isBull ? (cfg.bu_ob_color || "#089981") : (cfg.be_ob_color || "#F23645");
                    try {
                        track(chart.createMultipointShape([{ time: mt1, price: ml.y1 }, { time: mt2, price: ml.y2 }], {
                            shape: "trend_line",
                            lock: true,
                            disableSelection: true,
                            disableSave: true,
                            disableUndo: true,
                            ownerStudyId: studyId,
                            overrides: {
                                "linecolor": col,
                                "linewidth": 2,
                                "linestyle": 0,
                                "linetooltrendline.linecolor": col,
                                "linetooltrendline.linewidth": 2,
                                "linetooltrendline.linestyle": 0
                            }
                        }));
                    } catch (_) {}
                }
            }
            if (this.msbLabels && this.msbLabels.length > 0 && typeof chart.createShape === "function") {
                var lStart = Math.max(0, this.msbLabels.length - 100);
                for (var l = lStart; l < this.msbLabels.length; l++) {
                    var lb = this.msbLabels[l];
                    var lt = barTimes[lb.x] || barTimes[Math.min(totalBars - 1, Math.max(0, lb.x))];
                    if (!lt) continue;
                    var lCol = lb.isBull ? (cfg.bu_ob_text_color || "#089981") : (cfg.be_ob_text_color || "#F23645");
                    try {
                        track(chart.createShape({ time: lt, price: lb.y }, {
                            shape: "text",
                            text: "MSB",
                            lock: true,
                            disableSelection: true,
                            disableSave: true,
                            disableUndo: true,
                            ownerStudyId: studyId,
                            overrides: {
                                "color": lCol,
                                "textColor": lCol,
                                "fontsize": 10,
                                "bold": true,
                                "fillBackground": false,
                                "drawBorder": false,
                                "borderColor": "rgba(0,0,0,0)"
                            }
                        }));
                    } catch (_) {}
                }
            }

            // 3. BLUE ZIGZAG LINES (All historical waves up to 450)
            if (cfg.show_zigzag !== false && this.zigzags && this.zigzags.length > 0) {
                var zzStart = Math.max(0, this.zigzags.length - 450);
                for (var z = zzStart; z < this.zigzags.length; z++) {
                    var zg = this.zigzags[z];
                    if (zg.x1 === zg.x2) continue;
                    var zt1 = barTimes[zg.x1], zt2 = barTimes[zg.x2];
                    if (!zt1 || !zt2 || zt1 === zt2) continue;
                    try {
                        track(chart.createMultipointShape([{ time: zt1, price: zg.y1 }, { time: zt2, price: zg.y2 }], {
                            shape: "trend_line",
                            lock: true,
                            disableSelection: true,
                            disableSave: true,
                            disableUndo: true,
                            ownerStudyId: studyId,
                            overrides: {
                                "linecolor": "#2962FF",
                                "linewidth": 1,
                                "linestyle": 0,
                                "linetooltrendline.linecolor": "#2962FF",
                                "linetooltrendline.linewidth": 1,
                                "linetooltrendline.linestyle": 0
                            }
                        }));
                    } catch (_) {}
                }
            }
        };

        this.main = function (ctx, inputCallback) {
            this._context = ctx;
            this._input = inputCallback;

            var selfInput = this._input;
            function getInp(idx, defVal) {
                if (typeof selfInput === "function") {
                    var v = selfInput(idx);
                    if (v !== undefined) return v;
                    var vId = selfInput("in_" + idx);
                    if (vId !== undefined) return vId;
                }
                return defVal;
            }

            var zigzag_len = Math.max(1, Math.round(Number(getInp(0, 9))));
            var show_zigzag = Boolean(getInp(1, true));
            var fib_factor = Number(getInp(2, 0.33));
            var text_size = String(getInp(3, "tiny"));
            var delete_boxes = Boolean(getInp(4, true));

            var bu_ob_color = String(getInp(5, "#089981"));
            var bu_ob_border_color = String(getInp(6, "#089981"));
            var bu_ob_text_color = String(getInp(7, "#089981"));

            var be_ob_color = String(getInp(8, "#F23645"));
            var be_ob_border_color = String(getInp(9, "#F23645"));
            var be_ob_text_color = String(getInp(10, "#F23645"));

            var bu_bb_color = String(getInp(11, "#089981"));
            var bu_bb_border_color = String(getInp(12, "#089981"));
            var bu_bb_text_color = String(getInp(13, "#089981"));

            var be_bb_color = String(getInp(14, "#F23645"));
            var be_bb_border_color = String(getInp(15, "#F23645"));
            var be_bb_text_color = String(getInp(16, "#F23645"));

            this._cfg = {
                zigzag_len: zigzag_len,
                show_zigzag: show_zigzag,
                fib_factor: fib_factor,
                text_size: text_size,
                delete_boxes: delete_boxes,
                bu_ob_color: bu_ob_color,
                bu_ob_border_color: bu_ob_border_color,
                bu_ob_text_color: bu_ob_text_color,
                be_ob_color: be_ob_color,
                be_ob_border_color: be_ob_border_color,
                be_ob_text_color: be_ob_text_color,
                bu_bb_color: bu_bb_color,
                bu_bb_border_color: bu_bb_border_color,
                bu_bb_text_color: bu_bb_text_color,
                be_bb_color: be_bb_color,
                be_bb_border_color: be_bb_border_color,
                be_bb_text_color: be_bb_text_color
            };

            var bar_index = PineJS.Std.n(this._context);
            var timeMs = PineJS.Std.time(this._context);
            var timeSec = timeMs > 1e11 ? Math.floor(timeMs / 1000) : Math.floor(timeMs);
            var open = PineJS.Std.open(this._context);
            var high = PineJS.Std.high(this._context);
            var low = PineJS.Std.low(this._context);
            var close = PineJS.Std.close(this._context);

            if (!this.bars || bar_index === 0) {
                this.resetState();
            }

            if (this.bars.length > bar_index) {
                this.bars.length = bar_index;
                this.barTimes.length = bar_index;
                this.to_up.length = bar_index;
                this.to_down.length = bar_index;
                this.l0i_history.length = bar_index;
                this.h0i_history.length = bar_index;

                while (this.high_points.length > 0 && this.high_points[this.high_points.length - 1].index >= bar_index) this.high_points.pop();
                while (this.low_points.length > 0 && this.low_points[this.low_points.length - 1].index >= bar_index) this.low_points.pop();
                while (this.zigzags.length > 0 && this.zigzags[this.zigzags.length - 1].x2 >= bar_index) this.zigzags.pop();
                while (this.msbLines.length > 0 && this.msbLines[this.msbLines.length - 1].x2 >= bar_index) this.msbLines.pop();
                while (this.msbLabels.length > 0 && this.msbLabels[this.msbLabels.length - 1].x >= bar_index) this.msbLabels.pop();
            }

            this.bars[bar_index] = { index: bar_index, time: timeSec, open: open, high: high, low: low, close: close };
            this.barTimes[bar_index] = timeSec;

            // 1. to_up / to_down (ta.highest / ta.lowest over zigzag_len)
            var maxH = high, minL = low;
            var sIdx = Math.max(0, bar_index - zigzag_len + 1);
            for (var k = sIdx; k <= bar_index; k++) {
                if (this.bars[k].high > maxH) maxH = this.bars[k].high;
                if (this.bars[k].low < minL) minL = this.bars[k].low;
            }
            var cur_to_up = high >= maxH;
            var cur_to_down = low <= minL;
            this.to_up[bar_index] = cur_to_up;
            this.to_down[bar_index] = cur_to_down;

            // 2. Trend tracking
            var prevTrend = this.trend;
            if (bar_index > 0) {
                if (prevTrend === 1 && cur_to_down) this.trend = -1;
                else if (prevTrend === -1 && cur_to_up) this.trend = 1;
            }

            // 3. Lowest low / highest high since opposite trend signal
            var last_trend_up_since = null;
            for (var bu = bar_index; bu >= 1; bu--) {
                if (this.to_up[bu - 1]) { last_trend_up_since = bar_index - bu; break; }
            }
            var len_up = (last_trend_up_since !== null && last_trend_up_since > 0) ? last_trend_up_since : 1;
            var low_val = low, low_index = bar_index;
            var sLu = Math.max(0, bar_index - len_up + 1);
            for (var ku = sLu; ku <= bar_index; ku++) {
                if (this.bars[ku].low < low_val) low_val = this.bars[ku].low;
            }
            for (var bu2 = bar_index; bu2 >= 0; bu2--) {
                if (this.bars[bu2].low === low_val) { low_index = bu2; break; }
            }

            var last_trend_down_since = null;
            for (var bd = bar_index; bd >= 1; bd--) {
                if (this.to_down[bd - 1]) { last_trend_down_since = bar_index - bd; break; }
            }
            var len_down = (last_trend_down_since !== null && last_trend_down_since > 0) ? last_trend_down_since : 1;
            var high_val = high, high_index = bar_index;
            var sLd = Math.max(0, bar_index - len_down + 1);
            for (var kd = sLd; kd <= bar_index; kd++) {
                if (this.bars[kd].high > high_val) high_val = this.bars[kd].high;
            }
            for (var bd2 = bar_index; bd2 >= 0; bd2--) {
                if (this.bars[bd2].high === high_val) { high_index = bd2; break; }
            }

            var trendChanged = (bar_index > 0 && this.trend !== prevTrend);
            if (trendChanged) {
                if (this.trend === 1) this.low_points.push({ val: low_val, index: low_index });
                if (this.trend === -1) this.high_points.push({ val: high_val, index: high_index });
            }

            var h0 = this.high_points.length > 0 ? this.high_points[this.high_points.length - 1] : { val: high, index: bar_index };
            var h1 = this.high_points.length > 1 ? this.high_points[this.high_points.length - 2] : h0;
            var l0 = this.low_points.length > 0 ? this.low_points[this.low_points.length - 1] : { val: low, index: bar_index };
            var l1 = this.low_points.length > 1 ? this.low_points[this.low_points.length - 2] : l0;

            this.l0i_history[bar_index] = l0.index;
            this.h0i_history[bar_index] = h0.index;

            // 4. ZigZag line registration
            if (trendChanged && show_zigzag) {
                if (this.trend === 1 && this.high_points.length > 0) {
                    var prevH = this.high_points[this.high_points.length - 1];
                    if (prevH.index !== low_index) this.zigzags.push({ x1: prevH.index, y1: prevH.val, x2: low_index, y2: low_val });
                } else if (this.trend === -1 && this.low_points.length > 0) {
                    var prevL = this.low_points[this.low_points.length - 1];
                    if (prevL.index !== high_index) this.zigzags.push({ x1: prevL.index, y1: prevL.val, x2: high_index, y2: high_val });
                }
            }

            // 5. Market Structure Break (MSB) detection
            var prevMarket = this.market;
            if (this.high_points.length >= 2 && this.low_points.length >= 2) {
                if (this.last_l0 === l0.val || this.last_h0 === h0.val) {
                    this.market = prevMarket;
                } else if (prevMarket === 1 && l0.val < l1.val && l0.val < l1.val - Math.abs(h0.val - l1.val) * fib_factor) {
                    this.market = -1;
                } else if (prevMarket === -1 && h0.val > h1.val && h0.val > h1.val + Math.abs(h1.val - l0.val) * fib_factor) {
                    this.market = 1;
                }
            }

            var l0i_zz = (bar_index >= zigzag_len) ? this.l0i_history[bar_index - zigzag_len] : l0.index;
            var h0i_zz = (bar_index >= zigzag_len) ? this.h0i_history[bar_index - zigzag_len] : h0.index;
            var selfInst = this;

            function findCandle(start, end, isBearish) {
                var from = Math.min(start, end), to = Math.max(start, end);
                var resIdx = start;
                for (var cIdx = Math.max(0, from); cIdx <= Math.min(selfInst.bars.length - 1, to); cIdx++) {
                    var b = selfInst.bars[cIdx];
                    if (b && (isBearish ? (b.open > b.close) : (b.open < b.close))) resIdx = cIdx;
                }
                return resIdx;
            }

            if (bar_index > 0 && this.market !== prevMarket) {
                this.last_l0 = l0.val;
                this.last_h0 = h0.val;

                if (this.market === 1) {
                    this.msbLines.push({ x1: h1.index, y1: h1.val, x2: h0.index, y2: h1.val, isBull: true });
                    this.msbLabels.push({ x: Math.floor((h1.index + l0.index) / 2), y: h1.val, text: "MSB", isBull: true });

                    var bu_ob_idx = findCandle(h1.index, l0i_zz, true);
                    var bu_bb_idx = findCandle(l1.index - zigzag_len, h1.index, false);
                    var cOb = this.bars[bu_ob_idx] || this.bars[bar_index];
                    var cBb = this.bars[bu_bb_idx] || this.bars[bar_index];

                    this.bu_ob_boxes.push({ left: bu_ob_idx, top: cOb.high, bottom: cOb.low, right: bar_index + 10, text: "Bu-OB", isBull: true, boxType: "bu_ob" });
                    this.bu_bb_boxes.push({ left: bu_bb_idx, top: cBb.high, bottom: cBb.low, right: bar_index + 10, text: l0.val < l1.val ? "Bu-BB" : "Bu-MB", isBull: true, boxType: "bu_bb" });
                } else if (this.market === -1) {
                    this.msbLines.push({ x1: l1.index, y1: l1.val, x2: l0.index, y2: l1.val, isBull: false });
                    this.msbLabels.push({ x: Math.floor((l1.index + h0.index) / 2), y: l1.val, text: "MSB", isBull: false });

                    var be_ob_idx = findCandle(l1.index, h0i_zz, false);
                    var be_bb_idx = findCandle(h1.index - zigzag_len, l1.index, true);
                    var cBeOb = this.bars[be_ob_idx] || this.bars[bar_index];
                    var cBeBb = this.bars[be_bb_idx] || this.bars[bar_index];

                    this.be_ob_boxes.push({ left: be_ob_idx, top: cBeOb.high, bottom: cBeOb.low, right: bar_index + 10, text: "Be-OB", isBull: false, boxType: "be_ob" });
                    this.be_bb_boxes.push({ left: be_bb_idx, top: cBeBb.high, bottom: cBeBb.low, right: bar_index + 10, text: h0.val > h1.val ? "Be-BB" : "Be-MB", isBull: false, boxType: "be_bb" });
                }
            }

            // 6. Box maintenance (Pine Script array queue: shift when broken)
            for (var bi = 0; bi < this.bu_ob_boxes.length; bi++) {
                var bOb = this.bu_ob_boxes[bi];
                if (!bOb) continue;
                if (close < bOb.bottom) {
                    if (delete_boxes) {
                        this.bu_ob_boxes.shift();
                        bi--;
                    }
                } else {
                    bOb.right = bar_index + 10;
                }
            }
            for (var bi = 0; bi < this.bu_bb_boxes.length; bi++) {
                var bBb = this.bu_bb_boxes[bi];
                if (!bBb) continue;
                if (close < bBb.bottom) {
                    if (delete_boxes) {
                        this.bu_bb_boxes.shift();
                        bi--;
                    }
                } else {
                    bBb.right = bar_index + 10;
                }
            }
            for (var bi = 0; bi < this.be_ob_boxes.length; bi++) {
                var eOb = this.be_ob_boxes[bi];
                if (!eOb) continue;
                if (close > eOb.top) {
                    if (delete_boxes) {
                        this.be_ob_boxes.shift();
                        bi--;
                    }
                } else {
                    eOb.right = bar_index + 10;
                }
            }
            for (var bi = 0; bi < this.be_bb_boxes.length; bi++) {
                var eBb = this.be_bb_boxes[bi];
                if (!eBb) continue;
                if (close > eBb.top) {
                    if (delete_boxes) {
                        this.be_bb_boxes.shift();
                        bi--;
                    }
                } else {
                    eBb.right = bar_index + 10;
                }
            }

            if (typeof setTimeout !== "undefined") {
                if (this._renderTimer) clearTimeout(this._renderTimer);
                var selfTimer = this;
                this._renderTimer = setTimeout(function () {
                    if (!selfTimer._isDestroyed) selfTimer.renderDrawings();
                }, 120);
            }

            return [NaN];
        };
    }
})
