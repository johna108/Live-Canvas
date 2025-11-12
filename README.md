# Living Canvas: A web-based puzzle game powered by Generative AI

This is a demo app that shows how to build an AI-powered web game using Angular, PhaserJS, Gemini, Imagen, Veo and Firebase App Hosting.

**Explore the demo and its underlying concepts in more detail on the solutions page at https://developers.google.com/solutions/learn/living-canvas**

Living Canvas is a web-based puzzle game where users draw on the screen to bring objects to life. The drawings are analysed with Gemini and transformed into higher fidelity graphics using Gemini, Imagen and Veo before dropping the graphics into the game world with gameplay properties attached by Gemini.

*This project is intended for demonstration purposes only. It is not
intended for use in a production environment.*

## Try it out today

We recommend trying out this project in Firebase Studio. Click this button to launch the project in Firebase Studio and follow the steps below to get started.

<a href="https://studio.firebase.google.com/import?url=https%3A%2F%2Fgithub.com%2FFirebaseExtended%2Fsolution-living-canvas">
  <picture>
    <source
      media="(prefers-color-scheme: dark)"
      srcset="https://cdn.firebasestudio.dev/btn/try_dark_32.svg">
    <source
      media="(prefers-color-scheme: light)"
      srcset="https://cdn.firebasestudio.dev/btn/try_light_32.svg">
    <img
      height="32"
      alt="Try in Firebase Studio"
      src="https://cdn.firebasestudio.dev/btn/try_blue_32.svg">
  </picture>
</a>

### Prerequisites

