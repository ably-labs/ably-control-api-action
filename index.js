const core = require("@actions/core");
const axios = require("axios");

async function createApp(accountId, controlApiKey, appName) {
  try {
    const appUrl = `https://control.ably.net/v1/accounts/${accountId}/apps`;
    core.info(`Creating app for ${accountId}`);
    const response = await axios({
      method: "post",
      url: appUrl,
      headers: { Authorization: `Bearer ${controlApiKey}` },
      data: {
        name: appName,
        status: "enabled",
        tlsOnly: true,
        fcmKey: null,
        apnsCertificate: null,
        apnsPrivateKey: null,
        apnsUseSandboxEndpoint: false
      }
    });

    core.info(`Created app named ${appName}.`);
    core.setOutput("app-name", response.data.name);
    core.setOutput("app-id", response.data.id);
    return response.data.id;
  } catch (error) {
    if (error.response.status === 422) {
      core.info(`App named ${appName} already exists.`);
      const response = await axios({
        method: "get",
        url: appUrl,
        headers: { Authorization: `Bearer ${controlApiKey}` }
      });

      let app = response.data.filter((app) => app.name.toLowerCase() === appName.toLowerCase() && app.status.toLowerCase() === "enabled")[0];

      core.info(`Using id of existing app named ${app.name}.`);
      core.setOutput("app-name", app.name);
      core.setOutput("app-id", app.id);
      return app.id;
    } else {
      core.setFailed(error.message);
    }
  }
}

async function getApiKey(appId, controlApiKey, keyName) {
  const keyUrl = `https://control.ably.net/v1/apps/${appId}/keys`;
  core.info(`Getting API Key for: ${appId}.`);
  const response = await axios({
    method: "get",
    url: keyUrl,
    headers: { Authorization: `Bearer ${controlApiKey}` }
  });

  let key = response.data.filter((key) => key.name.toLowerCase() === keyName.toLowerCase())[0];

  if (key === undefined) {
    core.info(`No existing API Key named ${keyName} was found.`);
    throw new Error("No API key found.");
  }

  core.info(`Found existing API key named ${key.name}.`);
  core.setOutput("api-key-name", key.name);
  core.setSecret(key.id);
  core.setOutput("api-key-id", key.id);
  core.setSecret(key.key);
  core.setOutput("api-key-key", key.key);
}

async function createApiKey(appId, controlApiKey, keyName, keyCapabilities) {
  const keyUrl = `https://control.ably.net/v1/apps/${appId}/keys`;
  const capabilities = keyCapabilities
    .split(",")
    .map((capability) => capability.trim())
    .filter((capability) => capability !== "");

  core.info(`Creating API key for: ${appId}.`);

  const response = await axios({
    method: "post",
    url: keyUrl,
    headers: { Authorization: `Bearer ${controlApiKey}` },
    data: {
      name: keyName,
      capability: { "*": capabilities }
    }
  });

  core.info(`Created API key with name: ${response.data.name}.`);
  core.setOutput("api-key-name", response.data.name);
  core.setSecret(response.data.id);
  core.setOutput("api-key-id", response.data.id);
  core.setSecret(response.data.key);
  core.setOutput("api-key-key", response.data.key);
}

(async () => {
  try {
    const accountId = core.getInput("account-id");
    const controlApiKey = core.getInput("control-api-key");
    const appName = core.getInput("app-name");
    const createKey = core.getBooleanInput("create-key");
    const keyName = core.getInput("key-name");
    const keyCapabilities = core.getInput("key-capabilities");

    const appId = await createApp(accountId, controlApiKey, appName);

    if (createKey) {
      try {
        await getApiKey(appId, controlApiKey, keyName);
        core.info("Completed");
      } catch {
        createApiKey(appId, controlApiKey, keyName, keyCapabilities);
      }
    }
  } catch (error) {
    core.setFailed(error.message);
  }
})();
