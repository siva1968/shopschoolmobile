/**
 * Inventory utility functions for stock management
 */

interface InventoryLocationLevel {
  id: string;
  location_id: string;
  metadata: null;
  inventory_item_id: string;
  raw_stocked_quantity: {
    value: string;
    precision: number;
  };
  raw_reserved_quantity: {
    value: string;
    precision: number;
  };
  raw_incoming_quantity: {
    value: string;
    precision: number;
  };
  created_at: string;
  updated_at: string;
  deleted_at: null;
  available_quantity: number;
  stocked_quantity: number;
  reserved_quantity: number;
  incoming_quantity: number;
}

interface InventoryItem {
  id: string;
  location_levels: InventoryLocationLevel[];
}

/**
 * Extracts available quantity from inventory data
 * Expects one inventory object and one location_levels entry
 * @param inventory - Array of inventory items
 * @returns Available quantity or 0 if not found
 */
export function extractAvailableQuantity(inventory: InventoryItem[]): number {
  try {
    // Check if inventory array exists and has at least one item
    if (!inventory || !Array.isArray(inventory) || inventory.length === 0) {
      return 0;
    }

    // Get the first (and expected only) inventory item
    const inventoryItem = inventory[0];
    
    // Check if location_levels exists and has at least one entry
    if (!inventoryItem.location_levels || !Array.isArray(inventoryItem.location_levels) || inventoryItem.location_levels.length === 0) {
      return 0;
    }

    // Get the first (and expected only) location level
    const locationLevel = inventoryItem.location_levels[0];
    
    // Return the available quantity, ensuring it's a valid number
    return typeof locationLevel.available_quantity === 'number' ? locationLevel.available_quantity : 0;
  } catch (error) {
    console.error('Error extracting available quantity:', error);
    return 0;
  }
}

/**
 * Validates if sufficient stock is available for the requested quantity
 * @param inventory - Array of inventory items
 * @param requestedQuantity - Quantity being requested
 * @returns Object with validation result and message
 */
export function validateStockAvailability(inventory: InventoryItem[], requestedQuantity: number): {
  isValid: boolean;
  message: string;
  availableQuantity: number;
} {
  const availableQuantity = extractAvailableQuantity(inventory);
  
  if (availableQuantity <= 0) {
    return {
      isValid: false,
      message: 'Out of stock',
      availableQuantity: 0
    };
  }
  
  if (requestedQuantity > availableQuantity) {
    return {
      isValid: false,
      message: `Only ${availableQuantity} item${availableQuantity !== 1 ? 's' : ''} available in stock`,
      availableQuantity
    };
  }
  
  return {
    isValid: true,
    message: 'Stock available',
    availableQuantity
  };
}

/**
 * Gets a user-friendly stock status message
 * @param availableQuantity - Available quantity from inventory
 * @returns Human-readable stock status
 */
export function getStockStatusMessage(availableQuantity: number): string {
  if (availableQuantity <= 0) {
    return 'Out of stock';
  } else if (availableQuantity <= 5) {
    return `Low stock (${availableQuantity} left)`;
  } else {
    return 'In stock';
  }
}
