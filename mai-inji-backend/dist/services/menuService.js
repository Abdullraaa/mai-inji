"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMenuItems = getMenuItems;
exports.getMenuItemById = getMenuItemById;
exports.updateMenuItem = updateMenuItem;
const connection_1 = __importDefault(require("../db/connection"));
async function getMenuItems(includeSoldOut = false) {
    const query = `
    SELECT 
      mi.*,
      mc.name as category_name
    FROM menu_items mi
    JOIN menu_categories mc ON mi.category_id = mc.id
    WHERE mi.deleted_at IS NULL
    ${!includeSoldOut ? 'AND mi.is_available = true' : ''}
    ORDER BY mc.sort_order, mi.created_at DESC
  `;
    const result = await connection_1.default.query(query);
    return result.rows;
}
async function getMenuItemById(id) {
    const result = await connection_1.default.query('SELECT * FROM menu_items WHERE id = $1 AND deleted_at IS NULL', [id]);
    return result.rows.length ? result.rows[0] : null;
}
async function updateMenuItem(id, updates) {
    const client = await connection_1.default.connect();
    try {
        await client.query('BEGIN');
        const fields = [];
        const values = [];
        let paramCount = 1;
        if (updates.price !== undefined) {
            fields.push(`price = $${paramCount++}`);
            values.push(updates.price);
        }
        if (updates.is_available !== undefined) {
            fields.push(`is_available = $${paramCount++}`);
            values.push(updates.is_available);
        }
        if (updates.description !== undefined) {
            fields.push(`description = $${paramCount++}`);
            values.push(updates.description);
        }
        if (fields.length === 0) {
            const result = await client.query('SELECT * FROM menu_items WHERE id = $1', [id]);
            return result.rows[0];
        }
        fields.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(id);
        const query = `
      UPDATE menu_items 
      SET ${fields.join(', ')} 
      WHERE id = $${paramCount}
      RETURNING *
    `;
        const result = await client.query(query, values);
        await client.query('COMMIT');
        return result.rows[0];
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        client.release();
    }
}
//# sourceMappingURL=menuService.js.map