/*
 * Based on Easing Equations (c) 2003 Robert Penner, all rights reserved.
 * Subject to the terms of the BSD License.
 * (https://spdx.org/licenses/BSD-3-Clause.html)
 */
var L;
(function (L) {
    L.Motion = L.Motion || {};
    L.Motion.Ease = {
        linear: function(p) {
            return p;
        },
        swing: function(p) {
            return 0.5 - Math.cos(p * Math.PI) / 2;
        },
        easeInQuad: function(p) {
            return p * p;
        },
        easeOutQuad: function(p) {
            return -(p * (p - 2));
        },
        easeInOutQuad: function(p) {
            if ((p /= 0.5) < 1) return 0.5 * p * p;
            return -0.5 * ((--p) * (p - 2) - 1);
        },
        easeInCubic: function(p) {
            return p * p * p;
        },
        easeOutCubic: function(p) {
            return (Math.pow((p - 1), 3) + 1);
        },
        easeInOutCubic: function(p) {
            if ((p /= 0.5) < 1) return 0.5 * Math.pow(p, 3);
            return 0.5 * (Math.pow((p - 2), 3) + 2);
        },
        easeInQuart: function(p) {
            return Math.pow(p, 4);
        },
        easeOutQuart: function(p) {
            return -(Math.pow((p - 1), 4) - 1);
        },
        easeInOutQuart: function(p) {
            if ((p /= 0.5) < 1) return 0.5 * Math.pow(p, 4);
            return -0.5 * (Math.pow((p - 2), 4) - 2);
        },
        easeInQuint: function(p) {
            return Math.pow(p, 5);
        },
        easeOutQuint: function(p) {
            return (Math.pow((p - 1), 5) + 1);
        },
        easeInOutQuint: function(p) {
            if ((p /= 0.5) < 1) return 0.5 * Math.pow(p, 5);
            return 0.5 * (Math.pow((p - 2), 5) + 2);
        },
        easeInSine: function(p) {
            return -Math.cos(p * (Math.PI / 2)) + 1;
        },
        easeOutSine: function(p) {
            return Math.sin(p * (Math.PI / 2));
        },
        easeInOutSine: function(p) {
            return -0.5 * (Math.cos(Math.PI * p) - 1);
        },
        easeInExpo: function(p) {
            return (p === 0) ? 0 : Math.pow(2, 10 * (p - 1));
        },
        easeOutExpo: function(p) {
            return (p === 1) ? 1 : (-Math.pow(2, -10 * p) + 1);
        },
        easeInOutExpo: function(p) {
            if (p === 0) return 0;
            if (p === 1) return 1;
            if ((p /= 0.5) < 1) return 0.5 * Math.pow(2, 10 * (p - 1));
            return 0.5 * (-Math.pow(2, -10 * --p) + 2);
        },
        easeInCirc: function(p) {
            return -(Math.sqrt(1 - (p * p)) - 1);
        },
        easeOutCirc: function(p) {
            return Math.sqrt(1 - Math.pow((p - 1), 2));
        },
        easeInOutCirc: function(p) {
            if ((p /= 0.5) < 1) return -0.5 * (Math.sqrt(1 - p * p) - 1);
            return 0.5 * (Math.sqrt(1 - (p -= 2) * p) + 1);
        },
        easeInElastic: function(p) {
            var s = 1.70158;
            var a = 1;
            var p_ = 0.3;
            if (p === 0) return 0;
            if (p === 1) return 1;
            var s_ = p_ / (2 * Math.PI) * Math.asin(1 / a);
            return -(a * Math.pow(2, 10 * (p -= 1)) * Math.sin((p - s_) * (2 * Math.PI) / p_));
        },
        easeOutElastic: function(p) {
            var s = 1.70158;
            var a = 1;
            var p_ = 0.3;
            if (p === 0) return 0;
            if (p === 1) return 1;
            var s_ = p_ / (2 * Math.PI) * Math.asin(1 / a);
            return a * Math.pow(2, -10 * p) * Math.sin((p - s_) * (2 * Math.PI) / p_) + 1;
        },
        easeInOutElastic: function(p) {
            var s = 1.70158;
            var a = 1;
            var p_ = 0.3 * 1.5;
            if (p === 0) return 0;
            if ((p /= 0.5) === 2) return 1;
            var s_ = p_ / (2 * Math.PI) * Math.asin(1 / a);
            if (p < 1) return -0.5 * (a * Math.pow(2, 10 * (p -= 1)) * Math.sin((p - s_) * (2 * Math.PI) / p_));
            return a * Math.pow(2, -10 * (p -= 1)) * Math.sin((p - s_) * (2 * Math.PI) / p_) * 0.5 + 1;
        },
        easeInBack: function(p) {
            var s = 1.70158;
            return p * p * ((s + 1) * p - s);
        },
        easeOutBack: function(p) {
            var s = 1.70158;
            return ((p = p - 1) * p * ((s + 1) * p + s) + 1);
        },
        easeInOutBack: function(p) {
            var s = 1.70158;
            if ((p /= 0.5) < 1) return 0.5 * (p * p * (((s *= (1.525)) + 1) * p - s));
            return 0.5 * ((p -= 2) * p * (((s *= (1.525)) + 1) * p + s) + 2);
        },
        easeInBounce: function(p) {
            return 1 - L.Motion.Ease.easeOutBounce(1 - p);
        },
        easeOutBounce: function(p) {
            if (p < (1 / 2.75)) {
                return (7.5625 * p * p);
            } else if (p < (2 / 2.75)) {
                return (7.5625 * (p -= (1.5 / 2.75)) * p + 0.75);
            } else if (p < (2.5 / 2.75)) {
                return (7.5625 * (p -= (2.25 / 2.75)) * p + 0.9375);
            } else {
                return (7.5625 * (p -= (2.625 / 2.75)) * p + 0.984375);
            }
        },
        easeInOutBounce: function(p) {
            if (p < 0.5) return L.Motion.Ease.easeInBounce(p * 2) * 0.5;
            return L.Motion.Ease.easeOutBounce(p * 2 - 1) * 0.5 + 0.5;
        }
    };
})(L || (L = {}));
