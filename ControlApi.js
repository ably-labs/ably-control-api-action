const core = require("@actions/core");
const fetch = require("node-fetch");

const appApi = "https://control.ably.net/v1/apps";
const accountApi = "https://control.ably.net/v1/accounts";

class AblyControlApi {
  constructor(accountId, controlApiKey) {
    this.accountId = accountId;
    this.controlApiKey = controlApiKey;
    this.defaultHeaders = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.controlApiKey}`
    };
  }

  async checkCredentials() {
    core.info(`Checking credentials for account: ${this.accountId}`);
    const response = await this.get(`${accountApi}/${this.accountId}/apps`);

    if (response.status !== 200) {
      const responseText = await response.text();
      core.debug(responseText);
      throw new Error("Invalid Ably accountId + control API key combination.");
    }
  }

  async listApps() {
    core.info(`Listing all apps registered on account...`);
    const response = await this.get(`${accountApi}/${this.accountId}/apps`);
    if (response.status !== 200) {
      return [];
    }

    return response.json();
  }

  async getApp(appName) {
    core.info(`Retrieving app: ${appName}`);
    const appListResponse = await this.listApps();
    const allApps = await appListResponse.json();
    return allApps.filter((app) => app.name.toLowerCase() === appName.toLowerCase() && app.status.toLowerCase() === "enabled")[0];
  }

  async createApp(appName) {
    core.info(`Creating app: ${appName}`);

    const request = {
      name: appName,
      status: "enabled",
      tlsOnly: true,
      apnsUseSandboxEndpoint: false
    };

    const response = await this.post(`${accountApi}/${this.accountId}/apps`, request);
    if (!response.ok) {
      core.error(response.statusText);
      throw new Error(response.text());
    }
    return response.json();
  }

  async getOrCreateApp(appName) {
    const allApps = await this.listApps();
    const app = allApps.filter((app) => app.name.toLowerCase() === appName.toLowerCase() && app.status.toLowerCase() === "enabled")[0];

    if (app) {
      return app;
    }

    core.info(`${appName} does not exist.`);
    return this.createApp(appName);
  }

  async listApiKeys(appId) {
    core.info(`Listing API keys available for app: ${appId}`);
    const response = await this.get(`${appApi}/${appId}/keys`);
    if (response.status !== 200) {
      return [];
    }

    return response.json();
  }

  async createApiKey(appId, keyName, keyCapabilities) {
    core.info(`Creating an API key for app '${appId}' with name '${keyName}'...`);

    const capabilities = keyCapabilities
      .split(",")
      .map((capability) => capability.trim())
      .filter((capability) => capability !== "");

    const response = await this.post(`${appApi}/${appId}/keys`, { name: keyName, capability: { "*": capabilities } });
    if (!response.ok) {
      core.error(response.statusText);
      throw new Error(response.text());
    }
    return response.json();
  }

  async get(url) {
    const response = await fetch(url, { headers: this.defaultHeaders });
    core.info(`GET: ${url} returned status: ${response.status}`);
    return response;
  }

  async post(url, body) {
    const options = { method: "post", headers: this.defaultHeaders, body: JSON.stringify(body) };
    const response = await fetch(url, options);
    core.info(`POST: ${url} returned status: ${response.status}`);
    return response;
  }
}

module.exports = AblyControlApi;
