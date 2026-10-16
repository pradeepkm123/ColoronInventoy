// backend/socket.js
const { Server } = require('socket.io');

let io = null;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    },
  });

  io.on('connection', (socket) => {
    socket.on('join_room', (data) => {
      const { role, storeLocation, userId, name } = data || {};

      // 1. Role-based rooms
      if (role) {
        const lowerRole = String(role).toLowerCase().trim();
        socket.join(`role_${lowerRole}`);

        if (String(role).toUpperCase().includes('ADMIN')) {
          socket.join('super_admin');
          socket.join('role_admin');
          socket.join('role_super_admin');
        }

        if (
          lowerRole.includes('service') ||
          lowerRole.includes('engineer') ||
          lowerRole.includes('technician')
        ) {
          socket.join('service_person');
          socket.join('role_service_person');
        }
      }

      // 2. Store / Location rooms
      if (storeLocation) {
        const loc = String(storeLocation).trim();
        socket.join(`store_${loc}`);
        socket.join(loc);
        socket.join(`store_${loc.toLowerCase()}`);
      }

      // 3. User-specific rooms
      if (userId) {
        socket.join(`user_${String(userId)}`);
      }
      if (name) {
        const cleanName = String(name).toLowerCase().trim();
        socket.join(`user_${cleanName}`);
        socket.join(`user_${String(name).trim()}`);
      }
    });

    socket.on('disconnect', () => {
      // Disconnected
    });
  });

  return io;
}

function getIO() {
  return io;
}

function emitToStore(storeName, event, data) {
  if (!io || !storeName) return;
  const clean = String(storeName).trim();
  io.to(`store_${clean}`)
    .to(clean)
    .to(`store_${clean.toLowerCase()}`)
    .emit(event, data);
}

function emitToSuperAdmin(event, data) {
  if (!io) return;
  io.to('super_admin')
    .to('role_admin')
    .to('role_superadmin')
    .to('role_super_admin')
    .emit(event, data);
}

function emitToUser(userIdOrName, event, data) {
  if (!io || !userIdOrName) return;
  const clean = String(userIdOrName).trim();
  io.to(`user_${clean}`)
    .to(`user_${clean.toLowerCase()}`)
    .emit(event, data);
}

function emitToServicePerson(engineerNameOrId, event, data) {
  if (!io) return;
  if (engineerNameOrId) {
    const clean = String(engineerNameOrId).trim();
    io.to(`user_${clean}`)
      .to(`user_${clean.toLowerCase()}`)
      .emit(event, data);
  }
  io.to('service_person')
    .to('role_service_person')
    .emit(event, data);
}

function emitToAll(event, data) {
  if (!io) return;
  io.emit(event, data);
}

module.exports = {
  initSocket,
  getIO,
  emitToStore,
  emitToSuperAdmin,
  emitToUser,
  emitToServicePerson,
  emitToAll,
};
