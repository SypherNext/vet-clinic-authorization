// Loaders turn the number in the address (/pets/3) into the row it names,
// or stop with a 404 when there is no such row. authorize() calls them
// before it checks a permission, so the rules always see the real row.
// Each row is labelled with its kind ('pet', 'record', 'team'). authorize()
// uses it to decide between 403 and 404, and the policy to name the row in
// the relationship model ('record:3').
import { HttpError, NOT_FOUND_MESSAGE } from '../http/errors.js';
import { readId } from '../http/validate.js';
import { findPet, findRecord } from './portal-data.js';
import { findTeam } from '../teams/teams.js';

function loader(find, paramName, kind) {
  return (db) => (req) => {
    const id = readId(req.params[paramName]);
    const row = id === null ? null : find(db, id);
    // The same words as for a row you may not see, so the two cannot be told apart.
    if (!row) throw new HttpError(404, 'Page not found', NOT_FOUND_MESSAGE);
    return { ...row, kind };
  };
}

export const petLoader = loader(findPet, 'petId', 'pet');
export const recordLoader = loader(findRecord, 'recordId', 'record');
export const teamLoader = loader(findTeam, 'teamId', 'team');
