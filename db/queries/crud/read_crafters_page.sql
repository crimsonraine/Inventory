SELECT 
    crafter_id, CONCAT(crafter_first_name, ' ', crafter_last_name) AS name,
    crafters.country_id, country_name, addid
FROM
    crafters
JOIN countries
    ON crafters.country_id = countries.country_id
WHERE
    addid is NULL
OR
    addid = ?
ORDER BY crafters.crafter_last_name;