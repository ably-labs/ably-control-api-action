const core = require('@actions/core');
const axios = require('axios');
let appId;

try {
  const accountId = getInput('account-id');
  const controlApiKey = getInput('control-api-key');
  const appName = getInput('app-name');
  const createKey = getInput('create-key');
  const keyName = getInput('key-name');
  const keyCapabilities = getInput('key-capabilities');
  let createAppPromise = new Promise((resolve, reject) => {
    createApp(accountId, controlApiKey, appName);
    resolve(appId);
  });

  if (createKey) {
    createAppPromise.then((appId) => {
      createApiKey(appId, controlApiKey, keyName, keyCapabilities);
    });
  }
} catch (error) {
  setFailed(error.message);
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
    setOutput("app-id", response.data.id);
    appId = response.data.id;
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
        setOutput("app-id", app.id);
        appId = app.id;
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
    setOutput("api-key-id", response.data.id);
    core.setSecret('api-key-secret');
    setOutput("api-key-secret", response.data.secret);
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
        setOutput("api-key-id", key.id);
        core.setSecret('api-key-secret');
        setOutput("api-key-secret", key.secret);
      });
    }
  });
}