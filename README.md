[![Moleculer](https://badgen.net/badge/Powered%20by/Moleculer/0e83cd)](https://moleculer.services)

# medicrea-comms-backend

This is a [Moleculer](https://moleculer.services/)-based microservices project. Generated with the [Moleculer CLI](https://moleculer.services/docs/0.14/moleculer-cli.html).

## Prerequisites

### Medicrea Accounts and Access

1. You will need a Medicrea email address (_Your.Name_@medtronic.com).
2. You will need access to Medicrea’s Twilio Dev Account.
3. You will need access to Medicrea’s Salesforce instance for Terazo.
4. You will have to follow the instructions in the Horizon View Client Install for VDI Access document (see Kyle for Horizon View Client Instalation VPE V5 doument). (**TODO: Add Link?**)

### Required Software

1. Install ngrok on your system (https://ngrok.com/download).
2. Install Docker Desktop on your system (https://www.docker.com/products/docker-desktop).
   - Start Docker Desktop.
   - Select the Settings icon on the top right.
   - Select Kubernetes on the left side of the page.
   - Select the checkbox next to Enable Kubernetes.
3. Install Tilt on your system (https://docs.tilt.dev/install.html).
4. Get Additional Required Files
   - Get .env.local file from another developer and place it in the project’s root directory.
   - Get salesforce.key file from another developer and place it in the project’s root directory.

## Usage

Start the project with `npm run start:tsdev` command.
After starting, open the http://localhost:3000/ URL in your browser.
On the welcome page you can test the generated services via API Gateway and check the nodes & services.

Install the molecular CLI and in the terminal, try the following commands:

$mol

- `nodes` - List all connected nodes.
- `actions` - List all registered service actions.
- `call greeter.hello` - Call the `greeter.hello` action.
- `call greeter.welcome --name John` - Call the `greeter.welcome` action with the `name` parameter.
- `call products.list` - List the products (call the `products.list` action).

## Services

- **api**: API Gateway services
- **greeter**: Sample service with `hello` and `welcome` actions.
- **products**: Sample DB service. To use with MongoDB, set `MONGO_URI` environment variables and install MongoDB adapter with `npm i moleculer-db-adapter-mongo`.

## Mixins

- **db.mixin**: Database access mixin for services. Based on [moleculer-db](https://github.com/moleculerjs/moleculer-db#readme)

## Useful links

- Moleculer website: https://moleculer.services/
- Moleculer Documentation: https://moleculer.services/docs/0.14/

## NPM scripts

- `npm run start:tsdev`: Start development mode
- `npm run start:dev`: Start development mode (load all services locally with hot-reload & REPL)
- `npm run start`: Start production mode (set `SERVICES` env variable to load certain services)
- `npm run cli`: Start a CLI and connect to production. Don't forget to set production namespace with `--ns` argument in script
- `npm run lint`: Run ESLint
- `npm run ci`: Run continuous test mode with watching
- `npm test`: Run tests & generate coverage report
- `npm run dc:up`: Start the stack with Docker Compose
- `npm run dc:down`: Stop the stack with Docker Compose
- `npm run twilio:update': Runs twilio webhook update code

## Putting it all Together.

Ensure that you have all the required environment variables setup. Consult the `.env.example` and create your own .env and .evn local by consulting with DevOps or anther developer to fill in the TWILIO and SALES_FORCE enviroment variables. Again, as stated above, ensure you have a proper salesforce.key as well.

1. Start the server environment

   - Run _tilt up_ on the command line.
   - Connect to the Tilt console using the URL displayed on the command window (http://localhost:10350/).
   - Look for the endpoint URL of the API resource in the Tilt console (http://localhost:3000/) which will be used later with the ngrok command.

2. Start ngrok and point it to the URL of the API resource (ngrok http 3000).

   - ngrok http --hostname=medicrea.ngrok.io https://localhost:3000

3. Configure Twilio.

   - Go to Twilio (https://console.twilio.com).
   - Verify that you have an active phone number.
     - Select # Phone Number on the left side of the screen.
     - Select Active numbers on the left side of the screen.
     - You should see a list of your active numbers. If not ask the team for help.
   - Point your number’s webhook to your dev environment.
     - Select the phone number you want to work with from the list.
     - Scroll down to the Voice and Fax section of the page.
     - Find the A Call Comes In subsection.
     - Select the Webhook option from the dropdown list.
     - Enter the ngrok Forwarding HTTPS URL for the API resource and append the path to the API that you want to test (https://b4cb-107-15-238-54.ngrok.io/api/v1/voice/inbound).
     - Select the HTTP POST option from the dropdown list.
     - Select the Save button at the bottom of the page.

4. Verify the System

   - On the Tilt console, select the resource that you want to test (voice in this case).
   - Use your phone to call the Twilio number that was configured above.
   - If everything is configured correctly, you should see some activity in the Tilt console for that resource.

## Automated Deployment process.

Building of the container and deploying into AWS is handled by Gitlab Pipelines (.gitlab-ci.yaml). This is triggered on a merge to the main branch of the repository.
The steps are as follows:

1. The "build" step takes the Dockerfile and uses a build platform called Kaniko (https://github.com/GoogleContainerTools/kaniko) to create the docker image and publish it to the Medtronic Artifactory instance using credentials sourced from Gitlab secrets
2. The "test" step is for future use to add image testing
3. The "deploy" step takes the image from the build step and deploys it to the AWS EKS Dev cluster.
   - Credentials are pulled from Gitlab secrets for AWS and Artifactory
   - Prerequisites are installed (kubectl and envsubst)
   - All application secrets are mapped and exposed to the cluster from AWS Secret Manager utilizing ASCP (https://docs.aws.amazon.com/secretsmanager/latest/userguide/integrating_csi_driver.html) and the k8s-aws-secretmap.yml file
   - Application is then deployed via kubectl and the deployment-k8s.yaml file
