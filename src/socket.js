let _io = null;

export function setIO(io) {
  _io = io;
}

export function emitToTenant(tenantId, event, data) {
  if (_io) {
    _io.to(`tenant-${tenantId}`).emit(event, data);
  }
}