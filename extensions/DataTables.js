const SendPropType = {
    Int: 0,
    Float: 1,
    Vector: 2,
    VectorXy: 3,
    String: 4,
    Array: 5,
    DataTable: 6,
    Int64: 7,
};

const SendPropFlags = {
    Unsigned: 1 << 0,
    Coord: 1 << 1,
    Noscale: 1 << 2,
    Rounddown: 1 << 3,
    Roundup: 1 << 4,
    Normal: 1 << 5,
    Exclude: 1 << 6,
    Xyze: 1 << 7,
    InsideArray: 1 << 8,
    ProxyAlwaysYes: 1 << 9,
    IsAVectorElem: 1 << 10,
    Collapsible: 1 << 11,
    CoordMp: 1 << 12,
    CoordMpLowPrecision: 1 << 13,
    CoordMpIntegral: 1 << 14,
    CellCoord: 1 << 15,
    CellCoordLowPrecision: 1 << 16,
    CellCoordIntegral: 1 << 17,
    ChangesOften: 1 << 18,
    VarInt: 1 << 19,
};

module.exports = {
    SendPropType,
    SendPropFlags,
};
