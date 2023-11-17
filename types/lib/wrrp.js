var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var _a = require('mathjs'), gcd = _a.gcd, round = _a.round;
var assert = require('assert');
var isNumber = require('lodash').isNumber;
var Joi = require('joi');
var debug = require('debug')('wrr-plus');
var WeightedRoundRobin = /** @class */ (function () {
    function WeightedRoundRobin(options) {
        if (options === void 0) { options = {}; }
        this._options = this._getParams(options);
        this._totalWeight = 0;
        this._weightArray = [];
        this._peerMap = new Map();
        this._gcd = 1;
    }
    WeightedRoundRobin.prototype._getParams = function (options) {
        var schema = Joi.object().keys({
            reverse: Joi.boolean().default(false),
            max: Joi.number().max(10000).min(20).default(100),
            min: Joi.number().max(20).min(1).default(20),
            filter: Joi.object().keys({
                enable: Joi.boolean().default(false),
                number: Joi.number().max(10000).min(1).default(3),
                totalWeight: Joi.number().max(10000).min(1).default(100),
                ratio: Joi.number().max(1).min(0).default(0.6)
            }).default()
        }).default();
        return Joi.attempt(options, schema);
    };
    WeightedRoundRobin.prototype.add = function (key, value) {
        assert((key && value), 'add(key, value) key and value are required.');
        assert((isNumber(value.weight) && value.weight > 0), "value.weight ".concat(value.weight, " must be a required number and it must be larger than 0."));
        value.currentWeight = value.weight;
        value.effectiveWeight = value.weight;
        this._weightArray.push(value.weight);
        this._totalWeight += value.weight;
        this._peerMap.set(key, value);
        return true;
    };
    WeightedRoundRobin.prototype.reset = function () {
        this._totalWeight = 0;
        this._weightArray = [];
        this._peerMap = new Map(); // 创建一个新的 Map 实例
        this._gcd = 1;
    };
    WeightedRoundRobin.prototype.get = function (key) {
        assert(key, 'get(key) key is required.');
        assert(this._peerMap.has(key), 'get false, because no such key in WeightedRoundRobin map');
        var value = this._peerMap.get(key);
        return this._get(value);
    };
    WeightedRoundRobin.prototype.remove = function (key) {
        assert(key, 'remove(key) key is required.');
        assert(this._peerMap.has(key), 'delete false, because no such key in WeightedRoundRobin map');
        this._peerMap.delete(key);
    };
    WeightedRoundRobin.prototype.size = function () {
        return this._peerMap.size;
    };
    WeightedRoundRobin.prototype.getRoundRobin = function (item, _a) {
        var _b = _a === void 0 ? this._options : _a, reverse = _b.reverse, max = _b.max, min = _b.min, filter = _b.filter;
        var roundRobin = [];
        var peerMapLength = this._peerMap.size;
        if (peerMapLength === 0) {
            return roundRobin;
        }
        if (peerMapLength === 1) {
            var value = this._get(this._peerMap.get(__spreadArray([], this._peerMap.keys(), true)[0]));
            roundRobin.push(item ? value[item] : value);
            return roundRobin;
        }
        this._filter(peerMapLength);
        var peerMapCurrentLength = this._peerMap.size;
        max = (peerMapCurrentLength > max) ? peerMapCurrentLength : max;
        var roundCount = this._getRoundCount(max, min);
        for (var i = 1; i <= roundCount; i++) {
            var best = reverse ? this._calculateReverse() : this._calculate();
            if (best) {
                var value = this._get(best);
                roundRobin.push(item ? value[item] : value);
            }
        }
        debug("get roundRobin: ".concat(roundRobin.length, ", peerMapLength: ").concat(peerMapLength, ", totalWeight: ").concat(this._totalWeight, ", gcd: ").concat(this._gcd));
        return roundRobin;
    };
    WeightedRoundRobin.prototype._get = function (value) {
        var newValue = __assign({}, value);
        delete newValue.currentWeight;
        delete newValue.effectiveWeight;
        return newValue;
    };
    WeightedRoundRobin.prototype._filter = function (peerMapLength) {
        var _a = this._options.filter, enable = _a.enable, number = _a.number, totalWeight = _a.totalWeight, ratio = _a.ratio;
        if (!enable || peerMapLength <= number) {
            return;
        }
        if (this._totalWeight > totalWeight) {
            var diff = 0;
            this._weightArray = [];
            for (var _i = 0, _b = this._peerMap; _i < _b.length; _i++) {
                var _c = _b[_i], peerKey = _c[0], peer = _c[1];
                var radix = peer.weight / this._totalWeight;
                if (radix > ratio) {
                    diff += peer.weight;
                    this.remove(peerKey);
                }
                else {
                    this._weightArray.push(peer.weight);
                }
            }
            this._totalWeight -= diff;
            this._gcd = gcd.apply(void 0, this._weightArray);
        }
    };
    WeightedRoundRobin.prototype._getRoundCount = function (max, min) {
        var radix = round(this._totalWeight / this._gcd);
        if (max > radix > min) {
            return radix;
        }
        else if (radix >= max) {
            return max;
        }
        else if (radix < min) {
            return min;
        }
        else {
            return 100;
        }
    };
    WeightedRoundRobin.prototype._calculate = function () {
        var bestPeer;
        var totalEffectiveWeight = 0;
        for (var _i = 0, _a = this._peerMap; _i < _a.length; _i++) {
            var _b = _a[_i], peer = _b[1];
            totalEffectiveWeight += peer.effectiveWeight;
            peer.currentWeight += peer.effectiveWeight;
            if (peer.effectiveWeight < peer.weight) {
                peer.effectiveWeight++;
            }
            if (!bestPeer || bestPeer.currentWeight < peer.currentWeight) {
                bestPeer = peer;
            }
        }
        if (bestPeer) {
            bestPeer.currentWeight -= totalEffectiveWeight;
            return bestPeer;
        }
        return false;
    };
    WeightedRoundRobin.prototype._calculateReverse = function () {
        var bestPeer;
        var totalEffectiveWeight = 0;
        for (var _i = 0, _a = this._peerMap; _i < _a.length; _i++) {
            var _b = _a[_i], peer = _b[1];
            totalEffectiveWeight += peer.effectiveWeight;
            peer.currentWeight += peer.effectiveWeight;
            if (peer.effectiveWeight > peer.weight) {
                peer.effectiveWeight--;
            }
            if (!bestPeer || bestPeer.currentWeight > peer.currentWeight) {
                bestPeer = peer;
            }
        }
        if (bestPeer) {
            bestPeer.currentWeight += totalEffectiveWeight;
            return bestPeer;
        }
        return false;
    };
    return WeightedRoundRobin;
}());
module.exports = WeightedRoundRobin;
module.exports.default = WeightedRoundRobin;
