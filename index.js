const core = require('@actions/core');
const axios = require('axios');

try {
  const accountId = core.getInput('account-id');
  const controlApiKey = core.getInput('control-api-key');
  const appName = core.getInput('app-name');
  console.log(`Ably app to create: ${appName}!`);
  const createAppUrl = `https://control.ably.net/v1/accounts/${accountId}/apps`;
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
  }).then(function (response) {
    core.setOutput("app-id", response.id);
  });
} catch (error) {
  core.setFailed(error.message);
}