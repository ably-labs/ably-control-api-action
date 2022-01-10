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
        core.info(`App named ${appName} already exists.`);
        axios({
          method: 'get',
          url: appUrl,
          headers: { 'Authorization': `Bearer ${controlApiKey}` },
        })
        .then(function (response) {
          let app = response.data.filter(app => app.name.toLowerCase() === appName.toLowerCase())[0];
          core.info(`Using id of existing app named ${app.name}.`);
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
      .split(',')
      .map(capability => capability.trim())
      .filter(capability => capability !== '');
    core.info(capabilities);
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
      core.setSecret('api-key-key');
      core.setOutput("api-key-key", response.data.key);
      resolve();
    })
    .catch(function (error) {
      if (error.response.status === 422) {
        core.info(`API Key named ${keyName} already exists.`);
        axios({
          method: 'get',
          url: keyUrl,
          headers: { 'Authorization': `Bearer ${controlApiKey}` },
        })
        .then(function (response) {
          let key = response.data.filter(key => key.name.toLowerCase() === keyName.toLowerCase())[0];
          core.info(`Using id and key of existing API Key named ${key.name}.`);
          core.setSecret('api-key-id');
          core.setOutput("api-key-id", key.id);
          core.setSecret('api-key-key');
          core.setOutput("api-key-key", key.key);
          resolve();
        });
      } else {
        throw error;
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

