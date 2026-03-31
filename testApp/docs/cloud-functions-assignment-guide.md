# Cloud Functions Assignment Guide

## Part 1: Local Project Migration

### What changed locally

- The React app now calls `/api/*` endpoints instead of using the Firestore Client SDK directly.
- Server-side handlers now live in `functions/index.js`.
- Firebase Admin uses lazy initialization through `getApps()` and `initializeApp()`.
- Firebase Hosting rewrites `/api/*` requests to deployed Cloud Functions.
- Vite proxies `/api/*` requests to the local Functions emulator during development.

### Files to screenshot

- `vite.config.js`
- `firebase.json`
- `functions/index.js`

### Deploy flow

1. In a terminal:

```powershell
cd testApp\functions
npm install
cd ..
npm run build
firebase deploy --only functions,hosting
```

2. After deploy, open the GCP or Firebase Functions dashboard and confirm:

- `addItem`
- `clearList`

Both should show a healthy status.

## Part 2: GCP Console Practice

Create a new HTTP function directly in the GCP console with entry point `validateItem`.

### `index.js`

```js
const { z } = require("zod");

const itemSchema = z.object({
  content: z
    .string()
    .regex(/^[A-Za-z ]+$/, "content must contain only letters and spaces"),
  style: z.enum(["cool", "hot", "complete"]),
});

exports.validateItem = (req, res) => {
  const parsed = itemSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      errors: parsed.error.flatten(),
    });
  }

  return res.status(200).json({
    ok: true,
    item: parsed.data,
  });
};
```

### `package.json`

```json
{
  "name": "validate-item",
  "version": "1.0.0",
  "main": "index.js",
  "dependencies": {
    "zod": "latest"
  }
}
```

### Cloud Shell curl tests

Replace `FUNCTION_URL` with your deployed HTTPS trigger URL.

```bash
FUNCTION_URL="https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/validateItem"
```

Success test:

```bash
curl -i -X POST "$FUNCTION_URL" \
  -H "Content-Type: application/json" \
  -d '{"content":"Fresh Apples","style":"cool"}'
```

Special-character failure:

```bash
curl -i -X POST "$FUNCTION_URL" \
  -H "Content-Type: application/json" \
  -d '{"content":"Fresh@Apples","style":"cool"}'
```

Invalid-style failure:

```bash
curl -i -X POST "$FUNCTION_URL" \
  -H "Content-Type: application/json" \
  -d '{"content":"Fresh Apples","style":"warm"}'
```

## Part 3: Security Practice

### OWASP risk selected

S1:2017 Injection.

Why this fits:

- the function accepts untrusted input from the request
- that input is passed into a shell command without safe handling
- the attacker can change what command actually runs

In serverless terms, this is a good beginner-friendly example of injection inside a cloud function.

### Intentionally vulnerable example

This function is now available in your local project at:

- `functions/index.js` as `vulnerableList`

Deploy only the vulnerable demo function when you are ready for Part 3:

```powershell
firebase deploy --only "functions:vulnerableList"
```

The intentionally vulnerable code is:

```js
const { exec } = require("child_process");

exports.vulnerableList = (req, res) => {
  const path = req.query.path || ".";

  exec(`ls ${path}`, (error, stdout, stderr) => {
    if (error) {
      return res.status(500).send(stderr || error.message);
    }

    return res.status(200).send(stdout);
  });
};
```

### Example attack from Cloud Shell

```bash
VULN_URL="https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/vulnerableList"
curl "$VULN_URL?path=.%3Bwhoami"
```

If the function is vulnerable, the response will include the output of `whoami`.

After you finish your screenshots, remove it from production:

```powershell
firebase functions:delete vulnerableList --region us-east1
```

### Service account and roles

Find the function service account:

```bash
gcloud functions describe vulnerableList \
  --gen2 \
  --region us-east1 \
  --format="value(serviceConfig.serviceAccountEmail)"
```

List its project roles:

```bash
FUNCTION_SA="SERVICE_ACCOUNT_EMAIL"

gcloud projects get-iam-policy YOUR_PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:$FUNCTION_SA" \
  --format="table(bindings.role)"
```

### Least privilege note

- If the function uses the default Compute Engine service account or has broad roles like `Editor`, it does not follow least privilege.
- A shopping-list function usually only needs narrow Firestore access such as `roles/datastore.user`, plus standard logging.

### Submission-ready Part 3 write-up

You can adapt the text below for your PDF or Word submission.

#### Part 3 summary paragraph

```text
For Part 3, I selected S1:2017 Injection from the OWASP Top 10 Serverless Interpretation. I created an intentionally vulnerable Google Cloud Function that reads user input from the request and places it directly into a shell command without proper sanitization. This makes the function vulnerable to command injection because an attacker can craft input that changes the command being executed. I demonstrated the attack from Cloud Shell by sending a malicious request to the function URL, and the function returned output showing that the injected command was executed successfully.
```

#### Vulnerable code explanation

```text
The vulnerable code uses child_process.exec() and directly concatenates request input into the command string. Because the input is not validated or escaped, the shell interprets attacker-controlled characters as part of the command. This is a practical example of serverless injection because the cloud function is executing untrusted input in a sensitive context.
```

#### Attack demonstration paragraph

```text
To simulate the attack, I called the vulnerable function from Cloud Shell using a crafted URL parameter. Instead of only listing the intended directory, the function also executed the injected command. This confirmed that the function was exploitable and that untrusted user input was reaching the command interpreter without protection.
```

#### Service account and least privilege paragraph

Replace the placeholders below with your real values after checking the service account and IAM roles.

```text
The function was running as the service account [SERVICE_ACCOUNT_EMAIL]. The roles assigned to this identity were [ROLE_1], [ROLE_2], and [ROLE_3]. Based on the Principle of Least Privilege, this configuration [does / does not] fully follow best practices. If a function only needs to read or write Firestore data, it should not have broad project-wide permissions such as Editor or Owner. A more secure setup would grant only the minimum roles necessary for the specific function behavior.
```

#### Short conclusion paragraph

```text
This exercise showed how serverless functions can still suffer from classic application security problems such as injection. Even though the code runs in a managed cloud environment, unsafe handling of user input can still lead to command execution and privilege abuse. Reviewing the assigned service account and reducing permissions are important steps in limiting the impact of a successful attack.
```

## Screenshot Checklist

- Screenshot 1: `vite.config.js` and `firebase.json`
- Screenshot 2: `functions/index.js` showing lazy init, `addItem`, and `clearList`
- Screenshot 3: Functions dashboard with green checks for `addItem` and `clearList`
- Screenshot 4: `validateItem` inline editor with Zod schema and regex
- Screenshot 5: Cloud Shell with all three curl test results
- Screenshot 6: Vulnerable code and Cloud Shell showing the attack
- Screenshot 7: Terminal showing the successful exploit plus a short description
