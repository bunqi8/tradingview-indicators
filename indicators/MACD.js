({
    name: "MACD Ultimate MTF",
    metainfo: {
        _metainfoVersion: 52,
        isTVScript: false,
        is_hidden_study: false,
        is_price_study: false,
        isCustomIndicator: true,
        format: { precision: 2, type: "price" },
        id: "MACD_Ultimate_MTF@tv-basicstudies-1",
        scriptIdPart: "",
        name: "MACD Ultimate MTF",
        description: "MACD Ultimate MTF",
        shortDescription: "MACD Ult MTF",
        defaults: {
            styles: {
                plot_0: { linestyle: 0, linewidth: 3, plottype: 0, trackPrice: false, transparency: 0, visible: true, color: "#00E676" },
                plot_1: { linestyle: 0, linewidth: 2, plottype: 0, trackPrice: false, transparency: 0, visible: true, color: "#FFEB3B" },
                plot_2: { linestyle: 0, linewidth: 4, plottype: 1, trackPrice: false, transparency: 0, visible: true, color: "#00E5FF" },
                plot_3: { linestyle: 0, linewidth: 4, plottype: 3, trackPrice: false, transparency: 0, visible: true, color: "#00E676" },
                plot_4: { linestyle: 0, linewidth: 4, plottype: 3, trackPrice: false, transparency: 0, visible: true, color: "#FF5252" }
            },
            palettes: {
                palette_macd: {
                    colors: {
                        0: { color: "#00E676", width: 3, style: 0 }, // Lime (Above Signal)
                        1: { color: "#FF5252", width: 3, style: 0 }  // Red (Below Signal)
                    }
                },
                palette_hist: {
                    colors: {
                        0: { color: "#00E5FF", width: 4, style: 0 }, // Aqua (Bullish Up)
                        1: { color: "#2962FF", width: 4, style: 0 }, // Blue (Bullish Down)
                        2: { color: "#880E4F", width: 4, style: 0 }, // Maroon (Bearish Up)
                        3: { color: "#FF5252", width: 4, style: 0 }  // Red (Bearish Down)
                    }
                }
            },
            inputs: {
                in_0: 12,
                in_1: 26,
                in_2: 9
            },
            bands: [
                { color: "rgba(120, 123, 134, 0.6)", linestyle: 0, linewidth: 1, visible: true, value: 0 }
            ]
        },
        inputs: [
            { id: "in_0", name: "Fast Length", defval: 12, type: "integer", min: 1, max: 2000 },
            { id: "in_1", name: "Slow Length", defval: 26, type: "integer", min: 1, max: 2000 },
            { id: "in_2", name: "Signal Length", defval: 9, type: "integer", min: 1, max: 2000 }
        ],
        plots: [
            { id: "plot_0", type: "line" },
            { id: "plot_1", type: "line" },
            { id: "plot_2", type: "line" },
            { id: "plot_3", type: "line" },
            { id: "plot_4", type: "line" },
            { id: "plot_5", palette: "palette_macd", target: "plot_0", type: "colorer" },
            { id: "plot_6", palette: "palette_hist", target: "plot_2", type: "colorer" }
        ],
        styles: {
            plot_0: { title: "MACD", histogramBase: 0, joinPoints: true, isHidden: false },
            plot_1: { title: "Signal Line", histogramBase: 0, joinPoints: true, isHidden: false },
            plot_2: { title: "Histogram", histogramBase: 0, joinPoints: false, isHidden: false },
            plot_3: { title: "Bullish Cross", histogramBase: 0, joinPoints: false, isHidden: false },
            plot_4: { title: "Bearish Cross", histogramBase: 0, joinPoints: false, isHidden: false }
        },
        bands: [
            { id: "hline_0", name: "0 Line", zorder: -1 }
        ],
        palettes: {
            palette_macd: {
                colors: {
                    0: { name: "MACD Above Signal (Lime)" },
                    1: { name: "MACD Below Signal (Red)" }
                },
                valToIndex: { 0: 0, 1: 1 }
            },
            palette_hist: {
                colors: {
                    0: { name: "Hist Bullish Up (Aqua)" },
                    1: { name: "Hist Bullish Down (Blue)" },
                    2: { name: "Hist Bearish Up (Maroon)" },
                    3: { name: "Hist Bearish Down (Red)" }
                },
                valToIndex: { 0: 0, 1: 1, 2: 2, 3: 3 }
            }
        }
    },
    constructor: function () {
        this.f_histColor = function (hist, prevHist) {
            var change = isNaN(prevHist) ? 0 : (hist - prevHist);
            if (hist > 0) {
                return change > 0 ? 0 : 1; // 0: Aqua, 1: Blue
            } else {
                return change > 0 ? 2 : 3; // 2: Maroon, 3: Red
            }
        };

        this.init = function (ctx, inputCallback) {
            this._context = ctx;
            this._input = inputCallback;
        };

        this.main = function (ctx, inputCallback) {
            this._context = ctx || this._context;
            this._input = inputCallback || this._input;

            var in_fast = 12;
            var in_slow = 26;
            var in_signal = 9;

            if (typeof this._input === "function") {
                var v0 = this._input(0); if (v0 !== undefined) in_fast = Math.max(1, Math.round(Number(v0)));
                var v1 = this._input(1); if (v1 !== undefined) in_slow = Math.max(1, Math.round(Number(v1)));
                var v2 = this._input(2); if (v2 !== undefined) in_signal = Math.max(1, Math.round(Number(v2)));
            }

            if (this._context && typeof this._context.setMinimumAdditionalDepth === "function") {
                this._context.setMinimumAdditionalDepth(Math.max(in_fast, in_slow) + in_signal);
            }

            var close = PineJS.Std.close(this._context);
            var src = this._context.new_var(close);

            var fastMA = PineJS.Std.ema(src, in_fast, this._context);
            var slowMA = PineJS.Std.ema(src, in_slow, this._context);
            var macd = fastMA - slowMA;

            var macdVar = this._context.new_var(macd);
            var signal = PineJS.Std.sma(macdVar, in_signal, this._context);
            var hist = macd - signal;

            var prevMacd = macdVar.get(1);
            var signalVar = this._context.new_var(signal);
            var prevSignal = signalVar.get(1);

            var isCrossUp = (!isNaN(macd) && !isNaN(signal) && !isNaN(prevMacd) && !isNaN(prevSignal) && prevMacd <= prevSignal && macd > signal);
            var isCrossDn = (!isNaN(macd) && !isNaN(signal) && !isNaN(prevMacd) && !isNaN(prevSignal) && prevMacd >= prevSignal && macd < signal);

            var histVar = this._context.new_var(hist);
            var prevHist = histVar.get(1);
            var histColorIdx = this.f_histColor(hist, prevHist);
            var macdColorIdx = (macd >= signal) ? 0 : 1;

            return [
                macd,                                // plot_0: MACD Line
                signal,                              // plot_1: Signal Line
                hist,                                // plot_2: Histogram
                isCrossUp ? signal : NaN,            // plot_3: Bullish Cross Dot (Lime)
                isCrossDn ? signal : NaN,            // plot_4: Bearish Cross Dot (Red)
                macdColorIdx,                        // plot_5: MACD Line 2-Colorer (targets plot_0)
                histColorIdx                         // plot_6: Histogram 4-Colorer (targets plot_2)
            ];
        };
    }
})
