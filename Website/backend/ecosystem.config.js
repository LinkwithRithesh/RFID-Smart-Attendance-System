module.exports = {
  apps: [
    {
      name: 'smartattend-backend',
      script: 'server.js',
      // Real-time SSE Transport Architecture Note (Option b):
      // When utilizing single-process in-memory EventBus for Server-Sent Events (SSE)
      // (`/api/v1/attendance-sessions/:id/stream` & `/api/v1/devices/telemetry/stream`),
      // run as a single dedicated instance (instances: 1, exec_mode: 'fork') so all
      // client connections and event emitters share the same process event bus.
      // Alternatively, if scaling out horizontally across multiple worker nodes,
      // back eventBus with Redis Pub/Sub (Option a).
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
