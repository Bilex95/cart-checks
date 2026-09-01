describe("cart-checks", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  it("adds items and computes subtotal, VAT and total", () => {
    cy.contains(".product", "Honey beans").find("[data-add]").click();
    cy.contains(".product", "Groundnut oil").find("[data-add]").click();

    cy.get('[data-total="subtotal"]').should("have.text", "₦4,400.00");
    cy.get('[data-total="vat"]').should("have.text", "₦330.00");
    cy.get('[data-total="grand"]').should("have.text", "₦4,730.00");
  });

  it("updates totals when quantity changes", () => {
    cy.contains(".product", "Honey beans").find("[data-add]").click();
    cy.get('[data-inc="beans"]').click().click();

    cy.get('[data-qty="beans"]').should("have.text", "3");
    cy.get('[data-total="subtotal"]').should("have.text", "₦5,400.00");
  });

  it("shows the empty-cart message after removing the last item", () => {
    cy.contains(".product", "Honey beans").find("[data-add]").click();
    cy.get("#empty").should("not.be.visible");

    cy.get('[data-remove="beans"]').click();
    cy.get("#empty").should("be.visible").and("contain", "empty");
  });

  it("applies a valid coupon from the API", () => {
    cy.intercept("GET", "/api/coupon*", {
      statusCode: 200,
      body: { valid: true, percentOff: 10 },
    }).as("coupon");

    cy.contains(".product", "Basmati rice").find("[data-add]").click();
    cy.get("#coupon").type("SAVE10");
    cy.get("#apply").click();

    cy.wait("@coupon");
    cy.get("#coupon-msg").should("have.class", "ok").and("contain", "10% off");
    cy.get('[data-total="discount"]').should("have.text", "−₦950.00");
    cy.get('[data-total="grand"]').should("have.text", "₦9,191.00");
  });

  it("keeps the total unchanged when the coupon service fails", () => {
    cy.intercept("GET", "/api/coupon*", { statusCode: 500, body: {} }).as("coupon");

    cy.contains(".product", "Basmati rice").find("[data-add]").click();
    cy.get('[data-total="grand"]').then(($el) => {
      const before = $el.text();
      cy.get("#coupon").type("SAVE10");
      cy.get("#apply").click();
      cy.wait("@coupon");
      cy.get("#coupon-msg").should("have.class", "bad").and("contain", "Couldn't check");
      cy.get('[data-total="grand"]').should("have.text", before);
    });
  });

  // Deliberately failing — this is the good-first-issue. Add a
  // "Proceed to checkout" button that is disabled while the cart is empty.
  it("disables checkout when the cart is empty", () => {
    cy.contains("button", "Proceed to checkout").should("be.disabled");
  });
});
