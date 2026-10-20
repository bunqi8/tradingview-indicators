({
    name: "CM_Ultimate_MA_MTF_V2",
    metainfo: {
        _metainfoVersion: 52,
        isTVScript: false,
        is_hidden_study: false,
        is_price_study: true,
        isCustomIndicator: true,
        format: { precision: 2, type: "price" },
        id: "CM_Ultimate_MA_MTF_V2@tv-basicstudies-1",
        scriptIdPart: "",
        name: "CM_Ultimate_MA_MTF_V2",
        description: "CM_Ultimate_MA_MTF_V2",
        shortDescription: "CM_Ultimate_MA",
        defaults: {
            styles: {
                plot_out1: { plottype: 0, linewidth: 3, color: "#089981", linestyle: 0, visible: true, trackPrice: false },
                plot_out2: { plottype: 5, linewidth: 3, color: "#F23645", linestyle: 0, visible: true, trackPrice: false },
                plot_cross: { plottype: "shape_cross", location: "Absolute", color: "#00BCD4", size: "normal", visible: true }
            },
            palettes: {
                ma1Palette: {
                    colors: {
                        0: { color: "#089981", width: 3, style: 0 },
                        1: { color: "#F23645", width: 3, style: 0 },
                        2: { color: "#00BCD4", width: 3, style: 0 }
                    }
                },
                ma2Palette: {
                    colors: {
                        0: { color: "#089981", width: 3, style: 0 },
                        1: { color: "#F23645", width: 3, style: 0 },
                        2: { color: "#00BCD4", width: 3, style: 0 },
                        3: { color: "#FFFFFF", width: 3, style: 0 }
                    }
                },
                barPalette: {
                    colors: [
                        { color: "#FFD600", width: 1, style: 0 }
                    ]
                }
            },
            inputs: {
                in_0: true,
                in_1: 20,
                in_2: 7,
                in_3: 1,
                in_4: false,
                in_5: true,
                in_6: 2,
                in_7: false,
                in_8: false,
                in_9: 50,
                in_10: 7,
                in_11: 1,
                in_12: true,
                in_13: false
            }
        },
        plots: [
            { id: "plot_out1", type: "line" },
            { id: "plot_out1_color", type: "colorer", target: "plot_out1", palette: "ma1Palette" },
            { id: "plot_out2", type: "line" },
            { id: "plot_out2_color", type: "colorer", target: "plot_out2", palette: "ma2Palette" },
            { id: "plot_cross", type: "shapes" },
            { id: "plot_bar_colorer", type: "bar_colorer", palette: "barPalette" }
        ],
        styles: {
            plot_out1: { title: "Multi-Timeframe Moving Avg", histogramBase: 0, joinPoints: false },
            plot_out2: { title: "2nd Multi-TimeFrame Moving Average", histogramBase: 0, joinPoints: false },
            plot_cross: { title: "Cross of Both MAs", isHidden: false }
        },
        palettes: {
            ma1Palette: {
                colors: {
                    0: { name: "Up Trend Color (Lime)" },
                    1: { name: "Down Trend Color (Red)" },
                    2: { name: "Neutral Color (Aqua)" }
                }
            },
            ma2Palette: {
                colors: {
                    0: { name: "MA2 Up Color (Lime)" },
                    1: { name: "MA2 Down Color (Red)" },
                    2: { name: "MA2 Neutral Color (Aqua)" },
                    3: { name: "MA2 Static Color (White)" }
                }
            },
            barPalette: {
                colors: [
                    { name: "Price Crossing Bar Color (Yellow)" }
                ],
                valToIndex: {
                    100: 0
                }
            }
        },
        inputs: [
            { id: "in_0", name: "Use Current Chart Resolution?", defval: true, type: "bool" },
            { id: "in_1", name: "Moving Average Length - LookBack Period", defval: 20, type: "integer", min: 1 },
            { id: "in_2", name: "Tilson T3 Factor - *.10 - so 7 = .7 etc.", defval: 7, type: "float", min: 0 },
            { id: "in_3", name: "MA Type: 1=SMA, 2=EMA, 3=WMA, 4=HullMA, 5=VWMA, 6=RMA, 7=TEMA, 8=Tilson T3", defval: 1, type: "integer", min: 1, max: 8 },
            { id: "in_4", name: "Show Price Crossing 1st Mov Avg - Highlight Bar?", defval: false, type: "bool" },
            { id: "in_5", name: "Change Color Based On Direction?", defval: true, type: "bool" },
            { id: "in_6", name: "Color Smoothing - Setting 1 = No Smoothing", defval: 2, type: "integer", min: 1, max: 10 },
            { id: "in_7", name: "Optional 2nd Moving Average", defval: false, type: "bool" },
            { id: "in_8", name: "Show Price Crossing 2nd Mov Avg?", defval: false, type: "bool" },
            { id: "in_9", name: "Moving Average Length - Optional 2nd MA", defval: 50, type: "integer", min: 1 },
            { id: "in_10", name: "Tilson T3 Factor - 2nd MA - *.10", defval: 7, type: "float", min: 0 },
            { id: "in_11", name: "2nd MA Type: 1=SMA, 2=EMA, 3=WMA, 4=HullMA, 5=VWMA, 6=RMA, 7=TEMA, 8=Tilson T3", defval: 1, type: "integer", min: 1, max: 8 },
            { id: "in_12", name: "Change Color Based On Direction 2nd MA?", defval: true, type: "bool" },
            { id: "in_13", name: "Show Dots on Cross of Both MA's", defval: false, type: "bool" }
        ]
    },
    constructor: function () {
        this.init = function (ctx, get_input) {
            this._context = ctx;
            this._input = get_input;

            this.bars = [];
            this.closes = [];
            this.opens = [];
            this.volumes = [];

            this.out1History = [];
            this.out2History = [];

            // Rolling state for MA1
            this.ma1State = {
                prevEma: NaN,
                prevRma: NaN,
                prevE1: NaN, prevE2: NaN, prevE3: NaN,
                prevT1: NaN, prevT2: NaN, prevT3: NaN, prevT4: NaN, prevT5: NaN, prevT6: NaN,
                hullDiffHistory: []
            };

            // Rolling state for MA2
            this.ma2State = {
                prevEma: NaN,
                prevRma: NaN,
                prevE1: NaN, prevE2: NaN, prevE3: NaN,
                prevT1: NaN, prevT2: NaN, prevT3: NaN, prevT4: NaN, prevT5: NaN, prevT6: NaN,
                hullDiffHistory: []
            };

            this.stateHistory1 = [];
            this.stateHistory2 = [];
        };

        function cloneState(s) {
            return {
                prevEma: s.prevEma,
                prevRma: s.prevRma,
                prevE1: s.prevE1, prevE2: s.prevE2, prevE3: s.prevE3,
                prevT1: s.prevT1, prevT2: s.prevT2, prevT3: s.prevT3, prevT4: s.prevT4, prevT5: s.prevT5, prevT6: s.prevT6,
                hullDiffHistory: s.hullDiffHistory.slice()
            };
        }

        function calculateMovingAverage(closes, volumes, b, atype, len, factorT3, st) {
            var src = closes[b];
            var val = src;

            if (atype === 1) { // 1 = SMA
                var s = 0, count = 0;
                for (var i = 0; i < len && (b - i) >= 0; i++) {
                    s += closes[b - i];
                    count++;
                }
                val = count > 0 ? (s / count) : src;
            } else if (atype === 2) { // 2 = EMA
                var alpha = 2.0 / (len + 1.0);
                st.prevEma = isNaN(st.prevEma) ? src : alpha * src + (1.0 - alpha) * st.prevEma;
                val = st.prevEma;
            } else if (atype === 3) { // 3 = WMA
                var sW = 0, sV = 0;
                for (var j = 0; j < len && (b - j) >= 0; j++) {
                    var w = len - j;
                    sW += w;
                    sV += closes[b - j] * w;
                }
                val = sW > 0 ? (sV / sW) : src;
            } else if (atype === 4) { // 4 = HullMA
                var halfLen = Math.max(1, Math.round(len / 2.0));
                var sqrtLen = Math.max(1, Math.round(Math.sqrt(len)));

                var sW1 = 0, sV1 = 0;
                for (var k1 = 0; k1 < halfLen && (b - k1) >= 0; k1++) {
                    var w1 = halfLen - k1;
                    sW1 += w1;
                    sV1 += closes[b - k1] * w1;
                }
                var wmaHalf = sW1 > 0 ? (sV1 / sW1) : src;

                var sW2 = 0, sV2 = 0;
                for (var k2 = 0; k2 < len && (b - k2) >= 0; k2++) {
                    var w2 = len - k2;
                    sW2 += w2;
                    sV2 += closes[b - k2] * w2;
                }
                var wmaFull = sW2 > 0 ? (sV2 / sW2) : src;
                var diff = 2.0 * wmaHalf - wmaFull;
                st.hullDiffHistory[b] = diff;

                var sW3 = 0, sV3 = 0;
                for (var k3 = 0; k3 < sqrtLen && (b - k3) >= 0; k3++) {
                    var w3 = sqrtLen - k3;
                    sW3 += w3;
                    sV3 += (st.hullDiffHistory[b - k3] !== undefined ? st.hullDiffHistory[b - k3] : diff) * w3;
                }
                val = sW3 > 0 ? (sV3 / sW3) : diff;
            } else if (atype === 5) { // 5 = VWMA
                var sPv = 0, sVol = 0;
                for (var m = 0; m < len && (b - m) >= 0; m++) {
                    var vol = volumes[b - m] !== undefined ? volumes[b - m] : 1;
                    sPv += closes[b - m] * vol;
                    sVol += vol;
                }
                val = sVol > 0 ? (sPv / sVol) : src;
            } else if (atype === 6) { // 6 = RMA (Wilder's)
                var p = Math.min(b + 1, len);
                st.prevRma = isNaN(st.prevRma) ? src : (st.prevRma * (p - 1.0) + src) / p;
                val = st.prevRma;
            } else if (atype === 7) { // 7 = TEMA (Triple EMA)
                var alphaT = 2.0 / (len + 1.0);
                st.prevE1 = isNaN(st.prevE1) ? src : alphaT * src + (1.0 - alphaT) * st.prevE1;
                st.prevE2 = isNaN(st.prevE2) ? st.prevE1 : alphaT * st.prevE1 + (1.0 - alphaT) * st.prevE2;
                st.prevE3 = isNaN(st.prevE3) ? st.prevE2 : alphaT * st.prevE2 + (1.0 - alphaT) * st.prevE3;
                val = 3.0 * (st.prevE1 - st.prevE2) + st.prevE3;
            } else if (atype === 8) { // 8 = Tilson T3
                var bFactor = factorT3 * 0.1;
                var c1 = -bFactor * bFactor * bFactor;
                var c2 = 3.0 * bFactor * bFactor + 3.0 * bFactor * bFactor * bFactor;
                var c3 = -6.0 * bFactor * bFactor - 3.0 * bFactor - 3.0 * bFactor * bFactor * bFactor;
                var c4 = 1.0 + 3.0 * bFactor + bFactor * bFactor * bFactor + 3.0 * bFactor * bFactor;

                var alphaT3 = 2.0 / (len + 1.0);
                st.prevT1 = isNaN(st.prevT1) ? src : alphaT3 * src + (1.0 - alphaT3) * st.prevT1;
                st.prevT2 = isNaN(st.prevT2) ? st.prevT1 : alphaT3 * st.prevT1 + (1.0 - alphaT3) * st.prevT2;
                st.prevT3 = isNaN(st.prevT3) ? st.prevT2 : alphaT3 * st.prevT2 + (1.0 - alphaT3) * st.prevT3;
                st.prevT4 = isNaN(st.prevT4) ? st.prevT3 : alphaT3 * st.prevT3 + (1.0 - alphaT3) * st.prevT4;
                st.prevT5 = isNaN(st.prevT5) ? st.prevT4 : alphaT3 * st.prevT4 + (1.0 - alphaT3) * st.prevT5;
                st.prevT6 = isNaN(st.prevT6) ? st.prevT5 : alphaT3 * st.prevT5 + (1.0 - alphaT3) * st.prevT6;

                val = c1 * st.prevT6 + c2 * st.prevT5 + c3 * st.prevT4 + c4 * st.prevT3;
            }

            return val;
        }

        this.main = function (ctx, inputCallback) {
            this._context = ctx;
            var PineStd = (typeof PineJS !== "undefined" && PineJS.Std) ? PineJS.Std : null;
            var bar_index = PineStd ? PineStd.n(this._context) : this.bars.length;
            var open = PineStd ? PineStd.open(this._context) : 0;
            var high = PineStd ? PineStd.high(this._context) : 0;
            var low = PineStd ? PineStd.low(this._context) : 0;
            var close = PineStd ? PineStd.close(this._context) : 0;
            var volume = PineStd ? PineStd.volume(this._context) : 1;
            if (isNaN(volume) || volume === null) volume = 1;

            if (bar_index === 0) {
                this.bars = [];
                this.closes = [];
                this.opens = [];
                this.volumes = [];
                this.out1History = [];
                this.out2History = [];
                this.stateHistory1 = [];
                this.stateHistory2 = [];
                this.ma1State = {
                    prevEma: NaN, prevRma: NaN,
                    prevE1: NaN, prevE2: NaN, prevE3: NaN,
                    prevT1: NaN, prevT2: NaN, prevT3: NaN, prevT4: NaN, prevT5: NaN, prevT6: NaN,
                    hullDiffHistory: []
                };
                this.ma2State = {
                    prevEma: NaN, prevRma: NaN,
                    prevE1: NaN, prevE2: NaN, prevE3: NaN,
                    prevT1: NaN, prevT2: NaN, prevT3: NaN, prevT4: NaN, prevT5: NaN, prevT6: NaN,
                    hullDiffHistory: []
                };
            }

            // Truncate on tick rewind
            if (this.bars.length > bar_index) {
                this.bars.length = bar_index;
                this.closes.length = bar_index;
                this.opens.length = bar_index;
                this.volumes.length = bar_index;
                this.out1History.length = bar_index;
                this.out2History.length = bar_index;
                this.stateHistory1.length = bar_index;
                this.stateHistory2.length = bar_index;
                if (bar_index > 0 && this.stateHistory1[bar_index - 1]) {
                    this.ma1State = cloneState(this.stateHistory1[bar_index - 1]);
                }
                if (bar_index > 0 && this.stateHistory2[bar_index - 1]) {
                    this.ma2State = cloneState(this.stateHistory2[bar_index - 1]);
                }
            }

            var getInp = function (idx, def) {
                var v = typeof inputCallback === "function" ? inputCallback(idx) : undefined;
                return v !== undefined ? v : def;
            };

            // Inputs
            var useCurrentRes = Boolean(getInp(0, true));
            var len = Math.max(1, Math.round(Number(getInp(1, 20))));
            var factorT3 = Number(getInp(2, 7));
            var atype = Math.max(1, Math.min(8, Math.round(Number(getInp(3, 1)))));
            var spc = Boolean(getInp(4, false));
            var cc = Boolean(getInp(5, true));
            var smoothe = Math.max(1, Math.min(10, Math.round(Number(getInp(6, 2)))));
            var doma2 = Boolean(getInp(7, false));
            var spc2 = Boolean(getInp(8, false));
            var len2 = Math.max(1, Math.round(Number(getInp(9, 50))));
            var sfactorT3 = Number(getInp(10, 7));
            var atype2 = Math.max(1, Math.min(8, Math.round(Number(getInp(11, 1)))));
            var cc2 = Boolean(getInp(12, true));
            var sd = Boolean(getInp(13, false));

            this.bars[bar_index] = { open: open, high: high, low: low, close: close };
            this.closes[bar_index] = close;
            this.opens[bar_index] = open;
            this.volumes[bar_index] = volume;

            // 1. Calculate MA1
            var out1 = calculateMovingAverage(this.closes, this.volumes, bar_index, atype, len, factorT3, this.ma1State);
            this.out1History[bar_index] = out1;
            this.stateHistory1[bar_index] = cloneState(this.ma1State);

            // 2. Calculate MA2
            var out2 = calculateMovingAverage(this.closes, this.volumes, bar_index, atype2, len2, sfactorT3, this.ma2State);
            this.out2History[bar_index] = out2;
            this.stateHistory2[bar_index] = cloneState(this.ma2State);

            // Price Crossing Formula
            // cr_up = open < out1 and close > out1
            // cr_Down = open > out1 and close < out1
            var cr_up = (open < out1) && (close > out1);
            var cr_Down = (open > out1) && (close < out1);

            // cr_up2 = open < out2 and close > out2
            // cr_Down2 = open > out2 and close < out2
            var cr_up2 = (open < out2) && (close > out2);
            var cr_Down2 = (open > out2) && (close < out2);

            // MA Direction & Color
            // ma_up = out1 >= out1[smoothe]
            // ma_down = out1 < out1[smoothe]
            var smoothIndex = Math.max(0, bar_index - smoothe);
            var prevSmoothVal = this.out1History[smoothIndex] !== undefined ? this.out1History[smoothIndex] : out1;
            var ma_up = out1 >= prevSmoothVal;
            var ma_down = out1 < prevSmoothVal;

            // col = cc ? ma_up ? lime : ma_down ? red : aqua : aqua
            // Palette 1: 0=lime, 1=red, 2=aqua
            var col1Idx = cc ? (ma_up ? 0 : (ma_down ? 1 : 2)) : 2;

            // col2 = cc2 ? ma_up ? lime : ma_down ? red : aqua : white
            // Palette 2: 0=lime, 1=red, 2=aqua, 3=white
            var col2Idx = cc2 ? (ma_up ? 0 : (ma_down ? 1 : 2)) : 3;

            // Cross of Both MAs
            // cross(out1, out2) = crossover(out1, out2) or crossunder(out1, out2)
            var prevOut1 = bar_index > 0 ? this.out1History[bar_index - 1] : NaN;
            var prevOut2 = bar_index > 0 ? this.out2History[bar_index - 1] : NaN;
            var crossBoth = (bar_index > 0) && (((out1 > out2) && (prevOut1 <= prevOut2)) || ((out1 < out2) && (prevOut1 >= prevOut2)));
            var crossVal = (sd && crossBoth) ? out2 : NaN;

            // Barcolor
            var highlightBar = (spc && (cr_up || cr_Down)) || (spc2 && (cr_up2 || cr_Down2));
            var barColorVal = highlightBar ? 100 : NaN;

            var out2Plot = doma2 ? out2 : NaN;

            return [
                out1,
                col1Idx,
                out2Plot,
                col2Idx,
                crossVal,
                barColorVal
            ];
        };
    }
})
