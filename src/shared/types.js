"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketStatus = exports.HardwareDeviceType = exports.UserRole = exports.PaymentStatus = exports.PaymentMethod = exports.VehicleType = void 0;
var VehicleType;
(function (VehicleType) {
    VehicleType["CAR"] = "CAR";
    VehicleType["MOTORCYCLE"] = "MOTORCYCLE";
    VehicleType["TRUCK"] = "TRUCK";
})(VehicleType || (exports.VehicleType = VehicleType = {}));
var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["CASH"] = "CASH";
    PaymentMethod["CREDIT_CARD"] = "CREDIT_CARD";
    PaymentMethod["DEBIT_CARD"] = "DEBIT_CARD";
    PaymentMethod["MOBILE_PAYMENT"] = "MOBILE_PAYMENT";
    PaymentMethod["CARD"] = "CARD";
    PaymentMethod["EWALLET"] = "EWALLET";
})(PaymentMethod || (exports.PaymentMethod = PaymentMethod = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "PENDING";
    PaymentStatus["COMPLETED"] = "COMPLETED";
    PaymentStatus["FAILED"] = "FAILED";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "ADMIN";
    UserRole["OPERATOR"] = "OPERATOR";
})(UserRole || (exports.UserRole = UserRole = {}));
var HardwareDeviceType;
(function (HardwareDeviceType) {
    HardwareDeviceType["GATE"] = "GATE";
    HardwareDeviceType["CAMERA"] = "CAMERA";
    HardwareDeviceType["PRINTER"] = "PRINTER";
    HardwareDeviceType["SCANNER"] = "SCANNER";
})(HardwareDeviceType || (exports.HardwareDeviceType = HardwareDeviceType = {}));
var TicketStatus;
(function (TicketStatus) {
    TicketStatus["ACTIVE"] = "ACTIVE";
    TicketStatus["PAID"] = "PAID";
    TicketStatus["CANCELLED"] = "CANCELLED";
})(TicketStatus || (exports.TicketStatus = TicketStatus = {}));
