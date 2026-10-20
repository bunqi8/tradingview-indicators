({
    name: "Squeeze Momentum Indicator",
    metainfo: {
        _metainfoVersion: 52,
        isTVScript: false,
        is_hidden_study: false,
        is_price_study: false,
        isCustomIndicator: true,
        format: { precision: 4, type: "price" },
        id: "SqueezeMomentum@tv-basicstudies-1",
        scriptIdPart: "",
        name: "Squeeze Momentum Indicator",
        description: "Squeeze Momentum Indicator",
        shortDescription: "Squeeze Momentum",
        defaults: {
            styles: {
                plot_val: {
                    plottype: 1, // 1 = LineStudyPlotStyle.Histogram
                    linewidth: 4,
                    color: "#00E676",
                    linestyle: 0,
                    trackPrice: false,
                    transparency: 0,
                    visible: true
                },
                plot_squeeze: {
                    plottype: 3, // 3 = LineStudyPlotStyle.Cross (matches Pine style=cross)
                    linewidth: 2,
                    color: "#000000",
                    linestyle: 0,
                    trackPrice: false,
                    transparency: 0,
                    visible: true
                }
            },
            palettes: {
                histPalette: {
                    colors: {
                        0: { color: "#00E676", width: 4, style: 0 }, // Lime (Bullish Increasing)
                        1: { color: "#4CAF50", width: 4, style: 0 }, // Green (Bullish Decreasing)
                        2: { color: "#FF5252", width: 4, style: 0 }, // Red (Bearish Increasing)
                        3: { color: "#880E4F", width: 4, style: 0 }  // Maroon (Bearish Decreasing)
                    }
                },
                sqzPalette: {
                    colors: {
                        0: { color: "#000000", width: 2, style: 0 }, // Squeeze ON (Black)
                        1: { color: "#787B86", width: 2, style: 0 }, // Squeeze OFF (Gray)
                        2: { color: "#2196F3", width: 2, style: 0 }  // No Squeeze (Blue)
                    }
                }
            },
            inputs: {
                in_length: 20,
                in_mult: 2.0,
                in_lengthKC: 20,
                in_multKC: 1.5,
                in_useTrueRange: true
            }
        },
        inputs: [
            { id: "in_length", name: "BB Length", defval: 20, type: "integer", min: 1, max: 2000 },
            { id: "in_mult", name: "BB MultFactor", defval: 2.0, type: "float", min: 0.1, max: 50.0, step: 0.1 },
            { id: "in_lengthKC", name: "KC Length", defval: 20, type: "integer", min: 1, max: 2000 },
            { id: "in_multKC", name: "KC MultFactor", defval: 1.5, type: "float", min: 0.1, max: 50.0, step: 0.1 },
            { id: "in_useTrueRange", name: "Use TrueRange (KC)", defval: true, type: "bool" }
        ],
        plots: [
            { id: "plot_val", type: "line" },
            { id: "plot_val_color", type: "colorer", target: "plot_val", palette: "histPalette" },
            { id: "plot_squeeze", type: "line" },
            { id: "plot_squeeze_color", type: "colorer", target: "plot_squeeze", palette: "sqzPalette" }
        ],
        styles: {
            plot_val: { title: "Momentum Histogram", histogramBase: 0, joinPoints: false },
            plot_squeeze: { title: "Squeeze Cross", histogramBase: 0, joinPoints: false }
        },
        palettes: {
            histPalette: {
                colors: {
                    0: { name: "Momentum Up (Increasing)" },
                    1: { name: "Momentum Up (Decreasing)" },
                    2: { name: "Momentum Down (Increasing)" },
                    3: { name: "Momentum Down (Decreasing)" }
                },
                valToIndex: {
                    0: 0,
                    1: 1,
                    2: 2,
                    3: 3
                }
            },
            sqzPalette: {
                colors: {
                    0: { name: "Squeeze ON" },
                    1: { name: "Squeeze OFF" },
                    2: { name: "No Squeeze" }
                },
                valToIndex: {
                    0: 0,
                    1: 1,
                    2: 2
                }
            }
        }
    },
    constructor: function () {
        this.init = function (ctx, get_input) {
            this._context = ctx;
            this._input = get_input;
            this.bars = [];
        };

        this.main = function (ctx, get_input) {
            this._context = ctx || this._context;
            this._input = get_input || this._input;

            var in_length = 20;
            var in_mult = 2.0;
            var in_lengthKC = 20;
            var in_multKC = 1.5;
            var in_useTrueRange = true;

            if (typeof this._input === "function") {
                var v0 = this._input(0); if (v0 !== undefined) in_length = v0;
                var v1 = this._input(1); if (v1 !== undefined) in_mult = v1;
                var v2 = this._input(2); if (v2 !== undefined) in_lengthKC = v2;
                var v3 = this._input(3); if (v3 !== undefined) in_multKC = v3;
                var v4 = this._input(4); if (v4 !== undefined) in_useTrueRange = v4;
            }

            var bar_index = PineJS.Std.n(this._context);
            var open = PineJS.Std.open(this._context);
            var high = PineJS.Std.high(this._context);
            var low = PineJS.Std.low(this._context);
            var close = PineJS.Std.close(this._context);

            if (!this.bars || bar_index === 0) {
                this.bars = [];
            }

            // Truncate future bars if engine rewinds on bar tick updates
            if (this.bars.length > bar_index) {
                this.bars.length = bar_index;
            }

            // Calculate True Range (matches Pine Script `tr`)
            var tr = high - low;
            if (bar_index > 0 && this.bars[bar_index - 1]) {
                var prevClose = this.bars[bar_index - 1].close;
                tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
            }
            var range = in_useTrueRange ? tr : (high - low);

            this.bars[bar_index] = {
                open: open,
                high: high,
                low: low,
                close: close,
                range: range,
                diff: NaN,
                val: NaN
            };

            // 1. Keltner Channels & diff series calculation (ready at bar_index >= in_lengthKC - 1)
            if (bar_index >= in_lengthKC - 1) {
                var sumCloseKC = 0;
                var sumRangeKC = 0;
                var maxHigh = -Infinity;
                var minLow = Infinity;
                for (var i = bar_index - in_lengthKC + 1; i <= bar_index; i++) {
                    sumCloseKC += this.bars[i].close;
                    sumRangeKC += this.bars[i].range;
                    if (this.bars[i].high > maxHigh) maxHigh = this.bars[i].high;
                    if (this.bars[i].low < minLow) minLow = this.bars[i].low;
                }
                var ma = sumCloseKC / in_lengthKC;
                var rangema = sumRangeKC / in_lengthKC;
                var upperKC = ma + rangema * in_multKC;
                var lowerKC = ma - rangema * in_multKC;

                var avgHL = (maxHigh + minLow) / 2.0;
                var avgHL_SMA = (avgHL + ma) / 2.0;
                this.bars[bar_index].diff = close - avgHL_SMA;
                this.bars[bar_index].upperKC = upperKC;
                this.bars[bar_index].lowerKC = lowerKC;
            }

            // 2. Bollinger Bands & Squeeze Dots condition
            // In Pine Script, prior to warmup, noSqz is true (since BB and KC are na), producing blue dots.
            var sqzColorIdx = 2; // Default: Blue (No Squeeze)
            if (bar_index >= in_length - 1 && bar_index >= in_lengthKC - 1) {
                var sumCloseBB = 0;
                for (var i = bar_index - in_length + 1; i <= bar_index; i++) {
                    sumCloseBB += this.bars[i].close;
                }
                var basis = sumCloseBB / in_length;

                var sumSq = 0;
                for (var i = bar_index - in_length + 1; i <= bar_index; i++) {
                    var d = this.bars[i].close - basis;
                    sumSq += d * d;
                }
                var stdev = Math.sqrt(sumSq / in_length); // Population standard deviation (Pine default biased=true)

                // Pine script line 17: dev = multKC * stdev(source, length)
                var bbMultiplier = (in_mult !== 2.0 && in_multKC === 1.5) ? in_mult : in_multKC;
                var dev = bbMultiplier * stdev;
                var upperBB = basis + dev;
                var lowerBB = basis - dev;

                var uKC = this.bars[bar_index].upperKC;
                var lKC = this.bars[bar_index].lowerKC;

                // Squeeze ON: Bollinger Bands inside Keltner Channels
                var sqzOn = (lowerBB > lKC) && (upperBB < uKC);
                // Squeeze OFF: Bollinger Bands outside Keltner Channels
                var sqzOff = (lowerBB < lKC) && (upperBB > uKC);
                // No Squeeze: transitional state
                var noSqz = (!sqzOn && !sqzOff);

                if (noSqz) {
                    sqzColorIdx = 2; // Blue (No Squeeze)
                } else if (sqzOn) {
                    sqzColorIdx = 0; // Black (Squeeze ON)
                } else {
                    sqzColorIdx = 1; // Gray (Squeeze OFF)
                }
            }

            // 3. Momentum Histogram (Linear Regression of oscillator diff)
            // diff is only available starting at bar (in_lengthKC - 1).
            // ta.linreg(diff, in_lengthKC, 0) requires in_lengthKC valid diff values,
            // so it produces valid results only starting at bar_index >= 2 * in_lengthKC - 2.
            var valOut = NaN;
            var valColorIdx = NaN;

            if (bar_index >= 2 * in_lengthKC - 2) {
                // Closed-form exact Ordinary Least Squares (OLS) linear regression
                var sumLin = 0;
                var startIdx = bar_index - in_lengthKC + 1;
                for (var i = 0; i < in_lengthKC; i++) {
                    sumLin += (3 * i - in_lengthKC + 2) * this.bars[startIdx + i].diff;
                }
                valOut = (2 * sumLin) / (in_lengthKC * (in_lengthKC + 1));
                this.bars[bar_index].val = valOut;

                // Previous bar's val (matches Pine nz(val[1]))
                var prevVal = (bar_index > 0 && this.bars[bar_index - 1] && !isNaN(this.bars[bar_index - 1].val))
                    ? this.bars[bar_index - 1].val
                    : 0.0;

                // Coloring matching original Pine Script:
                // bcolor = iff( val > 0, iff( val > nz(val[1]), lime, green), iff( val < nz(val[1]), red, maroon))
                if (valOut > 0) {
                    valColorIdx = (valOut > prevVal) ? 0 : 1; // 0 = Lime (#00E676), 1 = Green (#4CAF50)
                } else {
                    valColorIdx = (valOut < prevVal) ? 2 : 3; // 2 = Red (#FF5252), 3 = Maroon (#880E4F)
                }
            }

            return [valOut, valColorIdx, 0, sqzColorIdx];
        };
    }
})
