"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingsController = void 0;
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const supabase_auth_guard_1 = require("../common/guards/supabase-auth.guard");
const bookings_service_1 = require("./bookings.service");
const create_service_dto_1 = require("./dto/create-service.dto");
const create_appointment_dto_1 = require("./dto/create-appointment.dto");
const reschedule_appointment_dto_1 = require("./dto/reschedule-appointment.dto");
const create_block_dto_1 = require("./dto/create-block.dto");
const availability_dto_1 = require("./dto/availability.dto");
const set_business_hours_dto_1 = require("./dto/set-business-hours.dto");
let BookingsController = class BookingsController {
    bookings;
    constructor(bookings) {
        this.bookings = bookings;
    }
    services(user, workspaceId) {
        return this.bookings.listServices(user, workspaceId);
    }
    createService(user, workspaceId, dto) {
        return this.bookings.createService(user, workspaceId, dto);
    }
    calendar(user, workspaceId, start, end) {
        return this.bookings.calendar(user, workspaceId, start, end);
    }
    businessHours(user, workspaceId) {
        return this.bookings.getBusinessHours(user, workspaceId);
    }
    setBusinessHours(user, workspaceId, dto) {
        return this.bookings.setBusinessHours(user, workspaceId, dto);
    }
    createBlock(user, workspaceId, dto) {
        return this.bookings.createBlock(user, workspaceId, dto);
    }
    availability(user, workspaceId, dto) {
        return this.bookings.availability(user, workspaceId, dto);
    }
    createAppointment(user, workspaceId, dto) {
        return this.bookings.createAppointment(user, workspaceId, dto);
    }
    confirm(user, workspaceId, appointmentId) {
        return this.bookings.confirm(user, workspaceId, appointmentId);
    }
    cancel(user, workspaceId, appointmentId) {
        return this.bookings.cancel(user, workspaceId, appointmentId);
    }
    complete(user, workspaceId, appointmentId) {
        return this.bookings.complete(user, workspaceId, appointmentId);
    }
    reschedule(user, workspaceId, appointmentId, dto) {
        return this.bookings.reschedule(user, workspaceId, appointmentId, dto);
    }
};
exports.BookingsController = BookingsController;
__decorate([
    (0, common_1.Get)('services'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "services", null);
__decorate([
    (0, common_1.Post)('services'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, create_service_dto_1.CreateServiceDto]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "createService", null);
__decorate([
    (0, common_1.Get)('calendar'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __param(2, (0, common_1.Query)('start')),
    __param(3, (0, common_1.Query)('end')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "calendar", null);
__decorate([
    (0, common_1.Get)('business-hours'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "businessHours", null);
__decorate([
    (0, common_1.Put)('business-hours'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, set_business_hours_dto_1.SetBusinessHoursDto]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "setBusinessHours", null);
__decorate([
    (0, common_1.Post)('calendar/blocks'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, create_block_dto_1.CreateCalendarBlockDto]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "createBlock", null);
__decorate([
    (0, common_1.Post)('availability'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, availability_dto_1.AvailabilityDto]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "availability", null);
__decorate([
    (0, common_1.Post)('appointments'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, create_appointment_dto_1.CreateAppointmentDto]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "createAppointment", null);
__decorate([
    (0, common_1.Post)('appointments/:appointmentId/confirm'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __param(2, (0, common_1.Param)('appointmentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "confirm", null);
__decorate([
    (0, common_1.Post)('appointments/:appointmentId/cancel'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __param(2, (0, common_1.Param)('appointmentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "cancel", null);
__decorate([
    (0, common_1.Post)('appointments/:appointmentId/complete'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __param(2, (0, common_1.Param)('appointmentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "complete", null);
__decorate([
    (0, common_1.Post)('appointments/:appointmentId/reschedule'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('workspaceId')),
    __param(2, (0, common_1.Param)('appointmentId')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, reschedule_appointment_dto_1.RescheduleAppointmentDto]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "reschedule", null);
exports.BookingsController = BookingsController = __decorate([
    (0, common_1.Controller)('workspaces/:workspaceId'),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard),
    __metadata("design:paramtypes", [bookings_service_1.BookingsService])
], BookingsController);
//# sourceMappingURL=bookings.controller.js.map