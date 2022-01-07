const core = require('@actions/core');
const axios = require('axios');

try {
  const accountId = core.getInput('account-id');
  const controlApiKey = core.getInput('control-api-key');
  const appName = core.getInput('app-name');
  console.log(`Ably app to create: ${appName}!`);
  const createAppUrl = `https://control.ably.net/v1/accounts/${accountId}/apps`;
  const config = {
    headers: { Authorization: `Bearer ${controlApiKey}` },
    data: {
      "name": appName,
      "status": "enabled",
      "tlsOnly": true,
      "fcmKey": null,
      "apnsCertificate": null,
      "apnsPrivateKey": null,
      "apnsUseSandboxEndpoint": false
    }
  };
  axios.post(createAppUrl, config).then(function (response) {
    core.setOutput("app-id", response.id);
  });
} catch (error) {
  core.setFailed(error.message);
}