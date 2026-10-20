({
    name: "Market Bottom Vix Fix",
    metainfo: {
        _metainfoVersion: 52,
        isTVScript: false,
        is_hidden_study: false,
        is_price_study: false,
        isCustomIndicator: true,
        format: { precision: 2, type: "price" },
        id: "Market_Bottom_Vix_Fix@tv-basicstudies-1",
        scriptIdPart: "",
        name: "Market Bottom Vix Fix",
        description: "Market Bottom Vix Fix",
        shortDescription: "Market Bottom Vix Fix",
        defaults: {
            styles: {
                plot_0: { linestyle: 0, linewidth: 4, plottype: 0, trackPrice: false, transparency: 0, visible: true, color: "#FF9800" },
                plot_1: { linestyle: 0, linewidth: 4, plottype: 0, trackPrice: false, transparency: 0, visible: true, color: "#FF9800" },
                plot_2: { linestyle: 0, linewidth: 4, plottype: 1, trackPrice: false, transparency: 0, visible: true, color: "#787B86" },
                plot_3: { linestyle: 0, linewidth: 3, plottype: 0, trackPrice: false, transparency: 0, visible: true, color: "#00E5FF" }
            },
            palettes: {
                palette_vix: {
                    colors: {
                        0: { color: "#00E676", width: 4, style: 0 }, // Lime (Market Bottom / High Volatility)
                        1: { color: "#787B86", width: 4, style: 0 }  // Gray (Normal)
                    }
                }
            },
            inputs: {
                in_0: 22,
                in_1: 20,
                in_2: 2.0,
                in_3: 50,
                in_4: 0.85,
                in_5: 1.01,
                in_6: false,
                in_7: false
            }
        },
        inputs: [
            { id: "in_0", name: "LookBack Period Standard Deviation High", defval: 22, type: "integer", min: 1, max: 2000 },
            { id: "in_1", name: "Bolinger Band Length", defval: 20, type: "integer", min: 1, max: 2000 },
            { id: "in_2", name: "Bollinger Band Standard Devaition Up", defval: 2.0, type: "float", min: 1.0, max: 5.0, step: 0.1 },
            { id: "in_3", name: "Look Back Period Percentile High", defval: 50, type: "integer", min: 1, max: 2000 },
            { id: "in_4", name: "Highest Percentile", defval: 0.85, type: "float", min: 0.5, max: 1.5, step: 0.01 },
            { id: "in_5", name: "Lowest Percentile", defval: 1.01, type: "float", min: 0.5, max: 1.5, step: 0.01 },
            { id: "in_6", name: "Show High Range - Based on Percentile and LookBack Period?", defval: false, type: "bool" },
            { id: "in_7", name: "Show Standard Deviation Line?", defval: false, type: "bool" }
        ],
        plots: [
            { id: "plot_0", type: "line" },
            { id: "plot_1", type: "line" },
            { id: "plot_2", type: "line" },
            { id: "plot_3", type: "line" },
            { id: "plot_4", palette: "palette_vix", target: "plot_2", type: "colorer" }
        ],
        styles: {
            plot_0: { title: "Range High Percentile", histogramBase: 0, joinPoints: true, isHidden: false },
            plot_1: { title: "Range Low Percentile", histogramBase: 0, joinPoints: true, isHidden: false },
            plot_2: { title: "Market Bottom Vix Fix", histogramBase: 0, joinPoints: false, isHidden: false },
            plot_3: { title: "Upper Band", histogramBase: 0, joinPoints: true, isHidden: false }
        },
        palettes: {
            palette_vix: {
                colors: {
                    0: { name: "Market Bottom (Lime)" },
                    1: { name: "Normal (Gray)" }
                },
                valToIndex: { 0: 0, 1: 1 }
            }
        }
    },
    constructor: function () {
        this.init = function (ctx, inputCallback) {
            this._context = ctx;
            this._input = inputCallback;
        };

        this.main = function (ctx, inputCallback) {
            this._context = ctx || this._context;
            this._input = inputCallback || this._input;

            var pd = 22;
            var bbl = 20;
            var mult = 2.0;
            var lb = 50;
            var ph = 0.85;
            var pl = 1.01;
            var hp = false;
            var sd = false;

            if (typeof this._input === "function") {
                var v0 = this._input(0); if (v0 !== undefined) pd = Math.max(1, Math.round(Number(v0)));
                var v1 = this._input(1); if (v1 !== undefined) bbl = Math.max(1, Math.round(Number(v1)));
                var v2 = this._input(2); if (v2 !== undefined) mult = Number(v2);
                var v3 = this._input(3); if (v3 !== undefined) lb = Math.max(1, Math.round(Number(v3)));
                var v4 = this._input(4); if (v4 !== undefined) ph = Number(v4);
                var v5 = this._input(5); if (v5 !== undefined) pl = Number(v5);
                var v6 = this._input(6); if (v6 !== undefined) hp = Boolean(v6);
                var v7 = this._input(7); if (v7 !== undefined) sd = Boolean(v7);
            }

            if (this._context && typeof this._context.setMinimumAdditionalDepth === "function") {
                this._context.setMinimumAdditionalDepth(Math.max(pd, bbl, lb) + 1);
            }

            var close = PineJS.Std.close(this._context);
            var low = PineJS.Std.low(this._context);
            var closeVar = this._context.new_var(close);

            var highestClose = PineJS.Std.highest(closeVar, pd, this._context);
            var wvf = 0;
            if (!isNaN(highestClose) && highestClose > 0) {
                wvf = ((highestClose - low) / highestClose) * 100;
            }
            var wvfVar = this._context.new_var(wvf);

            var sDev = mult * PineJS.Std.stdev(wvfVar, bbl, this._context);
            var midLine = PineJS.Std.sma(wvfVar, bbl, this._context);
            var upperBand = midLine + sDev;

            var rangeHigh = PineJS.Std.highest(wvfVar, lb, this._context) * ph;
            var rangeLow = PineJS.Std.lowest(wvfVar, lb, this._context) * pl;

            var isBottom = (wvf >= upperBand || wvf >= rangeHigh);
            var colIdx = isBottom ? 0 : 1; // 0 = Lime (#00E676), 1 = Gray (#787B86)

            return [
                (hp && !isNaN(rangeHigh)) ? rangeHigh : NaN,  // plot_0: Range High Percentile
                (hp && !isNaN(rangeLow)) ? rangeLow : NaN,    // plot_1: Range Low Percentile
                wvf,                                          // plot_2: Williams Vix Fix Histogram
                (sd && !isNaN(upperBand)) ? upperBand : NaN,  // plot_3: Upper Band Line
                colIdx                                        // plot_4: Colorer for plot_2
            ];
        };
    }
})
