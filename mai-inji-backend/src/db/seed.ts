import { v4 as uuid } from 'uuid';
import pool from './connection';

async function seed() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Seeding database...');
    
    // Create categories
    const categoryIds = {
      meals: uuid(),
      drinks: uuid(),
      desserts: uuid(),
    };
    
    await client.query(
      `INSERT INTO menu_categories (id, name, sort_order) VALUES 
       ($1, $2, $3), ($4, $5, $6), ($7, $8, $9)`,
      [
        categoryIds.meals, 'Main Meals', 1,
        categoryIds.drinks, 'Drinks', 2,
        categoryIds.desserts, 'Desserts', 3,
      ]
    );
    
    // Create menu items
    const menuItems = [
      { category: categoryIds.meals, name: 'Jollof Rice & Chicken', description: 'Spiced rice with seasoned chicken', price: 250000 }, // 2500 naira in kobo
      { category: categoryIds.meals, name: 'Fried Rice & Beef', description: 'Fried rice with grilled beef', price: 280000 },
      { category: categoryIds.meals, name: 'Pepper Soup', description: 'Hot pepper soup with meat', price: 150000 },
      { category: categoryIds.drinks, name: 'Cold Water', description: 'Chilled bottled water', price: 20000 },
      { category: categoryIds.drinks, name: 'Zobo Drink', description: 'Traditional zobo juice', price: 50000 },
      { category: categoryIds.desserts, name: 'Bread & Puff Puff', description: 'Fried dough with bread', price: 80000 },
    ];
    
    for (const item of menuItems) {
      await client.query(
        `INSERT INTO menu_items (category_id, name, description, price, is_available) 
         VALUES ($1, $2, $3, $4, $5)`,
        [item.category, item.name, item.description, item.price, true]
      );
    }
    
    console.log('✅ Database seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    client.release();
  }
}

seed();
