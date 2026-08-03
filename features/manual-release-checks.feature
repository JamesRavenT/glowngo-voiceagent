Feature: Handling failure

  @manual
  Scenario: A service-side failure is not blamed on the caller's network
    Given the ElevenLabs account has exhausted its quota
    When a caller starts a call
    Then the caller is not told to check their own connection
    # Live-only and expected to fail until connection errors are classified.

  @manual
  Scenario: The agent answers a single question once
    Given a live call to the hosted agent
    When the caller asks one question
    Then the agent gives one answer and then waits for at least five seconds
    # Manual regression guard for ADR 0008.

  @manual @deployment
  Scenario: The deployed site runs in the intended mode
    Given the deployed Cloudflare URL
    Then the deployed bundle carries the expected agent mode
