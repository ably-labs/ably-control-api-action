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
      core.info(`Created app named ${appName}.`);
      core.setOutput("app-name", response.data.name);
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
          let app = response.data.filter(app => 
            app.name.toLowerCase() === appName.toLowerCase() &&
            app.status.toLowerCase() === "enabled")[0];
          core.info(`Using id of existing app named ${app.name}.`);
          core.setOutput("app-name", app.name);
          core.setOutput("app-id", app.id);
          resolve(app.id);
        });
      } else {
        throw error;
      }
    });
  });
}

const getApiKey = (appId, controlApiKey, keyName) => {
  return new Promise((resolve, reject) => {
    const keyUrl = `https://control.ably.net/v1/apps/${appId}/keys`;
    axios({
      method: 'get',
      url: keyUrl,
      headers: { 'Authorization': `Bearer ${controlApiKey}` },
    })
    .then(function (response) {
      let key = response.data.filter(key => key.name.toLowerCase() === keyName.toLowerCase())[0];
      if (key !== undefined) {
        core.info(`Found existing API key named ${key.name}.`);
        core.setOutput("api-key-name", key.name);
        core.setSecret("api-key-id");
        core.setOutput("api-key-id", key.id);
        core.setSecret("api-key-key");
        core.setOutput("api-key-key", key.key);
        resolve();
      } else {
        core.info(`No existing API Key named ${keyName} was found.`);
        reject(new Error("No API key found."));
      }
    })
    .catch(function (error) {
      throw error;
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
      core.setOutput("api-key-name", response.data.name);
      core.setSecret('api-key-id');
      core.setOutput("api-key-id", response.data.id);
      core.setSecret('api-key-key');
      core.setOutput("api-key-key", response.data.key);
      resolve();
    })
    .catch(function (error) {
      throw error;
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
      getApiKey(appId, controlApiKey, keyName).then(
        _result => core.info("Completed"),
        _error => createApiKey(appId, controlApiKey, keyName, keyCapabilities)
      );
    }
  })
} catch (error) {
  core.setFailed(error.message);
}

