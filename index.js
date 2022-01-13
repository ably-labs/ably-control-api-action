const core = require("@actions/core");
const ControlApi = require("./ControlApi");

core.info(`Generating Ably Keys...`);

(async () => {
  const accountId = core.getInput("account-id");
  const controlApiKey = core.getInput("control-api-key");

  const appName = core.getInput("app-name");
  const createKey = core.getBooleanInput("create-key");
  const keyName = core.getInput("key-name");
  const keyCapabilities = core.getInput("key-capabilities");

  const controlApi = new ControlApi(accountId, controlApiKey);
  await controlApi.checkCredentials();

  const app = await controlApi.getOrCreateApp(appName);

  if (!createKey) {
    core.info(`Skipping creating key due to configuration.`);
    return;
  }

  const allKeys = await controlApi.listApiKeys(app.id);
  let key = allKeys.filter((key) => key.name.toLowerCase() === keyName.toLowerCase())[0];

  if (!key) {
    core.info(`No existing API key found.`);
    key = await controlApi.createApiKey(app.id, keyName, keyCapabilities);
  }

  core.info(`Account, application and keys all exist - storing secrets...`);

  core.setSecret(key.id);
  core.setSecret(key.key);

  core.setOutput("app-id", app.id);
  core.setOutput("app-name", app.name);
  core.setOutput("api-key-id", key.id);
  core.setOutput("api-key-name", key.name);
  core.setOutput("api-key-key", key.key);

  core.info("Completed");
})();
