({
    name: "UT Bot Alerts",
    metainfo: {
        _metainfoVersion: 52,
        isTVScript: false,
        is_hidden_study: false,
        is_price_study: true,
        isCustomIndicator: true,
        format: { precision: 2, type: "price" },
        id: "UTBotAlerts@tv-basicstudies-1",
        scriptIdPart: "",
        name: "UT Bot Alerts",
        description: "UT Bot Alerts",
        shortDescription: "UT Bot",
        defaults: {
            styles: {
                plot_stop: { plottype: 0, linewidth: 1, color: "#2962FF", isHidden: false, trackPrice: false },
                plot_buy: { plottype: "shape_label_up", location: "BelowBar", color: "#089981", textColor: "#ffffff", size: "auto" },
                plot_sell: { plottype: "shape_label_down", location: "AboveBar", color: "#f23645", textColor: "#ffffff", size: "auto" }
            },
            palettes: {
                stopPalette: {
                    colors: {
                        0: { color: "#089981", width: 1, style: 0 },
                        1: { color: "#F23645", width: 1, style: 0 },
                        2: { color: "#2962FF", width: 1, style: 0 }
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
                in_0: 1.0,
                in_1: 10,
                in_2: false
            }
        },
        plots: [
            { id: "plot_stop", type: "line" },
            { id: "plot_stop_color", type: "colorer", target: "plot_stop", palette: "stopPalette" },
            { id: "plot_buy", type: "shapes" },
            { id: "plot_sell", type: "shapes" },
            { id: "plot_bar_colorer", type: "bar_colorer", palette: "barPalette" }
        ],
        styles: {
            plot_stop: { title: "ATR Trailing Stop", histogramBase: 0, joinPoints: false },
            plot_buy: { title: "Buy Signal", isHidden: false, text: "Buy" },
            plot_sell: { title: "Sell Signal", isHidden: false, text: "Sell" }
        },
        palettes: {
            stopPalette: {
                colors: {
                    0: { name: "Bullish Stop Color" },
                    1: { name: "Bearish Stop Color" },
                    2: { name: "Neutral Stop Color" }
                }
            },
            barPalette: {
                colors: [
                    { name: "Buy Bar Color" },
                    { name: "Sell Bar Color" }
                ],
                valToIndex: {
                    100: 0,
                    200: 1
                }
            }
        },
        inputs: [
            { id: "in_0", name: "Key Vaule. 'This changes the sensitivity'", defval: 1.0, type: "float", min: 0.1, step: 0.1 },
            { id: "in_1", name: "ATR Period", defval: 10, type: "integer", min: 1 },
            { id: "in_2", name: "Signals from Heikin Ashi Candles", defval: false, type: "bool" }
        ]
    },
    constructor: function () {
        this.init = function (ctx, get_input) {
            this._context = ctx;
            this._input = get_input;

            this.bars = [];
            this.closes = [];
            this.highs = [];
            this.lows = [];
            this.opens = [];
            this.srcValues = [];
            this.trailingStops = [];
            this.posValues = [];
            this.rmaHistory = [];
            this.lastRmaTr = NaN;
        };

        this.main = function (ctx, inputCallback) {
            this._context = ctx;
            var PineStd = (typeof PineJS !== "undefined" && PineJS.Std) ? PineJS.Std : null;
            var bar_index = PineStd ? PineStd.n(this._context) : this.bars.length;
            var open = PineStd ? PineStd.open(this._context) : 0;
            var high = PineStd ? PineStd.high(this._context) : 0;
            var low = PineStd ? PineStd.low(this._context) : 0;
            var close = PineStd ? PineStd.close(this._context) : 0;

            if (bar_index === 0) {
                this.bars = [];
                this.closes = [];
                this.highs = [];
                this.lows = [];
                this.opens = [];
                this.srcValues = [];
                this.trailingStops = [];
                this.posValues = [];
                this.rmaHistory = [];
                this.lastRmaTr = NaN;
            }

            // Truncate future bars on real-time tick rewinds
            if (this.bars.length > bar_index) {
                this.bars.length = bar_index;
                this.closes.length = bar_index;
                this.highs.length = bar_index;
                this.lows.length = bar_index;
                this.opens.length = bar_index;
                this.srcValues.length = bar_index;
                this.trailingStops.length = bar_index;
                this.posValues.length = bar_index;
                this.rmaHistory.length = bar_index;
                this.lastRmaTr = bar_index > 0 ? this.rmaHistory[bar_index - 1] : NaN;
            }

            var getInp = function (idx, def) {
                var v = typeof inputCallback === "function" ? inputCallback(idx) : undefined;
                return v !== undefined ? v : def;
            };

            // a = input(1, title = "Key Vaule. 'This changes the sensitivity'")
            var a = Number(getInp(0, 1.0));
            // c = input(10, title = "ATR Period")
            var c = Math.max(1, Math.round(Number(getInp(1, 10))));
            // h = input(false, title = "Signals from Heikin Ashi Candles")
            var h = Boolean(getInp(2, false));

            // xATR = atr(c)
            var prevClose = (bar_index > 0 && this.bars[bar_index - 1]) ? this.bars[bar_index - 1].close : close;
            var tr = (bar_index === 0) ? (high - low) : Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));

            if (isNaN(this.lastRmaTr)) {
                this.lastRmaTr = tr;
            } else {
                var p = Math.min(bar_index + 1, c);
                this.lastRmaTr = (this.lastRmaTr * (p - 1) + tr) / p;
            }
            this.rmaHistory[bar_index] = this.lastRmaTr;
            var xATR = this.lastRmaTr;

            // nLoss = a * xATR
            var nLoss = a * xATR;

            // src = h ? security(heikinashi(syminfo.tickerid), timeframe.period, close, lookahead = false) : close
            var src = h ? ((open + high + low + close) / 4.0) : close;

            this.bars[bar_index] = { open: open, high: high, low: low, close: close };
            this.closes[bar_index] = close;
            this.highs[bar_index] = high;
            this.lows[bar_index] = low;
            this.opens[bar_index] = open;
            this.srcValues[bar_index] = src;

            var prevStop = (bar_index > 0 && !isNaN(this.trailingStops[bar_index - 1])) ? this.trailingStops[bar_index - 1] : 0.0;
            var prevSrc = (bar_index > 0 && !isNaN(this.srcValues[bar_index - 1])) ? this.srcValues[bar_index - 1] : 0.0;

            // xATRTrailingStop := iff(src > nz(xATRTrailingStop[1], 0) and src[1] > nz(xATRTrailingStop[1], 0), max(nz(xATRTrailingStop[1]), src - nLoss),
            //    iff(src < nz(xATRTrailingStop[1], 0) and src[1] < nz(xATRTrailingStop[1], 0), min(nz(xATRTrailingStop[1]), src + nLoss), 
            //    iff(src > nz(xATRTrailingStop[1], 0), src - nLoss, src + nLoss)))
            var xATRTrailingStop = 0.0;
            if (src > prevStop && prevSrc > prevStop) {
                xATRTrailingStop = Math.max(prevStop, src - nLoss);
            } else if (src < prevStop && prevSrc < prevStop) {
                xATRTrailingStop = Math.min(prevStop, src + nLoss);
            } else if (src > prevStop) {
                xATRTrailingStop = src - nLoss;
            } else {
                xATRTrailingStop = src + nLoss;
            }
            this.trailingStops[bar_index] = xATRTrailingStop;

            // pos := iff(src[1] < nz(xATRTrailingStop[1], 0) and src > nz(xATRTrailingStop[1], 0), 1,
            //    iff(src[1] > nz(xATRTrailingStop[1], 0) and src < nz(xATRTrailingStop[1], 0), -1, nz(pos[1], 0)))
            var prevPos = (bar_index > 0 && !isNaN(this.posValues[bar_index - 1])) ? this.posValues[bar_index - 1] : 0;
            var pos = 0;
            if (prevSrc < prevStop && src > prevStop) {
                pos = 1;
            } else if (prevSrc > prevStop && src < prevStop) {
                pos = -1;
            } else {
                pos = prevPos;
            }
            this.posValues[bar_index] = pos;

            // xcolor = pos == -1 ? color.red: pos == 1 ? color.green : color.blue
            // Palette mapping: 0 -> green (#089981), 1 -> red (#F23645), 2 -> blue (#2962FF)
            var stopColorIdx = (pos === 1) ? 0 : (pos === -1 ? 1 : 2);

            // ema = ema(src, 1) -> in Pine, ema(src, 1) is identical to src
            var ema = src;
            var prevEma = prevSrc;

            // above = crossover(ema, xATRTrailingStop)
            var above = (bar_index > 0) && (ema > xATRTrailingStop) && (prevEma <= prevStop);

            // below = crossover(xATRTrailingStop, ema)
            var below = (bar_index > 0) && (xATRTrailingStop > ema) && (prevStop <= prevEma);

            // buy  = src > xATRTrailingStop and above 
            // sell = src < xATRTrailingStop and below
            var buy = (src > xATRTrailingStop) && above;
            var sell = (src < xATRTrailingStop) && below;

            // barbuy  = src > xATRTrailingStop 
            // barsell = src < xATRTrailingStop 
            var barbuy = src > xATRTrailingStop;
            var barsell = src < xATRTrailingStop;

            // barcolor(barbuy ? color.green : na)
            // barcolor(barsell ? color.red : na)
            var barColorVal = barbuy ? 100 : (barsell ? 200 : NaN);

            return [
                xATRTrailingStop,
                stopColorIdx,
                buy ? low : NaN,
                sell ? high : NaN,
                barColorVal
            ];
        };
    }
})
