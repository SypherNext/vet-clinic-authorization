// Relationship-based access control (ReBAC), small enough to read in one go.
//
// MODEL says, for each type of object, how a relation can be true:
//   direct('user')         a tuple says so: ('user:1', 'owner', 'pet:1')
//   same('owner')          another relation on the same object is true
//   via('pet', 'owner')    follow the object's 'pet' tuple to the pet, then
//                          check 'owner' there ("the owner of this record's pet")
// The same model is written in OpenFGA's language in examples/openfga, and
// OpenFGA gives the same answers (see lesson 11).

const direct = (...types) => ({ direct: types });
const same = (relation) => ({ same: relation });
const via = (link, relation) => ({ via: link, relation });

export const MODEL = {
  user: {},
  clinic: {
    admin: [direct('user')],
    front_desk: [direct('user')],
  },
  team: {
    clinic: [direct('clinic')],
    member: [direct('user')],
    manager: [via('clinic', 'admin')],
  },
  pet: {
    clinic: [direct('clinic')],
    owner: [direct('user')],
    care_team: [direct('team')],
    carer: [via('care_team', 'member')],
    viewer: [same('owner'), same('carer'), via('clinic', 'front_desk')],
  },
  record: {
    pet: [direct('pet')],
    author: [direct('user')],
    shared_with: [direct('user')],
    viewer: [same('author'), same('shared_with'), via('pet', 'owner'), via('pet', 'carer')],
    sharer: [same('author')],
  },
};

// The model above is at most a few steps deep. A limit still protects
// against a mistake in it that would loop forever.
const MAX_DEPTH = 10;

const typeOf = (object) => object.split(':')[0];

export function createRelationships(db) {
  const hasTuple = db.prepare('SELECT 1 FROM relationship_tuples WHERE subject = ? AND relation = ? AND object = ?');
  const subjectsOf = db.prepare('SELECT subject FROM relationship_tuples WHERE relation = ? AND object = ?');

  // Is `subject` in `relation` with `object`? check('user:1', 'viewer', 'record:2')
  function check(subject, relation, object, depth = 0) {
    if (depth > MAX_DEPTH) return false;
    const ways = MODEL[typeOf(object)]?.[relation] ?? [];
    return ways.some((way) => {
      if (way.direct) return hasTuple.get(subject, relation, object) !== undefined;
      if (way.same) return check(subject, way.same, object, depth + 1);
      return subjectsOf.all(way.via, object)
        .some((row) => check(subject, way.relation, row.subject, depth + 1));
    });
  }

  return { check };
}
