# Beginner Cloud Function Migration Walkthrough

This document explains every major change made during this chat in beginner-friendly language.

The goal is to help you understand:

- what the project looked like before
- what we changed
- why we changed it
- how to repeat the same process on your own next time

## 1. What the project looked like before

At the start, your React app was talking to Firestore directly from the browser.

That means code inside `src/App.jsx` was doing things like:

- adding items with Firestore client SDK
- updating item style with Firestore client SDK
- deleting completed items with Firestore client SDK
- clearing the whole list with Firestore client SDK

This works for a simple demo, but your assignment specifically asked you to move database logic to the server using Cloud Functions.

Why that matters:

- Browser code is untrusted because users can inspect and modify it.
- Server-side code is the safer place for database operations and validation.
- This is closer to how professional apps are built.

## 2. The big architecture change

We changed the app from this:

```text
React app -> Firestore directly
```

to this:

```text
React app -> /api endpoints -> Cloud Functions -> Firestore
```

Now the React app does not write to Firestore directly.
Instead, it sends HTTP requests to Cloud Functions such as:

- `/api/addItem`
- `/api/clearList`
- `/api/listItems`
- `/api/updateItemStyle`
- `/api/deleteCompleted`

The Cloud Function receives the request, validates it, and then talks to Firestore using Firebase Admin SDK.

## 3. New backend folder: `functions/`

We created a new backend folder for the server-side code:

- [functions/index.js](/c:/Users/soumi/Desktop/Misc%20Files/Spring%202026%20USCA/Advanced%20Web%20Development/CSCIA614/testApp/functions/index.js)
- [functions/package.json](/c:/Users/soumi/Desktop/Misc%20Files/Spring%202026%20USCA/Advanced%20Web%20Development/CSCIA614/testApp/functions/package.json)

### Why this was needed

Firebase Functions need their own runtime and dependencies.
That is why the project now has a separate `functions/package.json`.

### What is inside `functions/index.js`

This file contains the server endpoints.

Important ones for your assignment:

- `addItem`
- `clearList`

Also included to preserve your app behavior:

- `listItems`
- `updateItemStyle`
- `deleteCompleted`

## 4. Lazy initialization of Firebase Admin SDK

One assignment requirement was:

> Implement Lazy Initialization for the Firebase Admin SDK to optimize cold starts.

