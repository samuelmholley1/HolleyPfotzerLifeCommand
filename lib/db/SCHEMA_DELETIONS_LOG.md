# SCHEMA DELETIONS LOG

This file records all deletions of tables, columns, or fields from `schema.ts` for audit, rollback, and restoration purposes.

## Log Format
- **Date:** YYYY-MM-DD
- **Table:** Name of the affected table
- **Field:** Name of the deleted field/column
- **Reason:** Why it was deleted
- **Migration/PR:** Reference to migration file or pull request
- **Restoration SQL:** SQL to restore the field if needed

---

## Example Entry

**Date:** 2025-07-04  
**Table:** example_table  
**Field:** old_field  
**Reason:** Deprecated, replaced by `new_field`  
**Migration/PR:** 20250704_remove_old_field.sql  
**Restoration SQL:**
```sql
ALTER TABLE example_table ADD COLUMN old_field text;
```

---

> All deletions must be logged here before merging any schema change.
