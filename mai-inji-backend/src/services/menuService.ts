import pool from '../db/connection';
import { MenuItem } from '../types';

export async function getMenuItems(includeSoldOut: boolean = false) {
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
  
  const result = await pool.query(query);
  return result.rows;
}

export async function getMenuItemById(id: string): Promise<MenuItem | null> {
  const result = await pool.query(
    'SELECT * FROM menu_items WHERE id = $1 AND deleted_at IS NULL',
    [id]
  );
  
  return result.rows.length ? result.rows[0] : null;
}

export async function updateMenuItem(
  id: string,
  updates: Partial<MenuItem>
): Promise<MenuItem> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const fields: string[] = [];
    const values: any[] = [];
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
      const result = await client.query(
        'SELECT * FROM menu_items WHERE id = $1',
        [id]
      );
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
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
