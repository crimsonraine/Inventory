SELECT 
    id, core, wood, length, flexibility, notes,
    CONCAT(crafter_first_name, ' ', crafter_last_name) AS name, wands.crafter_id
FROM
    wands
JOIN crafters
    ON crafters.crafter_id = wands.crafter_id
WHERE
    userid = ?
ORDER BY crafters.crafter_last_name;