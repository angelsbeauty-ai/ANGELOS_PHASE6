"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendHippocraticTreatmentMessage = sendHippocraticTreatmentMessage;
exports.createTreatmentFromNote = createTreatmentFromNote;
function sendHippocraticTreatmentMessage(_treatmentNote) {
    return 'Treatment recorded. A care team member will follow up shortly.';
}
function createTreatmentFromNote(_note, _clientId, _userId) {
    return { note: _note, client_id: _clientId, created_by: _userId };
}
//# sourceMappingURL=treatment-messages.js.map