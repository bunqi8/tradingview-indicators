({
    name: "SuperTrend AI (Clustering)",
    metainfo: {
        _metainfoVersion: 52,
        isTVScript: false,
        is_hidden_study: false,
        is_price_study: true,
        isCustomIndicator: true,
        format: { precision: 2, type: "price" },
        id: "SuperTrendAI@tv-basicstudies-1",
        scriptIdPart: "",
        name: "SuperTrend AI (Clustering)",
        description: "SuperTrend AI (Clustering)",
        shortDescription: "SuperTrend AI",
        defaults: {
            styles: {
                plot_ts: { plottype: 0, linewidth: 2, color: "#089981", linestyle: 0, trackPrice: false },
                plot_ama: { plottype: 0, linewidth: 1, color: "rgba(8, 153, 129, 0.5)", linestyle: 0, trackPrice: false }
            },
            palettes: {
                tsPalette: {
                    colors: {
                        0: { color: "#089981", width: 2, style: 0 },
                        1: { color: "#F23645", width: 2, style: 0 }
                    }
                },
                amaPalette: {
                    colors: {
                        0: { color: "rgba(8, 153, 129, 0.5)", width: 1, style: 0 },
                        1: { color: "rgba(242, 54, 69, 0.5)", width: 1, style: 0 }
                    }
                },
                barPalette: {
                    colors: [
                        { color: "#089981", width: 1, style: 0 },
                        { color: "#F23645", width: 1, style: 0 }
                    ]
                }
            },
            inputs: {
                in_0: 10,
                in_1: 1,
                in_2: 5,
                in_3: 0.5,
                in_4: 10,
                in_5: "Best",
                in_6: 1000,
                in_7: 10000,
                in_8: true,
                in_9: true,
                in_10: true,
                in_11: "Top Right",
                in_12: "Small"
            }
        },
        plots: [
            { id: "plot_ts", type: "line" },
            { id: "plot_ts_colorer", type: "colorer", target: "plot_ts", palette: "tsPalette" },
            { id: "plot_ama", type: "line" },
            { id: "plot_ama_colorer", type: "colorer", target: "plot_ama", palette: "amaPalette" },
            { id: "plot_bar_colorer", type: "bar_colorer", palette: "barPalette" }
        ],
        palettes: {
            tsPalette: {
                colors: {
                    0: { name: "Bullish Trailing Stop" },
                    1: { name: "Bearish Trailing Stop" }
                }
            },
            amaPalette: {
                colors: {
                    0: { name: "Bullish AMA" },
                    1: { name: "Bearish AMA" }
                }
            },
            barPalette: {
                colors: [
                    { name: "Bullish Bar Color" },
                    { name: "Bearish Bar Color" }
                ],
                valToIndex: {
                    100: 0,
                    200: 1
                }
            }
        },
        styles: {
            plot_ts: { title: "Trailing Stop", histogramBase: 0, joinPoints: false },
            plot_ama: { title: "Trailing Stop AMA", histogramBase: 0, joinPoints: false }
        },
        inputs: [
            { id: "in_0", name: "ATR Length", defval: 10, type: "integer", min: 1 },
            { id: "in_1", name: "Factor Range Min", defval: 1, type: "integer", min: 0 },
            { id: "in_2", name: "Factor Range Max", defval: 5, type: "integer", min: 0 },
            { id: "in_3", name: "Step", defval: 0.5, type: "float", min: 0.1, step: 0.1 },
            { id: "in_4", name: "Performance Memory", defval: 10, type: "float", min: 2 },
            { id: "in_5", name: "From Cluster", defval: "Best", type: "text", options: ["Best", "Average", "Worst"] },
            { id: "in_6", name: "Maximum Iteration Steps", defval: 1000, type: "integer", min: 0, group: "Optimization" },
            { id: "in_7", name: "Historical Bars Calculation", defval: 10000, type: "integer", min: 0, group: "Optimization" },
            { id: "in_8", name: "Candle Coloring", defval: true, type: "bool", group: "Style" },
            { id: "in_9", name: "Show Signals", defval: true, type: "bool", group: "Style" },
            { id: "in_10", name: "Show Dashboard", defval: true, type: "bool", group: "Dashboard" },
            { id: "in_11", name: "Location", defval: "Top Right", type: "text", options: ["Top Right", "Bottom Right", "Bottom Left"], group: "Dashboard" },
            { id: "in_12", name: "Size", defval: "Small", type: "text", options: ["Tiny", "Small", "Normal"], group: "Dashboard" }
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
            if (typeof window !== "undefined") {
                window.__st_ai_closed = false;
            }
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
            this.opens = [];

            this.holderHistory = [];
            this.rmaAtrHistory = [];
            this.denEmaHistory = [];
            this.upperHistory = [];
            this.lowerHistory = [];
            this.osHistory = [];
            this.perfAmaHistory = [];
            this.targetFactorHistory = [];

            this.factors = [];
            this.signals = [];
            this.dashData = null;
            this._showDash = true;
            this._prevShowDash = true;
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
            this.bars = [];
            this.barTimes = [];
            this.closes = [];
            this.highs = [];
            this.lows = [];
            this.opens = [];
            this.holderHistory = [];
            this.rmaAtrHistory = [];
            this.denEmaHistory = [];
            this.upperHistory = [];
            this.lowerHistory = [];
            this.osHistory = [];
            this.perfAmaHistory = [];
            this.targetFactorHistory = [];
            this.factors = [];
            this.signals = [];
            this.dashData = null;
            if (typeof document !== "undefined") {
                var overlay = document.getElementById("st_ai_dashboard_overlay");
                if (overlay) overlay.remove();
            }
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
            return n.indexOf("supertrendai") !== -1 ||
                   d.indexOf("supertrendai") !== -1 ||
                   i.indexOf("supertrendai") !== -1 ||
                   n.indexOf("supertrendclustering") !== -1 ||
                   d.indexOf("supertrendclustering") !== -1;
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
                window.__st_ai_drawnShapeIds = window.__st_ai_drawnShapeIds || [];
                if (window.__st_ai_drawnShapeIds.length > 0) {
                    for (var k = 0; k < window.__st_ai_drawnShapeIds.length; k++) {
                        if (idsToClear.indexOf(window.__st_ai_drawnShapeIds[k]) === -1) {
                            idsToClear.push(window.__st_ai_drawnShapeIds[k]);
                        }
                    }
                    window.__st_ai_drawnShapeIds = [];
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

            if (typeof document !== "undefined") {
                var overlay = document.getElementById("st_ai_dashboard_overlay");
                if (overlay) overlay.remove();
            }
        };

        function attachDrag(overlayEl, selfInst) {
            var header = overlayEl.querySelector("#st_ai_header");
            if (!header) return;

            var btnMin = overlayEl.querySelector("#st_ai_btn_min");
            var btnMax = overlayEl.querySelector("#st_ai_btn_max");
            var btnClose = overlayEl.querySelector("#st_ai_btn_close");

            if (btnMin) {
                btnMin.onmousedown = function (e) { if (e && e.stopPropagation) e.stopPropagation(); };
                btnMin.onclick = function (e) {
                    if (e && e.stopPropagation) e.stopPropagation();
                    if (typeof window !== "undefined") {
                        window.__st_ai_minimized = true;
                    }
                    if (selfInst && typeof selfInst.renderTable === "function") {
                        selfInst.renderTable();
                    }
                };
            }
            if (btnMax) {
                btnMax.onmousedown = function (e) { if (e && e.stopPropagation) e.stopPropagation(); };
                btnMax.onclick = function (e) {
                    if (e && e.stopPropagation) e.stopPropagation();
                    if (typeof window !== "undefined") {
                        window.__st_ai_minimized = false;
                    }
                    if (selfInst && typeof selfInst.renderTable === "function") {
                        selfInst.renderTable();
                    }
                };
            }
            if (btnClose) {
                btnClose.onmousedown = function (e) { if (e && e.stopPropagation) e.stopPropagation(); };
                btnClose.onclick = function (e) {
                    if (e && e.stopPropagation) e.stopPropagation();
                    if (typeof window !== "undefined") {
                        window.__st_ai_closed = true;
                    }
                    var ex = document.getElementById("st_ai_dashboard_overlay");
                    if (ex) ex.remove();
                };
            }

            header.onmousedown = function (e) {
                if (e.target && (e.target.id === "st_ai_btn_min" || e.target.id === "st_ai_btn_max" || e.target.id === "st_ai_btn_close")) {
                    return;
                }
                if (e.preventDefault) e.preventDefault();
                var startX = e.clientX;
                var startY = e.clientY;
                var rect = overlayEl.getBoundingClientRect();
                var parent = overlayEl.offsetParent || document.body;
                var parentRect = parent.getBoundingClientRect();
                var initLeft = rect.left - parentRect.left;
                var initTop = rect.top - parentRect.top;

                overlayEl.style.right = "auto";
                overlayEl.style.bottom = "auto";
                overlayEl.style.left = initLeft + "px";
                overlayEl.style.top = initTop + "px";

                function onMove(ev) {
                    var dx = ev.clientX - startX;
                    var dy = ev.clientY - startY;
                    var newLeft = Math.max(0, initLeft + dx);
                    var newTop = Math.max(0, initTop + dy);
                    overlayEl.style.left = newLeft + "px";
                    overlayEl.style.top = newTop + "px";
                    if (typeof window !== "undefined") {
                        window.__st_ai_customPos = {
                            left: newLeft + "px",
                            top: newTop + "px"
                        };
                    }
                }

                function onUp() {
                    document.removeEventListener("mousemove", onMove);
                    document.removeEventListener("mouseup", onUp);
                }

                document.addEventListener("mousemove", onMove);
                document.addEventListener("mouseup", onUp);
            };
        }

        this.renderTable = function () {
            if (this._isDestroyed || !this.dashData || this._showDash === false) {
                if (typeof document !== "undefined") {
                    var ex = document.getElementById("st_ai_dashboard_overlay");
                    if (ex) ex.remove();
                }
                return;
            }
            if (typeof document === "undefined") return;

            if (typeof window !== "undefined" && window.__st_ai_closed) {
                var exClosed = document.getElementById("st_ai_dashboard_overlay");
                if (exClosed) exClosed.remove();
                return;
            }

            var d = this.dashData;
            var loc = this._dashLoc || "Top Right";
            var sz = this._textSize || "Small";

            var posCss = "top: 55px; right: 75px;";
            if (typeof window !== "undefined" && window.__st_ai_customPos) {
                posCss = "top: " + window.__st_ai_customPos.top + "; left: " + window.__st_ai_customPos.left + "; right: auto; bottom: auto;";
            } else {
                if (loc === "Bottom Right") posCss = "bottom: 45px; right: 75px;";
                else if (loc === "Bottom Left") posCss = "bottom: 45px; left: 75px;";
            }

            var fontPx = sz === "Tiny" ? "10px" : (sz === "Normal" ? "13px" : "11px");
            var padPx = sz === "Tiny" ? "3px 6px" : (sz === "Normal" ? "6px 12px" : "4px 8px");

            var existing = document.getElementById("st_ai_dashboard_overlay");
            if (existing) existing.remove();

            var container = document.getElementById("tv_chart_container") || document.body;
            var overlay = document.createElement("div");
            overlay.id = "st_ai_dashboard_overlay";
            overlay.style.cssText = "position:absolute;" + posCss + "z-index:99;background:rgba(30,34,45,0.98);border:1px solid #373a46;border-radius:6px;box-shadow:0 6px 20px rgba(0,0,0,0.6);font-size:" + fontPx + ";color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,\"Trebuchet MS\",Roboto,Ubuntu,sans-serif;user-select:none;overflow:hidden;pointer-events:auto;min-width:280px;";

            if (typeof window !== "undefined") {
                window.__st_ai_lastInst = this;
            }

            // Minimized view
            if (typeof window !== "undefined" && window.__st_ai_minimized) {
                overlay.innerHTML = '<div id="st_ai_header" style="display:flex;align-items:center;justify-content:space-between;padding:6px 10px;background:#131722;color:#fff;font-weight:bold;cursor:move;">' +
                    '<span style="display:flex;align-items:center;gap:6px;">🤖 <span>SUPERTREND AI</span></span>' +
                    '<div style="display:flex;align-items:center;gap:8px;">' +
                    '<span id="st_ai_btn_max" style="color:#00E676;font-size:14px;padding:0 4px;cursor:pointer;line-height:1;" title="Maximize">＋</span>' +
                    '<span id="st_ai_btn_close" style="color:#888;font-size:14px;padding:0 4px;cursor:pointer;line-height:1;" title="Close">✕</span>' +
                    '</div></div>';
                container.appendChild(overlay);
                attachDrag(overlay, this);
                return;
            }

            // Full Header
            var html = '<div id="st_ai_header" style="display:flex;align-items:center;justify-content:space-between;padding:6px 10px;background:#131722;border-bottom:1px solid #373a46;font-weight:600;letter-spacing:0.3px;cursor:move;">' +
                '<span style="display:flex;align-items:center;gap:6px;">🤖 <span>SuperTrend AI Cluster</span></span>' +
                '<div style="display:flex;align-items:center;gap:10px;">' +
                '<span id="st_ai_btn_min" style="cursor:pointer;color:#888;font-size:14px;line-height:1;padding:0 3px;" title="Minimize">−</span>' +
                '<span id="st_ai_btn_close" style="cursor:pointer;color:#888;font-size:14px;line-height:1;padding:0 3px;" title="Close">✕</span>' +
                '</div></div>';

            // Table Body
            var cellStyleTh = "padding:" + padPx + ";border:1px solid #373a46;color:#ffffff;font-weight:600;white-space:nowrap;";
            var cellStyleTd = "padding:" + padPx + ";border:1px solid #373a46;color:#ffffff;white-space:nowrap;";

            html += '<table style="border-collapse:collapse;width:100%;font-size:inherit;color:#ffffff;">';
            html += '<thead><tr style="background:#1e222d;">' +
                '<th style="' + cellStyleTh + 'text-align:left;">Cluster</th>' +
                '<th style="' + cellStyleTh + 'text-align:center;">Size</th>' +
                '<th style="' + cellStyleTh + 'text-align:center;">Centroid Dispersion</th>' +
                '<th style="' + cellStyleTh + 'text-align:left;">Factors</th>' +
                '</tr></thead>';

            html += '<tbody>';
            // Row 1: Best
            html += '<tr>' +
                '<td style="' + cellStyleTd + 'text-align:left;color:#ffffff;">Best</td>' +
                '<td style="' + cellStyleTd + 'text-align:center;color:#ffffff;">' + d.topN + '</td>' +
                '<td style="' + cellStyleTd + 'text-align:center;color:#ffffff;font-family:monospace;">' + d.dispBest + '</td>' +
                '<td style="' + cellStyleTd + 'text-align:left;color:#ffffff;font-family:monospace;">' + d.factorsBest + '</td>' +
                '</tr>';

            // Row 2: Average
            html += '<tr>' +
                '<td style="' + cellStyleTd + 'text-align:left;color:#ffffff;">Average</td>' +
                '<td style="' + cellStyleTd + 'text-align:center;color:#ffffff;">' + d.midN + '</td>' +
                '<td style="' + cellStyleTd + 'text-align:center;color:#ffffff;font-family:monospace;">' + d.dispMid + '</td>' +
                '<td style="' + cellStyleTd + 'text-align:left;color:#ffffff;font-family:monospace;">' + d.factorsMid + '</td>' +
                '</tr>';

            // Row 3: Worst
            html += '<tr>' +
                '<td style="' + cellStyleTd + 'text-align:left;color:#ffffff;">Worst</td>' +
                '<td style="' + cellStyleTd + 'text-align:center;color:#ffffff;">' + d.btmN + '</td>' +
                '<td style="' + cellStyleTd + 'text-align:center;color:#ffffff;font-family:monospace;">' + d.dispBtm + '</td>' +
                '<td style="' + cellStyleTd + 'text-align:left;color:#ffffff;font-family:monospace;">' + d.factorsWorst + '</td>' +
                '</tr>';

            html += '</tbody></table>';

            overlay.innerHTML = html;
            container.appendChild(overlay);
            attachDrag(overlay, this);
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
                        window.__st_ai_drawnShapeIds = window.__st_ai_drawnShapeIds || [];
                        window.__st_ai_drawnShapeIds.push(sid);
                    }
                }
                if (typeof res.then === "function") {
                    res.then(recordId).catch(function () {});
                } else {
                    recordId(res);
                }
            }

            // 1. Render Signal Score Badges (matching Pine label.new with style_label_up / style_label_down)
            if (this._showSignals !== false) {
                var sigs = this.signals || [];
                var maxSigs = Math.min(500, sigs.length);
                var sigStart = Math.max(0, sigs.length - maxSigs);

                for (var s = sigStart; s < sigs.length; s++) {
                    var sg = sigs[s];
                    var t = barTimes[sg.bar];
                    if (!t) continue;

                    var scoreText = String(sg.score);
                    var isBuy = sg.isBuy;
                    var col = isBuy ? (this._bullCss || "#089981") : (this._bearCss || "#F23645");

                    var ptPrice = sg.ts;

                    (function (ptTime, ptPrice, isBuySig, scoreStr, color) {
                        try {
                            if (typeof chart.createShape === "function") {
                                var shapePromise = chart.createShape({ time: ptTime, price: ptPrice }, {
                                    shape: "text",
                                    text: scoreStr,
                                    lock: true,
                                    disableSelection: true,
                                    disableSave: true,
                                    disableUndo: true,
                                    overrides: {
                                        "color": "#ffffff",
                                        "textColor": "#ffffff",
                                        "fontsize": 9,
                                        "bold": true,
                                        "fillBackground": true,
                                        "backgroundColor": color,
                                        "backgroundTransparency": 0,
                                        "drawBorder": true,
                                        "borderColor": color,
                                        "linewidth": 1
                                    }
                                });

                                if (shapePromise && typeof shapePromise.then === "function") {
                                    shapePromise.then(function (sid) {
                                        track(sid);
                                    }).catch(function () {});
                                } else if (shapePromise) {
                                    track(shapePromise);
                                }
                            }
                        } catch (_) {}
                    })(t, ptPrice, isBuy, scoreText, col);
                }
            }

            // 2. Render Dashboard Table Overlay
            if (this._showDash) {
                this.renderTable();
            } else {
                if (typeof document !== "undefined") {
                    var ex = document.getElementById("st_ai_dashboard_overlay");
                    if (ex) ex.remove();
                }
            }
        };

        function percentile_linear_interpolation(arr, p) {
            if (!arr || arr.length === 0) return 0;
            var sorted = arr.slice().filter(function (v) { return typeof v === "number" && !isNaN(v) && isFinite(v); }).sort(function (a, b) { return a - b; });
            var n = sorted.length;
            if (n === 0) return 0;
            if (n === 1) return sorted[0];
            var rank = (p / 100.0) * (n - 1);
            var k = Math.floor(rank);
            var d = rank - k;
            if (k >= n - 1) return sorted[n - 1];
            if (k < 0) return sorted[0];
            return sorted[k] + d * (sorted[k + 1] - sorted[k]);
        }

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
                this.closes = [];
                this.highs = [];
                this.lows = [];
                this.opens = [];
                this.holderHistory = [];
                this.rmaAtrHistory = [];
                this.denEmaHistory = [];
                this.upperHistory = [];
                this.lowerHistory = [];
                this.osHistory = [];
                this.perfAmaHistory = [];
                this.targetFactorHistory = [];
                this.factors = [];
                this.signals = [];
                this.dashData = null;
                return [NaN, NaN, NaN, NaN, NaN];
            }

            var bar_index = rawIndex;
            var rawTime = PineStd ? PineStd.time(this._context) : Date.now();
            var timeSec = rawTime > 1e11 ? Math.floor(rawTime / 1000) : Math.floor(rawTime);
            var open = PineStd ? PineStd.open(this._context) : 0;
            var high = PineStd ? PineStd.high(this._context) : 0;
            var low = PineStd ? PineStd.low(this._context) : 0;
            var close = PineStd ? PineStd.close(this._context) : 0;
            var hl2 = (high + low) / 2.0;

            if (!this.bars || bar_index === 0) {
                this.bars = [];
                this.barTimes = [];
                this.closes = [];
                this.highs = [];
                this.lows = [];
                this.opens = [];
                this.holderHistory = [];
                this.rmaAtrHistory = [];
                this.denEmaHistory = [];
                this.upperHistory = [];
                this.lowerHistory = [];
                this.osHistory = [];
                this.perfAmaHistory = [];
                this.targetFactorHistory = [];
                this.factors = [];
                this.signals = [];
                this.dashData = null;
            }

            if (this.bars.length > bar_index) {
                this.bars.length = bar_index;
                this.barTimes.length = bar_index;
                this.closes.length = bar_index;
                this.highs.length = bar_index;
                this.lows.length = bar_index;
                this.opens.length = bar_index;
                this.holderHistory.length = bar_index;
                this.rmaAtrHistory.length = bar_index;
                this.denEmaHistory.length = bar_index;
                this.upperHistory.length = bar_index;
                this.lowerHistory.length = bar_index;
                this.osHistory.length = bar_index;
                this.perfAmaHistory.length = bar_index;
                this.targetFactorHistory.length = bar_index;
                while (this.signals.length > 0 && this.signals[this.signals.length - 1].bar >= bar_index) {
                    this.signals.pop();
                }
            }

            var getInp = function (idx, def) {
                var v = typeof inputCallback === "function" ? inputCallback(idx) : undefined;
                return v !== undefined ? v : def;
            };

            var length = Math.max(1, Math.round(Number(getInp(0, 10))));
            var minMult = Math.max(0, Number(getInp(1, 1)));
            var maxMult = Math.max(0, Number(getInp(2, 5)));
            if (minMult > maxMult) {
                var tmp = minMult; minMult = maxMult; maxMult = tmp;
            }
            var step = Math.max(0.1, Number(getInp(3, 0.5)));
            var perfAlpha = Math.max(2, Number(getInp(4, 10)));
            var fromCluster = String(getInp(5, "Best"));
            var maxIter = Math.max(0, Math.round(Number(getInp(6, 1000))));
            var maxData = Math.max(0, Math.round(Number(getInp(7, 10000))));

            var showGradient = Boolean(getInp(8, true));
            var showSignals = Boolean(getInp(9, true));
            var showDash = Boolean(getInp(10, true));
            var dashLoc = String(getInp(11, "Top Right"));
            var textSize = String(getInp(12, "Small"));

            var bullCss = "#089981";
            var bearCss = "#F23645";

            this._bullCss = bullCss;
            this._bearCss = bearCss;
            this._dashLoc = dashLoc;
            this._textSize = textSize;
            this._showSignals = showSignals;

            // Handle Show Dashboard setting changes
            if (this._prevShowDash === false && showDash === true) {
                if (typeof window !== "undefined") {
                    window.__st_ai_closed = false;
                }
            }
            if (this._prevDashLoc !== undefined && this._prevDashLoc !== dashLoc) {
                if (typeof window !== "undefined") {
                    window.__st_ai_customPos = null;
                }
            }
            this._prevShowDash = showDash;
            this._prevDashLoc = dashLoc;
            this._showDash = showDash;

            this.bars[bar_index] = { open: open, high: high, low: low, close: close, time: timeSec };
            this.barTimes[bar_index] = timeSec;
            this.closes[bar_index] = close;
            this.highs[bar_index] = high;
            this.lows[bar_index] = low;
            this.opens[bar_index] = open;

            // 1. Initialize factor range and factors array
            if (this.factors.length === 0) {
                this.factors = [];
                var numSteps = Math.floor((maxMult - minMult) / step);
                for (var fIdx = 0; fIdx <= numSteps; fIdx++) {
                    this.factors.push(minMult + fIdx * step);
                }
            }

            // 2. ATR Calculation (Pine ta.atr(length) - RMA of TR)
            var prevClose = (bar_index > 0 && typeof this.closes[bar_index - 1] === "number" && !isNaN(this.closes[bar_index - 1])) ? this.closes[bar_index - 1] : close;
            var tr = (bar_index === 0) ? (high - low) : Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
            if (isNaN(tr)) tr = 0;

            var prevRmaAtr = (bar_index > 0 && typeof this.rmaAtrHistory[bar_index - 1] === "number" && !isNaN(this.rmaAtrHistory[bar_index - 1])) ? this.rmaAtrHistory[bar_index - 1] : tr;
            var currentRmaAtr = (bar_index === 0) ? tr : (prevRmaAtr * (length - 1) + tr) / length;
            this.rmaAtrHistory[bar_index] = currentRmaAtr;
            var atr = currentRmaAtr;

            // 3. Multi-Factor Supertrend Calculation with Bar Snapshotting
            var alphaPerf = 2.0 / (perfAlpha + 1.0);
            var prevHolder = (bar_index > 0 && this.holderHistory[bar_index - 1]) ? this.holderHistory[bar_index - 1] : null;
            var currentHolder = [];

            for (var k = 0; k < this.factors.length; k++) {
                var factor = this.factors[k];
                var prevSpt = prevHolder ? prevHolder[k] : {
                    upper: hl2,
                    lower: hl2,
                    output: hl2,
                    perf: 0,
                    factor: factor,
                    trend: 0
                };

                var up = hl2 + atr * factor;
                var dn = hl2 - atr * factor;

                var prevSptUpper = (typeof prevSpt.upper === "number" && !isNaN(prevSpt.upper)) ? prevSpt.upper : hl2;
                var prevSptLower = (typeof prevSpt.lower === "number" && !isNaN(prevSpt.lower)) ? prevSpt.lower : hl2;
                var prevSptOutput = (typeof prevSpt.output === "number" && !isNaN(prevSpt.output)) ? prevSpt.output : hl2;

                var trend = close > prevSptUpper ? 1 : (close < prevSptLower ? 0 : prevSpt.trend);
                var sptUpper = (bar_index > 0 && prevClose < prevSptUpper) ? Math.min(up, prevSptUpper) : up;
                var sptLower = (bar_index > 0 && prevClose > prevSptLower) ? Math.max(dn, prevSptLower) : dn;

                var diff = (bar_index > 0) ? Math.sign(prevClose - prevSptOutput) : 0;
                var priceDiff = (bar_index > 0) ? (close - prevClose) : 0;
                var prevPerf = (typeof prevSpt.perf === "number" && !isNaN(prevSpt.perf)) ? prevSpt.perf : 0;
                var perf = prevPerf + alphaPerf * (priceDiff * diff - prevPerf);
                if (isNaN(perf) || !isFinite(perf)) perf = 0;

                var sptOutput = trend === 1 ? sptLower : sptUpper;

                currentHolder.push({
                    upper: sptUpper,
                    lower: sptLower,
                    output: sptOutput,
                    perf: perf,
                    factor: factor,
                    trend: trend
                });
            }
            this.holderHistory[bar_index] = currentHolder;

            // 4. K-Means Clustering on Factor Performance
            var data = [];
            var factor_array = [];
            for (var hIdx = 0; hIdx < currentHolder.length; hIdx++) {
                data.push(currentHolder[hIdx].perf);
                factor_array.push(currentHolder[hIdx].factor);
            }

            var centroids = [
                percentile_linear_interpolation(data, 25),
                percentile_linear_interpolation(data, 50),
                percentile_linear_interpolation(data, 75)
            ];

            var factors_clusters = [[], [], []];
            var perfclusters = [[], [], []];

            for (var iter = 0; iter <= maxIter; iter++) {
                factors_clusters = [[], [], []];
                perfclusters = [[], [], []];

                for (var dIdx = 0; dIdx < data.length; dIdx++) {
                    var val = data[dIdx];
                    var fVal = factor_array[dIdx];
                    var dist = [
                        Math.abs(val - centroids[0]),
                        Math.abs(val - centroids[1]),
                        Math.abs(val - centroids[2])
                    ];
                    var minD = Math.min(dist[0], dist[1], dist[2]);
                    var idx = (dist[0] === minD) ? 0 : ((dist[1] === minD) ? 1 : 2);

                    perfclusters[idx].push(val);
                    factors_clusters[idx].push(fVal);
                }

                var new_centroids = [
                    perfclusters[0].length > 0 ? (perfclusters[0].reduce(function (a, b) { return a + b; }, 0) / perfclusters[0].length) : centroids[0],
                    perfclusters[1].length > 0 ? (perfclusters[1].reduce(function (a, b) { return a + b; }, 0) / perfclusters[1].length) : centroids[1],
                    perfclusters[2].length > 0 ? (perfclusters[2].reduce(function (a, b) { return a + b; }, 0) / perfclusters[2].length) : centroids[2]
                ];

                if (new_centroids[0] === centroids[0] && new_centroids[1] === centroids[1] && new_centroids[2] === centroids[2]) {
                    break;
                }
                centroids = new_centroids;
            }

            // 5. Signals and Target Supertrend
            // In Pine Script: 'Best' => 2, 'Average' => 1, 'Worst' => 0
            var from = fromCluster === "Best" ? 2 : (fromCluster === "Average" ? 1 : 0);

            // Denominator: EMA of abs(close - close[1]) with length perfAlpha
            var absDiff = (bar_index > 0) ? Math.abs(close - prevClose) : 0;
            var prevDenEma = (bar_index > 0 && typeof this.denEmaHistory[bar_index - 1] === "number" && !isNaN(this.denEmaHistory[bar_index - 1])) ? this.denEmaHistory[bar_index - 1] : absDiff;
            var alphaDen = 2.0 / (Math.round(perfAlpha) + 1.0);
            var currentDenEma = (bar_index === 0) ? absDiff : (alphaDen * absDiff + (1.0 - alphaDen) * prevDenEma);
            this.denEmaHistory[bar_index] = currentDenEma;
            var den = currentDenEma;

            var targetClusterFactors = factors_clusters[from];
            var targetClusterPerf = perfclusters[from];

            var prevTargetFactor = (bar_index > 0 && typeof this.targetFactorHistory[bar_index - 1] === "number" && !isNaN(this.targetFactorHistory[bar_index - 1])) ? this.targetFactorHistory[bar_index - 1] : ((minMult + maxMult) / 2.0);
            var target_factor = prevTargetFactor;
            if (targetClusterFactors && targetClusterFactors.length > 0) {
                var sumF = targetClusterFactors.reduce(function (a, b) { return a + b; }, 0);
                target_factor = sumF / targetClusterFactors.length;
            }
            this.targetFactorHistory[bar_index] = target_factor;

            var perf_idx = 0;
            if (targetClusterPerf && targetClusterPerf.length > 0 && den > 0) {
                var sumP = targetClusterPerf.reduce(function (a, b) { return a + b; }, 0);
                var avgP = sumP / targetClusterPerf.length;
                perf_idx = Math.max(avgP, 0) / den;
            }

            // Adaptive Supertrend
            var finalUp = hl2 + atr * target_factor;
            var finalDn = hl2 - atr * target_factor;

            var prevUpper = (bar_index > 0 && typeof this.upperHistory[bar_index - 1] === "number" && !isNaN(this.upperHistory[bar_index - 1])) ? this.upperHistory[bar_index - 1] : hl2;
            var prevLower = (bar_index > 0 && typeof this.lowerHistory[bar_index - 1] === "number" && !isNaN(this.lowerHistory[bar_index - 1])) ? this.lowerHistory[bar_index - 1] : hl2;
            var prevOs = (bar_index > 0 && typeof this.osHistory[bar_index - 1] === "number") ? this.osHistory[bar_index - 1] : 0;

            var currentUpper = (bar_index > 0 && prevClose < prevUpper) ? Math.min(finalUp, prevUpper) : finalUp;
            var currentLower = (bar_index > 0 && prevClose > prevLower) ? Math.max(finalDn, prevLower) : finalDn;
            var currentOs = close > currentUpper ? 1 : (close < currentLower ? 0 : prevOs);
            var ts = currentOs === 1 ? currentLower : currentUpper;

            this.upperHistory[bar_index] = currentUpper;
            this.lowerHistory[bar_index] = currentLower;
            this.osHistory[bar_index] = currentOs;

            // Trailing stop Adaptive MA (perf_ama)
            var prevPerfAma = (bar_index > 0 && typeof this.perfAmaHistory[bar_index - 1] === "number" && !isNaN(this.perfAmaHistory[bar_index - 1])) ? this.perfAmaHistory[bar_index - 1] : ts;
            var currentPerfAma = (bar_index === 0 || isNaN(prevPerfAma)) ? ts : (prevPerfAma + perf_idx * (ts - prevPerfAma));
            this.perfAmaHistory[bar_index] = currentPerfAma;

            // Signal trigger: os > prevOs (Buy), os < prevOs (Sell)
            var isBuy = (currentOs > prevOs && bar_index > 0);
            var isSell = (currentOs < prevOs && bar_index > 0);

            if (showSignals && (isBuy || isSell)) {
                this.signals.push({
                    bar: bar_index,
                    ts: ts,
                    isBuy: isBuy,
                    score: Math.floor(perf_idx * 10)
                });
            }

            // Store dashboard statistics for last bar
            // In Pine Script: Best is cluster 2, Average is cluster 1, Worst is cluster 0
            var topN = perfclusters[2].length;
            var midN = perfclusters[1].length;
            var btmN = perfclusters[0].length;

            var calcDisp = function (clusterArr, centroidVal, denom) {
                if (denom <= 1 || !clusterArr || clusterArr.length <= 1) return "0";
                var disp = 0;
                for (var cI = 0; cI < clusterArr.length; cI++) {
                    disp += Math.abs(clusterArr[cI] - centroidVal);
                }
                var val = disp / denom;
                if (val === 0 || Math.abs(val) < 1e-6 || isNaN(val)) return "0";
                var rounded = Number(val.toFixed(4));
                return (rounded === 0) ? "0" : rounded.toString();
            };

            this.dashData = {
                topN: topN,
                midN: midN,
                btmN: btmN,
                dispBest: calcDisp(perfclusters[2], centroids[2], topN),
                dispMid: calcDisp(perfclusters[1], centroids[1], midN),
                dispBtm: calcDisp(perfclusters[0], centroids[0], btmN),
                factorsBest: "[" + factors_clusters[2].join(", ") + "]",
                factorsMid: "[" + factors_clusters[1].join(", ") + "]",
                factorsWorst: "[" + factors_clusters[0].join(", ") + "]"
            };

            // Schedule drawing refresh
            if (typeof setTimeout !== "undefined") {
                if (this._renderTimer) clearTimeout(this._renderTimer);
                var selfTimer = this;
                this._renderTimer = setTimeout(function () {
                    if (!selfTimer._isDestroyed) selfTimer.renderDrawings();
                }, 100);
            }

            // Plot outputs:
            // 1. Trailing Stop line: return ts, color NaN on trend flip matching Pine: os != os[1] ? na : css
            var tsPlot = ts;
            var tsColorIdx = (currentOs !== prevOs && bar_index > 0) ? NaN : (currentOs === 1 ? 0 : 1);

            // 2. Trailing Stop AMA line: return currentPerfAma, color NaN on cross matching Pine: ta.cross(close, perf_ama) ? na : ...
            var amaCross = bar_index > 0 && ((close > currentPerfAma && prevClose <= prevPerfAma) || (close < currentPerfAma && prevClose >= prevPerfAma));
            var amaPlot = currentPerfAma;
            var amaColorIdx = amaCross ? NaN : (close > currentPerfAma ? 0 : 1);

            // 3. Bar colorer
            var barColorVal = showGradient ? (currentOs === 1 ? 100 : 200) : NaN;

            return [
                tsPlot,
                tsColorIdx,
                amaPlot,
                amaColorIdx,
                barColorVal
            ];
        };
    }
})
