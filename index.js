const core = require('@actions/core');
const axios = require('axios');

const createApp = (accountId, controlApiKey, appName) => {
  return new Promise(resolve => {
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
      resolve(response.data.id);
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
          resolve(app.id);
        });
      }
    });
  });
}

const createApiKey = (appId, controlApiKey, keyName, keyCapabilities) => {
  return new Promise(resolve => {
    const keyUrl = `https://control.ably.net/v1/apps/${appId}/keys`;
    const capabilities = keyCapabilities
      .split('-')
      .map(capability => capability.trim())
      .filter(capability => capability !== '');
    axios({
      method: 'post',
      url: keyUrl,
      headers: { 'Authorization': `Bearer ${controlApiKey}` },
      data: {
        "name": keyName,
        "capability": { "*": capabilities }
      }
    })
    .then(function (response) {
      core.info(`Created API key with name: ${response.data.name}.`);
      core.setSecret('api-key-id');
      core.setOutput("api-key-id", response.data.id);
      core.setSecret('api-key-secret');
      core.setOutput("api-key-secret", response.data.key);
      resolve();
    })
    .catch(function (error) {
      core.error(JSON.stringify(error));
      if (error.response.status === 422) {
        // Key with the exact name already exists.
        // Get the key and return its id.
        axios({
          method: 'get',
          url: keyUrl,
          headers: { 'Authorization': `Bearer ${controlApiKey}` },
        })
        .then(function (response) {
          core.info(response);
          let key = response.data.filter(key => key.name.toLowerCase() === keyName.toLowerCase())[0];
          core.info(key);
          core.setSecret('api-key-id');
          core.setOutput("api-key-id", key.id);
          core.setSecret('api-key-secret');
          core.setOutput("api-key-secret", key.key);
          resolve();
        });
      }
    });
  });
}

try {
  const accountId = core.getInput('account-id');
  const controlApiKey = core.getInput('control-api-key');
  const appName = core.getInput('app-name');
  const createKey = core.getBooleanInput('create-key');
  const keyName = core.getInput('key-name');
  const keyCapabilities = core.getInput('key-capabilities');
  createApp(accountId, controlApiKey, appName).then((appId) =>  {
    if (createKey) {
      core.info(`Creating an API key for app: ${appId}.`);
      createApiKey(appId, controlApiKey, keyName, keyCapabilities);
    }
  })
} catch (error) {
  core.setFailed(error.message);
}

