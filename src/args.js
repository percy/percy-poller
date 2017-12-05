export const docs = 'Documentation: https://github.com/percy/percy-poller';

export const options = {
  token: {
    description: 'Percy token with read access',
    type: 'string',
  },
  build_id: {
    description: 'Percy build id',
    type: 'string',
  },
};

export const usage = 'Usage: percy-poller --token=TOKEN --build_id=BUILD_ID';
