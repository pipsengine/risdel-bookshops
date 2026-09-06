# Module 35 — E-Commerce, Online Orders & Customer Portal

## Purpose
Expose the existing Risdel catalogue and operations through a customer-facing online channel without creating a second source of product, price, stock or customer data.

## Public routes
- `/shop` catalogue and search
- `/shop/product/[id]` product detail
- `/shop/cart` cart
- `/shop/checkout` delivery/click-and-collect checkout
- `/portal` customer account and online order tracking

## Internal route
- `/commerce` online order and payment-control register

## Controls
- Live stock availability is calculated from saleable warehouse balances.
- Server-side price resolution revalidates current retail prices at checkout.
- Tax is derived from product tax code and active tax-code configuration.
- Online checkout creates/links the existing CRM customer.
- Checkout creates an internal Sales Order and reserves inventory.
- Payment gateway capture remains disabled until configured.
- Portal passwords are scrypt-hashed; the portal session uses an HttpOnly signed cookie.
- All online records remain migration-ready through stable UUIDs.
