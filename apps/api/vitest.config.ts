import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'api',
    environment: 'node',
    globals: true,
    // Tests never touch a real server; these just satisfy config validation.
    env: {
      DB_USER: 'test',
      DB_PASSWORD: 'test',
      DB_NAME: 'motor_master_test',
      LOG_LEVEL: 'silent',
    },
  },
});
