// Loaders turn the number in the address (/pets/3) into the row it names,
// or stop with a 404 when there is no such row. authorize() calls them
// before it checks a permission, so the rules always see the real row.
import { HttpError } from '../http/errors.js';
import { findPet, findRecord } from './portal-data.js';

function idFrom(req, name) {
  const id = Number(req.params[name]);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function loader(find, paramName, what) {
  return (db) => (req) => {
    const id = idFrom(req, paramName);
    const row = id === null ? null : find(db, id);
    if (!row) throw new HttpError(404, 'Not found', `There is no ${what} with that number.`);
    return row;
  };
}

export const petLoader = loader(findPet, 'petId', 'pet');
export const recordLoader = loader(findRecord, 'recordId', 'record');
