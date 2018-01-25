import * as args from './args';
import PercyClient from 'percy-client';
import yargs from 'yargs';

const VERSION = require('../package.json').version;
const MAX_RETRIES_WHEN_PROCESSING = 1000;

function clientInfo() {
  let version = require('../package.json').version;
  return `percy-poller/${version}`;
}

function shouldContinueToPoll(buildAttributes) {
  return buildAttributes.state == 'pending' || buildAttributes.state == 'processing';
}

function retry(client, buildId, numRetries) {
  if (numRetries < MAX_RETRIES_WHEN_PROCESSING) {
    // Retry with recursion with retries incremented
    setTimeout(getBuild, 1000, client, buildId, numRetries + 1);
  } else {
    handleError('Retries exceeded. Exiting.');
  }
}

function handleUnexpectedStatusCode(response) {
  handleError(
    `Received an unexpected status code: ${response.statusCode}` +
      `\nResponse Body: ${JSON.stringify(response.body)}`,
  );
}

function unexpectedBuildResponseBody(response) {
  return !response.body.data || !response.body.data.attributes;
}

function handleUnexpectedBuildResponseBody(response) {
  handleError(
    'Response body in an unexpected format. Expected JSON with data.attributes.' +
      `\nResponse Body: ${JSON.stringify(response.body)}`,
  );
}

function unexpectedBuildsResponseBody(response) {
  return (
    !response.body.data || response.body.data.length == 0 || response.body.data[0].type != 'builds'
  );
}

function handleUnexpectedBuildsResponseBody(response) {
  handleError(
    'Response body in an unexpected format. Expected JSON with data array of builds.' +
      `\nResponse Body: ${JSON.stringify(response.body)}`,
  );
}

function pollUntilResult(client, buildId, buildAttributes, numRetries) {
  if (shouldContinueToPoll(buildAttributes)) {
    retry(client, buildId, numRetries);
  } else {
    let result = JSON.stringify(buildAttributes, null, 2);
    console.log(result);
  }
}

function handleBuildResponse(response, client, buildId, numRetries) {
  if (response.statusCode != 200) {
    handleUnexpectedStatusCode(response);
    return;
  }

  if (unexpectedBuildResponseBody(response)) {
    handleUnexpectedBuildResponseBody(response);
    return;
  }

  let buildAttributes = response.body.data.attributes;
  pollUntilResult(client, buildId, buildAttributes, numRetries);
}

function handleBuildsResponse(response, client) {
  if (response.statusCode != 200) {
    handleUnexpectedStatusCode(response);
    return;
  }

  if (unexpectedBuildsResponseBody(response)) {
    handleUnexpectedBuildsResponseBody(response);
    return;
  }

  let buildId = response.body.data[0].id;
  let buildAttributes = response.body.data[0].attributes;
  pollUntilResult(client, buildId, buildAttributes, 0);
}

function handleError(error) {
  if (error.message) {
    console.error(error.message);
  } else {
    console.error(error);
  }
  // TODO: Could retry on 5XXs 3 times before exiting.
  process.exitCode = 1;
}

function getBuildForSHA(client, project, sha) {
  let buildPromise = client.getBuilds(project, {sha: sha});
  buildPromise
    .then(response => {
      handleBuildsResponse(response, client);
    })
    .catch(function(error) {
      handleError(error);
    });
}

function getBuild(client, buildId, numRetries) {
  let buildPromise = client.getBuild(buildId);
  buildPromise
    .then(response => {
      handleBuildResponse(response, client, buildId, numRetries);
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

  if (!process.env.PERCY_FULL_TOKEN) {
    handleError('PERCY_FULL_TOKEN environment variable must be set.');
    return;
  }

  let apiUrl = process.env.PERCY_API; // Optional.
  let percyClient = new PercyClient({
    token: process.env.PERCY_FULL_TOKEN,
    apiUrl,
    clientInfo: clientInfo(),
  });

  if (argv.sha) {
    if (!process.env.PERCY_PROJECT) {
      handleError('PERCY_PROJECT environment variable must be set when querying by sha.');
      return;
    }
    getBuildForSHA(percyClient, process.env.PERCY_PROJECT, argv.sha);
  } else if (argv.build_id) {
    let buildId = argv.build_id;
    getBuild(percyClient, buildId, 0);
  } else {
    handleError('You must specify either a build_id or sha');
    return;
  }
}
