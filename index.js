const core = require('@actions/core');
const axios = require('axios');

try {
  const accountId = core.getInput('account-id');
  const controlApiKey = core.getInput('control-api-key');
  const appName = core.getInput('app-name');
  const createKey = core.getBooleanInput('create-key');
  const keyName = core.getInput('key-name');
  const keyCapabilities = core.getInput('key-capabilities');
  const appId = createApp(accountId, controlApiKey, appName);
  if (createKey) {
    core.info(`Creating an API key for app: ${appId}.`);
    createApiKey(appId, controlApiKey, keyName, keyCapabilities);
  }
} catch (error) {
  core.setFailed(error.message);
}

function createApp(accountId, controlApiKey, appName)
{
  const appUrl = `https://control.ably.net/v1/accounts/${accountId}/apps`;
  axios({
    method: 'post',
    url: appUrl,
    headers: { 'Authorization': `Bearer ${controlApiKey}` },
    data: {
      "name": appName,
      "status": "enabled",
      "tlsOnly": true,
      "fcmKey": null,
      "apnsCertificate": null,
      "apnsPrivateKey": null,
      "apnsUseSandboxEndpoint": false
    }
  })
  .then(function (response) {
    core.setOutput("app-id", response.data.id);
    return response.data.id;
  })
  .catch(function (error) {
    if (error.response.status === 422) {
      // App with the exact name already exists.
      // Get the app and return its id.
      axios({
        method: 'get',
        url: appUrl,
        headers: { 'Authorization': `Bearer ${controlApiKey}` },
      })
      .then(function (response) {
        let app = response.data.filter(app => app.name.toLowerCase() === appName.toLowerCase())[0];
        core.setOutput("app-id", app.id);
        return app.id;
      });
    }
  });
}

function createApiKey(appId, controlApiKey, keyName, keyCapabilities) {
  const keyUrl = `https://control.ably.net/v1/apps/${appId}/keys`;
  const capabilities = keyCapabilities.split(',');
  axios({
    method: 'post',
    url: keyUrl,
    headers: { 'Authorization': `Bearer ${controlApiKey}` },
    data: {
      "name": keyName,
      "capability": capabilities,
    }
  })
  .then(function (response) {
    core.setSecret('api-key-id');
    core.setOutput("api-key-id", response.data.id);
    core.setSecret('api-key-secret');
    core.setOutput("api-key-secret", response.data.secret);
  })
  .catch(function (error) {
    if (error.response.status === 422) {
      // Key with the exact name already exists.
      // Get the key and return its id.
      axios({
        method: 'get',
        url: keyUrl,
        headers: { 'Authorization': `Bearer ${controlApiKey}` },
      })
      .then(function (response) {
        let key = response.data.filter(key => key.name.toLowerCase() === keyName.toLowerCase())[0];
        core.setSecret('api-key-id');
        core.setOutput("api-key-id", key.id);
        core.setSecret('api-key-secret');
        core.setOutput("api-key-secret", key.secret);
      });
    }
  });
}