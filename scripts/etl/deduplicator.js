/**
 * ETL Deduplicator
 * Detects and handles duplicate customer records
 */

/**
 * Generate a normalized key for deduplication
 * @param {Object} customer - Transformed customer data
 * @param {string} type - Key type: 'name' or 'phone'
 * @returns {string} Normalized key
 */
function generateKey(customer, type) {
  if (type === 'name') {
    const firstName = (customer.firstName || '').toLowerCase().trim();
    const lastName = (customer.lastName || '').toLowerCase().trim();
    return `${firstName}|${lastName}`;
  }
  
  if (type === 'phone') {
    return customer.phone || '';
  }
  
  return '';
}

/**
 * Find duplicates in a list of customers
 * @param {Array} customers - List of transformed customer records
 * @returns {{ unique: Array, duplicates: Array }}
 */
function findDuplicates(customers) {
  const nameIndex = new Map(); // name key -> first occurrence index
  const phoneIndex = new Map(); // phone -> first occurrence index
  
  const unique = [];
  const duplicates = [];

  customers.forEach((customer, index) => {
    const nameKey = generateKey(customer.data, 'name');
    const phoneKey = generateKey(customer.data, 'phone');
    
    const duplicateReasons = [];
    let existingIndex = -1;

    // Check name duplicate (only if both first and last name exist)
    if (nameKey && customer.data.firstName && customer.data.lastName) {
      if (nameIndex.has(nameKey)) {
        duplicateReasons.push('same_name');
        existingIndex = nameIndex.get(nameKey);
      } else {
        nameIndex.set(nameKey, index);
      }
    }

    // Check phone duplicate
    if (phoneKey) {
      if (phoneIndex.has(phoneKey)) {
        if (!duplicateReasons.includes('same_name')) {
          existingIndex = phoneIndex.get(phoneKey);
        }
        duplicateReasons.push('same_phone');
      } else {
        phoneIndex.set(phoneKey, index);
      }
    }

    // Handle duplicate
    if (duplicateReasons.length > 0) {
      duplicates.push({
        record: customer,
        originalIndex: index,
        duplicateOf: existingIndex,
        reasons: duplicateReasons
      });
    } else {
      unique.push(customer);
    }
  });

  return { unique, duplicates };
}

/**
 * Merge duplicate records (optional - picks the more complete record)
 * @param {Object} existing - Existing record
 * @param {Object} duplicate - Duplicate record
 * @returns {Object} Merged record
 */
function mergeRecords(existing, duplicate) {
  const merged = { ...existing.data };
  
  // Fill in missing fields from duplicate
  if (!merged.email && duplicate.data.email) {
    merged.email = duplicate.data.email;
  }
  if (!merged.address && duplicate.data.address) {
    merged.address = duplicate.data.address;
  }
  if (!merged.lastName && duplicate.data.lastName) {
    merged.lastName = duplicate.data.lastName;
  }
  
  return {
    data: merged,
    isValid: existing.isValid && duplicate.isValid,
    errors: [...existing.errors, ...duplicate.errors],
    warnings: [...existing.warnings, `Merged with duplicate record`]
  };
}

/**
 * Process customers with deduplication
 * @param {Array} transformedCustomers - List of transformed customer records
 * @param {Object} options - Deduplication options
 * @param {boolean} options.merge - Whether to merge duplicate records
 * @returns {{ valid: Array, invalid: Array, duplicates: Array, stats: Object }}
 */
function deduplicateCustomers(transformedCustomers, options = { merge: false }) {
  // Separate valid and invalid records first
  const valid = transformedCustomers.filter(c => c.isValid);
  const invalid = transformedCustomers.filter(c => !c.isValid);

  // Find duplicates among valid records
  const { unique, duplicates } = findDuplicates(valid);

  // Optionally merge duplicates
  let finalRecords = unique;
  if (options.merge && duplicates.length > 0) {
    const mergedMap = new Map();
    
    unique.forEach((record, index) => {
      mergedMap.set(index, record);
    });

    duplicates.forEach(dup => {
      const existingRecord = valid[dup.duplicateOf];
      const merged = mergeRecords(existingRecord, dup.record);
      // Find the record in finalRecords and update it
      const uniqueIndex = unique.findIndex(r => r === existingRecord);
      if (uniqueIndex >= 0) {
        finalRecords[uniqueIndex] = merged;
      }
    });
  }

  return {
    valid: finalRecords,
    invalid,
    duplicates,
    stats: {
      totalInput: transformedCustomers.length,
      validCount: finalRecords.length,
      invalidCount: invalid.length,
      duplicateCount: duplicates.length
    }
  };
}

module.exports = {
  generateKey,
  findDuplicates,
  mergeRecords,
  deduplicateCustomers
};
