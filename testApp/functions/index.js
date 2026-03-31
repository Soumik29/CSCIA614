const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const { exec } = require("child_process");
const { getApps, initializeApp } = require("firebase-admin/app");
const { FieldValue, getFirestore } = require("firebase-admin/firestore");

const REGION = "us-east1";
const COLLECTION_NAME = "shoppingList";
const VALID_STYLES = new Set(["cool", "hot", "complete"]);
const CONTENT_PATTERN = /^[A-Za-z0-9 .,'&()-]+$/;

function getDb() {
  if (!getApps().length) {
    initializeApp();
    logger.info("Firebase Admin SDK initialized.");
  }

  return getFirestore();
}

function normalizeText(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().replace(/\s+/g, " ");
}

function isValidItemContent(value) {
  const normalized = normalizeText(value);

  return (
    Boolean(normalized) &&
    normalized.length <= 120 &&
    CONTENT_PATTERN.test(normalized)
  );
}

function isValidCreatedBy(value) {
  const normalized = normalizeText(value);
  return normalized.length <= 80;
}

function isValidDocId(value) {
  return typeof value === "string" && value.trim().length > 0 && !value.includes("/");
}

function sendJson(res, statusCode, body) {
  res.status(statusCode).json(body);
}

function rejectWrongMethod(req, res, expectedMethod) {
  if (req.method === expectedMethod) {
    return false;
  }

  sendJson(res, 405, {
    ok: false,
    message: `Use ${expectedMethod} for this endpoint.`,
  });
  return true;
}

function mapItem(docSnapshot) {
  const data = docSnapshot.data();

  return {
    id: docSnapshot.id,
    content: data.content ?? "",
    style: data.style ?? "cool",
    created_by: data.created_by ?? "anonymous",
    createdAt: data.createdAt?.toMillis?.() ?? 0,
  };
}

async function deleteSnapshotDocs(docSnapshots) {
  const db = getDb();
  let deletedCount = 0;

  for (let index = 0; index < docSnapshots.length; index += 400) {
    const batch = db.batch();
    const chunk = docSnapshots.slice(index, index + 400);

    chunk.forEach((docSnapshot) => {
      batch.delete(docSnapshot.ref);
    });

    await batch.commit();
    deletedCount += chunk.length;
  }

  return deletedCount;
}

exports.listItems = onRequest({ region: REGION }, async (req, res) => {
  if (rejectWrongMethod(req, res, "GET")) {
    return;
  }

  try {
    const snapshot = await getDb()
      .collection(COLLECTION_NAME)
      .orderBy("createdAt", "asc")
      .get();

    sendJson(res, 200, {
      ok: true,
      items: snapshot.docs.map(mapItem),
    });
  } catch (error) {
    logger.error("listItems failed", error);
    sendJson(res, 500, {
      ok: false,
      message: "Unable to load items.",
    });
  }
});

exports.addItem = onRequest({ region: REGION }, async (req, res) => {
  if (rejectWrongMethod(req, res, "POST")) {
    return;
  }

  const content = req.body?.content;
  const createdBy = req.body?.createdBy;

  if (!isValidItemContent(content)) {
    sendJson(res, 400, {
      ok: false,
      message: "content must be a short plain-text string.",
    });
    return;
  }

  if (!isValidCreatedBy(createdBy ?? "")) {
    sendJson(res, 400, {
      ok: false,
      message: "createdBy must be 80 characters or fewer.",
    });
    return;
  }

  try {
    const docRef = await getDb().collection(COLLECTION_NAME).add({
      content: normalizeText(content),
      style: "cool",
      created_by: normalizeText(createdBy) || "anonymous",
      createdAt: FieldValue.serverTimestamp(),
    });

    sendJson(res, 200, {
      ok: true,
      id: docRef.id,
    });
  } catch (error) {
    logger.error("addItem failed", error);
    sendJson(res, 500, {
      ok: false,
      message: "Unable to add item.",
    });
  }
});

exports.updateItemStyle = onRequest({ region: REGION }, async (req, res) => {
  if (rejectWrongMethod(req, res, "POST")) {
    return;
  }

  const id = req.body?.id;
  const style = req.body?.style;

  if (!isValidDocId(id)) {
    sendJson(res, 400, {
      ok: false,
      message: "A valid document id is required.",
    });
    return;
  }

  if (!VALID_STYLES.has(style)) {
    sendJson(res, 400, {
      ok: false,
      message: "style must be one of cool, hot, or complete.",
    });
    return;
  }

  try {
    await getDb().collection(COLLECTION_NAME).doc(id.trim()).update({ style });

    sendJson(res, 200, {
      ok: true,
    });
  } catch (error) {
    logger.error("updateItemStyle failed", error);
    sendJson(res, 500, {
      ok: false,
      message: "Unable to update item style.",
    });
  }
});

exports.deleteCompleted = onRequest({ region: REGION }, async (req, res) => {
  if (rejectWrongMethod(req, res, "POST")) {
    return;
  }

  try {
    const snapshot = await getDb()
      .collection(COLLECTION_NAME)
      .where("style", "==", "complete")
      .get();

    const deletedCount = await deleteSnapshotDocs(snapshot.docs);

    sendJson(res, 200, {
      ok: true,
      deletedCount,
    });
  } catch (error) {
    logger.error("deleteCompleted failed", error);
    sendJson(res, 500, {
      ok: false,
      message: "Unable to delete completed items.",
    });
  }
});

exports.clearList = onRequest({ region: REGION }, async (req, res) => {
  if (rejectWrongMethod(req, res, "POST")) {
    return;
  }

  try {
    const snapshot = await getDb().collection(COLLECTION_NAME).get();
    const deletedCount = await deleteSnapshotDocs(snapshot.docs);

    sendJson(res, 200, {
      ok: true,
      deletedCount,
    });
  } catch (error) {
    logger.error("clearList failed", error);
    sendJson(res, 500, {
      ok: false,
      message: "Unable to clear the list.",
    });
  }
});

// WARNING: This function is intentionally vulnerable and exists only for the
// assignment's OWASP Serverless security demonstration. Do not keep or deploy
// this in a real application after you finish the screenshots/report.
exports.vulnerableList = onRequest({ region: REGION }, (req, res) => {
  if (rejectWrongMethod(req, res, "GET")) {
    return;
  }

  const path = typeof req.query.path === "string" ? req.query.path : ".";

  exec(`ls ${path}`, (error, stdout, stderr) => {
    if (error) {
      res.status(500).send(stderr || error.message);
      return;
    }

    res.status(200).send(stdout);
  });
});
