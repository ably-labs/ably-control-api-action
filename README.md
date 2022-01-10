# Ably Control Api Action

A GitHub Action to use the Ably Control API.

## Usage

### Inputs

The action has the following required inputs:

* `account-id`; the Ably account ID, see [these instructions](https://ably.com/documentation/control-api#account-id) how to obtain this.
* `control-api-key`; an Ably Control API key, see [these instructions](https://ably.com/documentation/control-api#authentication) how to create one.
* `app-name`; the name of the Ably app to create via this action.

It is important to keep the `account-id` and `control-api-key` inputs secret, as they are used to authenticate with the Ably Control API. Put these values in GitHub secrets and read the secret values in the action (see the example below).

### Outputs

* `app-id`;, the ID of the created Ably app.

### Example

```yml
jobs:
    - name: Create Ably App
      id: ablyapp
      uses: ./
      with:
          account-id: '${{ secrets.ABLY_ACCOUNT_ID }}'
          control-api-key: '${{ secrets.ABLY_CONTROL_API_KEY }}'
          app-name: 'My new Ably app 1'
    - name: Get the output
      run: echo "App ID ${{ steps.ablyapp.outputs.app-id }}"
```

## More information

For more information about the Ably Control API please see the [Ably docs](https://ably.com/documentation/control-api);
