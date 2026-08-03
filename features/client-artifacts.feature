Feature: Keeping secrets off the client

  @critical @security
  Scenario: Server-only credentials are absent from shipped client artifacts
    Given the site has been built with known sentinel credentials
    When the shipped client artifacts are scanned
    Then no server credential sentinel appears in them

  @security @deployment
  Scenario: A live build exposes the public agent identifier and nothing more
    Given a live-mode build with known sentinel credentials
    When the shipped client artifacts are scanned
    Then the public agent identifier sentinel is present
    And no server credential sentinel appears
