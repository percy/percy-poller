import * as args from './args';
import PercyClient from 'percy-client';
import yargs from 'yargs';

const VERSION = require('../package.json').version;
const MAX_RETRIES_WHEN_PROCESSING = 1000;

function shouldContinueToPoll(response) {
  return (
    response.body.data.attributes.state == 'pending' ||
    response.body.data.attributes.state == 'processing'
  );
}

function retry(client, buildId, numRetries) {
  if (numRetries < MAX_RETRIES_WHEN_PROCESSING) {
    // Retry with recursion with retries incremented
    setTimeout(getBuild, 1000, client, buildId, numRetries + 1);
  } else {
    console.error('Retries exceeded. Exiting.'); // eslint-disable-line no-console
    process.exitCode = 1;
  }
}

function handleUnexpectedStatusCode(response) {
  // eslint-disable-next-line no-console
  console.error('Received an unexpected status code: ', response.statusCode);
  console.error(response.body); // eslint-disable-line no-console
  process.exitCode = 1;
}

function unexpectedResponseBody(response) {
  return !response.body.data || !response.body.data.attributes;
}

function handleUnexpectedResponseBody(response) {
  // eslint-disable-next-line no-console
  console.error('Response body in an unexpected format. Expected JSON with data.attributes');
  // eslint-disable-next-line no-console
  console.error('Response body: ', response.body);
  process.exitCode = 1;
}

function handleResponse(response, client, buildId, numRetries) {
  if (response.statusCode != 200) {
    handleUnexpectedStatusCode(response);
    return;
  }

  if (unexpectedResponseBody(response)) {
    handleUnexpectedResponseBody(response);
    return;
  }

  if (shouldContinueToPoll(response)) {
    retry(client, buildId, numRetries);
  } else {
    // Received a 200 with a state that indicates processing is finished.
    // Could be Finished, Failed, Expired. Log and terminate.
    let result = JSON.stringify(response.body.data.attributes, null, 2);
    console.log(result); // eslint-disable-line no-console
  }
}

function handleError(error) {
  if (error.message) {
    console.error(error.message); // eslint-disable-line no-console
  } else {
    console.error(error); // eslint-disable-line no-console
  }
  // TODO: Could retry on 5XXs 3 times before exiting.
  process.exitCode = 1;
}

function getBuild(client, buildId, numRetries) {
  let buildPromise = client.getBuild(buildId);
  buildPromise
    .then(response => {
      handleResponse(response, client, buildId, numRetries);
    })
    .catch(function(error) {
      handleError(error);
    });
}

// eslint-disable-next-line import/prefer-default-export
export function run(argv) {
  argv = yargs(argv)
    .usage(args.usage)
    .help()
    .alias('help', 'h')
    .options(args.options)
    .demandOption(['build_id'], 'Please provide a build_id.')
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

  if (!process.env.PERCY_TOKEN) {
    // eslint-disable-next-line no-console
    console.error('PERCY_TOKEN environment variable must be set.');
    process.exitCode = 1;
    return;
  }

  let percyClient = new PercyClient({token: process.env.PERCY_TOKEN});
  let buildId = argv.build_id;
  getBuild(percyClient, buildId, 0);
}
