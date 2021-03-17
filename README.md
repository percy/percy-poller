# percy-poller

## Deprecated

This package has been deprecated and is not supported. Use the Percy CLI `build:wait` command: https://docs.percy.io/docs/cli-build#percy-buildwait instead. 


Utility to poll for a build's status on [Percy](https://percy.io).  

## Use

**NOTE:** Using percy-poller requires a special token. The normal token provided on a project's settings page will not work.

```bash
npm i -g @percy/poller
export PERCY_FULL_TOKEN=<your_token>  # Handle this token securely - it must be kept secret
export PERCY_PROJECT=<your_project>  # The org and project slug (e.g. percy/example-percyscript)

# Option 1 - Poll by build_id:
percy-poller --build_id <your_build_id>

# Option 2 - Poll by git commit sha:
percy-poller --sha <your_full_40_character_commit_sha>
```

* If the build is still processing, it will poll until the build is finished. It retries once a second, with a max of 1000 retries.
* It will log the status of the build requested in JSON format.  
* If an error is encountered, it will log the error to stderr, and exit with a code of 1.

### Sample Build Status

The status is JSON formatted, and has several main fields of interest:
- state: You probably want to confirm this is 'finished' and not 'failed' or another error condition.  
- web-url: This is to Percy's web UI for viewing and approving the build.
- review-state: unreviewed or approved. Builds will be automatically approved if there are no visual changes since last approval.
- total-snapshots: The total number of snapshots in the build.
- total-snapshots-unreviewed: The total number of snapshots with changes that are unreviewed.

Sample of a full status:

```
{
  "branch": "master",
  "build-number": 632,
  "web-url": "https://percy.io/test/test/builds/430290",
  "state": "finished",
  "review-state": "approved",
  "review-state-reason": "no_diffs",
  "is-pull-request": false,
  "pull-request-number": null,
  "pull-request-title": null,
  "user-agent": "Percy/v1 percy-storybook/1.2.6 percy-js/2.4.2 (storybook/^3.2.12 react/^15.6.1; node/v8.4.0)",
  "total-snapshots": 18,
  "total-snapshots-unreviewed": 18,
  "total-comparisons": 36,
  "total-comparisons-finished": 36,
  "total-comparisons-diff": 36,
  "failure-reason": null,
  "parallel-nonce": null,
  "parallel-total-shards": null,
  "finished-at": "2017-12-05T18:57:28.000Z",
  "approved-at": null,
  "created-at": "2017-12-05T18:57:07.000Z",
  "updated-at": "2017-12-05T18:57:28.000Z"
}
```

## Development

After making code changes, you'll need to rebuild before they'll take effect.
```
yarn build
export PERCY_FULL_TOKEN=<your_token>  # Handle this token securely - it must be kept secret
./bin/percy-poller.js  --build_id <your_build_id>
```

## Testing

Use `yarn test` to run the tests # TODO
