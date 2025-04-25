
# Important Column Naming Conventions

## `shopify_line_item_id` vs `shopify_order_id`

Throughout the codebase, we use `shopify_line_item_id` as the naming convention for the unique identifier of order line items in Shopify.

**CRITICAL**: The database column is actually named `shopify_order_id` in some tables but contains what we refer to as `shopify_line_item_id` in our code. This mismatch is historical and should not be changed.

When interacting with the database:
- Always use `.eq('shopify_order_id', ...)` when filtering by the line item ID
- Always use `shopify_line_item_id` in TypeScript interfaces and variable names

## Toast Function Typing

The toast function from `@/hooks/use-toast` requires careful typing to prevent TypeScript circular reference errors.

Correct pattern:

```typescript
// Extract toast function from useToast()
const { toast } = useToast();

// Pass toast function directly to hooks that need it
const someHook = useMyHook({ toast });
```

Incorrect pattern (causes TS2589 error):

```typescript
// This causes "Type instantiation is excessively deep and possibly infinite" errors
const someHook = useMyHook(useToast());
```

This documentation serves as a reference to prevent regression issues when making changes to components that use these patterns.
