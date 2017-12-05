# Releasing

1. `git pull origin master`  (Make sure there hasn't been any other changes)
1. `yarn login`
1. `yarn version` - enter new version
1. `git push origin master`
1. `git push --tags`
1. Ensure tests have passed on that tag
1. [Update the release notes](https://github.com/percy/percy-poller/releases) on GitHub
1. `npm publish` (leave new version blank)
1. [Visit npm](https://www.npmjs.com/package/percy-poller) and see the new version is live

* Announce the new release,
   making sure to say "thank you" to the contributors
   who helped shape this version!
