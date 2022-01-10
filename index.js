const core = require('@actions/core');
const axios = require('axios');

try {
  const accountId = core.getInput('account-id');
  const controlApiKey = core.getInput('control-api-key');
  const appName = core.getInput('app-name');
  console.log(`Ably app to create: ${appName}!`);
  const createAppUrl = `https://control.ably.net/v1/accounts/${accountId}/apps`;
  const getApsUrl = `https://control.ably.net/v1/accounts/${accountId}/apps`;
  axios({
    method: 'post',
    url: createAppUrl,
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
  })
  .catch(function (error) {
    if (error.response.status === 422) {
      // App with the exact name already exists.
      // Get the app and return its id.
      axios({
        method: 'get',
        url: getApsUrl,
        headers: { 'Authorization': `Bearer ${controlApiKey}` },
      })
      .then(function (response) {
        let app = response.data.filter(app => app.name.toLowerCase() === appName.toLowerCase())[0];
        core.setOutput("app-id", app.id);
      });
    }
  });
} catch (error) {
  core.setFailed(error.message);
}