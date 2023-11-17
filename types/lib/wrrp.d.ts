export = WeightedRoundRobin;
declare class WeightedRoundRobin {
    constructor(options?: {});
    _options: any;
    _totalWeight: number;
    _weightArray: any[];
    _peerMap: Map<any, any>;
    _gcd: number;
    _getParams(options: any): any;
    add(key: any, value: any): boolean;
    reset(): void;
    get(key: any): any;
    remove(key: any): void;
    size(): number;
    getRoundRobin(item: any, { reverse, max, min, filter }?: any): any[];
    _get(value: any): any;
    _filter(peerMapLength: any): void;
    _getRoundCount(max: any, min: any): any;
    _calculate(): any;
    _calculateReverse(): any;
}
declare namespace WeightedRoundRobin {
    export { WeightedRoundRobin as default };
}