We added this pattern in [functions/index.js](/c:/Users/soumi/Desktop/Misc%20Files/Spring%202026%20USCA/Advanced%20Web%20Development/CSCIA614/testApp/functions/index.js#L11):

```js
function getDb() {
  if (!getApps().length) {
    initializeApp();
  }

  return getFirestore();
}
```

### What this means

- `initializeApp()` starts Firebase Admin.
- If we call it every time without checking, it can cause errors or waste work.
- `getApps().length` checks whether Firebase Admin was already initialized.
- If not, we initialize it once.
- After that, we reuse the existing app.

### Why this is called "lazy initialization"

Because Firebase Admin is not initialized immediately when the file loads.
It gets initialized only when a function actually needs it.

That helps with cold start performance.

## 5. Data validation added to `addItem`

Your assignment required validation so the function does not blindly accept unsafe input.

We added validation in [functions/index.js](/c:/Users/soumi/Desktop/Misc%20Files/Spring%202026%20USCA/Advanced%20Web%20Development/CSCIA614/testApp/functions/index.js#L28).

### What it validates

- `content` must be a string
- empty content is rejected
- content is trimmed
- content length is limited
- only plain-text style characters are allowed

### Why this matters

If you save any random input without checking it, that can open the door to messy data or injection-style abuse.

This line is the main rule:

```js
const CONTENT_PATTERN = /^[A-Za-z0-9 .,'&()-]+$/;
```

This means:

- letters are allowed
- numbers are allowed
- spaces are allowed
- a few simple punctuation marks are allowed
- other unexpected characters are rejected

Important note:

For Part 1, your assignment only said to check that input is a valid string and prevent injection attacks.
The validation above satisfies that requirement in a practical way.

For Part 2, the assignment is stricter and only allows letters and spaces.
That stricter rule is handled separately in the GCP Console `validateItem` example, not in your shopping-list `addItem` function.

## 6. React app no longer uses Firestore directly

We changed [src/App.jsx](/c:/Users/soumi/Desktop/Misc%20Files/Spring%202026%20USCA/Advanced%20Web%20Development/CSCIA614/testApp/src/App.jsx) so it now uses `fetch()` instead of the Firestore client SDK.

### Before

The React component imported Firestore functions like:

- `addDoc`
- `collection`
- `getDocs`
- `updateDoc`
- `writeBatch`
- `onSnapshot`

### After

The component now sends HTTP requests like:

```js
await requestJson("/api/addItem", {
  method: "POST",
  body: JSON.stringify({
    content,
    createdBy: author,
  }),
});
```

### Why this was needed

Because the frontend should now call the Cloud Functions instead of Firestore directly.

### What `requestJson()` does

We added a small helper function near the top of `App.jsx`.

Its job is to:

- send requests to the server
- attach JSON headers when needed
- read the JSON response
- throw a friendly error if the request fails

This keeps the component code cleaner.

## 7. Shopping list loading changed from realtime snapshots to HTTP fetch

Originally the app used Firestore `onSnapshot()`, which gives realtime updates.

We replaced that with explicit loading through:

- `GET /api/listItems`

### Why

Once Firestore access moves to the server, the browser should no longer subscribe directly to Firestore.
The simpler beginner-friendly replacement is:

1. load the whole list from the server
2. make a change
3. reload the list

That is what the new `loadTasks()` and `runMutation()` functions do.

## 8. Added server endpoints to preserve existing app behavior

Even though the assignment only required `addItem` and `clearList`, your app also needed other actions to keep working.

So we added:

- `listItems`
- `updateItemStyle`
- `deleteCompleted`

This way the UI still supports:

- loading all items
- clicking an item to cycle its style
- deleting completed items
- clearing the whole list

## 9. Firebase client file was simplified

We updated [src/firebase.js](/c:/Users/soumi/Desktop/Misc%20Files/Spring%202026%20USCA/Advanced%20Web%20Development/CSCIA614/testApp/src/firebase.js).

### Before

It initialized:

- Firebase app
- Firestore

### After

It initializes:

- Firebase app
- Firebase Auth
- Google sign-in provider

### Why

Firestore is no longer used in the browser, so `getFirestore()` was removed from the client file.

Auth stayed on the frontend because your UI still signs users in with Google.

## 10. Added Firebase Hosting rewrites in `firebase.json`

We changed [firebase.json](/c:/Users/soumi/Desktop/Misc%20Files/Spring%202026%20USCA/Advanced%20Web%20Development/CSCIA614/testApp/firebase.json).

### Why this was required

Your assignment said:

> Update firebase.json and vite.config.js so that the React frontend calls /api/ instead of hardcoded URLs, eliminating CORS issues in production.

So instead of putting full function URLs in the browser code, we added rewrites like:

```json
{
  "source": "/api/addItem",
  "function": {
    "functionId": "addItem",
    "region": "us-east1"
  }
}
```

### What this does

When the browser requests:

```text
/api/addItem
```

Firebase Hosting internally forwards that request to your Cloud Function.

That means:

- no hardcoded function URL in React
- fewer CORS problems
- cleaner frontend code

## 11. Added Vite dev proxy in `vite.config.js`

We changed [vite.config.js](/c:/Users/soumi/Desktop/Misc%20Files/Spring%202026%20USCA/Advanced%20Web%20Development/CSCIA614/testApp/vite.config.js).

### Why this was needed

During local development, your frontend runs on the Vite dev server, not Firebase Hosting.
So we added a proxy so `/api/...` still works locally.

### What it does

When React calls:

```text
/api/addItem
```

the Vite dev server forwards it to the local Firebase Functions emulator:

```text
http://127.0.0.1:5001/{projectId}/us-east1/addItem
```

### Why this is useful

It lets you write the frontend once using `/api/...` and use the same pattern in both:

- local development
- deployed production

## 12. Region was changed from `us-central1` to `us-east1`

Later in the chat, you shared this deployed Cloud Run URL:

```text
https://testsec-880171148068.us-east1.run.app
```

That showed your environment was using `us-east1`.

Originally, I had set the function code and rewrites to `us-central1`, which is common as a default.
We then updated the project to `us-east1` so everything stays consistent.

Files updated for this:

- [functions/index.js](/c:/Users/soumi/Desktop/Misc%20Files/Spring%202026%20USCA/Advanced%20Web%20Development/CSCIA614/testApp/functions/index.js#L6)
- [firebase.json](/c:/Users/soumi/Desktop/Misc%20Files/Spring%202026%20USCA/Advanced%20Web%20Development/CSCIA614/testApp/firebase.json#L12)
- [vite.config.js](/c:/Users/soumi/Desktop/Misc%20Files/Spring%202026%20USCA/Advanced%20Web%20Development/CSCIA614/testApp/vite.config.js#L13)
- [cloud-functions-assignment-guide.md](/c:/Users/soumi/Desktop/Misc%20Files/Spring%202026%20USCA/Advanced%20Web%20Development/CSCIA614/testApp/docs/cloud-functions-assignment-guide.md)

## 13. Fixed Firebase project id mismatch

Your `.env` file used project id:

```text
cscia614-d47ad
```

But your `.firebaserc` file originally said:

```text
cscia614
```

We updated [.firebaserc](/c:/Users/soumi/Desktop/Misc%20Files/Spring%202026%20USCA/Advanced%20Web%20Development/CSCIA614/testApp/.firebaserc) to:

```text
cscia614-d47ad
```

### Why this matters

If `.firebaserc` points to the wrong project, deploy commands may go to the wrong Firebase project or fail unexpectedly.

## 14. Updated npm scripts

We updated [package.json](/c:/Users/soumi/Desktop/Misc%20Files/Spring%202026%20USCA/Advanced%20Web%20Development/CSCIA614/testApp/package.json).

### New useful scripts

- `npm run emulators`
- `npm run deploy`
- `npm run deploy:ghpages`

### Why

Before, your deploy script was for GitHub Pages.
Now your main deployment path for this assignment should be Firebase Hosting + Functions.

So:

- `deploy` now points to Firebase
- `deploy:ghpages` keeps the older GitHub Pages option available separately

## 15. ESLint config had to be updated

We changed [eslint.config.js](/c:/Users/soumi/Desktop/Misc%20Files/Spring%202026%20USCA/Advanced%20Web%20Development/CSCIA614/testApp/eslint.config.js).

### Why this was needed

Your old ESLint config assumed everything was browser code.
But now the project contains:

- browser code in `src/`
- Node-based config in `vite.config.js`
- Node/CommonJS backend code in `functions/`

Without updating ESLint, it reported errors such as:

- `require is not defined`
- `exports is not defined`
- `process is not defined`

### What we changed

We split linting rules by file type:

- browser globals for `src/**/*`
- Node globals for `vite.config.js`
- Node/CommonJS globals for `functions/**/*.js`

This made linting accurate again.

## 16. Installed backend dependencies

Inside `testApp/functions`, we installed:

- `firebase-admin`
- `firebase-functions`

These are required for the Cloud Functions backend to run and deploy.

## 17. Added beginner assignment guide

We also created:

- [cloud-functions-assignment-guide.md](/c:/Users/soumi/Desktop/Misc%20Files/Spring%202026%20USCA/Advanced%20Web%20Development/CSCIA614/testApp/docs/cloud-functions-assignment-guide.md)

That file focuses on the assignment submission steps, including:

- how to deploy
- what code to use for `validateItem`
- curl test commands
- the vulnerable demo example
- how to inspect the function service account and roles
- what screenshots to take

This walkthrough file is different.

This file explains the reasoning behind the code changes.
The other file is more of a task checklist.

## 18. Things we verified

We verified the code with:

- `npm run lint`
- `npm run build`
- `node --check functions/index.js`
- loading the functions file in Node successfully

That gave us confidence that:

- the frontend builds
- the linting rules are correct
- the server file has valid syntax

## 19. Command mistake you ran into

You tried:

```powershell
firebase deploy --only function,hosting
```

That failed for two reasons:

- it should be `functions`, not `function`
- in PowerShell, a comma-separated list should be wrapped in quotes

The correct command is:

```powershell
firebase deploy --only "functions,hosting"
```

## 20. How to repeat this migration next time

If you ever want to do this again from scratch, follow this order:

1. Find all Firestore client operations in the React app.
2. Create a `functions/` folder with its own `package.json`.
3. Add server endpoints for the required operations.
4. Add lazy initialization for Firebase Admin.
5. Add input validation on the server.
6. Replace Firestore client calls in React with `fetch("/api/...")`.
7. Add Firebase Hosting rewrites in `firebase.json`.
8. Add Vite proxy config in `vite.config.js`.
9. Make sure the project id in `.firebaserc` matches the real Firebase project.
10. Install backend dependencies in `functions/`.
11. Run lint and build.
12. Deploy with:

```powershell
firebase deploy --only "functions,hosting"
```

## 21. What you still need to do manually

Some assignment parts cannot be fully completed just by editing the local project.
You still need to do these in Google Cloud:

- deploy and confirm the functions dashboard is green
- create the separate `validateItem` function directly in GCP Console
- run the 3 curl tests in Cloud Shell
- create the intentionally vulnerable function
- simulate the attack
- inspect the service account and IAM roles
- take the required screenshots

## 22. Beginner mental model to remember

When you are building something like this, think of the app in 3 layers:

### Frontend layer

React handles:

- forms
- buttons
- displaying data
- calling `/api/...`

### Backend layer

Cloud Functions handle:

- validation
- trusted business logic
- talking to Firestore

### Database layer

Firestore stores the actual shopping list data.

This separation is the main lesson behind the migration.

## 23. Final summary

In this chat, we turned your shopping list app from a browser-to-Firestore app into a frontend-plus-server architecture.

The most important changes were:

- moving Firestore writes out of React
- creating Cloud Function endpoints
- adding lazy Firebase Admin initialization
- adding server-side validation
- configuring `/api/...` routing in both Vite and Firebase Hosting
- fixing project and region configuration

If you follow the order in Section 20 next time, you should be able to rebuild this setup much more confidently.
