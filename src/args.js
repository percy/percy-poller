export const docs = 'Documentation: https://github.com/percy/percy-poller';

export const options = {
  build_id: {
    description: 'Percy build id',
    type: 'string',
  },
  sha: {
    description: 'Git Commit SHA to find a build for.',
    type: 'string',
  },
};

export const usage = 'Usage: percy-poller --build_id=BUILD_ID';
