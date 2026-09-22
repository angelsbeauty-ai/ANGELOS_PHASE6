"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTreatmentFromNote = exports.sendHippocraticTreatmentMessage = void 0;
function sendHippocraticTreatmentMessage(_treatmentNote) {
    return 'Treatment recorded. A care team member will follow up shortly.';
}
exports.sendHippocraticTreatmentMessage = sendHippocraticTreatmentMessage;
function createTreatmentFromNote(_note, _clientId, _userId) {
    return { note: _note, client_id: _clientId, created_by: _userId };
}
exports.createTreatmentFromNote = createTreatmentFromNote;
//# sourceMappingURL=treatment-messages.js.map