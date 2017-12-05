import * as args from './args';
import PercyClient from 'percy-client';
import yargs from 'yargs';

const VERSION = require('../package.json').version;
const MAX_RETRIES_WHEN_PROCESSING = 1000;

function getBuild(client, buildId, numRetries) {
  let buildPromise = client.getBuild(buildId);
  buildPromise
    .then(response => {
      if (response.statusCode == 200) {
        if (
          response.body.data.attributes.state == 'pending' ||
          response.body.data.attributes.state == 'processing'
        ) {
          if (numRetries < MAX_RETRIES_WHEN_PROCESSING) {
            // Retry with recursion with retries incremented
            setTimeout(getBuild, 1000, client, buildId, numRetries + 1);
          } else {
            console.error('Retries exceeded. Exiting.'); // eslint-disable-line no-console
            process.exitCode = 1;
          }
        } else {
          if (numRetries < MAX_RETRIES_WHEN_PROCESSING) {
            // Received a 200 with a state other than pending or processing
            // Could be Finished, Failed, Expired. Log and terminate.
            console.log(response.body.data.attributes); // eslint-disable-line no-console
          }
        }
      } else {
        // eslint-disable-next-line no-console
        console.error('Received an unexpected response: ', response.statusCode);
        console.error(response.body); // eslint-disable-line no-console
        process.exitCode = 1;
      }
    })
    .catch(function(error) {
      if (error.message) {
        console.error(error.message); // eslint-disable-line no-console
      } else {
        console.error(error); // eslint-disable-line no-console
      }
      // Could retry on 5XXs 3 times before exiting.
      process.exitCode = 1;
    });
}

// eslint-disable-next-line import/prefer-default-export
export function run(argv) {
  argv = yargs(argv)
    .usage(args.usage)
    .help()
    .alias('help', 'h')
    .options(args.options)
    .demandOption(['token', 'build_id'], 'Please provide both token and build_id.')
    .epilogue(args.docs).argv;

  if (argv.help) {
    yargs.showHelp();
    process.on('exit', () => process.exit(1));
    return;
  }

  if (argv.version) {
    process.stdout.write(`v${VERSION}\n`);
    process.on('exit', () => process.exit(0));
    return;
  }

  let percyClient = new PercyClient({token: argv.token});
  let buildId = argv.build_id;
  getBuild(percyClient, buildId, 0);
}
