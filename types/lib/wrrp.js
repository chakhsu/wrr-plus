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
        this._peerMap = {};
        this._gcd = 1;
    }
    WeightedRoundRobin.prototype._getParams = function (options) {
        var newOptions = this._attemptParams(options);
        return newOptions;
    };
    WeightedRoundRobin.prototype._attemptParams = function (options) {
        var schema = Joi.object().keys({
            // 选择正逆序轮询表，true 为返回正序轮询表，false 为返回逆序轮询表，默认为 false
            reverse: Joi.boolean().default(false),
            // 返回轮询表的最大长度，注意：当节点数大于该值时，则选取节点数作为返回的最大长度
            max: Joi.number().max(10000).min(20).default(100),
            // 返回轮询表的最小长度
            min: Joi.number().max(20).min(1).default(20),
            // 过滤轮询表中某些异常的节点
            filter: Joi.object().keys({
                // 是否启用过滤异常节点，默认为 false
                enable: Joi.boolean().default(false),
                // 当节点数大于 3，可以触发过滤，默认为 3
                number: Joi.number().max(10000).min(1).default(3),
                // 当所有节点数总权重大于 100，可以触发过滤，默认为 100
                totalWeight: Joi.number().max(10000).min(1).default(100),
                // 当某个节点的权重占总权重的 0.6 时，过滤掉改节点，默认 0.6，取值范围在 0.1 ~ 1.0
                ratio: Joi.number().max(1).min(0).default(0.6)
            }).default()
        }).default();
        var newOptions = Joi.attempt(options, schema);
        return newOptions;
    };
    WeightedRoundRobin.prototype.add = function (key, value) {
        assert((key && value), 'add(key, value) key and value is required.');
        assert((isNumber(value.weight) && value.weight > 0), "value.weight ".concat(value.weight, " must be a required number and it must be larger than 0."));
        value.currentWeight = value.weight;
        value.effectiveWeight = value.weight;
        this._weightArray.push(value.weight);
        this._totalWeight = this._totalWeight + value.weight;
        this._peerMap[key] = value;
        return true;
    };
    WeightedRoundRobin.prototype.reset = function () {
        this._totalWeight = 0;
        this._weightArray = [];
        this._peerMap = {};
        this._gcd = 1;
    };
    WeightedRoundRobin.prototype.get = function (key) {
        assert(key, 'get(key) key is required.');
        assert(this._peerMap[key], 'get false, because no such key in WeightedRoundRobin map');
        var value = this._peerMap[key];
        var newValue = this._get(value);
        return newValue;
    };
    WeightedRoundRobin.prototype.remove = function (key) {
        assert(key, 'remove(key) key is required.');
        assert(this._peerMap[key], 'delete false, because no such key in WeightedRoundRobin map');
        delete this._peerMap[key];
    };
    WeightedRoundRobin.prototype.size = function () {
        return Object.keys(this._peerMap).length;
    };
    // 获取 value[item] RoundRobin，默认返回数组长度最大值为 100
    WeightedRoundRobin.prototype.getRoundRobin = function (item, _a) {
        var _b = _a === void 0 ? this._options : _a, _c = _b.reverse, reverse = _c === void 0 ? this._options.reverse : _c, _d = _b.max, max = _d === void 0 ? this._options.max : _d, _e = _b.min, min = _e === void 0 ? this._options.min : _e;
        var roundRobin = [];
        var peerMapLength = Object.keys(this._peerMap).length;
        // 直接返回空数组
        if (peerMapLength === 0) {
            return roundRobin;
        }
        // 返回唯一那个
        if (peerMapLength === 1) {
            var value = this._get(this._peerMap[Object.keys(this._peerMap)[0]]);
            roundRobin.push(item ? value[item] : value);
            return roundRobin;
        }
        // 修正 _peerMap, 去掉毛刺
        this._filter(peerMapLength);
        // 实例数大于 max, 就用实例数量作为 round count
        var peerMapCurrentLength = Object.keys(this._peerMap).length;
        if (peerMapCurrentLength > max) {
            max = peerMapCurrentLength;
        }
        // 循环计算获取
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
        var newValue = Object.assign({}, value);
        delete newValue.currentWeight;
        delete newValue.effectiveWeight;
        return newValue;
    };
    WeightedRoundRobin.prototype._filter = function (peerMapLength) {
        var _a = this._options.filter, enable = _a.enable, number = _a.number, totalWeight = _a.totalWeight, ratio = _a.ratio;
        if (!enable) {
            return;
        }
        // peer 数量大于 3
        if (peerMapLength > number) {
            // 总权重大于 100 才调整 peerMap
            if (this._totalWeight > totalWeight) {
                var diff = 0;
                var peerKey = void 0;
                this._weightArray = [];
                // 找出和移除占比超过 0.6 的 peer
                for (peerKey in this._peerMap) {
                    var radix = this._peerMap[peerKey].weight / this._totalWeight;
                    if (radix > ratio) {
                        diff += this._peerMap[peerKey].weight;
                        this.remove(peerKey);
                    }
                    else {
                        this._weightArray.push(this._peerMap[peerKey].weight);
                    }
                }
                // 减掉移除的权重
                this._totalWeight = this._totalWeight - diff;
                // 计算最大公约数
                this._gcd = gcd.apply(void 0, this._weightArray);
            }
        }
    };
    // 计算获取次数
    WeightedRoundRobin.prototype._getRoundCount = function (max, min) {
        var roundCount;
        // 总权重数 / 各权重间的最大公约数
        var radix = round(this._totalWeight / this._gcd);
        switch (radix > 0) {
            case max > radix > min: // radix 在范围内
                roundCount = radix;
                break;
            case radix >= max: // radix 大于最大值
                roundCount = max;
                break;
            case radix < min: // radix 小于最小值
                roundCount = min;
                break;
            default: // 默认
                roundCount = 100;
        }
        return roundCount;
    };
    // Nginx like WRR algorithm, 区别是权重越大，出现越多
    WeightedRoundRobin.prototype._calculate = function () {
        var peer;
        var peerKey;
        var bestPeer;
        var totalEffectiveWeight = 0;
        for (peerKey in this._peerMap) {
            peer = this._peerMap[peerKey];
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
    // Nginx like WRR algorithm, 区别是权重越少，出现越多
    WeightedRoundRobin.prototype._calculateReverse = function () {
        var peer;
        var peerKey;
        var bestPeer;
        var totalEffectiveWeight = 0;
        for (peerKey in this._peerMap) {
            peer = this._peerMap[peerKey];
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
