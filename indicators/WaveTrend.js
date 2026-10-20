({
    name: "WaveTrend",
    metainfo: {
        _metainfoVersion: 52,
        isTVScript: false,
        is_hidden_study: false,
        is_price_study: false,
        isCustomIndicator: true,
        format: { precision: 2, type: "price" },
        id: "WaveTrend_LB@tv-basicstudies-1",
        scriptIdPart: "",
        name: "WaveTrend",
        description: "WaveTrend",
        shortDescription: "WT_LB",
        defaults: {
            styles: {
                plot_0: { plottype: 0, linewidth: 1, color: "#787B86", linestyle: 2, visible: true, trackPrice: false },
                plot_ob1: { plottype: 0, linewidth: 1, color: "#F23645", linestyle: 0, visible: true, trackPrice: false },
                plot_os1: { plottype: 0, linewidth: 1, color: "#089981", linestyle: 0, visible: true, trackPrice: false },
                plot_ob2: { plottype: 0, linewidth: 1, color: "#F23645", linestyle: 2, visible: true, trackPrice: false },
                plot_os2: { plottype: 0, linewidth: 1, color: "#089981", linestyle: 2, visible: true, trackPrice: false },
                plot_wt1: { plottype: 0, linewidth: 2, color: "#089981", linestyle: 0, visible: true, trackPrice: false },
                plot_wt2: { plottype: 0, linewidth: 1, color: "#F23645", linestyle: 2, visible: true, trackPrice: false },
                plot_diff: { plottype: 3, linewidth: 1, color: "rgba(33, 150, 243, 0.25)", visible: true, trackPrice: false }
            },
            inputs: {
                in_0: 10,
                in_1: 21,
                in_2: 60,
                in_3: 53,
                in_4: -60,
                in_5: -53
            }
        },
        plots: [
            { id: "plot_0", type: "line" },
            { id: "plot_ob1", type: "line" },
            { id: "plot_os1", type: "line" },
            { id: "plot_ob2", type: "line" },
            { id: "plot_os2", type: "line" },
            { id: "plot_wt1", type: "line" },
            { id: "plot_wt2", type: "line" },
            { id: "plot_diff", type: "line" }
        ],
        styles: {
            plot_0: { title: "Zero Line", histogramBase: 0, joinPoints: false },
            plot_ob1: { title: "Over Bought Level 1", histogramBase: 0, joinPoints: false },
            plot_os1: { title: "Over Sold Level 1", histogramBase: 0, joinPoints: false },
            plot_ob2: { title: "Over Bought Level 2", histogramBase: 0, joinPoints: false },
            plot_os2: { title: "Over Sold Level 2", histogramBase: 0, joinPoints: false },
            plot_wt1: { title: "WT1", histogramBase: 0, joinPoints: false },
            plot_wt2: { title: "WT2", histogramBase: 0, joinPoints: false },
            plot_diff: { title: "WT1 - WT2 Area", histogramBase: 0, joinPoints: false }
        },
        inputs: [
            { id: "in_0", name: "Channel Length", defval: 10, type: "integer", min: 1 },
            { id: "in_1", name: "Average Length", defval: 21, type: "integer", min: 1 },
            { id: "in_2", name: "Over Bought Level 1", defval: 60, type: "integer" },
            { id: "in_3", name: "Over Bought Level 2", defval: 53, type: "integer" },
            { id: "in_4", name: "Over Sold Level 1", defval: -60, type: "integer" },
            { id: "in_5", name: "Over Sold Level 2", defval: -53, type: "integer" }
        ]
    },
    constructor: function () {
        this.init = function (ctx, get_input) {
            this._context = ctx;
            this._input = get_input;

            this.bars = [];
            this.esaHistory = [];
            this.dHistory = [];
            this.tciHistory = [];
            this.wt1History = [];

            this.lastEsa = NaN;
            this.lastD = NaN;
            this.lastTci = NaN;
        };

        this.main = function (ctx, inputCallback) {
            this._context = ctx;
            var PineStd = (typeof PineJS !== "undefined" && PineJS.Std) ? PineJS.Std : null;
            var bar_index = PineStd ? PineStd.n(this._context) : this.bars.length;
            var high = PineStd ? PineStd.high(this._context) : 0;
            var low = PineStd ? PineStd.low(this._context) : 0;
            var close = PineStd ? PineStd.close(this._context) : 0;

            if (bar_index === 0) {
                this.bars = [];
                this.esaHistory = [];
                this.dHistory = [];
                this.tciHistory = [];
                this.wt1History = [];

                this.lastEsa = NaN;
                this.lastD = NaN;
                this.lastTci = NaN;
            }

            // Truncate on tick rewind
            if (this.bars.length > bar_index) {
                this.bars.length = bar_index;
                this.esaHistory.length = bar_index;
                this.dHistory.length = bar_index;
                this.tciHistory.length = bar_index;
                this.wt1History.length = bar_index;
                this.lastEsa = bar_index > 0 ? this.esaHistory[bar_index - 1] : NaN;
                this.lastD = bar_index > 0 ? this.dHistory[bar_index - 1] : NaN;
                this.lastTci = bar_index > 0 ? this.tciHistory[bar_index - 1] : NaN;
            }

            var getInp = function (idx, def) {
                var v = typeof inputCallback === "function" ? inputCallback(idx) : undefined;
                return v !== undefined ? v : def;
            };

            // Pine:
            // n1 = input(10, "Channel Length")
            // n2 = input(21, "Average Length")
            // obLevel1 = input(60, "Over Bought Level 1")
            // obLevel2 = input(53, "Over Bought Level 2")
            // osLevel1 = input(-60, "Over Sold Level 1")
            // osLevel2 = input(-53, "Over Sold Level 2")
            var n1 = Math.max(1, Math.round(Number(getInp(0, 10))));
            var n2 = Math.max(1, Math.round(Number(getInp(1, 21))));
            var obLevel1 = Number(getInp(2, 60));
            var obLevel2 = Number(getInp(3, 53));
            var osLevel1 = Number(getInp(4, -60));
            var osLevel2 = Number(getInp(5, -53));

            // ap = hlc3
            var ap = (high + low + close) / 3.0;

            var alpha1 = 2.0 / (n1 + 1.0);
            var alpha2 = 2.0 / (n2 + 1.0);

            var esa = 0.0;
            var d = 0.0;
            var tci = 0.0;

            if (bar_index === 0 || isNaN(this.lastEsa)) {
                // esa = ema(ap, n1)
                esa = ap;
                // d = ema(abs(ap - esa), n1)
                d = 0.0;
                // ci = (ap - esa) / (0.015 * d)
                var ci = 0.0;
                // tci = ema(ci, n2)
                tci = ci;
            } else {
                esa = alpha1 * ap + (1.0 - alpha1) * this.lastEsa;
                var diffAbs = Math.abs(ap - esa);
                d = alpha1 * diffAbs + (1.0 - alpha1) * this.lastD;
                var denom = 0.015 * d;
                var ci = denom !== 0.0 ? (ap - esa) / denom : 0.0;
                tci = alpha2 * ci + (1.0 - alpha2) * this.lastTci;
            }

            this.bars[bar_index] = { high: high, low: low, close: close, ap: ap };
            this.esaHistory[bar_index] = esa;
            this.dHistory[bar_index] = d;
            this.tciHistory[bar_index] = tci;
            this.lastEsa = esa;
            this.lastD = d;
            this.lastTci = tci;

            // wt1 = tci
            var wt1 = tci;
            this.wt1History[bar_index] = wt1;

            // wt2 = sma(wt1, 4)
            var sum = 0.0;
            var count = 0;
            for (var k = 0; k < 4 && (bar_index - k) >= 0; k++) {
                sum += this.wt1History[bar_index - k];
                count++;
            }
            var wt2 = count > 0 ? (sum / count) : wt1;

            // plot(0, color=gray)
            // plot(obLevel1, color=red)
            // plot(osLevel1, color=green)
            // plot(obLevel2, color=red, style=3)
            // plot(osLevel2, color=green, style=3)
            // plot(wt1, color=green)
            // plot(wt2, color=red, style=3)
            // plot(wt1-wt2, color=blue, style=area, transp=80)
            var diff = wt1 - wt2;

            return [
                0,
                obLevel1,
                osLevel1,
                obLevel2,
                osLevel2,
                wt1,
                wt2,
                diff
            ];
        };
    }
})
