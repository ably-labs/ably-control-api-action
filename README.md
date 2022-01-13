# Ably Control Api Action

![Required Inputs Workflow](https://github.com/ably-labs/ably-control-api-action/actions/workflows/required_inputs_test.yml/badge.svg)
![All Inputs Workflow](https://github.com/ably-labs/ably-control-api-action/actions/workflows/all_inputs_test.yml/badge.svg)

A GitHub Action to use the [Ably Control API](https://ably.com/documentation/control-api). You can use this action to:

* Create an Ably application.
* Add an API key to an application, with a list of capabilities.

## Usage

### Inputs

The action has the following inputs:

* `account-id` (**required**); the Ably account ID, see [these instructions](https://ably.com/documentation/control-api#account-id) how to obtain this.
* `control-api-key`  (**required**); an Ably Control API key, see [these instructions](https://ably.com/documentation/control-api#authentication) how to create one. This key needs the following permissions:
  * `read:app`
  * `write:app`
  * `read:key`
  * `write:key`
* `app-name` (**optional**); the name for the Ably app to create. Defaults to the repository name.
* `create-key` (**optional**); a boolean value indicating whether to create an API key for the new app. Defaults to `'true'`.
* `key-name` (**optional**); the friendly name for the API key. Defaults to `'Generated API key'`.
* `key-capabilities` (**optional**); a comma-separated list of capabilities to grant to the new key. Defaults to `'publish, subscribe'`. These are the available capabilities:
  * `channel-metadata`,
  * `history`,
  * `presence`,
  * `publish`,
  * `push-admin`,
  * `push-subscribe`,
  * `statistics`,
  * `subscribe`

  For details of these capabilities see the [Ably docs](https://ably.com/documentation/core-features/authentication#capability-operations).

It is important to keep the `account-id` and `control-api-key` inputs secret, as they are used to authenticate with the Ably Control API. Put these values in [GitHub secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets) of your repository and read the secret values when configuring the inputs of this action (see the examples below).

### Outputs

* `app-name`; the name of the created Ably app.
* `app-id`; the ID of the created Ably app.<sup>*</sup>
* `api-key-name`; the name of the created API key.
* `api-key-id`; the ID of the created API key.<sup>*</sup>
* `api-key-key`; the key value of the created API key. <sup>*</sup>

> (*) Output is marked as a secret, so it won't be visible in the GitHub workflow logs.

### Examples

#### Using only the required inputs

```yml
- name: Create Ably App
  id: ablyapp
  uses: ably-labs/ably-control-api-action@v0.1.4
  with:
    account-id: '${{ secrets.ABLY_ACCOUNT_ID }}'
    control-api-key: '${{ secrets.ABLY_CONTROL_API_KEY }}'
- name: Get the output
  run: |
    echo "App Name: ${{ steps.ablyapp.outputs.app-name }}"
    echo "App ID: ${{ steps.ablyapp.outputs.app-id }}"
    echo "API Key Name: ${{ steps.ablyapp.outputs.api-key-name }}"
```

#### Using all inputs

```yml
- name: Create Ably App
  id: ablyapp
  uses: ably-labs/ably-control-api-action@v0.1.4
  with:
      account-id: '${{ secrets.ABLY_ACCOUNT_ID }}'
      control-api-key: '${{ secrets.ABLY_CONTROL_API_KEY }}'
      app-name: 'ably-control-api-key-all-inputs'
      create-key: 'true'
      key-name: 'all inputs api key'
      key-capabilities: 'publish, subscribe, presence, history'
- name: Get the output
  run: |
    echo "App Name: ${{ steps.ablyapp.outputs.app-name }}"
    echo "App ID: ${{ steps.ablyapp.outputs.app-id }}"
    echo "API Key Name: ${{ steps.ablyapp.outputs.api-key-name }}"
```

## More information

For more information about the Ably Control API please see the [Ably docs](https://ably.com/documentation/control-api).
