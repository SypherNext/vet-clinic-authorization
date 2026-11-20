// The sharing page of a medical record: who else may read it.
// All three routes need 'record:share', so only the record's author gets in.
import express from 'express';
import { authorize } from '../access/authorize.js';
import { recordLoader } from '../portal/loaders.js';
import { readId } from '../http/validate.js';
import { HttpError } from '../http/errors.js';
import { setFlash } from '../sessions/sessions.js';
import { listVets } from '../users/users.js';
import { listShares, shareRecord, unshareRecord } from './record-shares.js';

const sharingPath = (record) => `/records/${record.id}/sharing`;

// Records are shared vet to vet. Anyone else in the form is a mistake.
function readOtherVet(db, value, record) {
  const userId = readId(value);
  const vet = listVets(db).find((v) => v.id === userId && v.id !== record.author_id);
  if (!vet) throw new HttpError(400, 'Not a vet', 'Pick another vet from the list.');
  return vet;
}

export function sharingRoutes(deps) {
  const { db, clock } = deps;
  const router = express.Router();
  const mayShare = authorize('record:share', recordLoader(db));

  router.get('/records/:recordId/sharing', mayShare, (req, res) => {
    const record = req.resource;
    const shares = listShares(db, record.id);
    const sharedIds = new Set(shares.map((s) => s.user_id));
    const otherVets = listVets(db).filter((v) => v.id !== record.author_id && !sharedIds.has(v.id));
    res.render('sharing', { record, shares, otherVets });
  });

  router.post('/records/:recordId/sharing', mayShare, (req, res) => {
    const record = req.resource;
    const vet = readOtherVet(db, req.body.user_id, record);
    shareRecord(db, { recordId: record.id, userId: vet.id, grantedBy: req.user.id, now: clock.now() });
    setFlash(deps, req, res, `${vet.name} can now read this record.`);
    res.redirect(sharingPath(record));
  });

  router.post('/records/:recordId/sharing/:userId/remove', mayShare, (req, res) => {
    const record = req.resource;
    const vet = readOtherVet(db, req.params.userId, record);
    unshareRecord(db, { recordId: record.id, userId: vet.id });
    setFlash(deps, req, res, `${vet.name} can no longer read this record.`);
    res.redirect(sharingPath(record));
  });

  return router;
}
