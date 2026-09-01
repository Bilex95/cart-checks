# cart-checks

**The problem:** cart totals are where money bugs live — a VAT rate applied to the wrong base, a coupon that stacks twice, an empty cart that still lets you check out. They're fiddly to verify by hand every release.

**The solution:** a small cart (add/remove, quantity, 7.5% VAT, a server-checked coupon) and a Cypress suite that locks down the arithmetic, the empty state, and — importantly — what happens when the coupon API is down.

## Run it

```bash
npm install
npm test          # starts the server, runs Cypress headless, shuts down
```

Or work interactively:

```bash
npm start         # http://localhost:5173
npm run cy:open   # in another terminal
```

The `SAVE10` and `WELCOME5` codes are real — `serve.js` implements `/api/coupon` so the page works when you open it yourself, and the tests use `cy.intercept` to control that endpoint.

## How it's built

- `index.html` + `app.js` — vanilla JS, one `render()` that redraws the cart from state. Coupon lookup is a `fetch` to `/api/coupon`.
- `serve.js` — dependency-free static server plus the coupon endpoint.
- `cypress/e2e/cart.cy.js` — six specs: totals, quantity, empty state, a stubbed successful coupon, a stubbed **500** to prove the UI degrades gracefully, and one deliberately failing test.

## Contribute

- **Add the "Proceed to checkout" button** the failing test expects (see the open issue).
- Persist the cart to `localStorage` and add a spec that reloads mid-session.
- Add a spec for a coupon that shouldn't stack: applying `SAVE10` then `WELCOME5` should replace, not add.

---

Scaffolded by an automated weekly pipeline, then refined by hand — see the factory repo for how it works.