1. A new Firebase project
   - *We recommended using a new Firebase project for this demo. This [simplifies cleanup](#delete-and-clean-up-deployed-services) to avoid incurring on-going costs after trying out this demo app.*
1. [Activate billing on your Google Cloud / Firebase Project](https://console.cloud.google.com/billing/linkedaccount?project=_)
1. [Enable Vertex AI and recommended APIs](https://console.cloud.google.com/vertex-ai) in the Google Cloud console.
1. [Get a Gemini API key for your project in Google AI Studio.](https://aistudio.google.com/app/apikey)

> [!NOTE]
> Enabling billing and deploying services may incur a cost. Follow the steps under [Delete and clean up deployed services](#delete-and-clean-up-deployed-services) to remove any deployed services after trying out this demo.

## Getting Started

**📖 See [`docs/INDEX.md`](./docs/INDEX.md) for complete setup and API documentation.**

The project has been upgraded to use **local open-source AI models** instead of Google Cloud services. This means:

- ✅ No API keys or billing needed
- ✅ Fully offline capable (after model download)
- ✅ Text generation with Mistral 7B
- ✅ Image generation with Stable Diffusion XL
- ✅ Video generation with frame-by-frame synthesis

### Quick Start

**Using Docker (Recommended):**
```bash
docker-compose up
```

**Local Python (Alternative):**
```bash
cd server/local-models-service
pip install -r requirements.txt
python main.py
# In another terminal:
cd server && npm install && npm run dev
cd client && npm install && ng serve
```

Access the app at `http://localhost:4200`

### Running the Client and Server (without local models)

### Client

```
cd client
npm install
ng serve
```

### Server

```
cd server
npm install
npm run dev
```

## Running in Firebase Studio

1. Open the project in Firebase Studio.
1. When prompted, log in with your account.
1. Add your Google Cloud Project details (project ID, region and API key) to the file `.idx/dev.nix`.
    * Follow the steps under [Prerequisites](#prerequisites) to set up your Google Cloud project.
1. Rebuild the environment when prompted.
1. The app is now ready! Switch to the **Web Preview** to see it in action.

<!-- 
### Getting started in Firebase Studio

1. Open the project in Firebase Studio.
1. When prompted, select your Firebase project.
1. Log into Firebase Hosting. Navigate to the "Firebase Studio" screen and select "Authenticate". Follow the prompts in the terminal.
1. Prepare your Firebase project by setting up security rules, TTL configuration and functions for cleaning up data:
   1. Select a Firebase project: `firebase use`.
   2. Deploy Firestore, Storage and Functions: `firebase deploy --only firestore,storage,functions`
   3. Follow any additional prompts to set up access and grant permissions.
   4. You may need to grant the *Logs Writer* permission.
1. Configure Firebase for the Angular frontend app.
   1. Navigate to the Firebase console, create a new web client and donwload the configuration file for your project.
   1. Add the configuration into the file `client/web/angular-customer-app/src/environments/environment.development.ts`.
1. The app is now ready! Switch to the **Web Preview** to see it in action.

### Getting started locally

You can run the application locally and access Firebase and Google Cloud directly.

#### Local Prerequisites

1. Set up the [Google Cloud SDK](https://cloud.google.com/sdk/docs/install-sdk).
1. Set up the [Firebase CLI](https://firebase.google.com/docs/cli).
1. Set up [Application Default Credentials (ADC) for a local development environment](https://cloud.google.com/docs/authentication/set-up-adc-local-dev-environment)

Follow the steps in [services/cloud-run](services/cloud-run), [client/web/angular-customer-app](client/web/angular-customer-app) and [services/local-recommendation](services/local-recommendation) to run each component.

## Demo and code overview

This project consists of two main parts:

* [client/web/angular-customer-app](client/web/angular-customer-app/): The frontend customer ordering app, built with Angular.
* [services/cloud-run/](services/cloud-run/): The backend, built with Genkit, Vertex AI, Firestore, Clound Run and Cloud Storage for Firebase.

Two additional systems provide some additional services:

* [services/functions](services/functions/): Cloud Functions for Firebase to handle clean up of data stored in Cloud Storage.
* [services/local-recommendation](services/local-recommendation/): A simple HTTP-service that returns a drink recommendation from a fixed list of beverages.

## Demo walkthrough and examples

Once the application is up and running, talk to the agent to assemble and submit a beverage order.

Here are some example messages to try.

### Orders

```text
I want to order a latte with oat milk and double shots.
Add 1 latte, regular milk, 1 shot, no sweeteners to the order.
Order a cappucino with almond milk and extra sugar.
I'd like a decaf almond cappuccino, double shots with chocolate sauce.
Add a cortado with with quadruple shots, iced, regular milk and a Matcha Latte with extra foam, hazelnut sauce and sugar free vanilla sweetener.
Order 1 latte with oat milk, 2 shots and a latte, regular milk, 1 shot with sugar.
``` 

-->

## Deploying the app

You can deploy the backend and the frontend directly from Firebase Studio. Follow the on the "Firebase Studio" screen to deploy the app to Firebase App Hosting.

Create an apphosting.yaml file and configure it based on the example.apphosting.yaml file in the root of the project.

`firebase apphosting:backends:create --project PROJECT_ID --location us-central1`



## Delete and clean up deployed services

To avoid continued billing for the resources that you have created as part of trying out this demo app, delete the Firebase project or disable the deployed services.

If you have created a new project to test this app, follow [these steps to delete the project](https://support.google.com/firebase/answer/9137886?hl=en) through the Firebase console.

Alternatively, if you followed the steps to deploy Cloud Firestore, Functions and Cloud Storage for Firebase to an existing project, follow these steps to remove them manually through the console:
* [Delete data from Cloud Firestore](https://firebase.google.com/docs/firestore/using-console#delete_data)
* [Delete Cloud Functions](https://firebase.google.com/docs/functions/manage-functions?gen=2nd#delete_functions)
* [Delete Cloud Storage](https://firebase.google.com/docs/storage/manage-stored-files#delete)
* [Delete Cloud Run services](https://cloud.google.com/run/docs/managing/services#delete)

## Additional Information

This app is not an officially supported Google Product.




















<!-- 

# Folder Structure

- **client**: client app development, using Angular and PhaserJS
- **server**: server that serves the application, using Express.js

## Google Cloud project setup

Install the GCloud SDK to have access to GCloud on the command-line: https://cloud.google.com/sdk/docs/install

Via the Google Cloud console, create a project:
- https://console.cloud.google.com/welcome
- And enable the Gemini API: https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com?
- And enable the Vertex API: https://console.cloud.google.com/apis/library/aiplatform.googleapis.com

Back in the terminal console, authenticate with GCloud to connect the Cloud project to the server app on the command-line:
```
gcloud auth login
gcloud config set project PROJECT_ID
``` -->
