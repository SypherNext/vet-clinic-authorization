// Referrals: a vet asks a specialist to look at a pet for a limited time.

// One definition of "active", used by the policy and by the patients page.
export function isActiveOn(referral, today) {
  return referral.starts_on <= today && today <= referral.ends_on;
}

// The referrals sent to a vet, newest first, for the patients page.
export function referralsToVet(db, vetId) {
  return db.prepare(`SELECT r.*, p.name AS pet_name, p.species, f.name AS from_vet_name
                     FROM referrals r
                     JOIN pets p ON p.id = r.pet_id
                     JOIN users f ON f.id = r.from_vet_id
                     WHERE r.to_vet_id = ? ORDER BY r.starts_on DESC`).all(vetId);
}

// The referrals of one pet, for the pet page.
export function referralsOfPet(db, petId) {
  return db.prepare(`SELECT r.*, t.name AS to_vet_name, c.name AS to_clinic_name
                     FROM referrals r
                     JOIN users t ON t.id = r.to_vet_id
                     JOIN clinics c ON c.id = t.clinic_id
                     WHERE r.pet_id = ? ORDER BY r.starts_on DESC`).all(petId);
}
