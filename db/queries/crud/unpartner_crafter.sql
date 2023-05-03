DELETE 
FROM
    crafters
WHERE
    crafter_id = ?
AND
    (addid is NULL
OR
    addid = ?)