import { DahuaAPI } from 'node-dahua-api';

export const cameraConfig = {
  entry: {
    ip: '192.168.2.5',
    port: 37777,
    username: 'admin',
    password: '@dminparkir',
    channel: 1,
  },
  exit: {
    ip: '192.168.2.7',
    port: 37777,
    username: 'admin',
    password: '@dminparkir',
    channel: 1,
  }
};

export const createCameraConnection = (type: 'entry' | 'exit') => {
  const config = cameraConfig[type];
  return new DahuaAPI({
    host: config.ip,
    port: config.port,
    username: config.username,
    password: config.password,
    channel: config.channel,
  });
}; 