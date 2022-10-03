const GET = `
    SELECT
        c.category_id,
        c.category_name,
        category_image_id,
        category_icon_id,
        c.category_description,
        c.category_created_at,
        c.category_updated_at,
        u.upload_data as upload_image_data,
        up.upload_data as upload_icon_data
    FROM categories AS c
    LEFT JOIN uploads AS u ON c.category_image_id = u.upload_id
    LEFT JOIN uploads AS up ON c.category_icon_id = up.upload_id
    WHERE c.category_deleted_at IS null
    LIMIT $1
    OFFSET $2
`;

const GET_FORMAT = `
select
        json_build_object(
                'id', c.category_id,
                'category_name', c.category_name,
                'category_image_data', u.upload_data,
                'category_icon_data', up.upload_data,
                'category_description', c.category_description,
                'sub_categories', json_agg((json_build_object(
                        'id', sub_categories.sub_category_id,
                        'sub_category_name', sub_categories.sub_category_name,
                        'sub_category_description', sub_categories.sub_category_description, 
                         'sub_category_image_data', up_sub.upload_data,
                        'child_categories', 
                        
                           (SELECT json_agg(json_build_object(
                                'child_category_id', child_categories.child_category_id,
                                            'child_category_name', child_categories.child_category_name,
                                             'child_category_description', child_categories.child_category_description,
                                            'child_category_image_data', up_child.upload_data
                            ))
                                FROM child_categories 
                                LEFT JOIN uploads AS up_child ON child_categories.child_category_image = up_child.upload_id
                                where  child_categories.sub_category_id = sub_categories.sub_category_id)
                                                  )
                ))
    )
from categories c
left join sub_categories  on sub_categories.category_id  = c.category_id
LEFT JOIN uploads AS u ON c.category_image_id = u.upload_id
LEFT JOIN uploads AS up ON c.category_icon_id = up.upload_id
LEFT JOIN uploads AS up_sub ON sub_categories.sub_category_image = up_sub.upload_id
WHERE c.category_deleted_at IS null  and sub_categories.sub_category_deleted_at IS null 
group by c.category_id,
u.upload_id,
up.upload_id,
up_sub.upload_id                       
`;

const GET_ONE = `

SELECT row_to_json(row)
    FROM(
        SELECT
            c.category_id,
            c.category_name,
            category_image_id,
            category_icon_id,
            c.category_description,
            c.category_created_at,
            c.category_updated_at,
            u as category_image,
            up as category_icon
        FROM categories AS c
        LEFT JOIN uploads AS u ON c.category_image_id = u.upload_id
        LEFT JOIN uploads AS up ON c.category_icon_id = up.upload_id
        WHERE c.category_deleted_at IS null AND c.category_id = $1
    ) row

`;

const POST = `
    INSERT INTO categories(category_name, category_image_id, category_icon_id, category_description) 
    VALUES ($1::varchar, $2::uuid, $3::uuid, $4::text) 
    RETURNING *
`;

const checkCategoryName = `
	select
		*
	from categories
	where category_deleted_at is null and category_name ILIKE $1::varchar
`;

const checkCategoryImage = `
    SELECT 
       *
    FROM uploads
    WHERE upload_deleted_at IS NULL AND upload_id = $1::uuid
`;

const checkCategoryIcon = `
    SELECT 
       *
    FROM uploads
    WHERE upload_deleted_at IS NULL AND upload_id = $1::uuid
`;

const PATCH = `
    UPDATE categories SET
        category_name = (
            CASE
                WHEN length($2::varchar) > 0 THEN $2::varchar
                ELSE category_name
            END
        ),
        category_image_id = (
            CASE
                WHEN length($3) > 0 THEN $3::uuid
                ELSE category_image_id
            END
        ),
        category_icon_id = (
            CASE
                WHEN length($4) > 0 THEN $4::uuid
                ELSE category_icon_id
            END
        ),
        category_description = (
            CASE
                WHEN length($5::text) > 0 THEN $5::text
                ELSE category_description
            END
        ),
        category_updated_at = now()
    WHERE category_deleted_at IS null AND category_id = $1::uuid
    RETURNING *
`;

const DELETE = `
UPDATE categories SET
    category_deleted_at = now()
    WHERE category_deleted_at IS null AND category_id = $1::uuid
    RETURNING *
`;

export default {
    DELETE,
    GET,
    PATCH,
    POST,
    GET_ONE,
    checkCategoryName,
    checkCategoryImage,
    checkCategoryIcon,
    GET_FORMAT,
};


