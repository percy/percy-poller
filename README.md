# percy-poller

[![Package Status](https://img.shields.io/npm/v/percy-poller.svg)](https://www.npmjs.com/package/percy-poller)

Utility to poll for a build's status on [Percy](https://percy.io).  

## Use

** NOTE: ** Using percy-poller requires a special token. The normal token provided on a project's settings page will not work.

```
npm i -g percy-poller
percy-poller --token <your_token> --build_id <your_build_id>
```

* If the build is still processing, it will poll until the build is finished. It retries once a second, with a max of 1000 retries.
* It will log the status of the build requested in JSON format.  
* If an error is encountered, it will log the error to stderr, and exit with a code of 1.


## Development

After making code changes, you'll need to rebuild before they'll take effect.
```
yarn build
./bin/percy-poller.js  --token <your_token> --build_id <your_build_id>
```

## Testing

Use `yarn test` to run the tests
