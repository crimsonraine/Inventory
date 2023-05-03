UPDATE
    wands
SET
    core = ?,
    wood = ?,
    length = ?,
    flexibility = ?,
    crafter_id = ?,
    notes = ?
WHERE
    id = ?
AND
    userid = ?